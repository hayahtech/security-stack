// ── Geo I/O — Import/Export de arquivos geoespaciais ────────────────────────
// Suporta: KML (DJI SmartFarm, Google Earth), Shapefile (.zip), GeoJSON
// Exporta: KML para uso em drones DJI e mapas de prescrição (VRA)

import * as toGeoJSON from "@tmcw/togeojson";
import tokml from "tokml";
import shp from "shpjs";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon, Position } from "geojson";

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface ImportedTalhao {
  nome: string;
  areaHa: number;
  coords: [number, number][]; // [lat, lng] para Leaflet
  properties?: Record<string, unknown>;
}

export interface ZonaManejo {
  id: string;
  nome: string;
  talhaoId: string;
  coords: [number, number][];
  dose: number;           // dose variável (L/ha, kg/ha)
  unidade: string;
  cor: string;            // cor visual da zona (verde/amarelo/vermelho)
  ndvi?: number;          // índice de vegetação (0-1)
  observacao?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Converte coordenadas Leaflet [lat,lng] → GeoJSON [lng,lat] */
function leafletToGeoJSON(coords: [number, number][]): Position[] {
  return coords.map(([lat, lng]) => [lng, lat]);
}

/** Converte coordenadas GeoJSON [lng,lat] → Leaflet [lat,lng] */
function geoJSONToLeaflet(coords: Position[]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng]);
}

/** Calcula área em hectares a partir de coordenadas Leaflet */
export function calcularAreaHa(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const ringLngLat = leafletToGeoJSON(coords);
  // Fecha o polígono se ainda não estiver fechado
  const first = ringLngLat[0];
  const last = ringLngLat[ringLngLat.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ringLngLat.push([first[0], first[1]]);
  }
  const poly = turf.polygon([ringLngLat]);
  const areaM2 = turf.area(poly);
  return Math.round((areaM2 / 10000) * 100) / 100;
}

// ── IMPORT: KML ──────────────────────────────────────────────────────────────

/** Importa arquivo KML e retorna lista de talhões */
export async function importKML(file: File): Promise<ImportedTalhao[]> {
  const text = await file.text();
  const parser = new DOMParser();
  const kmlDom = parser.parseFromString(text, "text/xml");
  const geojson = toGeoJSON.kml(kmlDom) as FeatureCollection;
  return featureCollectionToTalhoes(geojson);
}

// ── IMPORT: Shapefile (.zip) ─────────────────────────────────────────────────

/** Importa .zip contendo Shapefile (.shp + .dbf + .prj) */
export async function importShapefile(file: File): Promise<ImportedTalhao[]> {
  const buffer = await file.arrayBuffer();
  const geojson = await shp(buffer);
  const fc = Array.isArray(geojson) ? geojson[0] : geojson;
  return featureCollectionToTalhoes(fc as FeatureCollection);
}

// ── IMPORT: GeoJSON ──────────────────────────────────────────────────────────

export async function importGeoJSON(file: File): Promise<ImportedTalhao[]> {
  const text = await file.text();
  const geojson = JSON.parse(text) as FeatureCollection;
  return featureCollectionToTalhoes(geojson);
}

/** Converte FeatureCollection em lista de talhões Leaflet-ready */
function featureCollectionToTalhoes(fc: FeatureCollection): ImportedTalhao[] {
  const talhoes: ImportedTalhao[] = [];
  let idx = 1;

  for (const feature of fc.features) {
    if (!feature.geometry) continue;

    const props = feature.properties || {};
    const nome =
      (props.name as string) ||
      (props.nome as string) ||
      (props.NOME as string) ||
      (props.Name as string) ||
      `Talhão ${idx}`;

    if (feature.geometry.type === "Polygon") {
      const ring = feature.geometry.coordinates[0] as Position[];
      const coords = geoJSONToLeaflet(ring);
      talhoes.push({
        nome,
        areaHa: calcularAreaHa(coords),
        coords,
        properties: props,
      });
      idx++;
    } else if (feature.geometry.type === "MultiPolygon") {
      for (const poly of feature.geometry.coordinates) {
        const ring = poly[0] as Position[];
        const coords = geoJSONToLeaflet(ring);
        talhoes.push({
          nome: `${nome} #${idx}`,
          areaHa: calcularAreaHa(coords),
          coords,
          properties: props,
        });
        idx++;
      }
    }
  }

  return talhoes;
}

// ── EXPORT: KML ──────────────────────────────────────────────────────────────

/** Exporta um talhão como arquivo KML (pronto para DJI SmartFarm) */
export function exportTalhaoAsKML(talhao: {
  nome: string;
  areaHa: number;
  coords: [number, number][];
}): void {
  const fc: FeatureCollection = {
    type: "FeatureCollection",
    features: [talhaoToFeature(talhao)],
  };
  const kml = tokml(fc, {
    documentName: talhao.nome,
    documentDescription: `Talhão exportado — ${talhao.areaHa} ha`,
  });
  downloadFile(kml, `${slugify(talhao.nome)}.kml`, "application/vnd.google-earth.kml+xml");
}

/** Exporta múltiplos talhões como KML */
export function exportTalhoesAsKML(
  talhoes: Array<{ nome: string; areaHa: number; coords: [number, number][] }>,
  nomeArquivo = "talhoes",
): void {
  const fc: FeatureCollection = {
    type: "FeatureCollection",
    features: talhoes.map(talhaoToFeature),
  };
  const kml = tokml(fc, {
    documentName: "Talhões da Fazenda",
    documentDescription: `${talhoes.length} talhões exportados`,
  });
  downloadFile(kml, `${nomeArquivo}.kml`, "application/vnd.google-earth.kml+xml");
}

/** Exporta mapa de prescrição (VRA) como KML com doses por zona */
export function exportPrescriptionMapAsKML(
  zonas: ZonaManejo[],
  nomeArquivo = "prescricao",
): void {
  const features: Feature[] = zonas.map((zona) => {
    const ring = leafletToGeoJSON(zona.coords);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }
    const geom: Polygon = { type: "Polygon", coordinates: [ring] };
    return {
      type: "Feature",
      properties: {
        name: zona.nome,
        description: `Dose: ${zona.dose} ${zona.unidade}${zona.observacao ? ` — ${zona.observacao}` : ""}`,
        dose: zona.dose,
        unidade: zona.unidade,
        stroke: zona.cor,
        "stroke-width": 2,
        fill: zona.cor,
        "fill-opacity": 0.4,
      },
      geometry: geom,
    };
  });

  const fc: FeatureCollection = { type: "FeatureCollection", features };
  const kml = tokml(fc, {
    documentName: "Mapa de Prescrição VRA",
    documentDescription: `${zonas.length} zonas de manejo com doses variáveis`,
    simplestyle: true,
  });
  downloadFile(kml, `${nomeArquivo}.kml`, "application/vnd.google-earth.kml+xml");
}

/** Exporta como GeoJSON (formato universal) */
export function exportAsGeoJSON(
  talhoes: Array<{ nome: string; areaHa: number; coords: [number, number][] }>,
  nomeArquivo = "talhoes",
): void {
  const fc: FeatureCollection = {
    type: "FeatureCollection",
    features: talhoes.map(talhaoToFeature),
  };
  downloadFile(JSON.stringify(fc, null, 2), `${nomeArquivo}.geojson`, "application/geo+json");
}

// ── Helpers internos ─────────────────────────────────────────────────────────

function talhaoToFeature(t: { nome: string; areaHa: number; coords: [number, number][] }): Feature {
  const ring = leafletToGeoJSON(t.coords);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }
  const geom: Polygon = { type: "Polygon", coordinates: [ring] };
  return {
    type: "Feature",
    properties: {
      name: t.nome,
      description: `Área: ${t.areaHa} ha`,
      areaHa: t.areaHa,
    },
    geometry: geom,
  };
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Zonas de manejo (VRA) — helpers ──────────────────────────────────────────

/**
 * Gera 3 zonas de dose diferenciada dentro de um talhão, dividindo em faixas.
 * Útil para demonstrar aplicação localizada antes de integração com NDVI real.
 */
export function gerarZonasAutomaticas(
  talhaoId: string,
  talhaoCoords: [number, number][],
  doseBase: number,
  unidade: string,
): ZonaManejo[] {
  // Calcula bounding box
  const lats = talhaoCoords.map((c) => c[0]);
  const lngs = talhaoCoords.map((c) => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const tercoLat = (maxLat - minLat) / 3;

  const zonaAlta: [number, number][] = [
    [minLat, minLng],
    [minLat + tercoLat, minLng],
    [minLat + tercoLat, maxLng],
    [minLat, maxLng],
  ];
  const zonaMedia: [number, number][] = [
    [minLat + tercoLat, minLng],
    [minLat + 2 * tercoLat, minLng],
    [minLat + 2 * tercoLat, maxLng],
    [minLat + tercoLat, maxLng],
  ];
  const zonaBaixa: [number, number][] = [
    [minLat + 2 * tercoLat, minLng],
    [maxLat, minLng],
    [maxLat, maxLng],
    [minLat + 2 * tercoLat, maxLng],
  ];

  return [
    {
      id: `${talhaoId}-zona-alta`,
      talhaoId,
      nome: "Zona Alta (vigor reduzido)",
      coords: zonaAlta,
      dose: Math.round(doseBase * 1.3 * 100) / 100,
      unidade,
      cor: "#dc2626",
      ndvi: 0.35,
      observacao: "NDVI baixo — requer dose maior para recuperação",
    },
    {
      id: `${talhaoId}-zona-media`,
      talhaoId,
      nome: "Zona Média",
      coords: zonaMedia,
      dose: doseBase,
      unidade,
      cor: "#f59e0b",
      ndvi: 0.55,
      observacao: "Vigor normal — dose padrão",
    },
    {
      id: `${talhaoId}-zona-baixa`,
      talhaoId,
      nome: "Zona Saudável (alto vigor)",
      coords: zonaBaixa,
      dose: Math.round(doseBase * 0.7 * 100) / 100,
      unidade,
      cor: "#16a34a",
      ndvi: 0.78,
      observacao: "NDVI alto — pode reduzir dose",
    },
  ];
}

/** Calcula economia estimada comparando dose única vs. dose variável */
export function calcularEconomiaVRA(
  areaTotalHa: number,
  doseBase: number,
  zonas: ZonaManejo[],
  custoUnit: number,
): { custoUniforme: number; custoVRA: number; economia: number; economiaPct: number } {
  const custoUniforme = areaTotalHa * doseBase * custoUnit;
  let volumeVRA = 0;
  for (const zona of zonas) {
    const areaZona = calcularAreaHa(zona.coords);
    volumeVRA += areaZona * zona.dose;
  }
  const custoVRA = volumeVRA * custoUnit;
  const economia = custoUniforme - custoVRA;
  const economiaPct = custoUniforme > 0 ? (economia / custoUniforme) * 100 : 0;
  return {
    custoUniforme: Math.round(custoUniforme),
    custoVRA: Math.round(custoVRA),
    economia: Math.round(economia),
    economiaPct: Math.round(economiaPct * 10) / 10,
  };
}
