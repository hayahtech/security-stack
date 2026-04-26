import { useState, useCallback } from 'react';
import { Building2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { isValidCnpj, maskCnpj, formatCnpj, cleanCnpj, type Cnpj } from '@/lib/cnpj';
import { cn } from '@/lib/utils';

export interface EmpresaInfo {
  cnpj: Cnpj;
  cnpj_formatted: string;
  nome: string;
  nome_fantasia?: string;
  municipio?: string;
  uf?: string;
}

interface CnpjInputProps {
  onEmpresaValidada: (empresa: EmpresaInfo | null) => void;
  disabled?: boolean;
  initialValue?: string;
}

type ValidationState = 'idle' | 'invalid' | 'valid' | 'not_found';

export function CnpjInput({ onEmpresaValidada, disabled, initialValue = '' }: CnpjInputProps) {
  const [rawValue, setRawValue] = useState(initialValue ? maskCnpj(initialValue) : '');
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCnpj(e.target.value);
    setRawValue(masked);
    setValidationState('idle');
    setEmpresa(null);
    onEmpresaValidada(null);

    const clean = cleanCnpj(masked);
    if (clean.length === 14) {
      if (!isValidCnpj(clean)) {
        setValidationState('invalid');
      }
      // Valid CNPJ detected — trigger lookup via blur/button
    }
  }, [onEmpresaValidada]);

  const handleBlur = useCallback(async () => {
    const clean = cleanCnpj(rawValue);
    if (clean.length !== 14 || !isValidCnpj(clean)) return;
    await lookupEmpresa(clean as Cnpj);
  }, [rawValue]);

  const lookupEmpresa = useCallback(async (cnpj: Cnpj) => {
    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('empresas')
        .select('cnpj, nome, nome_fantasia, municipio, uf')
        .eq('cnpj', cnpj)
        .eq('ativo', true)
        .single();

      if (error || !data) {
        // CNPJ válido mas não cadastrado — ainda permite prosseguir com nome manual
        const info: EmpresaInfo = {
          cnpj,
          cnpj_formatted: formatCnpj(cnpj),
          nome: '',
          municipio: undefined,
          uf: undefined,
        };
        setEmpresa(info);
        setValidationState('not_found');
        onEmpresaValidada(info);
        return;
      }

      const info: EmpresaInfo = {
        cnpj,
        cnpj_formatted: formatCnpj(cnpj),
        nome: data.nome,
        nome_fantasia: data.nome_fantasia ?? undefined,
        municipio: data.municipio ?? undefined,
        uf: data.uf ?? undefined,
      };
      setEmpresa(info);
      setValidationState('valid');
      onEmpresaValidada(info);
    } finally {
      setLoading(false);
    }
  }, [onEmpresaValidada]);

  const handleNomeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!empresa) return;
    const updated = { ...empresa, nome: e.target.value };
    setEmpresa(updated);
    onEmpresaValidada(updated.nome.trim() ? updated : null);
  }, [empresa, onEmpresaValidada]);

  const stateConfig = {
    idle:      { icon: null,                          color: '',                    text: '' },
    invalid:   { icon: <XCircle className="w-4 h-4" />, color: 'text-destructive',  text: 'CNPJ inválido' },
    valid:     { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600', text: empresa?.nome ?? '' },
    not_found: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-amber-600', text: 'CNPJ válido — empresa não cadastrada' },
  }[validationState];

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-foreground">
          Empresa / Filial Auditada
        </h3>
        <span className="text-[10px] text-destructive font-medium">obrigatório</span>
      </div>

      <div className="relative">
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="00.000.000/0000-00"
          value={rawValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          maxLength={18}
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono tracking-wider',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            validationState === 'invalid' && 'border-destructive focus:ring-destructive',
            validationState === 'valid' && 'border-green-500 focus:ring-green-500',
            validationState === 'not_found' && 'border-amber-400 focus:ring-amber-400',
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Feedback de validação */}
      {validationState !== 'idle' && !loading && (
        <div className={cn('flex items-center gap-1.5 text-xs font-medium', stateConfig.color)}>
          {stateConfig.icon}
          <span>{stateConfig.text}</span>
        </div>
      )}

      {/* Empresa encontrada */}
      {validationState === 'valid' && empresa && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 space-y-0.5">
          <p className="text-xs font-bold text-foreground">{empresa.nome}</p>
          {empresa.nome_fantasia && (
            <p className="text-xs text-muted-foreground">"{empresa.nome_fantasia}"</p>
          )}
          {(empresa.municipio || empresa.uf) && (
            <p className="text-xs text-muted-foreground">
              {[empresa.municipio, empresa.uf].filter(Boolean).join(' — ')}
            </p>
          )}
          <p className="text-[10px] font-mono text-muted-foreground pt-1">{empresa.cnpj_formatted}</p>
        </div>
      )}

      {/* CNPJ válido mas empresa não cadastrada — solicita nome manual */}
      {validationState === 'not_found' && empresa && (
        <div className="space-y-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            CNPJ válido mas não encontrado na base. Informe o nome da empresa para continuar:
          </p>
          <input
            type="text"
            placeholder="Nome da empresa"
            value={empresa.nome}
            onChange={handleNomeChange}
            disabled={disabled}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>
      )}
    </div>
  );
}
