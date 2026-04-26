/* ── Wi-Fi / HTTP & WebSocket RFID Reader Service ── */

import { emitEvent } from "@/data/devices-mock";

export type WifiConnectionState =
  | "idle"
  | "polling"
  | "websocket"
  | "disconnected"
  | "error";

interface WifiReaderConnection {
  readerId: string;
  ip: string;
  port: string;
  state: WifiConnectionState;
  mode: "polling" | "websocket";
  lastEid: string | null;
  abortController: AbortController | null;
  ws: WebSocket | null;
  intervalId: ReturnType<typeof setInterval> | null;
}

const wifiConnections = new Map<string, WifiReaderConnection>();
const stateListeners: Array<(readerId: string, state: WifiConnectionState, error?: string) => void> = [];

export function onWifiStateChange(
  cb: (readerId: string, state: WifiConnectionState, error?: string) => void
) {
  stateListeners.push(cb);
  return () => {
    const idx = stateListeners.indexOf(cb);
    if (idx >= 0) stateListeners.splice(idx, 1);
  };
}

function notifyState(readerId: string, state: WifiConnectionState, error?: string) {
  stateListeners.forEach((cb) => cb(readerId, state, error));
}

/**
 * Extract EID from various response formats.
 * Expects JSON: { "eid": "982000123456789", ... }
 * Also handles plain text responses.
 */
function extractEid(data: string): string | null {
  // Try JSON
  try {
    const json = JSON.parse(data);
    if (json.eid && typeof json.eid === "string" && json.eid.length >= 3) {
      return json.eid.trim();
    }
    // Some readers use "tag", "id", "tagId", "epc"
    const value = json.tag || json.id || json.tagId || json.epc || json.EID;
    if (value && typeof value === "string" && value.length >= 3) {
      return value.trim();
    }
  } catch {
    // Not JSON — try plain text
  }

  const trimmed = data.trim().replace(/[\r\n\x00]/g, "");
  if (trimmed.length >= 3 && trimmed.length <= 30) {
    return trimmed;
  }

  return null;
}

/**
 * Connect to a Wi-Fi RFID reader via HTTP polling.
 * Polls GET http://{IP}:{PORT}/lastread every 500ms.
 * Emits rfid_read event when a new EID is detected.
 */
export function connectWifiPolling(
  readerId: string,
  ip: string,
  port: string
): { success: boolean; error?: string } {
  // Stop existing connection if any
  disconnectWifiReader(readerId);

  const abortController = new AbortController();

  const conn: WifiReaderConnection = {
    readerId,
    ip,
    port,
    state: "polling",
    mode: "polling",
    lastEid: null,
    abortController,
    ws: null,
    intervalId: null,
  };

  notifyState(readerId, "polling");
  emitEvent({
    type: "status_change",
    deviceId: readerId,
    value: "connected",
    timestamp: new Date(),
  });

  const baseUrl = `https://${ip}:${port}`;

  // Polling loop every 500ms
  conn.intervalId = setInterval(async () => {
    try {
      const response = await fetch(`${baseUrl}/lastread`, {
        signal: abortController.signal,
        headers: { Accept: "application/json, text/plain" },
      });

      if (!response.ok) return;

      const text = await response.text();
      const eid = extractEid(text);

      if (eid && eid !== conn.lastEid) {
        conn.lastEid = eid;
        emitEvent({
          type: "rfid_read",
          deviceId: readerId,
          value: eid,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      if (abortController.signal.aborted) return;
      // Network error — reader may be temporarily unreachable
      // Don't disconnect; keep retrying
    }
  }, 500);

  wifiConnections.set(readerId, conn);
  return { success: true };
}

/**
 * Connect to a Wi-Fi RFID reader via WebSocket.
 * Opens ws://{IP}:{PORT}/stream and listens for EID messages.
 */
export function connectWifiWebSocket(
  readerId: string,
  ip: string,
  port: string
): { success: boolean; error?: string } {
  // Stop existing connection if any
  disconnectWifiReader(readerId);

  const wsUrl = `wss://${ip}:${port}/stream`;

  const conn: WifiReaderConnection = {
    readerId,
    ip,
    port,
    state: "websocket",
    mode: "websocket",
    lastEid: null,
    abortController: null,
    ws: null,
    intervalId: null,
  };

  try {
    const ws = new WebSocket(wsUrl);
    conn.ws = ws;

    ws.onopen = () => {
      conn.state = "websocket";
      notifyState(readerId, "websocket");
      emitEvent({
        type: "status_change",
        deviceId: readerId,
        value: "connected",
        timestamp: new Date(),
      });
    };

    ws.onmessage = (event) => {
      const data = typeof event.data === "string" ? event.data : "";
      const eid = extractEid(data);

      if (eid && eid !== conn.lastEid) {
        conn.lastEid = eid;
        emitEvent({
          type: "rfid_read",
          deviceId: readerId,
          value: eid,
          timestamp: new Date(),
        });
      }
    };

    ws.onerror = () => {
      conn.state = "error";
      notifyState(readerId, "error", "Erro na conexão WebSocket. Verifique IP e porta.");
    };

    ws.onclose = () => {
      conn.state = "disconnected";
      notifyState(readerId, "disconnected");
      emitEvent({
        type: "status_change",
        deviceId: readerId,
        value: "disconnected",
        timestamp: new Date(),
      });
    };

    wifiConnections.set(readerId, conn);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao conectar via WebSocket.";
    notifyState(readerId, "error", msg);
    return { success: false, error: msg };
  }
}

/**
 * Auto-detect: try WebSocket first, fall back to HTTP polling.
 */
export async function connectWifiReader(
  readerId: string,
  ip: string,
  port: string
): Promise<{ success: boolean; mode?: string; error?: string }> {
  // Try WebSocket first with a quick timeout
  const wsResult = connectWifiWebSocket(readerId, ip, port);
  if (wsResult.success) {
    // Give WebSocket 2s to connect, otherwise fall back to polling
    return new Promise((resolve) => {
      const conn = wifiConnections.get(readerId);
      const timeout = setTimeout(() => {
        // Check if WS actually connected
        if (conn?.ws?.readyState === WebSocket.OPEN) {
          resolve({ success: true, mode: "websocket" });
        } else {
          // Fall back to polling
          disconnectWifiReader(readerId);
          const pollResult = connectWifiPolling(readerId, ip, port);
          resolve({ success: pollResult.success, mode: "polling", error: pollResult.error });
        }
      }, 2000);

      // If WS opens quickly, resolve immediately
      if (conn?.ws) {
        const origOnOpen = conn.ws.onopen;
        conn.ws.onopen = (ev) => {
          clearTimeout(timeout);
          if (origOnOpen && typeof origOnOpen === "function") origOnOpen.call(conn.ws, ev);
          resolve({ success: true, mode: "websocket" });
        };
        const origOnError = conn.ws.onerror;
        conn.ws.onerror = (ev) => {
          clearTimeout(timeout);
          if (origOnError && typeof origOnError === "function") origOnError.call(conn.ws, ev);
          // Fall back to polling
          disconnectWifiReader(readerId);
          const pollResult = connectWifiPolling(readerId, ip, port);
          resolve({ success: pollResult.success, mode: "polling", error: pollResult.error });
        };
      }
    });
  }

  // Direct polling fallback
  const pollResult = connectWifiPolling(readerId, ip, port);
  return { success: pollResult.success, mode: "polling", error: pollResult.error };
}

/** Disconnect a Wi-Fi reader */
export function disconnectWifiReader(readerId: string) {
  const conn = wifiConnections.get(readerId);
  if (!conn) return;

  if (conn.intervalId) {
    clearInterval(conn.intervalId);
  }
  if (conn.abortController) {
    conn.abortController.abort();
  }
  if (conn.ws) {
    try { conn.ws.close(); } catch { /* best effort */ }
  }

  wifiConnections.delete(readerId);
  notifyState(readerId, "idle");
  emitEvent({
    type: "status_change",
    deviceId: readerId,
    value: "disconnected",
    timestamp: new Date(),
  });
}

/** Check if a Wi-Fi reader is currently connected */
export function isWifiConnected(readerId: string): boolean {
  const conn = wifiConnections.get(readerId);
  return conn?.state === "polling" || conn?.state === "websocket";
}

/** Get connection info */
export function getWifiConnection(readerId: string): WifiReaderConnection | undefined {
  return wifiConnections.get(readerId);
}
