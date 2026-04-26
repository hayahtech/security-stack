import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PeriodSelectorProps {
  startDate: Date;
  endDate: Date;
  onStartChange: (d: Date) => void;
  onEndChange: (d: Date) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  exportingPDF?: boolean;
}

export function PeriodSelector({ startDate, endDate, onStartChange, onEndChange, onExportPDF, onExportExcel, exportingPDF }: PeriodSelectorProps) {
  const presets = [
    { label: 'Este mês', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    { label: 'Mês passado', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    { label: 'Últimos 3 meses', start: startOfMonth(subMonths(new Date(), 2)), end: endOfMonth(new Date()) },
    { label: 'Últimos 6 meses', start: startOfMonth(subMonths(new Date(), 5)), end: endOfMonth(new Date()) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <Select onValueChange={(v) => {
        const p = presets[Number(v)];
        onStartChange(p.start);
        onEndChange(p.end);
      }}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período rápido" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p, i) => (
            <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(startDate, "dd/MM/yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={startDate} onSelect={(d) => d && onStartChange(d)} className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">até</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(endDate, "dd/MM/yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={endDate} onSelect={(d) => d && onEndChange(d)} className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>

      <div className="flex gap-2 ml-auto">
        <Button variant="outline" onClick={onExportPDF} disabled={exportingPDF}>
          <FileDown className="h-4 w-4 mr-2" />
          {exportingPDF ? 'Gerando...' : 'Exportar PDF'}
        </Button>
        <Button variant="outline" onClick={onExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>
    </div>
  );
}
