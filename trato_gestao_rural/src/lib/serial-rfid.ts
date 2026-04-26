/* ── Web Serial USB RFID Reader & Scale Service ── */

import { emitEvent } from "@/data/devices-mock";

export type SerialConnectionState =
  | "idle"
  | "requesting"
  | "connected"
  | "reading"
  | "disconnected"
  | "error";

interface SerialReaderConnection {
  deviceId: string;
  port: SerialPort | null;
  reader: ReadableStreamDefaultReader<Uint8Array> | null;
  state: SerialConnectionState;
  lastEid: string | null;
  abortFlag: boolean;
}

const serialConnections = new Map<string, SerialReaderConnection>();
const stateListeners: Array<(deviceId: string, state: SerialConnectionState, error?: string) => void> = [];

export function onSerialStateChange(
  cb: (deviceId: string, state: SerialConnectionState, error?: string) => void
) {
  stateListeners.push(cb);
  return () => {
    const idx = stateListeners.indexOf(cb);
    if (idx >= 0) stateListeners.splice(idx, 1);
  };
}

function notifyState(deviceId: string, state: SerialConnectionState, error?: string) {
  stateListeners.forEach((cb) => cb(deviceId, state, error));
}

/** Check if Web Serial API is available */
export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

/**
 * Parse a line of serial data.
 * Detects RFID EIDs and scale weight readings.
 *
 * RFID EID formats:
 *   - FDX-B 15-digit: "982000123456789"
 *   - Country prefix: "BR 076 123456789"
 *   - Generic tag: "BR-001"
 *
 * Scale weight formats:
 *   - Tru-Test:    "+0385.0kg"  or  "-0385.0kg"
 *   - Gallagher:   "  385.0"
 *   - Coimma:      "385.5 kg"
 *   - Ruddweigh:   "ST,GS,  385.0 kg"
 *   - Generic:     any number optionally followed by "kg"
 */
interface ParsedLine {
  type: "eid" | "weight" | "unknown";
  value: string;
}

function parseLine(line: string): ParsedLine {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return { type: "unknown", value: "" };

  // ── Weight patterns ──

  // Tru-Test: "+0385.0kg" or "-0385.0kg" or "+0385.0 kg"
  const truTestMatch = trimmed.match(/^[+-]?(\d+\.?\d*)\s*kg/i);
  if (truTestMatch) {
    return { type: "weight", value: truTestMatch[1] };
  }

  // Ruddweigh/indicator: "ST,GS,  385.0 kg" or "ST,  385.0"
  const indicatorMatch = trimmed.match(/(?:ST|GS|NT)[,\s]+.*?(\d+\.?\d*)\s*(?:kg)?/i);
  if (indicatorMatch) {
    return { type: "weight", value: indicatorMatch[1] };
  }

  // Gallagher / generic: leading spaces + number, optionally kg
  // Must be a plausible cattle weight (50-2000 kg)
  const gallagherMatch = trimmed.match(/^\s*(\d{2,4}\.?\d{0,2})\s*(?:kg)?\s*$/i);
  if (gallagherMatch) {
    const num = parseFloat(gallagherMatch[1]);
    if (num >= 50 && num <= 2000) {
      return { type: "weight", value: gallagherMatch[1] };
    }
  }

  // ── RFID EID patterns ──

  // FDX-B: 15-digit numeric
  const fdxMatch = trimmed.match(/(\d{15})/);
  if (fdxMatch) return { type: "eid", value: fdxMatch[1] };

  // Country + national ID: "BR 076 123456789" or "076123456789"
  const brMatch = trimmed.match(/(?:BR\s*)?(\d{3}\s*\d{9,12})/i);
  if (brMatch) return { type: "eid", value: brMatch[1].replace(/\s/g, "") };

  // Alphanumeric tag: "BR-001", "EID:12345"
  const tagMatch = trimmed.match(/([A-Z]{2,3}[-:\s]?\d{3,15})/i);
  if (tagMatch) return { type: "eid", value: tagMatch[1] };

  // Any short printable string (3-20 chars) could be an EID
  if (trimmed.length >= 3 && trimmed.length <= 20 && /^[\x20-\x7E]+$/.test(trimmed)) {
    return { type: "eid", value: trimmed };
  }

  return { type: "unknown", value: trimmed };
}

/**
 * Connect to a USB Serial device.
 * Opens the native serial port picker, then reads the data stream
 * parsing both RFID EIDs and scale weight readings.
 */
export async function connectSerialDevice(
  deviceId: string,
  baudRate: number = 9600
): Promise<{ success: boolean; error?: string }> {
  if (!isWebSerialSupported()) {
    return { success: false, error: "Web Serial não é suportado neste navegador. Use Chrome em HTTPS." };
  }

  // Disconnect existing
  disconnectSerialDevice(deviceId);

  notifyState(deviceId, "requesting");

  try {
    const port = await navigator.serial.requestPort();

    await port.open({ baudRate });

    const conn: SerialReaderConnection = {
      deviceId,
      port,
      reader: null,
      state: "connected",
      lastEid: null,
      abortFlag: false,
    };

    serialConnections.set(deviceId, conn);
    notifyState(deviceId, "connected");
    emitEvent({
      type: "status_change",
      deviceId,
      value: "connected",
      timestamp: new Date(),
    });

    // Start reading in background
    readLoop(conn);

    return { success: true };
  } catch (err: unknown) {
    const msg =
      err instanceof DOMException && err.name === "NotFoundError"
        ? "Nenhuma porta serial selecionada."
        : err instanceof DOMException && err.name === "SecurityError"
        ? "Permissão de acesso à porta serial negada."
        : err instanceof Error
        ? err.message
        : "Erro desconhecido ao conectar porta serial.";

    notifyState(deviceId, "error", msg);
    return { success: false, error: msg };
  }
}

/** Background read loop — reads lines from the serial stream */
async function readLoop(conn: SerialReaderConnection) {
  if (!conn.port?.readable) return;

  conn.state = "reading";
  notifyState(conn.deviceId, "reading");

  const decoder = new TextDecoderStream();
  const readableStreamClosed = conn.port.readable.pipeTo(decoder.writable as unknown as WritableStream<Uint8Array>);
  const inputStream = decoder.readable;
  const reader = inputStream.getReader();
  conn.reader = reader as unknown as ReadableStreamDefaultReader<Uint8Array>;

  let buffer = "";

  try {
    while (!conn.abortFlag) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      buffer += value;

      // Process complete lines (terminated by \r\n, \n, or \r)
      const lines = buffer.split(/\r?\n|\r/);
      // Keep the last incomplete chunk in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        const parsed = parseLine(line);

        if (parsed.type === "eid" && parsed.value !== conn.lastEid) {
          conn.lastEid = parsed.value;
          emitEvent({
            type: "rfid_read",
            deviceId: conn.deviceId,
            value: parsed.value,
            timestamp: new Date(),
          });
        } else if (parsed.type === "weight") {
          emitEvent({
            type: "weight_stable",
            deviceId: conn.deviceId,
            value: parsed.value,
            timestamp: new Date(),
          });
        }
      }
    }
  } catch (err) {
    if (!conn.abortFlag) {
      const msg = err instanceof Error ? err.message : "Erro na leitura serial.";
      notifyState(conn.deviceId, "error", msg);
    }
  } finally {
    reader.releaseLock();
    try { await readableStreamClosed; } catch { /* port closed */ }

    if (!conn.abortFlag) {
      conn.state = "disconnected";
      notifyState(conn.deviceId, "disconnected");
      emitEvent({
        type: "status_change",
        deviceId: conn.deviceId,
        value: "disconnected",
        timestamp: new Date(),
      });
    }
  }
}

/** Disconnect a USB Serial device */
export async function disconnectSerialDevice(deviceId: string) {
  const conn = serialConnections.get(deviceId);
  if (!conn) return;

  conn.abortFlag = true;

  try {
    if (conn.reader) {
      await conn.reader.cancel();
      conn.reader.releaseLock();
    }
  } catch { /* best effort */ }

  try {
    if (conn.port) {
      await conn.port.close();
    }
  } catch { /* best effort */ }

  serialConnections.delete(deviceId);
  notifyState(deviceId, "idle");
  emitEvent({
    type: "status_change",
    deviceId,
    value: "disconnected",
    timestamp: new Date(),
  });
}

/** Check if a serial device is connected */
export function isSerialConnected(deviceId: string): boolean {
  const conn = serialConnections.get(deviceId);
  return conn?.state === "connected" || conn?.state === "reading";
}
