/* ── Device configuration types and mock data for RFID readers and scales ── */

export type ConnectionType = "bluetooth" | "wifi" | "usb_serial";
export type RfidStandard = "fdx_b" | "hdx" | "uhf";
export type DeviceLocation = "brete" | "tronco" | "embarcadouro" | "manga" | "balanca" | "porteira" | "outro";
export type DeviceStatus = "connected" | "disconnected" | "waiting";

export const connectionTypeLabel: Record<ConnectionType, string> = {
  bluetooth: "Bluetooth LE",
  wifi: "Wi-Fi / HTTP Local",
  usb_serial: "USB Serial",
};

export const rfidStandardLabel: Record<RfidStandard, string> = {
  fdx_b: "ISO 11784/11785 FDX-B (134.2 kHz)",
  hdx: "HDX",
  uhf: "UHF 860-960 MHz",
};

export const deviceLocationLabel: Record<DeviceLocation, string> = {
  brete: "Brete",
  tronco: "Tronco",
  embarcadouro: "Embarcadouro",
  manga: "Manga",
  balanca: "Balança",
  porteira: "Porteira",
  outro: "Outro",
};

export const statusLabel: Record<DeviceStatus, string> = {
  connected: "Conectado",
  disconnected: "Desconectado",
  waiting: "Aguardando",
};

export const statusColor: Record<DeviceStatus, string> = {
  connected: "bg-emerald-500",
  disconnected: "bg-red-500",
  waiting: "bg-yellow-500",
};

export const readerManufacturers = ["Allflex", "Datamars", "Leader", "Zee Tags", "Gallagher", "Outro"];
export const scaleManufacturers = ["Tru-Test", "Gallagher", "Ruddweigh", "Coimma", "Outro"];

export interface RfidReader {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  connectionType: ConnectionType;
  rfidStandard: RfidStandard;
  location: DeviceLocation;
  active: boolean;
  status: DeviceStatus;
  ipAddress?: string;
  port?: string;
  lastReading?: string;
  lastReadingTime?: string;
}

export interface ElectronicScale {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  connectionType: ConnectionType;
  decimalPlaces: number;
  stabilizationReadings: number;
  linkedReaderId?: string;
  active: boolean;
  status: DeviceStatus;
  lastWeight?: number;
  lastReadingTime?: string;
}

/* ── Mock data ── */
export const mockReaders: RfidReader[] = [
  {
    id: "reader-1",
    name: "Leitor Brete Principal",
    manufacturer: "Allflex",
    model: "RS420",
    connectionType: "bluetooth",
    rfidStandard: "fdx_b",
    location: "brete",
    active: true,
    status: "connected",
    lastReading: "BR 076 123456789",
    lastReadingTime: "2026-03-08 14:32",
  },
  {
    id: "reader-2",
    name: "Painel Embarcadouro",
    manufacturer: "Gallagher",
    model: "HR5",
    connectionType: "wifi",
    rfidStandard: "fdx_b",
    location: "embarcadouro",
    active: true,
    status: "disconnected",
    ipAddress: "192.168.1.50",
    port: "8080",
  },
  {
    id: "reader-3",
    name: "Leitor Porteira Sul",
    manufacturer: "Datamars",
    model: "GES3S",
    connectionType: "usb_serial",
    rfidStandard: "hdx",
    location: "porteira",
    active: false,
    status: "disconnected",
  },
];

export const mockScales: ElectronicScale[] = [
  {
    id: "scale-1",
    name: "Balança Brete 1",
    manufacturer: "Tru-Test",
    model: "S3",
    connectionType: "bluetooth",
    decimalPlaces: 1,
    stabilizationReadings: 3,
    linkedReaderId: "reader-1",
    active: true,
    status: "connected",
    lastWeight: 485.5,
    lastReadingTime: "2026-03-08 14:32",
  },
  {
    id: "scale-2",
    name: "Balança Embarcadouro",
    manufacturer: "Coimma",
    model: "BC-2000",
    connectionType: "wifi",
    decimalPlaces: 0,
    stabilizationReadings: 5,
    linkedReaderId: "reader-2",
    active: true,
    status: "disconnected",
  },
];

/* ── Simulated device communication ── */

let simulationInterval: ReturnType<typeof setInterval> | null = null;
const listeners: Array<(event: DeviceEvent) => void> = [];

export interface DeviceEvent {
  type: "rfid_read" | "weight_stable" | "weight_change" | "status_change";
  deviceId: string;
  value: string;
  timestamp: Date;
}

export function subscribeDeviceEvents(callback: (event: DeviceEvent) => void) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function emitEvent(event: DeviceEvent) {
  listeners.forEach((cb) => cb(event));
}

// Simulated ear tags for demo
const simulatedTags = [
  "BR-001", "BR-002", "BR-003", "BR-005", "BR-006",
  "BR-007", "BR-008", "BR-009", "BR-010", "BR-011",
];

export function startSimulation() {
  if (simulationInterval) return;
  let tagIdx = 0;

  simulationInterval = setInterval(() => {
    const tag = simulatedTags[tagIdx % simulatedTags.length];
    tagIdx++;

    // Simulate RFID read
    emitEvent({
      type: "rfid_read",
      deviceId: "reader-1",
      value: tag,
      timestamp: new Date(),
    });

    // After a small delay, simulate stable weight
    setTimeout(() => {
      const weight = (350 + Math.random() * 200).toFixed(1);
      emitEvent({
        type: "weight_stable",
        deviceId: "scale-1",
        value: weight,
        timestamp: new Date(),
      });
    }, 1500);
  }, 6000); // One animal every 6 seconds
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

export function simulateSingleRead() {
  const tag = simulatedTags[Math.floor(Math.random() * simulatedTags.length)];
  emitEvent({
    type: "rfid_read",
    deviceId: "reader-1",
    value: tag,
    timestamp: new Date(),
  });
}

export function simulateSingleWeight() {
  const weight = (350 + Math.random() * 200).toFixed(1);
  emitEvent({
    type: "weight_stable",
    deviceId: "scale-1",
    value: weight,
    timestamp: new Date(),
  });
}
