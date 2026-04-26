// ── Planejador de Missões de Voo (Precision Ag) ───────────────────────────────
// Gera grade boustrophedon (vai-e-vem) dentro de um polígono
// Calcula tempo de voo, bateria, produto necessário
// Exporta KML compatível com DJI SmartFarm / DJI Terra

import * as turf from "@turf/turf";
import type { Feature, Polygon, Position } from "geojson";
import tokml from "tokml";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface ConfiguracaoMissao {
  // Drone
  velocidade: number;       // m/s (2–15)
  altitudeAGL: number;      // m acima do solo (1–50)
  larguraFaixa: number;     // m (faixa de cobertura do bico)
  sobreposicao: number;     // % de sobreposição lateral (0–50)
  anguloEntrada: number;    // graus (0=N-S, 90=L-O)
  margemSeguranca: number;  // m de distância da borda (2–10)
  // Produto
  vazaoBomba: number;       // L/min
  velocidadeVoo: number;    // m/s durante pulverização
  // Bateria
  capacidadeBat: number;    // mAh (ex: 30000 para T40)
  consumoHover: number;     // mAh/min em hover
  consumoCruise: number;    // mAh/min em voo normal
}

export interface Waypoint {
  lat: number;
  lng: number;
  altitudeAGL: number;
  acao: "decolagem" | "spray_on" | "spray_off" | "pouso" | "waypoint";
  velocidade: number;
}

export interface PlanoMissao {
  waypoints: Waypoint[];
  linhasVoo: [number, number][][];   // [lat,lng][] por linha
  estatisticas: EstatisticasMissao;
  config: ConfiguracaoMissao;
  talhaoNome: string;
  talhaoId: string;
  dataCriacao: Date;
}

export interface EstatisticasMissao {
  totalLinhas: number;
  distanciaVooM: number;
  distanciaTransitoM: number;
  distanciaTotalKm: number;
  tempoVooMin: number;
  tempoTransitoMin: number;
  tempoTotalMin: number;
  bateriaConsumida: number;     // mAh
  bateriaVoos: number;          // quantos voos/baterias necessários
  areaCobertaHa: number;
  produtoNecessarioL: number;   // litros de calda
  eficienciaPercent: number;    // área coberta / área total do talhão
}

export const DRONES_PRESET: Record<string, Partial<ConfiguracaoMissao> & { nome: string; imagem?: string }> = {
  "dji-t40": {
    nome: "DJI Agras T40",
    velocidade: 7,
    altitudeAGL: 3,
    larguraFaixa: 9,
    sobreposicao: 10,
    capacidadeBat: 30000,
    consumoHover: 800,
    consumoCruise: 600,
    vazaoBomba: 8,
    velocidadeVoo: 7,
    margemSeguranca: 3,
    anguloEntrada: 0,
  },
  "dji-t10": {
    nome: "DJI Agras T10",
    velocidade: 5,
    altitudeAGL: 3,
    larguraFaixa: 5,
    sobreposicao: 10,
    capacidadeBat: 12000,
    consumoHover: 400,
    consumoCruise: 300,
    vazaoBomba: 3.6,
    velocidadeVoo: 5,
    margemSeguranca: 2,
    anguloEntrada: 0,
  },
  "xag-p100": {
    nome: "XAG P100 Pro",
    velocidade: 8,
    altitudeAGL: 3,
    larguraFaixa: 10,
    sobreposicao: 10,
    capacidadeBat: 35000,
    consumoHover: 850,
    consumoCruise: 650,
    vazaoBomba: 10,
    velocidadeVoo: 8,
    margemSeguranca: 3,
    anguloEntrada: 0,
  },
};

// ── Algoritmo de planejamento ────────────────────────────────────────────────

/**
 * Gera linhas de voo boustrophedon (vai-e-vem) dentro do polígono.
 * Rotaciona o polígono para o ângulo de entrada, gera linhas paralelas,
 * intersecta com o polígono, depois rotaciona de volta.
 */
export function gerarPlanoMissao(
  talhaoId: string,
  talhaoNome: string,
  talhaoCoords: [number, number][], // [lat, lng]
  config: ConfiguracaoMissao,
): PlanoMissao {
  // ── 1. Converter para GeoJSON [lng, lat]
  const ringLngLat: Position[] = talhaoCoords.map(([lat, lng]) => [lng, lat]);
  const first = ringLngLat[0];
  const last = ringLngLat[ringLngLat.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ringLngLat.push([first[0], first[1]]);
  }
  const poligono: Feature<Polygon> = turf.polygon([ringLngLat]);
  const centroide = turf.centroid(poligono);
  const cx = centroide.geometry.coordinates[0];
  const cy = centroide.geometry.coordinates[1];

  // ── 2. Rotacionar polígono para alinhar com ângulo de entrada
  const angulo = config.anguloEntrada;
  const poligonoRotado = turf.transformRotate(poligono, angulo, { pivot: [cx, cy] });

  // ── 3. Bounding box do polígono rotado
  const [minLng, minLat, maxLng, maxLat] = turf.bbox(poligonoRotado);

  // ── 4. Calcular espaçamento entre linhas (faixa efetiva)
  const espaçamento = config.larguraFaixa * (1 - config.sobreposicao / 100);

  // Converter espaçamento de metros para graus de latitude
  const espacamentoGraus = espaçamento / 111320;

  // ── 5. Gerar linhas horizontais com margem de segurança
  const margemGraus = config.margemSeguranca / 111320;
  const linhasRotadas: [number, number][][] = [];
  let lat = minLat + margemGraus;
  let direcao = 1; // 1 = esquerda→direita, -1 = direita→esquerda

  while (lat <= maxLat - margemGraus) {
    const linhaFull: Feature = turf.lineString(
      direcao === 1
        ? [[minLng - 0.001, lat], [maxLng + 0.001, lat]]
        : [[maxLng + 0.001, lat], [minLng - 0.001, lat]],
    );

    // Intersecta com o polígono rotado
    try {
      const intersecao = turf.lineIntersect(linhaFull, poligonoRotado);

      // Usar pontos de interseção para definir segmento dentro do polígono
      const pts = intersecao.features
        .map((f) => f.geometry.coordinates as Position)
        .sort((a, b) => (direcao === 1 ? a[0] - b[0] : b[0] - a[0]));

      if (pts.length >= 2) {
        // Aplicar margem lateral
        const ptInicio: Position = [
          pts[0][0] + (direcao === 1 ? margemGraus : -margemGraus),
          pts[0][1],
        ];
        const ptFim: Position = [
          pts[pts.length - 1][0] + (direcao === 1 ? -margemGraus : margemGraus),
          pts[pts.length - 1][1],
        ];

        if (Math.abs(ptFim[0] - ptInicio[0]) > margemGraus * 2) {
          linhasRotadas.push([
            [ptInicio[1], ptInicio[0]], // [lat, lng]
            [ptFim[1], ptFim[0]],
          ]);
        }
      }
    } catch {
      // Linha pode não intersectar o polígono nesta posição
    }

    lat += espacamentoGraus;
    direcao *= -1;
  }

  // ── 6. Rotacionar linhas de volta ao ângulo original
  const linhasFinais: [number, number][][] = linhasRotadas.map((linha) => {
    return linha.map(([lat, lng]) => {
      const pt = turf.point([lng, lat]);
      const rotated = turf.transformRotate(pt, -angulo, { pivot: [cx, cy] });
      const [lngR, latR] = rotated.geometry.coordinates;
      return [latR, lngR] as [number, number];
    });
  });

  // ── 7. Gerar waypoints
  const waypoints: Waypoint[] = [];

  // Decolagem
  if (linhasFinais.length > 0) {
    waypoints.push({
      lat: linhasFinais[0][0][0],
      lng: linhasFinais[0][0][1],
      altitudeAGL: config.altitudeAGL + 5,
      acao: "decolagem",
      velocidade: config.velocidade,
    });
  }

  for (const linha of linhasFinais) {
    if (linha.length < 2) continue;

    waypoints.push({
      lat: linha[0][0],
      lng: linha[0][1],
      altitudeAGL: config.altitudeAGL,
      acao: "spray_on",
      velocidade: config.velocidadeVoo,
    });

    waypoints.push({
      lat: linha[1][0],
      lng: linha[1][1],
      altitudeAGL: config.altitudeAGL,
      acao: "spray_off",
      velocidade: config.velocidadeVoo,
    });
  }

  // Pouso
  if (linhasFinais.length > 0) {
    const ultima = linhasFinais[linhasFinais.length - 1];
    waypoints.push({
      lat: ultima[ultima.length - 1][0],
      lng: ultima[ultima.length - 1][1],
      altitudeAGL: 0,
      acao: "pouso",
      velocidade: 3,
    });
  }

  // ── 8. Calcular estatísticas
  const stats = calcularEstatisticasMissao(linhasFinais, config, talhaoCoords);

  return {
    waypoints,
    linhasVoo: linhasFinais,
    estatisticas: stats,
    config,
    talhaoNome,
    talhaoId,
    dataCriacao: new Date(),
  };
}

function calcularEstatisticasMissao(
  linhas: [number, number][][],
  config: ConfiguracaoMissao,
  talhaoCoords: [number, number][],
): EstatisticasMissao {
  let distanciaVooM = 0;
  let distanciaTransitoM = 0;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    if (linha.length < 2) continue;

    // Comprimento da linha de pulverização
    const from = turf.point([linha[0][1], linha[0][0]]);
    const to = turf.point([linha[1][1], linha[1][0]]);
    distanciaVooM += turf.distance(from, to, { units: "meters" });

    // Distância de trânsito entre linhas
    if (i < linhas.length - 1) {
      const fimAtual = turf.point([linha[linha.length - 1][1], linha[linha.length - 1][0]]);
      const inicioProxima = turf.point([linhas[i + 1][0][1], linhas[i + 1][0][0]]);
      distanciaTransitoM += turf.distance(fimAtual, inicioProxima, { units: "meters" });
    }
  }

  const distanciaTotalM = distanciaVooM + distanciaTransitoM;
  const tempoVooMin = distanciaVooM / (config.velocidadeVoo * 60);
  const tempoTransitoMin = distanciaTransitoM / (config.velocidade * 60);
  const tempoTotalMin = tempoVooMin + tempoTransitoMin;

  const bateriaConsumida =
    tempoVooMin * config.consumoCruise + tempoTransitoMin * config.consumoCruise;
  const bateriaVoos = Math.ceil(bateriaConsumida / (config.capacidadeBat * 0.8));

  // Área coberta
  const ringLngLat = talhaoCoords.map(([lat, lng]) => [lng, lat] as Position);
  const first = ringLngLat[0];
  const last = ringLngLat[ringLngLat.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ringLngLat.push([first[0], first[1]]);
  let areaTotalHa = 0;
  try {
    const poly = turf.polygon([ringLngLat]);
    areaTotalHa = turf.area(poly) / 10000;
  } catch { areaTotalHa = 0; }

  const areaCobertaHa =
    (linhas.length * config.larguraFaixa * (distanciaVooM / linhas.length)) / 10000;

  const produtoNecessarioL = (distanciaVooM / config.velocidadeVoo / 60) * config.vazaoBomba;

  return {
    totalLinhas: linhas.length,
    distanciaVooM: Math.round(distanciaVooM),
    distanciaTransitoM: Math.round(distanciaTransitoM),
    distanciaTotalKm: Math.round((distanciaTotalM / 1000) * 100) / 100,
    tempoVooMin: Math.round(tempoVooMin * 10) / 10,
    tempoTransitoMin: Math.round(tempoTransitoMin * 10) / 10,
    tempoTotalMin: Math.round(tempoTotalMin * 10) / 10,
    bateriaConsumida: Math.round(bateriaConsumida),
    bateriaVoos,
    areaCobertaHa: Math.round(areaCobertaHa * 100) / 100,
    produtoNecessarioL: Math.round(produtoNecessarioL * 10) / 10,
    eficienciaPercent: areaTotalHa > 0
      ? Math.min(100, Math.round((areaCobertaHa / areaTotalHa) * 100))
      : 0,
  };
}

// ── Export KML (DJI SmartFarm compatível) ────────────────────────────────────

export function exportarMissaoKML(plano: PlanoMissao): void {
  const features = [
    // Polígono da área de missão (para visualização)
    ...plano.linhasVoo.map((linha, i) => ({
      type: "Feature" as const,
      properties: {
        name: `Linha ${i + 1}`,
        description: `Faixa de pulverização ${i + 1}`,
        stroke: i % 2 === 0 ? "#22c55e" : "#3b82f6",
        "stroke-width": 2,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: linha.map(([lat, lng]) => [lng, lat, plano.config.altitudeAGL]),
      },
    })),
    // Waypoints de pulverização
    ...plano.waypoints
      .filter((w) => w.acao === "spray_on" || w.acao === "spray_off")
      .map((w, i) => ({
        type: "Feature" as const,
        properties: {
          name: `WP${i + 1} (${w.acao === "spray_on" ? "Spray ON" : "Spray OFF"})`,
          description: `Alt: ${w.altitudeAGL}m | Vel: ${w.velocidade}m/s`,
          "marker-color": w.acao === "spray_on" ? "#22c55e" : "#ef4444",
        },
        geometry: {
          type: "Point" as const,
          coordinates: [w.lng, w.lat, w.altitudeAGL],
        },
      })),
  ];

  const fc = { type: "FeatureCollection" as const, features };
  const kml = tokml(fc, {
    documentName: `Missão — ${plano.talhaoNome}`,
    documentDescription: [
      `Gerado pelo Trato Gestão Rural`,
      `Talhão: ${plano.talhaoNome}`,
      `Linhas: ${plano.estatisticas.totalLinhas}`,
      `Tempo estimado: ${plano.estatisticas.tempoTotalMin} min`,
      `Produto: ${plano.estatisticas.produtoNecessarioL} L`,
      `Baterias: ${plano.estatisticas.bateriaVoos}x`,
    ].join("\n"),
    simplestyle: true,
  });

  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `missao-${plano.talhaoId}-${plano.dataCriacao.toISOString().split("T")[0]}.kml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Export WPL (waypoint list genérico) ──────────────────────────────────────

export function exportarMissaoWPL(plano: PlanoMissao): void {
  const linhas = [
    "QGC WPL 110",
    // Home point
    `0\t1\t0\t16\t0\t0\t0\t0\t${plano.waypoints[0]?.lat ?? 0}\t${plano.waypoints[0]?.lng ?? 0}\t${plano.config.altitudeAGL + 5}\t1`,
  ];

  plano.waypoints.forEach((wp, i) => {
    const cmd = wp.acao === "spray_on" ? 178 : wp.acao === "spray_off" ? 179 : 16;
    linhas.push(
      `${i + 1}\t0\t3\t${cmd}\t0\t0\t0\t0\t${wp.lat}\t${wp.lng}\t${wp.altitudeAGL}\t1`,
    );
  });

  const content = linhas.join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `missao-${plano.talhaoId}.waypoints`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatarTempo(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export const CONFIG_PADRAO: ConfiguracaoMissao = {
  velocidade: 7,
  altitudeAGL: 3,
  larguraFaixa: 9,
  sobreposicao: 10,
  anguloEntrada: 0,
  margemSeguranca: 3,
  vazaoBomba: 8,
  velocidadeVoo: 7,
  capacidadeBat: 30000,
  consumoHover: 800,
  consumoCruise: 600,
};
