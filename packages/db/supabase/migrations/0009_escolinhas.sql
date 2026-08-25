-- Escolinhas (CTs/clubes de base) como entidade própria do domínio. Nenhuma
-- coluna aqui identifica ou localiza uma criança — é informação
-- institucional da escolinha (nome, cidade, UF, selo de credenciamento),
-- então pode ser pública sem a régua fina que `atletas` precisa.
--
-- Cadastro/edição de escolinha (tela de admin, autenticação de treinador)
-- não faz parte desta rodada — ver AGENTS/brief. A tabela existe para o
-- seed e a vitrine pública consumirem; por isso não há política de insert,
-- update ou delete abaixo: com RLS ligada e nenhuma política de escrita, a
-- RLS nega por padrão para qualquer role sujeita a ela (o seed escreve como
-- dono da migração/service role, que não passa por RLS).

create table escolinhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null,
  estado_uf text not null,
  credenciada boolean not null default false,
  credenciada_desde date,
  criado_em timestamptz not null default now(),

  -- "Desde quando" só faz sentido para quem é credenciada. Sem isso seria
  -- fácil o seed (ou uma tela futura) marcar `credenciada = true` e esquecer
  -- a data, deixando o selo público sem a informação que o justifica.
  constraint escolinhas_credenciada_desde_coerente
    check (not credenciada or credenciada_desde is not null)
);

create index escolinhas_estado_uf_idx on escolinhas (estado_uf);
create index escolinhas_credenciada_idx on escolinhas (credenciada) where credenciada;

alter table escolinhas enable row level security;

-- Leitura pública: nome, cidade, UF e selo de credenciamento não têm nada
-- da régua de "criança não é vitrine" — é o clube/CT, não o atleta.
create policy escolinhas_leitura_publica on escolinhas
  for select
  using (true);

-- O atleta pode não ter escolinha (perfil independente, cadastrado direto
-- pelo responsável, sem turma). `on delete set null`: remover a escolinha
-- do catálogo não deve apagar nem suspender o atleta vinculado a ela — o
-- vínculo é informativo, não uma dependência de existência.
alter table atletas
  add column escolinha_id uuid references escolinhas (id) on delete set null;

create index atletas_escolinha_id_idx on atletas (escolinha_id) where escolinha_id is not null;
