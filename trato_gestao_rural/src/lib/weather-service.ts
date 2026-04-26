/* ── Weather Service — Open-Meteo API ────────────── */

export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
}

export interface DailyForecast {
  date: string;
  weathercode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbMax: number;
  windspeedMax: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyData {
  time: string;
  temperature: number;
  precipitation: number;
  windspeed: number;
  humidity: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyData[];
  fetchedAt: number;
}

export interface HistoricalMonthly {
  month: string;
  precipitation: number;
}

/* ── Weather code → icon/label mapping ─── */
const WMO_MAP: Record<number, { icon: string; label: string }> = {
  0: { icon: "☀️", label: "Céu limpo" },
  1: { icon: "🌤️", label: "Parcialmente limpo" },
  2: { icon: "⛅", label: "Parcialmente nublado" },
  3: { icon: "☁️", label: "Nublado" },
  45: { icon: "🌫️", label: "Névoa" },
  48: { icon: "🌫️", label: "Névoa com geada" },
  51: { icon: "🌦️", label: "Garoa leve" },
  53: { icon: "🌦️", label: "Garoa moderada" },
  55: { icon: "🌧️", label: "Garoa intensa" },
  61: { icon: "🌧️", label: "Chuva leve" },
  63: { icon: "🌧️", label: "Chuva moderada" },
  65: { icon: "🌧️", label: "Chuva intensa" },
  71: { icon: "🌨️", label: "Neve leve" },
  73: { icon: "🌨️", label: "Neve moderada" },
  75: { icon: "❄️", label: "Neve intensa" },
  80: { icon: "🌧️", label: "Pancadas leves" },
  81: { icon: "🌧️", label: "Pancadas moderadas" },
  82: { icon: "⛈️", label: "Pancadas fortes" },
  95: { icon: "⛈️", label: "Tempestade" },
  96: { icon: "⛈️", label: "Tempestade com granizo" },
  99: { icon: "⛈️", label: "Tempestade severa" },
};

export function getWeatherInfo(code: number) {
  return WMO_MAP[code] || { icon: "🌤️", label: "Indefinido" };
}

/* ── THI — Temperature Humidity Index ─── */
export function calculateTHI(tempC: number, humidityPercent: number): number {
  // THI = (1.8 × T + 32) − (0.55 − 0.0055 × RH) × (1.8 × T − 26)
  const tf = 1.8 * tempC + 32;
  return tf - (0.55 - 0.0055 * humidityPercent) * (tf - 26);
}

export function getTHIStatus(thi: number): { label: string; color: string; icon: string } {
  if (thi < 72) return { label: "Conforto", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: "✅" };
  if (thi < 79) return { label: "Atenção", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: "⚠️" };
  return { label: "Estresse térmico", color: "bg-destructive/15 text-destructive", icon: "❌" };
}

/* ── Graus-dia acumulados ─── */
export function calcGDA(tempMax: number, tempMin: number, baseTemp = 10): number {
  return Math.max(0, (tempMax + tempMin) / 2 - baseTemp);
}

/* ── Evapotranspiração simplificada (Hargreaves) ─── */
export function calcET0(tempMax: number, tempMin: number, latitude: number, dayOfYear: number): number {
  const Ra = 15; // simplified solar radiation MJ/m²/day for tropics
  const tMean = (tempMax + tempMin) / 2;
  return 0.0023 * (tMean + 17.8) * Math.sqrt(Math.max(0, tempMax - tempMin)) * Ra * 0.408;
}

/* ── Farm coordinates ─── */
export interface FarmLocation {
  farmId: string;
  farmName: string;
  lat: number;
  lon: number;
}

export const DEFAULT_FARM_LOCATIONS: FarmLocation[] = [
  { farmId: "faz-1", farmName: "Fazenda Boa Vista", lat: -19.7472, lon: -47.9318 },
  { farmId: "faz-2", farmName: "Fazenda São José", lat: -21.1767, lon: -47.8208 },
  { farmId: "faz-3", farmName: "Sítio Esperança", lat: -16.6869, lon: -49.2648 },
];

/* ── Cache ─── */
const CACHE_KEY = "agrofinance_weather_cache";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(lat: number, lon: number): WeatherData | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${lat}_${lon}`);
    if (!raw) return null;
    const data: WeatherData = JSON.parse(raw);
    if (Date.now() - data.fetchedAt > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(lat: number, lon: number, data: WeatherData) {
  try {
    localStorage.setItem(`${CACHE_KEY}_${lat}_${lon}`, JSON.stringify(data));
  } catch { /* quota */ }
}

/* ── Fetch forecast ─── */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const cached = getCached(lat, lon);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,windspeed_10m,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode,sunrise,sunset,precipitation_probability_max&current_weather=true&timezone=America/Sao_Paulo&forecast_days=16`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo error: ${resp.status}`);
  const json = await resp.json();

  const data: WeatherData = {
    current: {
      temperature: json.current_weather.temperature,
      windspeed: json.current_weather.windspeed,
      weathercode: json.current_weather.weathercode,
      time: json.current_weather.time,
    },
    daily: json.daily.time.map((t: string, i: number) => ({
      date: t,
      weathercode: json.daily.weathercode[i],
      tempMax: json.daily.temperature_2m_max[i],
      tempMin: json.daily.temperature_2m_min[i],
      precipitationSum: json.daily.precipitation_sum[i],
      precipitationProbMax: json.daily.precipitation_probability_max[i],
      windspeedMax: json.daily.windspeed_10m_max[i],
      sunrise: json.daily.sunrise[i],
      sunset: json.daily.sunset[i],
    })),
    hourly: json.hourly.time.map((t: string, i: number) => ({
      time: t,
      temperature: json.hourly.temperature_2m[i],
      precipitation: json.hourly.precipitation[i],
      windspeed: json.hourly.windspeed_10m[i],
      humidity: json.hourly.relativehumidity_2m[i],
    })),
    fetchedAt: Date.now(),
  };

  setCache(lat, lon, data);
  return data;
}

/* ── Fetch historical monthly precipitation (último 1 ano) ─── */
export async function fetchHistorical(lat: number, lon: number): Promise<HistoricalMonthly[]> {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 1);

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&start_date=${start.toISOString().slice(0, 10)}&end_date=${end.toISOString().slice(0, 10)}&timezone=America/Sao_Paulo`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo archive error: ${resp.status}`);
  const json = await resp.json();

  const months: Record<string, number> = {};
  json.daily.time.forEach((t: string, i: number) => {
    const m = t.slice(0, 7);
    months[m] = (months[m] || 0) + (json.daily.precipitation_sum[i] || 0);
  });

  return Object.entries(months).map(([month, precipitation]) => ({
    month,
    precipitation: Math.round(precipitation * 10) / 10,
  }));
}

/* ── Série histórica de décadas (Open-Meteo Archive — desde 1940) ─── */
export interface PluvioAnual {
  ano: number;
  totalMm: number;          // precipitação total do ano (mm)
  mediaMovel5a: number | null; // média móvel 5 anos
  anomalia: number | null;  // desvio em % vs média histórica
  meses: { mes: number; totalMm: number }[];
}

export interface PluvioDecadas {
  lat: number;
  lon: number;
  localNome: string;
  uf: string;
  anos: PluvioAnual[];
  mediaHistorica: number;   // média anual do período completo
  fetchedAt: number;
}

const DECADAS_CACHE_KEY = "agrofinance_pluvio_decadas";
const DECADAS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function getDecadasCached(lat: number, lon: number): PluvioDecadas | null {
  try {
    const raw = localStorage.getItem(`${DECADAS_CACHE_KEY}_${lat}_${lon}`);
    if (!raw) return null;
    const data: PluvioDecadas = JSON.parse(raw);
    if (Date.now() - data.fetchedAt > DECADAS_CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setDecadasCache(lat: number, lon: number, data: PluvioDecadas) {
  try {
    localStorage.setItem(`${DECADAS_CACHE_KEY}_${lat}_${lon}`, JSON.stringify(data));
  } catch { /* quota */ }
}

/**
 * Busca histórico pluviométrico de décadas via Open-Meteo Archive.
 * API gratuita, sem chave, cobre de 1940 até ontem.
 * Para reduzir payload, busca em chunks de 10 anos.
 */
export async function fetchPluvioDecadas(
  lat: number,
  lon: number,
  localNome: string,
  uf: string,
  anosAtras = 30
): Promise<PluvioDecadas> {
  const cached = getDecadasCached(lat, lon);
  if (cached) return cached;

  const hoje = new Date();
  const anoFim = hoje.getFullYear() - 1; // ano completo mais recente
  const anoInicio = anoFim - anosAtras + 1;

  // Open-Meteo Archive aceita intervalos longos — buscamos de uma vez
  const startDate = `${anoInicio}-01-01`;
  const endDate = `${anoFim}-12-31`;

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&start_date=${startDate}&end_date=${endDate}&timezone=America%2FSao_Paulo`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo Archive error: ${resp.status}`);
  const json = await resp.json();

  // Agrupa por ano e mês
  const porAnoMes: Record<number, Record<number, number>> = {};
  (json.daily.time as string[]).forEach((t, i) => {
    const ano = Number(t.slice(0, 4));
    const mes = Number(t.slice(5, 7));
    const v = (json.daily.precipitation_sum[i] as number) || 0;
    if (!porAnoMes[ano]) porAnoMes[ano] = {};
    porAnoMes[ano][mes] = (porAnoMes[ano][mes] || 0) + v;
  });

  const anos: PluvioAnual[] = Object.entries(porAnoMes)
    .map(([anoStr, meses]) => {
      const ano = Number(anoStr);
      const mesesArr = Object.entries(meses).map(([m, v]) => ({
        mes: Number(m),
        totalMm: Math.round(v * 10) / 10,
      }));
      const totalMm = Math.round(mesesArr.reduce((s, m) => s + m.totalMm, 0) * 10) / 10;
      return { ano, totalMm, meses: mesesArr, mediaMovel5a: null, anomalia: null };
    })
    .sort((a, b) => a.ano - b.ano);

  // Média histórica geral
  const mediaHistorica = anos.length
    ? Math.round((anos.reduce((s, a) => s + a.totalMm, 0) / anos.length) * 10) / 10
    : 0;

  // Média móvel 5 anos e anomalia
  anos.forEach((a, i) => {
    const janela = anos.slice(Math.max(0, i - 2), i + 3);
    a.mediaMovel5a = Math.round((janela.reduce((s, x) => s + x.totalMm, 0) / janela.length) * 10) / 10;
    a.anomalia = mediaHistorica > 0
      ? Math.round(((a.totalMm - mediaHistorica) / mediaHistorica) * 1000) / 10
      : null;
  });

  const result: PluvioDecadas = {
    lat, lon, localNome, uf,
    anos,
    mediaHistorica,
    fetchedAt: Date.now(),
  };

  setDecadasCache(lat, lon, result);
  return result;
}

export function classificarAno(anomalia: number | null): {
  label: string; color: string; bg: string;
} {
  if (anomalia === null) return { label: "—", color: "text-muted-foreground", bg: "bg-muted" };
  if (anomalia >= 25)  return { label: "Muito chuvoso", color: "text-blue-700", bg: "bg-blue-100" };
  if (anomalia >= 10)  return { label: "Chuvoso", color: "text-cyan-700", bg: "bg-cyan-100" };
  if (anomalia >= -10) return { label: "Normal", color: "text-green-700", bg: "bg-green-100" };
  if (anomalia >= -25) return { label: "Seco", color: "text-amber-700", bg: "bg-amber-100" };
  return { label: "Muito seco", color: "text-red-700", bg: "bg-red-100" };
}

/* ── Climate alerts ─── */
export interface ClimateAlert {
  type: "rain" | "heat" | "wind" | "cold" | "ideal";
  icon: string;
  title: string;
  message: string;
  severity: "urgente" | "atencao" | "informativo" | "sucesso";
}

export function generateAlerts(data: WeatherData): ClimateAlert[] {
  const alerts: ClimateAlert[] = [];
  const next3days = data.daily.slice(0, 3);
  const next7days = data.daily.slice(0, 7);

  // Heavy rain
  const heavyRainDay = next3days.find((d) => d.precipitationSum > 30);
  if (heavyRainDay) {
    const day = new Date(heavyRainDay.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
    alerts.push({
      type: "rain", icon: "🌧️", severity: "atencao",
      title: "Chuva intensa prevista",
      message: `${Math.round(heavyRainDay.precipitationSum)}mm previstos para ${day}. Considere antecipar vacinações e evite pulverizações.`,
    });
  }

  // Heat wave (THI > 79 for 3+ days)
  const currentHumidity = data.hourly[0]?.humidity || 60;
  const hotDays = next7days.filter((d) => calculateTHI(d.tempMax, currentHumidity) > 79);
  if (hotDays.length >= 3) {
    alerts.push({
      type: "heat", icon: "🌡️", severity: "urgente",
      title: "Onda de calor — Estresse térmico",
      message: `${hotDays.length} dias com THI > 79 previstos. Garanta água disponível em todos os pastos e considere mover animais para áreas com sombra.`,
    });
  }

  // Strong wind
  const windDay = next3days.find((d) => d.windspeedMax > 50);
  if (windDay) {
    alerts.push({
      type: "wind", icon: "🌬️", severity: "atencao",
      title: "Vento forte previsto",
      message: `Vento de até ${Math.round(windDay.windspeedMax)} km/h. Adie pulverizações planejadas.`,
    });
  }

  // Cold
  const coldDay = next3days.find((d) => d.tempMin < 5);
  if (coldDay) {
    alerts.push({
      type: "cold", icon: "❄️", severity: "urgente",
      title: "Temperatura baixa",
      message: `Mínima de ${coldDay.tempMin}°C prevista. Atenção com bezerros recém-nascidos — considere recolher animais jovens.`,
    });
  }

  // Ideal vaccination conditions
  const idealDays = next3days.filter((d) => d.tempMax < 32 && d.tempMin > 10 && d.precipitationProbMax < 30);
  if (idealDays.length >= 3 && alerts.length === 0) {
    alerts.push({
      type: "ideal", icon: "🌿", severity: "sucesso",
      title: "Condição ideal para vacinação",
      message: "Próximos 3 dias com clima favorável para vacinação em campo (temperatura amena, sem chuva prevista).",
    });
  }

  return alerts;
}
