-- Separação física por sensibilidade. O que identifica ou é de saúde mora em
-- tabela própria, com RLS própria. O que localiza a criança — bairro, escola,
-- endereço, horário de treino — simplesmente não tem coluna.

create type estado_perfil as enum (
  'rascunho',
  'aguardando_consentimento',
  'ativo',
  'suspenso',
  'removido'
);

create table responsaveis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now()
);

create table atletas (
  id uuid primary key default gen_random_uuid(),
  responsavel_id uuid not null references responsaveis (id) on delete cascade,
  estado estado_perfil not null default 'rascunho',

  -- Só campo público. Ver packages/core/src/visibilidade.ts.
  apelido text not null,
  categoria text not null,
  posicao text,
  pe_dominante text,
  altura_cm integer,
  peso_kg numeric(5, 2),
  clube_atual text,
  estado_uf text,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table atleta_identificacao (
  atleta_id uuid primary key references atletas (id) on delete cascade,
  nome_completo text not null,
  data_nascimento date not null,
  cidade text,
  contato_responsavel text
);

create table atleta_saude (
  atleta_id uuid primary key references atletas (id) on delete cascade,
  avaliacao_postural jsonb,
  massa_magra_pct numeric(5, 2),
  historico_lesao text,
  atualizado_em timestamptz not null default now()
);

create index atletas_estado_idx on atletas (estado);
create index atletas_categoria_idx on atletas (categoria) where estado = 'ativo';
