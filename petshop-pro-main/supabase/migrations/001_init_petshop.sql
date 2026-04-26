-- ============================================================================
-- Petshop Pro — Schema inicial
-- Prefixo: petshop_  (primeira palavra da pasta do projeto)
-- Projeto Supabase compartilhado: uebkwwybpzkyzdgxjvzr
-- ============================================================================

-- Extensões
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- petshop_clientes
-- ----------------------------------------------------------------------------
create table if not exists public.petshop_clientes (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  email         text unique,
  telefone      text,
  endereco      text,
  pet_preferido text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists petshop_clientes_nome_idx on public.petshop_clientes (nome);

-- ----------------------------------------------------------------------------
-- petshop_pets
-- ----------------------------------------------------------------------------
create table if not exists public.petshop_pets (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.petshop_clientes(id) on delete cascade,
  nome        text not null,
  raca        text,
  idade       int check (idade >= 0),
  porte       text check (porte in ('Pequeno','Médio','Grande')),
  foto        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists petshop_pets_cliente_idx on public.petshop_pets (cliente_id);

-- ----------------------------------------------------------------------------
-- petshop_produtos
-- ----------------------------------------------------------------------------
create table if not exists public.petshop_produtos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  categoria  text not null check (categoria in ('Ração','Brinquedo','Acessório','Higiene')),
  preco      numeric(10,2) not null check (preco >= 0),
  estoque    int not null default 0 check (estoque >= 0),
  foto       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists petshop_produtos_categoria_idx on public.petshop_produtos (categoria);

-- ----------------------------------------------------------------------------
-- petshop_servicos  (agendamentos)
-- ----------------------------------------------------------------------------
create table if not exists public.petshop_servicos (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('Banho','Tosa','Vacina','Consulta','Cortar Unhas','Banho e Tosa')),
  pet_id      uuid not null references public.petshop_pets(id) on delete cascade,
  cliente_id  uuid references public.petshop_clientes(id) on delete set null,
  data        date not null,
  hora        time not null,
  preco       numeric(10,2) not null check (preco >= 0),
  status      text not null default 'Agendado' check (status in ('Agendado','Confirmado','Concluído','Cancelado')),
  observacoes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists petshop_servicos_data_idx    on public.petshop_servicos (data);
create index if not exists petshop_servicos_pet_idx     on public.petshop_servicos (pet_id);
create index if not exists petshop_servicos_status_idx  on public.petshop_servicos (status);

-- ----------------------------------------------------------------------------
-- petshop_vendas  (cabeçalho)
-- ----------------------------------------------------------------------------
create table if not exists public.petshop_vendas (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references public.petshop_clientes(id) on delete set null,
  total       numeric(10,2) not null check (total >= 0),
  data        date not null default current_date,
  tipo        text not null check (tipo in ('Produto','Serviço','Misto')),
  status      text not null default 'Pendente' check (status in ('Pago','Pendente','Cancelado')),
  observacoes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists petshop_vendas_data_idx    on public.petshop_vendas (data);
create index if not exists petshop_vendas_cliente_idx on public.petshop_vendas (cliente_id);

-- ----------------------------------------------------------------------------
-- petshop_venda_itens  (linhas — produto OU serviço)
-- ----------------------------------------------------------------------------
create table if not exists public.petshop_venda_itens (
  id            uuid primary key default gen_random_uuid(),
  venda_id      uuid not null references public.petshop_vendas(id) on delete cascade,
  produto_id    uuid references public.petshop_produtos(id) on delete set null,
  servico_id    uuid references public.petshop_servicos(id) on delete set null,
  descricao     text not null,
  quantidade    int not null default 1 check (quantidade > 0),
  preco_unit    numeric(10,2) not null check (preco_unit >= 0),
  subtotal      numeric(10,2) generated always as (quantidade * preco_unit) stored,
  created_at    timestamptz not null default now(),
  check (produto_id is not null or servico_id is not null)
);

create index if not exists petshop_venda_itens_venda_idx on public.petshop_venda_itens (venda_id);

-- ----------------------------------------------------------------------------
-- Trigger updated_at
-- ----------------------------------------------------------------------------
create or replace function public.petshop_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'petshop_clientes','petshop_pets','petshop_produtos',
    'petshop_servicos','petshop_vendas'
  ]) loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I
                    for each row execute function public.petshop_set_updated_at()', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- RLS — habilitar em todas as tabelas (políticas a definir conforme auth)
-- ----------------------------------------------------------------------------
alter table public.petshop_clientes    enable row level security;
alter table public.petshop_pets        enable row level security;
alter table public.petshop_produtos    enable row level security;
alter table public.petshop_servicos    enable row level security;
alter table public.petshop_vendas      enable row level security;
alter table public.petshop_venda_itens enable row level security;

-- Política inicial: acesso total para usuários autenticados
do $$
declare t text;
begin
  for t in select unnest(array[
    'petshop_clientes','petshop_pets','petshop_produtos',
    'petshop_servicos','petshop_vendas','petshop_venda_itens'
  ]) loop
    execute format('drop policy if exists %I_authenticated_all on public.%I', t, t);
    execute format($p$create policy %I_authenticated_all on public.%I
                       for all to authenticated using (true) with check (true)$p$, t, t);
  end loop;
end $$;
