// ── Relatório PDF de Conformidade ────────────────────────────────────────────
// Gera laudo de aplicação de defensivos agrícolas com assinatura eletrônica
// Conformidade: Lei 7.802/89 (Agrotóxicos), Instrução Normativa MAPA 17/2019

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OperacaoCampo } from "@/data/operacoes-campo-mock";
import { TIPO_LABELS, EQUIPAMENTO_LABELS, CLASSE_TOXICO_LABEL } from "@/data/operacoes-campo-mock";
import type { EstatisticasTelemetria } from "./telemetria-dji";
import { formatarDuracao } from "./telemetria-dji";

// Cores corporativas
const COR_VERDE = [22, 101, 52] as [number, number, number];      // #166534
const COR_VERDE_CLARO = [220, 252, 231] as [number, number, number]; // #dcfce7
const COR_CINZA = [75, 85, 99] as [number, number, number];
const COR_CINZA_CLARO = [243, 244, 246] as [number, number, number];
const COR_PRETO = [17, 24, 39] as [number, number, number];
const COR_BRANCO = [255, 255, 255] as [number, number, number];
const COR_LARANJA = [234, 88, 12] as [number, number, number];
const COR_VERMELHO = [185, 28, 28] as [number, number, number];

function classeCorTox(classe: string): [number, number, number] {
  if (classe === "I") return COR_VERMELHO;
  if (classe === "II") return [220, 38, 38];
  if (classe === "III") return [202, 138, 4];
  return [22, 101, 52];
}

function formatarData(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// ── Gerador principal ────────────────────────────────────────────────────────

export function gerarRelatorioPDF(
  op: OperacaoCampo,
  telemetria?: EstatisticasTelemetria,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; // largura A4
  let y = 0;

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFillColor(...COR_VERDE);
  doc.rect(0, 0, W, 28, "F");

  doc.setTextColor(...COR_BRANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("LAUDO DE APLICAÇÃO DE DEFENSIVOS AGRÍCOLAS", 14, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Trato Gestão Rural • Conformidade IN MAPA 17/2019 • Lei 7.802/89", 14, 17);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`, 14, 22);

  // Número do documento (canto direito)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Nº ${op.id.toUpperCase()}`, W - 14, 17, { align: "right" });

  y = 35;

  // ── Identificação da Operação ──────────────────────────────────────────────
  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setFillColor(...COR_VERDE_CLARO);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.text("1. IDENTIFICAÇÃO DA OPERAÇÃO", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: COR_CINZA_CLARO, textColor: COR_PRETO, fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    body: [
      ["Tipo de Operação", TIPO_LABELS[op.tipo]],
      ["Talhão / Área", `${op.talhaoNome} — ${op.areaHa} ha`],
      ["Área Planejada", `${op.areaPlanejaHa} ha`],
      ["Área Coberta", op.areaCobertaHa ? `${op.areaCobertaHa} ha` : "—"],
      ["Eficiência de Cobertura", op.areaCobertaHa
        ? `${Math.round((op.areaCobertaHa / op.areaPlanejaHa) * 100)}%`
        : "—"],
      ["Data / Hora Início", formatarDataHora(op.dataInicio)],
      ["Data / Hora Fim", op.dataFim ? formatarDataHora(op.dataFim) : "—"],
      ["Status", op.status.toUpperCase()],
    ],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // ── Produtos Aplicados ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setFillColor(...COR_VERDE_CLARO);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.setTextColor(...COR_PRETO);
  doc.text("2. PRODUTOS APLICADOS", 14, y);
  y += 4;

  const produtoRows = op.produtos.map((p) => [
    p.nome,
    p.principioAtivo,
    p.registroMapa,
    CLASSE_TOXICO_LABEL[p.classeToxico],
    `${p.dose} ${p.unidade}`,
    `${p.volumeTotal} L`,
    `R$ ${p.custo.toLocaleString("pt-BR")}`,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: COR_VERDE, textColor: COR_BRANCO, fontStyle: "bold" },
    head: [["Produto", "Princípio Ativo", "Reg. MAPA", "Classe Tox.", "Dose", "Vol. Total", "Custo"]],
    body: produtoRows,
    didParseCell: (data) => {
      // Colorir a célula de Classe Toxicológica
      if (data.column.index === 3 && data.section === "body") {
        const row = op.produtos[data.row.index];
        if (row) {
          data.cell.styles.textColor = classeCorTox(row.classeToxico);
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // ── Equipamento e Operador ─────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setFillColor(...COR_VERDE_CLARO);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.setTextColor(...COR_PRETO);
  doc.text("3. EQUIPAMENTO E OPERADOR", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: COR_CINZA_CLARO, textColor: COR_PRETO, fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    body: [
      ["Tipo de Equipamento", EQUIPAMENTO_LABELS[op.equipamento.tipo]],
      ["Modelo", op.equipamento.modelo],
      ["Registro / ANAC", op.equipamento.registro || "—"],
      ["Operador / Piloto", op.operador.nome],
      ["CPF", op.operador.documento],
      ["ART / CREA", op.operador.art || "—"],
    ],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // ── Condições Climáticas ───────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setFillColor(...COR_VERDE_CLARO);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.setTextColor(...COR_PRETO);
  doc.text("4. CONDIÇÕES CLIMÁTICAS NO MOMENTO DA APLICAÇÃO", 14, y);
  y += 4;

  const climaBody = [
    ["Velocidade do Vento", `${op.clima.vento} km/h`],
    ["Temperatura", `${op.clima.temperatura} °C`],
    ["Umidade Relativa", `${op.clima.umidade} %`],
    ["Chuva nas últimas 24h", op.clima.chuvaUltimas24h ? "SIM ⚠" : "Não"],
  ];

  // Alerta de vento
  if (op.clima.vento > 15) {
    climaBody.push(["⚠ ATENÇÃO", `Vento acima de 15 km/h — risco de deriva`]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } },
    body: climaBody,
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === climaBody.length - 1 && op.clima.vento > 15) {
        data.cell.styles.textColor = COR_LARANJA;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // ── Carência ───────────────────────────────────────────────────────────────
  if (op.carenciaDias > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setFillColor(254, 243, 199); // amarelo
    doc.rect(10, y - 5, W - 20, 7, "F");
    doc.setTextColor(...COR_PRETO);
    doc.text("5. PERÍODO DE CARÊNCIA", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } },
      body: [
        ["Dias de Carência", `${op.carenciaDias} dias`],
        ["Vencimento da Carência", op.carenciaVence ? formatarData(op.carenciaVence) : "—"],
        ["Reentrada na Área", op.carenciaVence ? `Somente após ${formatarData(op.carenciaVence)}` : "—"],
      ],
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // ── Telemetria (se disponível) ─────────────────────────────────────────────
  if (telemetria) {
    // Nova página se necessário
    if (y > 220) {
      doc.addPage();
      y = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setFillColor(...COR_VERDE_CLARO);
    doc.rect(10, y - 5, W - 20, 7, "F");
    doc.setTextColor(...COR_PRETO);
    doc.text("6. DADOS DE TELEMETRIA DO VOO", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } },
      body: [
        ["Total de Pontos Registrados", telemetria.totalPontos.toLocaleString("pt-BR")],
        ["Duração do Voo", formatarDuracao(telemetria.duracaoSegundos)],
        ["Distância Percorrida", `${telemetria.distanciaKm} km`],
        ["Área Coberta (convex hull)", `${telemetria.areaCobertaHa} ha`],
        ["Velocidade Média", `${telemetria.velocidadeMedia} m/s`],
        ["Velocidade Máxima", `${telemetria.velocidadeMax} m/s`],
        ["Altitude Média (AGL)", `${telemetria.altitudeMedia} m`],
        ["Altitude Mín/Máx", `${telemetria.altitudeMin} / ${telemetria.altitudeMax} m`],
        telemetria.consumoBateria != null
          ? ["Consumo de Bateria", `${telemetria.consumoBateria}% (${telemetria.batInicio}% → ${telemetria.batFim}%)`]
          : ["Bateria", "—"],
        ["Pontos com Spray Ativo", `${telemetria.pontosSpray} (${telemetria.percentCobertura}% do voo)`],
      ],
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // ── Observações ────────────────────────────────────────────────────────────
  if (op.observacoes) {
    if (y > 230) { doc.addPage(); y = 15; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COR_CINZA);
    doc.text("OBSERVAÇÕES:", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COR_PRETO);
    const lines = doc.splitTextToSize(op.observacoes, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;
  }

  // ── Custo Total ────────────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFillColor(...COR_VERDE);
  doc.rect(10, y, W - 20, 10, "F");
  doc.setTextColor(...COR_BRANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CUSTO TOTAL DA OPERAÇÃO", 14, y + 7);
  doc.text(
    `R$ ${op.custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    W - 14,
    y + 7,
    { align: "right" },
  );
  y += 16;

  // ── Assinaturas ────────────────────────────────────────────────────────────
  if (y > 245) { doc.addPage(); y = 15; }
  y += 5;
  doc.setTextColor(...COR_PRETO);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const col1 = 14;
  const col2 = W / 2 + 5;
  const yAssin = y + 18;

  // Linha esquerda
  doc.line(col1, yAssin, col1 + 80, yAssin);
  doc.text(`${op.operador.nome}`, col1 + 40, yAssin + 4, { align: "center" });
  doc.text("Operador / Piloto Responsável", col1 + 40, yAssin + 8, { align: "center" });
  doc.text(`CPF: ${op.operador.documento}`, col1 + 40, yAssin + 12, { align: "center" });

  // Linha direita
  doc.line(col2, yAssin, col2 + 80, yAssin);
  doc.text("_______________________________", col2, yAssin - 1);
  doc.text("Responsável Técnico / Agrônomo", col2 + 40, yAssin + 4, { align: "center" });
  doc.text(`ART: ${op.operador.art || "____________________"}`, col2 + 40, yAssin + 8, { align: "center" });

  // ── Rodapé ────────────────────────────────────────────────────────────────
  const totalPaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(...COR_CINZA);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Documento gerado pelo Trato Gestão Rural • Conforme Lei 7.802/89 e Instrução Normativa MAPA 17/2019",
      W / 2,
      295,
      { align: "center" },
    );
    doc.text(`Página ${p} de ${totalPaginas}`, W - 14, 295, { align: "right" });
    doc.text(`ID: ${op.id}`, 14, 295);
  }

  // ── Download ───────────────────────────────────────────────────────────────
  const fileName = `laudo-${op.id}-${op.dataInicio.split("T")[0]}.pdf`;
  doc.save(fileName);
}

// ── Relatório resumido de todas as operações ──────────────────────────────────

export function gerarRelatorioSintetico(operacoes: OperacaoCampo[]): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;

  // Cabeçalho
  doc.setFillColor(...COR_VERDE);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(...COR_BRANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("RESUMO DE OPERAÇÕES DE CAMPO", 14, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Período: ${operacoes.length} operações • Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 14, 17);

  const totalCusto = operacoes.reduce((s, o) => s + o.custoTotal, 0);
  const totalArea = operacoes.reduce((s, o) => s + o.areaPlanejaHa, 0);

  doc.text(`Custo Total: R$ ${totalCusto.toLocaleString("pt-BR")} • Área Total: ${totalArea} ha`, W - 14, 17, { align: "right" });

  autoTable(doc, {
    startY: 28,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: COR_VERDE, textColor: COR_BRANCO, fontStyle: "bold" },
    head: [[
      "ID", "Tipo", "Talhão", "Área (ha)", "Produto", "Equip.", "Operador",
      "Data", "Status", "Carência", "Custo (R$)",
    ]],
    body: operacoes.map((o) => [
      o.id,
      TIPO_LABELS[o.tipo],
      o.talhaoNome,
      o.areaPlanejaHa,
      o.produtos.map((p) => p.nome).join(", "),
      EQUIPAMENTO_LABELS[o.equipamento.tipo],
      o.operador.nome,
      formatarData(o.dataInicio),
      o.status,
      o.carenciaVence ? formatarData(o.carenciaVence) : "—",
      o.custoTotal.toLocaleString("pt-BR"),
    ]),
    foot: [[
      "", "", "TOTAL", totalArea, "", "", "", "", "", "",
      totalCusto.toLocaleString("pt-BR"),
    ]],
    footStyles: { fillColor: COR_CINZA_CLARO, fontStyle: "bold" },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 8) {
        const op = operacoes[data.row.index];
        if (op?.status === "concluida") data.cell.styles.textColor = [22, 101, 52];
        if (op?.status === "em_execucao") data.cell.styles.textColor = COR_VERMELHO;
        if (op?.status === "planejada") data.cell.styles.textColor = [37, 99, 235];
      }
    },
  });

  doc.save(`operacoes-campo-${new Date().toISOString().split("T")[0]}.pdf`);
}
