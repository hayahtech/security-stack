import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isValidCnpj, cleanCnpj, formatCnpj, type Cnpj } from '@/lib/cnpj';
import type { EmpresaInfo } from '@/components/checklist/CnpjInput';

type Status = 'idle' | 'loading' | 'found' | 'not_found' | 'invalid';

interface UseFindEmpresaResult {
  empresa: EmpresaInfo | null;
  status: Status;
}

/**
 * Busca uma empresa na tabela `empresas` a partir de um CNPJ.
 * Retorna null se o CNPJ for inválido ou a empresa não estiver cadastrada.
 */
export function useFindEmpresa(cnpjRaw: string): UseFindEmpresaResult {
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const clean = cleanCnpj(cnpjRaw);

    if (!clean) {
      setStatus('idle');
      setEmpresa(null);
      return;
    }

    if (!isValidCnpj(clean)) {
      setStatus('invalid');
      setEmpresa(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');

    supabase
      .from('empresas')
      .select('cnpj, nome, nome_fantasia, municipio, uf')
      .eq('cnpj', clean)
      .eq('ativo', true)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error || !data) {
          setStatus('not_found');
          setEmpresa(null);
          return;
        }

        setEmpresa({
          cnpj: clean as Cnpj,
          cnpj_formatted: formatCnpj(clean),
          nome: data.nome,
          nome_fantasia: data.nome_fantasia ?? undefined,
          municipio: data.municipio ?? undefined,
          uf: data.uf ?? undefined,
        });
        setStatus('found');
      });

    return () => { cancelled = true; };
  }, [cnpjRaw]);

  return { empresa, status };
}
