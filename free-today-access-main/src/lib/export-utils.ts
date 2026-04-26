import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export async function exportPDF(elementId: string, filename: string, title?: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Temporarily add print styles
  element.classList.add('export-mode');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  element.classList.remove('export-mode');

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  // First page
  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= (pdfHeight - 20);

  // Add pages if content overflows
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 20);
  }

  pdf.save(`${filename}.pdf`);
}

export function exportExcel(data: Record<string, any>[], sheetName: string, filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Auto-size columns
  const maxWidths: number[] = [];
  const headers = Object.keys(data[0] || {});
  headers.forEach((h, i) => {
    maxWidths[i] = h.length;
    data.forEach(row => {
      const val = String(row[h] ?? '');
      if (val.length > (maxWidths[i] || 0)) maxWidths[i] = val.length;
    });
  });
  ws['!cols'] = maxWidths.map(w => ({ wch: Math.min(w + 2, 40) }));

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportMultiSheetExcel(sheets: { name: string; data: Record<string, any>[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}
