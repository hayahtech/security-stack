
CREATE TABLE public.nfe_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chave_nfe TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'encontrada',
  uf TEXT,
  cnpj_emitente TEXT,
  numero_nf TEXT,
  nome_emitente TEXT,
  valor_total NUMERIC,
  data_emissao TEXT,
  response_data JSONB,
  entry_id UUID REFERENCES public.stock_entries(id) ON DELETE SET NULL,
  queried_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nfe_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nfe queries"
  ON public.nfe_queries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_nfe_queries_user_chave ON public.nfe_queries(user_id, chave_nfe);
CREATE INDEX idx_nfe_queries_queried_at ON public.nfe_queries(user_id, queried_at DESC);
