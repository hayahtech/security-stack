/// <reference path="../types/web-bluetooth.d.ts" />
/* ── Web Bluetooth RFID Reader Service ── */

import { emitEvent } from "@/data/devices-mock";

// Common RFID reader BLE service UUIDs
const RFID_SERVICE_UUIDS = [
  "0000fff0-0000-1000-8000-00805f9b34fb", // Generic RFID
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10/CC2541 modules
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART Service
];

const RFID_CHARACTERISTIC_UUIDS = [
  "0000fff1-0000-1000-8000-00805f9b34fb",
  "0000ffe1-0000-1000-8000-00805f9b34fb",
  "6e400003-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART TX
];

const NAME_PREFIXES = ["Allflex", "Datamars", "Leader", "Gallagher", "Zee"];

export type BluetoothConnectionState =
  | "idle"
  | "requesting"
  | "connecting"
  | "discovering"
  | "listening"
  | "disconnected"
  | "error";

export interface BluetoothRfidConnection {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
  state: BluetoothConnectionState;
}

const activeConnections = new Map<string, BluetoothRfidConnection>();
const stateListeners: Array<(deviceId: string, state: BluetoothConnectionState, error?: string) => void> = [];

export function onBluetoothStateChange(
  cb: (deviceId: string, state: BluetoothConnectionState, error?: string) => void
) {
  stateListeners.push(cb);
  return () => {
    const idx = stateListeners.indexOf(cb);
    if (idx >= 0) stateListeners.splice(idx, 1);
  };
}

function notifyState(deviceId: string, state: BluetoothConnectionState, error?: string) {
  stateListeners.forEach((cb) => cb(deviceId, state, error));
}

/** Check if Web Bluetooth API is available */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

/**
 * Parse raw BLE data into an EID string.
 * FDX-B EIDs are typically 15-digit numeric strings.
 * Many readers send ASCII text terminated by \r\n.
 */
function parseEID(data: DataView): string | null {
  // Try reading as UTF-8 text first (most common for serial-over-BLE readers)
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const text = new TextDecoder().decode(bytes).trim();

  // FDX-B: 15-digit numeric (e.g. "982000123456789")
  const fdxMatch = text.match(/(\d{15})/);
  if (fdxMatch) return fdxMatch[1];

  // Country code + national ID format (e.g. "BR 076 123456789" or "076123456789")
  const brMatch = text.match(/(?:BR\s*)?(\d{3}\s*\d{9,12})/i);
  if (brMatch) return brMatch[1].replace(/\s/g, "");

  // Generic alphanumeric tag (e.g. "BR-001", "EID:12345")
  const tagMatch = text.match(/([A-Z]{2,3}[-\s]?\d{3,15})/i);
  if (tagMatch) return tagMatch[1];

  // If we got any non-empty printable text, return it as-is
  const clean = text.replace(/[\r\n\x00]/g, "").trim();
  if (clean.length >= 3) return clean;

  // Fallback: hex dump for binary protocols
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.length >= 6 ? hex : null;
}

/**
 * Request a Bluetooth RFID device via the Web Bluetooth picker,
 * connect to its GATT server, and start listening for EID notifications.
 */
export async function connectBluetoothReader(
  readerId: string
): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  if (!isWebBluetoothSupported()) {
    return { success: false, error: "Web Bluetooth não é suportado neste navegador. Use Chrome em HTTPS." };
  }

  notifyState(readerId, "requesting");

  try {
    // Build filters: try service UUIDs + known name prefixes
    const filters: BluetoothRequestDeviceFilter[] = [
      ...RFID_SERVICE_UUIDS.map((uuid) => ({ services: [uuid] })),
      ...NAME_PREFIXES.map((prefix) => ({ namePrefix: prefix })),
    ];

    const device = await navigator.bluetooth.requestDevice({
      filters,
      optionalServices: [
        ...RFID_SERVICE_UUIDS,
        "battery_service",
        "device_information",
      ],
    });

    if (!device) {
      notifyState(readerId, "idle");
      return { success: false, error: "Nenhum dispositivo selecionado." };
    }

    // Handle unexpected disconnection
    device.addEventListener("gattserverdisconnected", () => {
      notifyState(readerId, "disconnected");
      emitEvent({
        type: "status_change",
        deviceId: readerId,
        value: "disconnected",
        timestamp: new Date(),
      });
      const conn = activeConnections.get(readerId);
      if (conn) {
        conn.state = "disconnected";
        conn.server = null;
        conn.characteristic = null;
      }
    });

    notifyState(readerId, "connecting");
    const server = await device.gatt!.connect();

    notifyState(readerId, "discovering");

    // Try each known service UUID until one works
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    for (const svcUuid of RFID_SERVICE_UUIDS) {
      try {
        const service = await server.getPrimaryService(svcUuid);
        for (const charUuid of RFID_CHARACTERISTIC_UUIDS) {
          try {
            const char = await service.getCharacteristic(charUuid);
            if (char.properties.notify || char.properties.indicate) {
              characteristic = char;
              break;
            }
          } catch {
            // Characteristic not found in this service, try next
          }
        }
        if (characteristic) break;

        // Fallback: iterate all characteristics looking for notify
        if (!characteristic) {
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.notify || c.properties.indicate) {
              characteristic = c;
              break;
            }
          }
        }
        if (characteristic) break;
      } catch {
        // Service not found, try next
      }
    }

    if (!characteristic) {
      server.disconnect();
      notifyState(readerId, "error", "Nenhuma característica de dados encontrada no dispositivo.");
      return {
        success: false,
        error: "Dispositivo conectado mas não possui característica RFID compatível. Verifique o modelo.",
      };
    }

    // Subscribe to notifications
    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (!target.value) return;
      const eid = parseEID(target.value);
      if (eid) {
        emitEvent({
          type: "rfid_read",
          deviceId: readerId,
          value: eid,
          timestamp: new Date(),
        });
      }
    });

    // Store connection
    activeConnections.set(readerId, {
      device,
      server,
      characteristic,
      state: "listening",
    });

    notifyState(readerId, "listening");
    emitEvent({
      type: "status_change",
      deviceId: readerId,
      value: "connected",
      timestamp: new Date(),
    });

    return { success: true, deviceName: device.name || "Dispositivo BLE" };
  } catch (err: unknown) {
    const msg =
      err instanceof DOMException && err.name === "NotFoundError"
        ? "Nenhum dispositivo selecionado ou pareamento cancelado."
        : err instanceof DOMException && err.name === "SecurityError"
        ? "Permissão Bluetooth negada. Verifique as configurações do navegador."
        : err instanceof Error
        ? err.message
        : "Erro desconhecido ao conectar.";

    notifyState(readerId, "error", msg);
    return { success: false, error: msg };
  }
}

/** Disconnect a Bluetooth reader */
export function disconnectBluetoothReader(readerId: string) {
  const conn = activeConnections.get(readerId);
  if (!conn) return;

  try {
    if (conn.characteristic) {
      conn.characteristic.removeEventListener("characteristicvaluechanged", () => {});
    }
    if (conn.server?.connected) {
      conn.server.disconnect();
    }
  } catch {
    // Best-effort cleanup
  }

  activeConnections.delete(readerId);
  notifyState(readerId, "idle");
  emitEvent({
    type: "status_change",
    deviceId: readerId,
    value: "disconnected",
    timestamp: new Date(),
  });
}

/** Get active connection info */
export function getBluetoothConnection(readerId: string): BluetoothRfidConnection | undefined {
  return activeConnections.get(readerId);
}

/** Check if a reader is connected via real Bluetooth */
export function isBluetoothConnected(readerId: string): boolean {
  const conn = activeConnections.get(readerId);
  return conn?.server?.connected === true;
}
