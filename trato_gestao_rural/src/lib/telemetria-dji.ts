// ── Telemetria DJI SmartFarm ─────────────────────────────────────────────────
// Parse de CSV/JSON exportado pelo DJI SmartFarm, DJI Terra e formatos genéricos
// Colunas detectadas automaticamente (case-insensitive, múltiplos aliases)

import * as turf from "@turf/turf";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface PontoTelemetria {
  timestamp: Date;
  lat: number;
  lng: number;
  altitude: number;        // metros (AGL)
  velocidade: number;      // m/s
  heading: number;         // graus (0-360)
  bateria?: number;        // %
  fluxoBomba?: number;     // L/min
  sprayAtivo?: boolean;
  tempMotor?: number;       // °C
}

export interface EstatisticasTelemetria {
  totalPontos: number;
  duracaoSegundos: number;
  areaCobert aHa: number;
  distanciaKm: number;
  velocidadeMedia: number;  // m/s
  velocidadeMax: number;
  altitudeMedia: number;
  altitudeMin: number;
  altitudeMax: number;
  batInicio?: number;
  batFim?: number;
  consumoBateria?: number;
  pontosSpray: number;      // pontos com pulverização ativa
  percentCobertura: number; // % do talhão coberto
}

export interface TelemetriaImportada {
  pontos: PontoTelemetria[];
  stats: EstatisticasTelemetria;
  formatoDetectado: string;
  nomeArquivo: string;
  dataVoo: Date;
}

// ── Aliases de colunas (DJI SmartFarm, DJI Terra, genérico) ──────────────────
const COL_LAT = ["latitude", "lat", "gps_lat", "gpslatitude", "y"];
const COL_LNG = ["longitude", "lng", "lon", "gps_lon", "gpslongitude", "x"];
const COL_ALT = ["altitude", "alt", "height", "relative_altitude", "altura", "altrel"];
const COL_VEL = ["speed", "velocity", "velocidade", "groundspeed", "ground_speed", "vel"];
const COL_HDG = ["heading", "yaw", "curso", "direcao", "direction"];
const COL_BAT = ["battery", "bateria", "battery_level", "volt", "voltage", "bat"];
const COL_FLUX = ["flow", "fluxo", "pump_flow", "spray_flow", "vazao"];
const COL_SPRAY = ["spray", "spraying", "spray_status", "pump", "pulverizando"];
const COL_TIME = [
  "timestamp", "time", "datetime", "date_time", "hora", "data",
  "gps_time", "utc_time", "record_time", "tempo",
];

function findCol(headers: string[], aliases: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ""));
  for (const alias of aliases) {
    const idx = lower.findIndex((h) => h === alias || h.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseNum(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function parseBool(v: string | undefined): boolean {
  if (!v) return false;
  const lower = v.toLowerCase().trim();
  return lower === "1" || lower === "true" || lower === "yes" || lower === "sim" || lower === "on";
}

function parseTimestamp(v: string | undefined, idx: number): Date {
  if (!v) return new Date(Date.now() + idx * 1000);
  // ISO 8601
  const iso = new Date(v);
  if (!isNaN(iso.getTime())) return iso;
  // epoch ms
  const epoch = Number(v);
  if (!isNaN(epoch) && epoch > 1e9) return new Date(epoch < 1e12 ? epoch * 1000 : epoch);
  return new Date(Date.now() + idx * 1000);
}

// ── Parser CSV ───────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  // Detecta delimitador: vírgula, ponto-e-vírgula ou tab
  const firstLine = text.split("\n")[0];
  const sep = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";

  return text
    .trim()
    .split("\n")
    .map((line) =>
      line.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, "")),
    );
}

export async function importarTelemetriaCSV(file: File): Promise<TelemetriaImportada> {
  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error("Arquivo vazio ou sem dados");

  const headers = rows[0];
  const iLat = findCol(headers, COL_LAT);
  const iLng = findCol(headers, COL_LNG);
  const iAlt = findCol(headers, COL_ALT);
  const iVel = findCol(headers, COL_VEL);
  const iHdg = findCol(headers, COL_HDG);
  const iBat = findCol(headers, COL_BAT);
  const iFlux = findCol(headers, COL_FLUX);
  const iSpray = findCol(headers, COL_SPRAY);
  const iTime = findCol(headers, COL_TIME);

  if (iLat === -1 || iLng === -1) {
    throw new Error(
      `Colunas de latitude/longitude não encontradas.\nColunas detectadas: ${headers.join(", ")}`,
    );
  }

  const pontos: PontoTelemetria[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2 || !row[iLat] || !row[iLng]) continue;

    const lat = parseNum(row[iLat]);
    const lng = parseNum(row[iLng]);
    if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) continue;

    pontos.push({
      timestamp: parseTimestamp(iTime !== -1 ? row[iTime] : undefined, i),
      lat,
      lng,
      altitude: iAlt !== -1 ? parseNum(row[iAlt]) : 30,
      velocidade: iVel !== -1 ? parseNum(row[iVel]) : 0,
      heading: iHdg !== -1 ? parseNum(row[iHdg]) : 0,
      bateria: iBat !== -1 ? parseNum(row[iBat]) : undefined,
      fluxoBomba: iFlux !== -1 ? parseNum(row[iFlux]) : undefined,
      sprayAtivo: iSpray !== -1 ? parseBool(row[iSpray]) : undefined,
    });
  }

  if (pontos.length === 0) throw new Error("Nenhum ponto de telemetria válido encontrado");

  const formatoDetectado = `CSV (${headers.length} colunas, ${pontos.length} pontos)`;
  return finalizarImport(pontos, formatoDetectado, file.name);
}

// ── Parser JSON (DJI SmartFarm JSON export) ───────────────────────────────────

export async function importarTelemetriaJSON(file: File): Promise<TelemetriaImportada> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSON inválido");
  }

  const rows: unknown[] = Array.isArray(data)
    ? data
    : ((data as Record<string, unknown>)?.records as unknown[]) ||
      ((data as Record<string, unknown>)?.data as unknown[]) ||
      ((data as Record<string, unknown>)?.points as unknown[]) ||
      [];

  if (!rows.length) throw new Error("Nenhum registro encontrado no JSON");

  const pontos: PontoTelemetria[] = rows
    .map((r, i) => {
      const o = r as Record<string, unknown>;
      const lat = parseNum(
        String(o.latitude ?? o.lat ?? o.gps_lat ?? o.y ?? ""),
      );
      const lng = parseNum(
        String(o.longitude ?? o.lng ?? o.lon ?? o.x ?? ""),
      );
      if (!lat && !lng) return null;

      return {
        timestamp: parseTimestamp(
          String(o.timestamp ?? o.time ?? o.datetime ?? ""),
          i,
        ),
        lat,
        lng,
        altitude: parseNum(String(o.altitude ?? o.height ?? o.alt ?? "30")),
        velocidade: parseNum(String(o.speed ?? o.velocity ?? o.velocidade ?? "0")),
        heading: parseNum(String(o.heading ?? o.yaw ?? "0")),
        bateria: o.battery != null ? parseNum(String(o.battery)) : undefined,
        fluxoBomba: o.flow != null ? parseNum(String(o.flow)) : undefined,
        sprayAtivo: o.spray != null ? parseBool(String(o.spray)) : undefined,
      } as PontoTelemetria;
    })
    .filter(Boolean) as PontoTelemetria[];

  if (pontos.length === 0) throw new Error("Nenhum ponto de telemetria válido encontrado");

  return finalizarImport(pontos, `JSON (${pontos.length} pontos)`, file.name);
}

// ── Entrada unificada ────────────────────────────────────────────────────────

export async function importarTelemetria(file: File): Promise<TelemetriaImportada> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json")) return importarTelemetriaJSON(file);
  if (name.endsWith(".csv") || name.endsWith(".txt")) return importarTelemetriaCSV(file);
  throw new Error("Formato não suportado. Use CSV (.csv/.txt) ou JSON (.json)");
}

// ── Calcular estatísticas ────────────────────────────────────────────────────

function finalizarImport(
  pontos: PontoTelemetria[],
  formatoDetectado: string,
  nomeArquivo: string,
): TelemetriaImportada {
  const stats = calcularEstatisticas(pontos);
  return {
    pontos,
    stats,
    formatoDetectado,
    nomeArquivo,
    dataVoo: pontos[0]?.timestamp ?? new Date(),
  };
}

function calcularEstatisticas(pontos: PontoTelemetria[]): EstatisticasTelemetria {
  if (pontos.length < 2) {
    return {
      totalPontos: pontos.length,
      duracaoSegundos: 0,
      areaCobertaHa: 0,
      distanciaKm: 0,
      velocidadeMedia: 0,
      velocidadeMax: 0,
      altitudeMedia: 0,
      altitudeMin: 0,
      altitudeMax: 0,
      pontosSpray: 0,
      percentCobertura: 0,
    };
  }

  const t0 = pontos[0].timestamp.getTime();
  const tN = pontos[pontos.length - 1].timestamp.getTime();
  const duracaoSegundos = Math.round((tN - t0) / 1000);

  // Distância total (sum de segmentos)
  let distanciaM = 0;
  for (let i = 1; i < pontos.length; i++) {
    const from = turf.point([pontos[i - 1].lng, pontos[i - 1].lat]);
    const to = turf.point([pontos[i].lng, pontos[i].lat]);
    distanciaM += turf.distance(from, to, { units: "meters" });
  }

  // Área coberta via convex hull
  const coords = pontos.map((p) => [p.lng, p.lat]);
  let areaCobertaHa = 0;
  try {
    const hull = turf.convex(turf.multiPoint(coords));
    if (hull) {
      areaCobertaHa = Math.round((turf.area(hull) / 10000) * 100) / 100;
    }
  } catch {
    areaCobertaHa = 0;
  }

  const vels = pontos.map((p) => p.velocidade);
  const alts = pontos.map((p) => p.altitude);
  const bats = pontos.map((p) => p.bateria).filter((b): b is number => b != null);
  const pontosSpray = pontos.filter((p) => p.sprayAtivo).length;

  return {
    totalPontos: pontos.length,
    duracaoSegundos,
    areaCobertaHa,
    distanciaKm: Math.round((distanciaM / 1000) * 100) / 100,
    velocidadeMedia: Math.round((vels.reduce((s, v) => s + v, 0) / vels.length) * 10) / 10,
    velocidadeMax: Math.round(Math.max(...vels) * 10) / 10,
    altitudeMedia: Math.round(alts.reduce((s, v) => s + v, 0) / alts.length),
    altitudeMin: Math.min(...alts),
    altitudeMax: Math.max(...alts),
    batInicio: bats[0],
    batFim: bats[bats.length - 1],
    consumoBateria: bats.length >= 2 ? bats[0] - bats[bats.length - 1] : undefined,
    pontosSpray,
    percentCobertura: pontosSpray > 0 ? Math.round((pontosSpray / pontos.length) * 100) : 0,
  };
}

// ── Mock de telemetria para demonstração ─────────────────────────────────────
// Simula voo de pulverização no Pasto Grande (pp-4) com trajeto em faixas

export function gerarTelemetriaMock(): TelemetriaImportada {
  const pontos: PontoTelemetria[] = [];
  const baseDate = new Date("2026-03-20T06:30:00");

  // Voo em faixas (boustrophedon) sobre o Pasto Grande
  const minLat = -19.750;
  const maxLat = -19.742;
  const minLng = -19.950 + 2.006; // ~-47.940 + offset
  const maxLng = minLng + 0.006;

  // Corrected: bounding box do pp-4
  const latStart = -19.742;
  const latEnd = -19.750;
  const lngStart = -47.940;
  const lngEnd = -47.946;
  const faixas = 18;
  const pontosPorFaixa = 24;

  let tempo = baseDate.getTime();
  let bateria = 98;
  let idx = 0;

  for (let f = 0; f < faixas; f++) {
    const lat = latStart + ((latEnd - latStart) / faixas) * f;
    const dir = f % 2 === 0 ? 1 : -1;

    for (let p = 0; p < pontosPorFaixa; p++) {
      const progress = dir === 1 ? p / pontosPorFaixa : 1 - p / pontosPorFaixa;
      const lng = lngStart + (lngEnd - lngStart) * progress;

      // Pequena variação para parecer real
      const jitterLat = (Math.random() - 0.5) * 0.00005;
      const jitterLng = (Math.random() - 0.5) * 0.00005;

      const velocidade = 5 + Math.random() * 2.5; // 5-7.5 m/s
      const altitude = 3 + Math.random() * 0.5;   // 3-3.5m AGL
      bateria = Math.max(10, bateria - 0.12);

      pontos.push({
        timestamp: new Date(tempo),
        lat: lat + jitterLat,
        lng: lng + jitterLng,
        altitude,
        velocidade,
        heading: dir === 1 ? 270 : 90,
        bateria: Math.round(bateria),
        fluxoBomba: 2.4 + Math.random() * 0.4,
        sprayAtivo: true,
      });

      tempo += Math.round((1 / velocidade) * 12 * 1000); // ~12m entre pontos
      idx++;
    }

    // Trecho de reposicionamento (sem spray)
    for (let r = 0; r < 3; r++) {
      tempo += 2000;
      bateria = Math.max(10, bateria - 0.05);
      pontos.push({
        timestamp: new Date(tempo),
        lat: lat + (latEnd - latStart) / faixas / 2 + (Math.random() - 0.5) * 0.0001,
        lng: dir === 1 ? lngEnd : lngStart,
        altitude: 8 + Math.random(),
        velocidade: 8,
        heading: dir === 1 ? 0 : 180,
        bateria: Math.round(bateria),
        fluxoBomba: 0,
        sprayAtivo: false,
      });
    }
  }

  return finalizarImport(pontos, "Mock DJI Agras T40 (simulado)", "op-003-pasto-grande.csv");
}

// ── Helpers de exibição ──────────────────────────────────────────────────────

export function formatarDuracao(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Amostrar pontos para não sobrecarregar o mapa (máx ~1000 pontos renderizados) */
export function amostrarPontos(pontos: PontoTelemetria[], maxPontos = 1000): PontoTelemetria[] {
  if (pontos.length <= maxPontos) return pontos;
  const step = Math.ceil(pontos.length / maxPontos);
  return pontos.filter((_, i) => i % step === 0);
}
