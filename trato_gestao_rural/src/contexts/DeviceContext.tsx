import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  subscribeDeviceEvents,
  mockReaders, mockScales,
  type RfidReader, type ElectronicScale, type DeviceEvent, type DeviceStatus,
} from "@/data/devices-mock";
import { connectBluetoothReader, disconnectBluetoothReader, isBluetoothConnected, onBluetoothStateChange } from "@/lib/bluetooth-rfid";
import { connectWifiReader, disconnectWifiReader, isWifiConnected, onWifiStateChange } from "@/lib/wifi-rfid";
import { connectSerialDevice, disconnectSerialDevice, isSerialConnected, onSerialStateChange } from "@/lib/serial-rfid";

/* ── Types ── */

export interface EIDReadEvent {
  eid: string;
  deviceId: string;
  timestamp: Date;
}

export interface WeightReadEvent {
  kg: number;
  deviceId: string;
  timestamp: Date;
}

type EIDListener = (event: EIDReadEvent) => void;
type WeightListener = (event: WeightReadEvent) => void;

interface DeviceContextValue {
  /** All configured readers */
  readers: RfidReader[];
  /** All configured scales */
  scales: ElectronicScale[];
  /** Number of currently connected devices */
  connectedCount: number;
  /** Whether any device is actively connected */
  hasActiveConnection: boolean;
  /** Last EID read across all devices */
  lastEid: EIDReadEvent | null;
  /** Last weight read across all devices */
  lastWeight: WeightReadEvent | null;

  /** Subscribe to EID read events — returns unsubscribe fn */
  onEIDRead: (cb: EIDListener) => () => void;
  /** Subscribe to weight read events — returns unsubscribe fn */
  onWeightRead: (cb: WeightListener) => () => void;

  /** Connect a specific reader by ID */
  connectReader: (readerId: string) => Promise<{ success: boolean; error?: string }>;
  /** Disconnect a specific reader by ID */
  disconnectReader: (readerId: string) => void;
  /** Connect a specific scale by ID */
  connectScale: (scaleId: string) => Promise<{ success: boolean; error?: string }>;
  /** Disconnect a specific scale by ID */
  disconnectScale: (scaleId: string) => void;

  /** Update reader status */
  updateReaderStatus: (readerId: string, status: DeviceStatus) => void;
  /** Update scale status */
  updateScaleStatus: (scaleId: string, status: DeviceStatus) => void;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function useDevices(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevices must be used within DeviceProvider");
  return ctx;
}

/** Convenience hook: subscribe to EID reads, auto-unsubscribes */
export function useEIDRead(callback: EIDListener) {
  const { onEIDRead } = useDevices();
  const cbRef = useRef(callback);
  cbRef.current = callback;
  useEffect(() => {
    return onEIDRead((ev) => cbRef.current(ev));
  }, [onEIDRead]);
}

/** Convenience hook: subscribe to weight reads, auto-unsubscribes */
export function useWeightRead(callback: WeightListener) {
  const { onWeightRead } = useDevices();
  const cbRef = useRef(callback);
  cbRef.current = callback;
  useEffect(() => {
    return onWeightRead((ev) => cbRef.current(ev));
  }, [onWeightRead]);
}

/* ── Provider ── */

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [readers, setReaders] = useState<RfidReader[]>(() => {
    const saved = localStorage.getItem("device_readers");
    return saved ? JSON.parse(saved) : mockReaders;
  });
  const [scales, setScales] = useState<ElectronicScale[]>(() => {
    const saved = localStorage.getItem("device_scales");
    return saved ? JSON.parse(saved) : mockScales;
  });

  const [lastEid, setLastEid] = useState<EIDReadEvent | null>(null);
  const [lastWeight, setLastWeight] = useState<WeightReadEvent | null>(null);

  const eidListeners = useRef<EIDListener[]>([]);
  const weightListeners = useRef<WeightListener[]>([]);

  // Persist device configs
  useEffect(() => {
    localStorage.setItem("device_readers", JSON.stringify(readers));
  }, [readers]);
  useEffect(() => {
    localStorage.setItem("device_scales", JSON.stringify(scales));
  }, [scales]);

  // Subscribe to low-level device events and fan out to typed listeners
  useEffect(() => {
    const unsub = subscribeDeviceEvents((event: DeviceEvent) => {
      if (event.type === "rfid_read") {
        const ev: EIDReadEvent = { eid: event.value, deviceId: event.deviceId, timestamp: event.timestamp };
        setLastEid(ev);
        eidListeners.current.forEach((cb) => cb(ev));

        // Update reader's last reading
        setReaders((rs) =>
          rs.map((r) =>
            r.id === event.deviceId
              ? { ...r, lastReading: event.value, lastReadingTime: event.timestamp.toLocaleString("pt-BR") }
              : r
          )
        );
      } else if (event.type === "weight_stable") {
        const kg = parseFloat(event.value);
        if (!isNaN(kg)) {
          const ev: WeightReadEvent = { kg, deviceId: event.deviceId, timestamp: event.timestamp };
          setLastWeight(ev);
          weightListeners.current.forEach((cb) => cb(ev));

          setScales((ss) =>
            ss.map((s) =>
              s.id === event.deviceId
                ? { ...s, lastWeight: kg, lastReadingTime: event.timestamp.toLocaleString("pt-BR") }
                : s
            )
          );
        }
      } else if (event.type === "status_change") {
        const status = event.value as DeviceStatus;
        setReaders((rs) => rs.map((r) => (r.id === event.deviceId ? { ...r, status } : r)));
        setScales((ss) => ss.map((s) => (s.id === event.deviceId ? { ...s, status } : s)));
      }
    });

    return unsub;
  }, []);

  // Listen for connection state changes from all transport layers
  useEffect(() => {
    const u1 = onBluetoothStateChange((deviceId, state) => {
      const status: DeviceStatus = state === "listening" ? "connected" : state === "disconnected" || state === "error" ? "disconnected" : "waiting";
      setReaders((rs) => rs.map((r) => (r.id === deviceId ? { ...r, status } : r)));
    });
    const u2 = onWifiStateChange((deviceId, state) => {
      const status: DeviceStatus = state === "polling" || state === "websocket" ? "connected" : "disconnected";
      setReaders((rs) => rs.map((r) => (r.id === deviceId ? { ...r, status } : r)));
    });
    const u3 = onSerialStateChange((deviceId, state) => {
      const status: DeviceStatus = state === "connected" || state === "reading" ? "connected" : "disconnected";
      setReaders((rs) => rs.map((r) => (r.id === deviceId ? { ...r, status } : r)));
      setScales((ss) => ss.map((s) => (s.id === deviceId ? { ...s, status } : s)));
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  const onEIDRead = useCallback((cb: EIDListener) => {
    eidListeners.current.push(cb);
    return () => {
      const idx = eidListeners.current.indexOf(cb);
      if (idx >= 0) eidListeners.current.splice(idx, 1);
    };
  }, []);

  const onWeightRead = useCallback((cb: WeightListener) => {
    weightListeners.current.push(cb);
    return () => {
      const idx = weightListeners.current.indexOf(cb);
      if (idx >= 0) weightListeners.current.splice(idx, 1);
    };
  }, []);

  const connectReader = useCallback(async (readerId: string): Promise<{ success: boolean; error?: string }> => {
    const reader = readers.find((r) => r.id === readerId);
    if (!reader) return { success: false, error: "Leitor não encontrado." };

    if (reader.connectionType === "bluetooth") {
      return connectBluetoothReader(readerId);
    } else if (reader.connectionType === "wifi") {
      if (!reader.ipAddress || !reader.port) return { success: false, error: "IP/Porta não configurados." };
      return connectWifiReader(readerId, reader.ipAddress, reader.port);
    } else {
      return connectSerialDevice(readerId);
    }
  }, [readers]);

  const disconnectReaderFn = useCallback((readerId: string) => {
    const reader = readers.find((r) => r.id === readerId);
    if (!reader) return;
    if (reader.connectionType === "bluetooth") disconnectBluetoothReader(readerId);
    else if (reader.connectionType === "wifi") disconnectWifiReader(readerId);
    else disconnectSerialDevice(readerId);
  }, [readers]);

  const connectScale = useCallback(async (scaleId: string): Promise<{ success: boolean; error?: string }> => {
    const scale = scales.find((s) => s.id === scaleId);
    if (!scale) return { success: false, error: "Balança não encontrada." };
    // Scales share connection type logic — USB serial is most common
    return connectSerialDevice(scaleId);
  }, [scales]);

  const disconnectScaleFn = useCallback((scaleId: string) => {
    disconnectSerialDevice(scaleId);
  }, []);

  const updateReaderStatus = useCallback((readerId: string, status: DeviceStatus) => {
    setReaders((rs) => rs.map((r) => (r.id === readerId ? { ...r, status } : r)));
  }, []);

  const updateScaleStatus = useCallback((scaleId: string, status: DeviceStatus) => {
    setScales((ss) => ss.map((s) => (s.id === scaleId ? { ...s, status } : s)));
  }, []);

  const connectedCount = [
    ...readers.filter((r) => r.status === "connected"),
    ...scales.filter((s) => s.status === "connected"),
  ].length;

  const value: DeviceContextValue = {
    readers,
    scales,
    connectedCount,
    hasActiveConnection: connectedCount > 0,
    lastEid,
    lastWeight,
    onEIDRead,
    onWeightRead,
    connectReader,
    disconnectReader: disconnectReaderFn,
    connectScale,
    disconnectScale: disconnectScaleFn,
    updateReaderStatus,
    updateScaleStatus,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}
