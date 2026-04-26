-- ============================================================================
-- TRATO GESTÃO RURAL — Migration 001: Create All Tables
-- Projeto Supabase: rad
-- Prefixo: trato_
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 0. UTILITY FUNCTIONS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.trato_profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES & AUTH
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp BOOLEAN DEFAULT false,
  document TEXT,                    -- CPF ou CNPJ (criptografado no frontend)
  profile_type TEXT DEFAULT 'produtor' CHECK (profile_type IN ('produtor', 'pessoal', 'ambos')),
  state TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_access_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}',   -- { "modulo": "none"|"read"|"write"|"full" }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_id UUID REFERENCES public.trato_access_profiles(id),
  farms TEXT[] DEFAULT '{}',        -- IDs das fazendas com acesso
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  last_access TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. PROPRIEDADES & FAZENDAS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'rural' CHECK (tipo IN ('rural', 'urbana', 'mista')),
  area_total NUMERIC,
  area_produtiva NUMERIC,
  area_preservacao NUMERIC,
  area_tributavel NUMERIC,
  municipio TEXT,
  estado TEXT,
  cep TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  proprietario TEXT,
  forma_posse TEXT CHECK (forma_posse IN ('propria', 'arrendada', 'parceria', 'comodato', 'posse')),
  nirf TEXT,                        -- Número do Imóvel na Receita Federal
  incra TEXT,
  car TEXT,                         -- Cadastro Ambiental Rural
  ccir TEXT,
  ie TEXT,                          -- Inscrição Estadual
  cie TEXT,
  cnpj TEXT,
  modulo_fiscal NUMERIC,
  bioma TEXT CHECK (bioma IN ('amazonia', 'cerrado', 'mata_atlantica', 'caatinga', 'pampa', 'pantanal')),
  notes TEXT,
  pastures_count INTEGER DEFAULT 0,
  animals_count INTEGER DEFAULT 0,
  main_activity TEXT,               -- pecuaria_corte, leiteira, mista, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.trato_properties(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  secao TEXT CHECK (secao IN ('dominio', 'ambiental', 'fiscal', 'infraestrutura', 'outros')),
  tipo TEXT,
  data_documento DATE,
  data_vencimento DATE,
  arquivo_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.trato_properties(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT CHECK (categoria IN ('residencial', 'pecuaria', 'armazenagem', 'operacional', 'hidrico', 'energia', 'ambiental')),
  tipo TEXT,
  area_capacidade TEXT,
  ano_construcao INTEGER,
  conservacao TEXT CHECK (conservacao IN ('otimo', 'bom', 'regular', 'ruim')),
  valor_estimado NUMERIC,
  observacoes TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_land_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.trato_properties(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('recebido', 'cedido')),
  parceiro TEXT,
  area_ha NUMERIC,
  descricao_area TEXT,
  valor_tipo TEXT CHECK (valor_tipo IN ('reais_ha_ano', 'sacas_ha', 'percentual')),
  valor NUMERIC,
  data_inicio DATE,
  data_vencimento DATE,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'produto', 'percentual')),
  contrato_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_itr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.trato_properties(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  area_total NUMERIC,
  area_tributavel NUMERIC,
  grau_utilizacao NUMERIC,
  vtn_ha NUMERIC,
  itr_lancado NUMERIC,
  itr_pago NUMERIC,
  status TEXT CHECK (status IN ('pago', 'pendente', 'parcelado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. PASTOS / PIQUETES
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_paddocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.trato_properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_ha NUMERIC,
  forage_type TEXT,                 -- Brachiaria, Panicum, etc
  capacity_ua NUMERIC,             -- Capacidade em UA
  current_animals INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'em_descanso', 'reformado', 'inativo')),
  coordinates JSONB,               -- GeoJSON polygon
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_forage_plantings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddock_id UUID NOT NULL REFERENCES public.trato_paddocks(id) ON DELETE CASCADE,
  variety TEXT,
  planting_date DATE,
  area_ha NUMERIC,
  seed_qty_kg NUMERIC,
  cost NUMERIC,
  expected_availability DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. REBANHO — ANIMAIS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.trato_properties(id),
  ear_tag TEXT,                     -- Brinco convencional
  eid TEXT,                         -- Identificação eletrônica (RFID)
  eid_type TEXT CHECK (eid_type IN ('fdx-b', 'hdx', 'uhf', 'ble')),
  name TEXT,
  species TEXT DEFAULT 'bovino' CHECK (species IN ('bovino', 'equino', 'caprino', 'suino', 'avicola', 'outro')),
  breed TEXT,
  sex TEXT CHECK (sex IN ('M', 'F')),
  category TEXT,                    -- bezerra, novilha, vaca, vaca_prenha, vaca_leiteira, bezerro, novilho, boi, boi_gordo, garrote, touro, etc
  birth_date DATE,
  purchase_date DATE,
  origin_type TEXT CHECK (origin_type IN ('nascido', 'comprado', 'trocado', 'doado')),
  origin_notes TEXT,
  dam_id UUID REFERENCES public.trato_animals(id),
  dam_ear_tag TEXT,
  sire_id UUID REFERENCES public.trato_animals(id),
  sire_ear_tag TEXT,
  current_status TEXT DEFAULT 'ativo' CHECK (current_status IN ('ativo', 'vendido', 'morto', 'abatido', 'descartado')),
  is_breeder BOOLEAN DEFAULT false,
  is_castrated BOOLEAN DEFAULT false,
  first_calving_date DATE,
  paddock_id UUID REFERENCES public.trato_paddocks(id),
  paddock TEXT,                     -- Nome do pasto (fallback se não usa paddock_id)
  current_weight NUMERIC,
  brinco_sisbov TEXT,               -- Brinco SISBOV (rastreabilidade)
  sisbov_status TEXT CHECK (sisbov_status IN ('identificado', 'pendente', 'nao_identificado', 'substituido')),
  sisbov_identification_date DATE,
  sisbov_brinco_tipo TEXT CHECK (sisbov_brinco_tipo IN ('convencional', 'eletronico', 'botton', 'tatuagem')),
  whatsapp_number TEXT,             -- Para notificações n8n
  notifications_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_animals_eid ON public.trato_animals(eid);
CREATE INDEX idx_trato_animals_ear_tag ON public.trato_animals(ear_tag);
CREATE INDEX idx_trato_animals_property ON public.trato_animals(property_id);
CREATE INDEX idx_trato_animals_paddock ON public.trato_animals(paddock_id);
CREATE INDEX idx_trato_animals_species ON public.trato_animals(species);
CREATE INDEX idx_trato_animals_status ON public.trato_animals(current_status);
CREATE INDEX idx_trato_animals_sisbov ON public.trato_animals(brinco_sisbov);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. PESAGENS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_weighings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  weight_arroba NUMERIC,            -- Calculado: weight_kg / 15
  weigh_date DATE NOT NULL,
  method TEXT CHECK (method IN ('balanca', 'fita', 'visual')),
  weighed_by TEXT,
  paddock TEXT,
  batch_id TEXT,                    -- ID do lote (pesagem em grupo)
  device_id TEXT,                   -- ID do dispositivo RFID/Balança
  gmd NUMERIC,                     -- GMD calculado vs pesagem anterior
  webhook_sent_to_n8n BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_weighings_animal ON public.trato_weighings(animal_id);
CREATE INDEX idx_trato_weighings_date ON public.trato_weighings(weigh_date);
CREATE INDEX idx_trato_weighings_batch ON public.trato_weighings(batch_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. TRATAMENTOS VETERINÁRIOS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,                        -- vacina, vermifugo, antibiotico, anti-inflamatorio, outro
  active_ingredient TEXT,
  concentration TEXT,
  default_unit TEXT,
  withdrawal_days_meat INTEGER DEFAULT 0,
  withdrawal_days_milk INTEGER DEFAULT 0,
  manufacturer TEXT,
  mapa_registro TEXT,               -- Registro no MAPA
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_vaccine_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  medication_id UUID REFERENCES public.trato_medications(id),
  frequency TEXT,                   -- anual, semestral, etc
  target_months INTEGER[],          -- [3, 6, 12] meses de idade
  target_category TEXT,             -- bezerra, novilha, vaca, etc
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.trato_medications(id),
  treatment_date DATE NOT NULL,
  type TEXT CHECK (type IN ('vacina', 'vermifugo', 'antibiotico', 'anti-inflamatorio', 'outro')),
  medication_name TEXT,             -- Fallback se medication_id é null
  dose TEXT,
  route TEXT CHECK (route IN ('IM', 'SC', 'IV', 'Oral', 'Pour-on')),
  applied_by TEXT,
  withdrawal_days INTEGER DEFAULT 0,
  withdrawal_end_date DATE,         -- Calculado: treatment_date + withdrawal_days
  batch_id TEXT,                    -- Tratamento em lote
  symptoms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_treatments_animal ON public.trato_treatments(animal_id);
CREATE INDEX idx_trato_treatments_date ON public.trato_treatments(treatment_date);
CREATE INDEX idx_trato_treatments_withdrawal ON public.trato_treatments(withdrawal_end_date);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. REPRODUÇÃO
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_reproductive_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('cobertura', 'iatf', 'diagnostico_prenhez', 'parto', 'aborto', 'desmame')),
  details TEXT,
  partner_id UUID REFERENCES public.trato_animals(id),
  partner_ear_tag TEXT,
  result TEXT,                      -- positivo, negativo, etc
  calf_id UUID REFERENCES public.trato_animals(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_repro_animal ON public.trato_reproductive_events(animal_id);
CREATE INDEX idx_trato_repro_type ON public.trato_reproductive_events(event_type);

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. PRODUÇÃO DE LEITE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_milk_yields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  production_date DATE NOT NULL,
  shift TEXT CHECK (shift IN ('manha', 'tarde')),
  liters NUMERIC NOT NULL,
  fat_percent NUMERIC,
  protein_percent NUMERIC,
  quality TEXT DEFAULT 'normal' CHECK (quality IN ('normal', 'descartado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_milk_animal ON public.trato_milk_yields(animal_id);
CREATE INDEX idx_trato_milk_date ON public.trato_milk_yields(production_date);

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. MOVIMENTAÇÕES DE ANIMAIS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_animal_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  paddock_from TEXT,
  paddock_to TEXT,
  paddock_from_id UUID REFERENCES public.trato_paddocks(id),
  paddock_to_id UUID REFERENCES public.trato_paddocks(id),
  entry_date DATE NOT NULL,
  exit_date DATE,
  days INTEGER,
  reason TEXT,                      -- pastejo, quarentena, venda, manejo, etc
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_movements_animal ON public.trato_animal_movements(animal_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. RASTREABILIDADE SISBOV
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_sisbov_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.trato_properties(id) ON DELETE CASCADE,
  numero_certificacao TEXT,
  certificadora TEXT,
  data_inicio DATE,
  cie TEXT,
  nirf TEXT,
  ie TEXT,
  status TEXT CHECK (status IN ('ativo', 'auditoria', 'suspenso', 'nao_certificado')),
  proxima_auditoria DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_sisbov_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('nascimento', 'entrada', 'pesagem', 'tratamento', 'vacina', 'movimentacao', 'reproducao', 'alimentacao', 'saida')),
  data DATE NOT NULL,
  descricao TEXT,
  responsavel TEXT,
  detalhes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_sisbov_feeding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('pasto', 'suplementacao', 'confinamento', 'semiconfinamento')),
  insumos TEXT,
  periodo TEXT,
  certificacao_origem TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 11. GTA — GUIA DE TRÂNSITO ANIMAL
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_gtas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  serie TEXT,
  data_emissao DATE,
  data_validade DATE,
  orgao_emissor TEXT,
  uf_emissao TEXT,
  -- Origem
  origem_propriedade TEXT,
  origem_municipio TEXT,
  origem_uf TEXT,
  origem_proprietario TEXT,
  origem_ie_nirf TEXT,
  -- Destino
  destino_propriedade TEXT,
  destino_municipio TEXT,
  destino_uf TEXT,
  destino_proprietario TEXT,
  destino_ie_nirf TEXT,
  -- Detalhes
  finalidade TEXT CHECK (finalidade IN ('venda', 'recria', 'engorda', 'reproducao', 'exposicao', 'abate', 'retorno', 'transferencia', 'outro')),
  especie TEXT CHECK (especie IN ('bovino', 'equino', 'suino', 'caprino', 'ovino', 'aves', 'outro')),
  quantidade INTEGER,
  animais_vinculados TEXT[],        -- IDs dos animais
  sexo_faixa TEXT,
  identificacao TEXT CHECK (identificacao IN ('eletronico', 'convencional', 'tatuagem', 'sem')),
  -- Transporte
  placa_veiculo TEXT,
  transportadora TEXT,
  motorista TEXT,
  mdfe_vinculado TEXT,
  -- Sanitário
  area_sanitaria TEXT CHECK (area_sanitaria IN ('livre', 'controlada', 'foco', 'vazio')),
  exames_realizados TEXT[],
  resultado_exames TEXT,
  vacinas_em_dia BOOLEAN,
  -- Arquivos
  arquivo_gta_url TEXT,
  arquivo_exames_url TEXT,
  -- Status
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'utilizado', 'vencendo', 'vencido', 'cancelado')),
  vinculo_venda TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 12. FINANCEIRO — INSTRUMENTOS DE PAGAMENTO
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_payment_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('conta_corrente', 'poupanca', 'cartao_credito', 'caixa', 'outro')),
  bank TEXT,
  last4 TEXT,
  holder_person_id UUID,
  closing_day INTEGER,
  due_day INTEGER,
  balance NUMERIC DEFAULT 0,
  credit_limit NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_card_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id UUID NOT NULL REFERENCES public.trato_payment_instruments(id) ON DELETE CASCADE,
  month TEXT,                       -- "2026-04"
  closing_date DATE,
  due_date DATE,
  total NUMERIC,
  status TEXT CHECK (status IN ('aberta', 'fechada', 'paga')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 13. FINANCEIRO — CATEGORIAS E CENTROS DE CUSTO
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('receita', 'despesa')),
  subcategories TEXT[] DEFAULT '{}',
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,                    -- CPF/CNPJ
  phone TEXT,
  email TEXT,
  type TEXT CHECK (type IN ('fornecedor', 'comprador', 'funcionario', 'parceiro', 'outro')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 14. FINANCEIRO — TRANSAÇÕES
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.trato_properties(id),
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'transferencia')),
  txn_date DATE NOT NULL,
  competence_month TEXT,            -- "2026-04" para DRE
  description TEXT NOT NULL,
  merchant TEXT,
  amount NUMERIC NOT NULL,
  instrument_id UUID REFERENCES public.trato_payment_instruments(id),
  category_id UUID REFERENCES public.trato_financial_categories(id),
  subcategory TEXT,
  cost_center_id UUID REFERENCES public.trato_cost_centers(id),
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pendente' CHECK (status IN ('confirmado', 'pendente', 'cancelado')),
  payer_person_id UUID REFERENCES public.trato_persons(id),
  beneficiary_person_id UUID REFERENCES public.trato_persons(id),
  payment_method TEXT CHECK (payment_method IN ('pix', 'boleto', 'cartao', 'dinheiro', 'transferencia')),
  installments INTEGER,
  current_installment INTEGER,
  parent_id UUID REFERENCES public.trato_transactions(id),
  recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  has_attachment BOOLEAN DEFAULT false,
  attachment_url TEXT,
  notes TEXT,
  history JSONB DEFAULT '[]',       -- [{date, action, description}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_txn_date ON public.trato_transactions(txn_date);
CREATE INDEX idx_trato_txn_type ON public.trato_transactions(type);
CREATE INDEX idx_trato_txn_status ON public.trato_transactions(status);
CREATE INDEX idx_trato_txn_category ON public.trato_transactions(category_id);
CREATE INDEX idx_trato_txn_instrument ON public.trato_transactions(instrument_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 15. FINANCEIRO — CONTAS A PAGAR/RECEBER
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pagar', 'receber')),
  due_date DATE NOT NULL,
  description TEXT NOT NULL,
  person_id UUID REFERENCES public.trato_persons(id),
  category_id UUID REFERENCES public.trato_financial_categories(id),
  amount NUMERIC NOT NULL,
  installment_label TEXT,           -- "3/6"
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'vencido', 'pago')),
  paid_date DATE,
  paid_instrument_id UUID REFERENCES public.trato_payment_instruments(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  total NUMERIC,
  num_installments INTEGER,
  paid_count INTEGER DEFAULT 0,
  next_due DATE,
  type TEXT CHECK (type IN ('pagar', 'receber')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  amount NUMERIC,
  frequency TEXT CHECK (frequency IN ('semanal', 'quinzenal', 'mensal', 'trimestral', 'anual')),
  next_date DATE,
  category_id UUID REFERENCES public.trato_financial_categories(id),
  person_id UUID REFERENCES public.trato_persons(id),
  type TEXT CHECK (type IN ('pagar', 'receber')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 16. FINANCEIRO — ORÇAMENTO
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.trato_properties(id),
  activity_id UUID,
  category_id UUID REFERENCES public.trato_financial_categories(id),
  planned_amount NUMERIC,
  spent_amount NUMERIC DEFAULT 0,
  period TEXT,                      -- "2026-04", "2026-Q1", "2026"
  status TEXT DEFAULT 'dentro' CHECK (status IN ('dentro', 'proximo', 'estourado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 17. FINANCEIRO — FINANCIAMENTOS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_financings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('credito_rural', 'maquina_equipamento', 'imovel_rural', 'veiculo_comercial', 'capital_giro', 'leasing', 'consorcio_empresarial', 'imovel_residencial', 'veiculo', 'emprestimo_pessoal', 'consignado', 'consorcio', 'outro')),
  perfil TEXT CHECK (perfil IN ('pessoal', 'empresarial')),
  instituicao TEXT,
  numero_contrato TEXT,
  instrument_id UUID REFERENCES public.trato_payment_instruments(id),
  valor_financiado NUMERIC,
  valor_entrada NUMERIC,
  data_contratacao DATE,
  data_primeira_parcela DATE,
  prazo_meses INTEGER,
  taxa_juros NUMERIC,
  taxa_tipo TEXT CHECK (taxa_tipo IN ('mensal', 'anual')),
  indice_correcao TEXT CHECK (indice_correcao IN ('sem', 'tjlp', 'tlp', 'selic', 'ipca', 'incc', 'tr', 'pre_fixado')),
  sistema_amortizacao TEXT CHECK (sistema_amortizacao IN ('sac', 'price', 'americano', 'personalizado')),
  possui_carencia BOOLEAN DEFAULT false,
  carencia_inicio DATE,
  carencia_fim DATE,
  carencia_tipo TEXT CHECK (carencia_tipo IN ('nada', 'juros', 'juros_correcao')),
  possui_rebate BOOLEAN DEFAULT false,
  rebate_percentual NUMERIC,
  rebate_condicao TEXT,
  possui_seguro BOOLEAN DEFAULT false,
  seguro_valor_parcela NUMERIC,
  seguradora TEXT,
  seguro_vencimento DATE,
  tipo_garantia TEXT CHECK (tipo_garantia IN ('alienacao', 'hipoteca', 'penhor_rural', 'aval', 'sem_garantia')),
  garantia_descricao TEXT,
  protocolo TEXT,
  programa_gov TEXT CHECK (programa_gov IN ('pronaf', 'pronamp', 'fco', 'abc', 'moderfrota', 'bndes', 'outro', '')),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'quitado', 'carencia', 'inadimplente')),
  saldo_devedor NUMERIC,
  total_pago NUMERIC DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_financing_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financing_id UUID NOT NULL REFERENCES public.trato_financings(id) ON DELETE CASCADE,
  numero INTEGER,
  vencimento DATE,
  saldo_devedor NUMERIC,
  amortizacao NUMERIC,
  juros NUMERIC,
  correcao NUMERIC DEFAULT 0,
  seguro NUMERIC DEFAULT 0,
  total NUMERIC,
  acumulado NUMERIC,
  status TEXT CHECK (status IN ('pago', 'pendente', 'vencido', 'futuro')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_credito_rural_extra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financiamento_id UUID NOT NULL REFERENCES public.trato_financings(id) ON DELETE CASCADE,
  programa TEXT CHECK (programa IN ('pronaf', 'pronamp', 'fco_rural', 'moderfrota', 'abc_ambiental', 'inovagro', 'renovagro', 'bndes', 'fno', 'fne', 'linha_livre', 'outro')),
  finalidade TEXT CHECK (finalidade IN ('custeio_agricola', 'custeio_pecuario', 'investimento', 'comercializacao', 'industrializacao', 'custeio_investimento')),
  cultura_atividade TEXT,
  area_financiada NUMERIC,
  data_liberacao DATE,
  data_inicio_carencia DATE,
  data_fim_carencia DATE,
  data_vencimento_final DATE,
  rebate_percentual NUMERIC,
  rebate_condicao TEXT,
  rebate_valor NUMERIC,
  rebate_status TEXT CHECK (rebate_status IN ('disponivel', 'perdido', 'aplicado')),
  taxa_contratual NUMERIC,
  possui_equalizacao BOOLEAN DEFAULT false,
  taxa_cheia NUMERIC,
  equalizacao NUMERIC,
  taxa_efetiva NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 18. PATRIMÔNIO
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_assets_patrimony (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('imovel_rural', 'imovel_urbano', 'veiculo', 'maquina', 'semovente', 'investimento', 'outro')),
  valor_aquisicao NUMERIC,
  data_aquisicao DATE,
  valor_mercado NUMERIC,
  data_avaliacao DATE,
  situacao TEXT CHECK (situacao IN ('quitado', 'financiado', 'arrendado', 'em_compra')),
  financiamento_id UUID REFERENCES public.trato_financings(id),
  segurado BOOLEAN DEFAULT false,
  seguradora TEXT,
  apolice TEXT,
  valor_segurado NUMERIC,
  seguro_vencimento DATE,
  localizacao TEXT,
  area NUMERIC,
  area_unidade TEXT CHECK (area_unidade IN ('ha', 'm2')),
  matricula TEXT,
  placa TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_consortia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  administradora TEXT,
  grupo TEXT,
  cota TEXT,
  bem_pretendido TEXT CHECK (bem_pretendido IN ('imovel', 'veiculo', 'maquina', 'servico')),
  valor_credito NUMERIC,
  prazo_meses INTEGER,
  taxa_administracao NUMERIC,
  taxa_tipo TEXT CHECK (taxa_tipo IN ('total', 'mensal')),
  fundo_reserva NUMERIC,
  parcela_atual NUMERIC,
  status TEXT CHECK (status IN ('aguardando', 'contemplado', 'bem_adquirido', 'encerrado')),
  contemplado BOOLEAN DEFAULT false,
  contemplacao_forma TEXT CHECK (contemplacao_forma IN ('sorteio', 'lance_livre', 'lance_fixo', 'lance_embutido')),
  contemplacao_data DATE,
  contemplacao_valor_lance NUMERIC,
  contemplacao_data_aquisicao DATE,
  contemplacao_bem_id UUID REFERENCES public.trato_assets_patrimony(id),
  parcelas_pagas INTEGER DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_leasing_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arrendador TEXT,
  bem_descricao TEXT,
  bem_asset_id UUID,                -- Referência à máquina/equipamento
  valor_bem NUMERIC,
  valor_residual NUMERIC,
  tipo_leasing TEXT CHECK (tipo_leasing IN ('financeiro', 'operacional', 'leaseback')),
  prazo_meses INTEGER,
  data_inicio DATE,
  data_termino DATE,
  contraprestacao_mensal NUMERIC,
  opcao_compra BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 19. ESTOQUE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_stock_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.trato_properties(id),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('alimentacao', 'saude_animal', 'defensivo', 'combustivel', 'ferramentas', 'outros')),
  unit TEXT CHECK (unit IN ('kg', 'litro', 'saco', 'caixa', 'unidade', 'dose')),
  current_qty NUMERIC DEFAULT 0,
  min_qty NUMERIC DEFAULT 0,
  avg_cost NUMERIC DEFAULT 0,
  supplier_id UUID REFERENCES public.trato_persons(id),
  supplier_name TEXT,
  lot TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.trato_stock_products(id) ON DELETE CASCADE,
  product_name TEXT,
  type TEXT CHECK (type IN ('entrada', 'saida')),
  entry_type TEXT CHECK (entry_type IN ('compra', 'doacao', 'producao_propria', 'transferencia', 'ajuste_inventario', 'devolucao')),
  qty NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  supplier_name TEXT,
  invoice_number TEXT,
  reason TEXT CHECK (reason IN ('uso_rebanho', 'uso_lavoura', 'perda', 'transferencia')),
  adjustment_reason TEXT CHECK (adjustment_reason IN ('contagem_fisica', 'perda_quebra', 'vencimento', 'erro_lancamento')),
  responsible_name TEXT,
  linked_paddock TEXT,
  movement_date DATE NOT NULL,
  balance_after NUMERIC,
  lot TEXT,
  expiry_date DATE,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_stock_mov_product ON public.trato_stock_movements(product_id);
CREATE INDEX idx_trato_stock_mov_date ON public.trato_stock_movements(movement_date);

-- ──────────────────────────────────────────────────────────────────────────────
-- 20. MÁQUINAS E EQUIPAMENTOS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.trato_properties(id),
  name TEXT NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('Trator', 'Caminhão', 'Moto', 'Ordenhadeira', 'Bomba', 'Implemento', 'Outro')),
  plate TEXT,
  year INTEGER,
  hourmeter NUMERIC DEFAULT 0,
  acquisition_cost NUMERIC,
  cost_center_id UUID REFERENCES public.trato_cost_centers(id),
  status TEXT DEFAULT 'Operacional' CHECK (status IN ('Operacional', 'Em manutenção', 'Inativo')),
  maintenance_interval_hours NUMERIC,
  last_maintenance_hourmeter NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.trato_equipment(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('Preventiva', 'Corretiva', 'Revisão', 'Lavagem', 'Outro')),
  date_in DATE,
  date_out DATE,
  description TEXT,
  parts_replaced TEXT[] DEFAULT '{}',
  service_provider TEXT,
  total_cost NUMERIC,
  hourmeter_at NUMERIC,
  next_maintenance_date DATE,
  next_maintenance_hourmeter NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.trato_equipment(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  worker_id UUID REFERENCES public.trato_persons(id),
  worker_name TEXT,
  turno TEXT CHECK (turno IN ('manha', 'tarde', 'noite', 'dia_completo')),
  hours NUMERIC,
  hourmeter_start NUMERIC,
  hourmeter_end NUMERIC,
  odometer_start NUMERIC,
  odometer_end NUMERIC,
  activity TEXT CHECK (activity IN ('aracao', 'gradagem', 'plantio', 'pulverizacao', 'colheita', 'transporte', 'rocagem', 'outros')),
  activity_other TEXT,
  paddock TEXT,
  fuel_liters NUMERIC,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 21. DISPOSITIVOS (RFID + BALANÇAS)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL CHECK (device_type IN ('rfid_reader', 'scale')),
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  connection_type TEXT CHECK (connection_type IN ('bluetooth', 'wifi', 'usb_serial')),
  -- RFID specific
  rfid_standard TEXT CHECK (rfid_standard IN ('fdx_b', 'hdx', 'uhf')),
  location TEXT CHECK (location IN ('brete', 'tronco', 'embarcadouro', 'manga', 'balanca', 'porteira', 'outro')),
  -- Scale specific
  decimal_places INTEGER DEFAULT 1,
  stabilization_readings INTEGER DEFAULT 3,
  linked_reader_id UUID REFERENCES public.trato_devices(id),
  -- Network
  ip_address TEXT,
  port TEXT,
  -- Status
  active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'waiting')),
  last_reading TEXT,
  last_reading_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 22. NF-e SAÍDA
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_nfe_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emitter_type TEXT CHECK (emitter_type IN ('pf', 'pj')),
  cnpj_cpf TEXT,
  razao_social TEXT,
  ie TEXT,
  im TEXT,
  address TEXT,
  municipality TEXT,
  state TEXT,
  tax_regime TEXT CHECK (tax_regime IN ('simples', 'presumido', 'real', 'mei')),
  cnae TEXT,
  series INTEGER DEFAULT 1,
  next_number INTEGER DEFAULT 1,
  environment TEXT DEFAULT 'homologacao' CHECK (environment IN ('homologacao', 'producao')),
  api_provider TEXT CHECK (api_provider IN ('focus', 'enotas', 'nuvemfiscal', 'outro')),
  api_url TEXT,
  api_token TEXT,                   -- Criptografar no frontend!
  certificate_uploaded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_nfe_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number INTEGER,
  series INTEGER DEFAULT 1,
  access_key TEXT,
  emission_date DATE,
  exit_date DATE,
  nature TEXT,
  purpose TEXT CHECK (purpose IN ('normal', 'complementar', 'ajuste', 'devolucao')),
  -- Destinatário
  recipient_cnpj_cpf TEXT,
  recipient_name TEXT,
  recipient_ie TEXT,
  recipient_address TEXT,
  recipient_city TEXT,
  recipient_state TEXT,
  ie_indicator TEXT CHECK (ie_indicator IN ('contribuinte', 'isento', 'nao_contribuinte')),
  final_consumer BOOLEAN DEFAULT false,
  -- Totais
  subtotal NUMERIC,
  freight NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC,
  -- Transporte
  freight_mode TEXT CHECK (freight_mode IN ('cif', 'fob', 'sem_frete')),
  carrier_name TEXT,
  vehicle_plate TEXT,
  volumes INTEGER,
  gross_weight NUMERIC,
  net_weight NUMERIC,
  -- Pagamento
  payment_mode TEXT CHECK (payment_mode IN ('avista', 'aprazo', 'outros')),
  installments JSONB DEFAULT '[]',  -- [{number, dueDate, amount}]
  -- Status
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('autorizada', 'cancelada', 'denegada', 'contingencia', 'rascunho')),
  cancel_reason TEXT,
  additional_info TEXT,
  fiscal_info TEXT,
  linked_sale_id TEXT,
  xml_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_nfe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.trato_nfe_documents(id) ON DELETE CASCADE,
  code TEXT,
  description TEXT,
  ncm TEXT,
  cfop TEXT,
  unit TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  total_price NUMERIC,
  icms_cst TEXT,
  icms_rate NUMERIC DEFAULT 0,
  pis_cst TEXT,
  cofins_cst TEXT,
  ipi_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_producer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT,
  note_date DATE,
  recipient_name TEXT,
  product TEXT,
  quantity NUMERIC,
  unit TEXT,
  value NUMERIC,
  linked_sale_id TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 23. MDF-e
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_mdfe_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT,
  serie INTEGER,
  chave_acesso TEXT,
  data_emissao DATE,
  uf_inicio TEXT,
  uf_fim TEXT,
  placa_veiculo TEXT,
  motorista TEXT,
  ciot TEXT,
  nfes_vinculadas TEXT[],
  gtas_vinculadas TEXT[],
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('autorizado', 'cancelado', 'encerrado', 'rascunho')),
  xml_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 24. PRODUÇÃO — PISCICULTURA
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_fish_tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.trato_properties(id),
  name TEXT NOT NULL,
  type TEXT,                        -- tanque, viveiro, rede, etc
  volume_m3 NUMERIC,
  area_m2 NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_fish_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.trato_fish_tanks(id) ON DELETE CASCADE,
  species TEXT,
  stocking_date DATE,
  quantity INTEGER,
  avg_weight_initial NUMERIC,
  supplier TEXT,
  cost NUMERIC,
  current_avg_weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_fish_feedings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.trato_fish_tanks(id) ON DELETE CASCADE,
  feeding_date DATE NOT NULL,
  feed_kg NUMERIC,
  feed_type TEXT,
  cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_fish_water_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.trato_fish_tanks(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  ph NUMERIC,
  oxygen NUMERIC,
  temperature NUMERIC,
  ammonia NUMERIC,
  turbidity NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_fish_samplings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.trato_fish_tanks(id) ON DELETE CASCADE,
  sampling_date DATE NOT NULL,
  sample_count INTEGER,
  avg_weight NUMERIC,
  estimated_total NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_fish_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.trato_fish_tanks(id) ON DELETE CASCADE,
  treatment_date DATE NOT NULL,
  product TEXT,
  dose TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_fish_harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.trato_fish_tanks(id) ON DELETE CASCADE,
  harvest_date DATE NOT NULL,
  quantity_kg NUMERIC,
  price_per_kg NUMERIC,
  buyer TEXT,
  total_revenue NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 25. PRODUÇÃO — AGRICULTURA
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_cultivation_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.trato_properties(id),
  name TEXT NOT NULL,
  main_culture TEXT,
  area NUMERIC,
  area_unit TEXT DEFAULT 'ha' CHECK (area_unit IN ('ha', 'm2')),
  system TEXT,                      -- irrigado, sequeiro, etc
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_cultivation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.trato_cultivation_areas(id) ON DELETE CASCADE,
  culture TEXT,
  variety TEXT,
  planting_date DATE,
  expected_harvest DATE,
  total_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'planejado' CHECK (status IN ('planejado', 'plantado', 'em_crescimento', 'colhido', 'perdido')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_crop_harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.trato_cultivation_areas(id),
  harvest_date DATE NOT NULL,
  culture TEXT,
  quantity_kg NUMERIC,
  quality TEXT,
  destination TEXT,
  buyer TEXT,
  price_per_kg NUMERIC,
  revenue NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_crop_losses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.trato_cultivation_areas(id),
  loss_date DATE NOT NULL,
  culture TEXT,
  quantity_kg NUMERIC,
  reason TEXT,                      -- praga, doenca, clima, etc
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 26. ATIVIDADES & FUNCIONÁRIOS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.trato_properties(id),
  name TEXT NOT NULL,
  type TEXT,                        -- aracao, gradagem, plantio, etc
  start_date DATE,
  end_date DATE,
  revenue_goal NUMERIC,
  status TEXT DEFAULT 'planejada' CHECK (status IN ('planejada', 'em_andamento', 'finalizada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  document TEXT,                    -- CPF
  ctps TEXT,
  admission_date DATE,
  salary NUMERIC,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 27. PARCEIROS COMERCIAIS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('fornecedor', 'comprador', 'parceiro', 'transportadora', 'veterinario', 'outro')),
  document TEXT,                    -- CPF/CNPJ
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  bank_info JSONB,                  -- {bank, agency, account, pix}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 28. NOTIFICAÇÕES & AUDITORIA
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  severity TEXT CHECK (severity IN ('urgente', 'atencao', 'informativo', 'sucesso')),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  action TEXT CHECK (action IN ('create', 'update', 'delete', 'login', 'approve', 'reject')),
  module TEXT,
  record TEXT,
  details JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trato_audit_user ON public.trato_audit_log(user_id);
CREATE INDEX idx_trato_audit_action ON public.trato_audit_log(action);
CREATE INDEX idx_trato_audit_date ON public.trato_audit_log(created_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- 29. APROVAÇÕES PENDENTES
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  amount NUMERIC,
  requested_by UUID REFERENCES auth.users(id),
  requested_by_name TEXT,
  request_date DATE,
  module TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 30. OPEN FINANCE (PLUGGY)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_connected_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT,                     -- Pluggy item_id
  connector_name TEXT,
  connector_logo TEXT,
  account_type TEXT,
  agency TEXT,
  account_number TEXT,
  linked_instrument_id UUID REFERENCES public.trato_payment_instruments(id),
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'needs_reauth', 'error')),
  last_sync TIMESTAMPTZ,
  balance_from_pluggy NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_imported_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pluggy_transaction_id TEXT,
  connected_bank_id UUID REFERENCES public.trato_connected_banks(id),
  txn_date DATE,
  description TEXT,
  original_description TEXT,
  amount NUMERIC,
  type TEXT CHECK (type IN ('credit', 'debit')),
  suggested_category_id UUID REFERENCES public.trato_financial_categories(id),
  confirmed_category_id UUID REFERENCES public.trato_financial_categories(id),
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'auto_categorized', 'confirmed', 'ignored')),
  matched_payable_id UUID REFERENCES public.trato_payables(id),
  imported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  category_id UUID REFERENCES public.trato_financial_categories(id),
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 31. SINCRONIZAÇÃO OFFLINE
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,        -- pesagem, leite, tratamento, movimentacao_pasto, financeiro
  entity_id TEXT,
  action TEXT CHECK (action IN ('insert', 'update', 'delete')),
  payload JSONB,
  synced BOOLEAN DEFAULT false,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX idx_trato_sync_pending ON public.trato_sync_queue(synced) WHERE synced = false;

-- ──────────────────────────────────────────────────────────────────────────────
-- 32. PUSH NOTIFICATION SETTINGS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_push_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Rebanho
  parto_proximo_7dias BOOLEAN DEFAULT true,
  parto_amanha BOOLEAN DEFAULT true,
  vacina_vencendo_7dias BOOLEAN DEFAULT true,
  animal_carencia_embarcado BOOLEAN DEFAULT true,
  animal_sem_pesagem BOOLEAN DEFAULT true,
  animal_sem_pesagem_dias INTEGER DEFAULT 30,
  -- Financeiro
  conta_pagar_hoje BOOLEAN DEFAULT true,
  conta_pagar_amanha BOOLEAN DEFAULT true,
  conta_em_atraso BOOLEAN DEFAULT true,
  meta_atingida BOOLEAN DEFAULT true,
  saldo_abaixo_minimo BOOLEAN DEFAULT true,
  saldo_minimo_limite NUMERIC DEFAULT 5000,
  -- Clima
  chuva_intensa BOOLEAN DEFAULT true,
  estresse_termico BOOLEAN DEFAULT true,
  geada_prevista BOOLEAN DEFAULT true,
  -- Estoque & Documentos
  estoque_abaixo_minimo BOOLEAN DEFAULT true,
  medicamento_vencendo BOOLEAN DEFAULT true,
  documento_vencendo BOOLEAN DEFAULT true,
  gta_vencendo BOOLEAN DEFAULT true,
  seguro_vencendo BOOLEAN DEFAULT true,
  -- Atividades
  atividade_hoje BOOLEAN DEFAULT true,
  atividade_atrasada BOOLEAN DEFAULT true,
  -- General
  email_frequency TEXT DEFAULT 'diario' CHECK (email_frequency IN ('imediata', 'diario', 'semanal', 'desativado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 33. ANIMAL FINANCIAL (VENDAS/ABATE)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.trato_animal_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  buyer TEXT,
  sold_weight_kg NUMERIC,
  price_per_arroba NUMERIC,
  total NUMERIC,
  sale_date DATE,
  gta_id UUID REFERENCES public.trato_gtas(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trato_animal_slaughters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.trato_animals(id) ON DELETE CASCADE,
  slaughter_date DATE,
  live_weight_kg NUMERIC,
  carcass_weight_kg NUMERIC,
  yield_pct NUMERIC,               -- Rendimento de carcaça %
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
