-- Trajetória e conquistas do profissional — o conteúdo que antes só existia
-- na landing feita à mão de `/profissional/flavio` (marcos de carreira,
-- números em destaque e uma citação) passa a ser dado, para que a página
-- genérica `/profissional/[slug]` consiga desenhar o mesmo tipo de conteúdo
-- para QUALQUER profissional — não só o Flávio. Ver relatório desta tarefa
-- (unificação da página do Flávio com a dos outros profissionais).
--
-- Duas tabelas novas, no mesmo espírito de `atleta_midias`/`atleta_destaques`
-- (migration 0011): filhas de `profissionais`, com `ordem` para controlar a
-- sequência de exibição, e RLS de leitura pública — mesma régua de
-- `profissionais` em si (migration 0010): nome, clube, título e ano de
-- carreira não têm nada da régua de "criança não é vitrine", é o
-- profissional que assina o laudo, não o atleta.
--
-- `profissional_marcos` é a linha do tempo (o que virou `linhaDoTempo` em
-- app/profissional/flavio/data.ts): um marco por conquista/temporada, com
-- `fase` distinguindo carreira de atleta de carreira de técnico — mesma
-- distinção que a landing fazia com "Em quadra" / "Na beira". `datado`
-- existe porque nem todo marco tem ano certo (ver "Sub-20" e "Mundial" no
-- Flávio, que a fonte não data) — `ano` continua sendo o rótulo mostrado
-- (pode ser um ano ou uma categoria), e `ano_ordinal` é só para ordenar a
-- lista sem depender do texto.
--
-- `profissional_conquistas` é a grade de números (o que virou `numeros` na
-- mesma landing): valor grande, unidade, rótulo e uma nota de apoio.

create table profissional_marcos (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references profissionais (id) on delete cascade,

  ano text not null,
  ano_ordinal integer not null,
  datado boolean not null default true,

  clube text,
  titulos text[] not null default '{}',
  titulo text not null,
  descricao text not null,

  fase text not null check (fase in ('atleta', 'tecnico')),
  destaque boolean not null default false,
  ordem integer not null default 0,

  criado_em timestamptz not null default now()
);

create index profissional_marcos_profissional_idx
  on profissional_marcos (profissional_id, ordem);

alter table profissional_marcos enable row level security;

create policy profissional_marcos_leitura_publica on profissional_marcos
  for select
  using (true);

create table profissional_conquistas (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid not null references profissionais (id) on delete cascade,

  valor text not null,
  unidade text not null,
  rotulo text not null,
  nota text,
  ordem integer not null default 0,

  criado_em timestamptz not null default now()
);

create index profissional_conquistas_profissional_idx
  on profissional_conquistas (profissional_id, ordem);

alter table profissional_conquistas enable row level security;

create policy profissional_conquistas_leitura_publica on profissional_conquistas
  for select
  using (true);

-- Citação (pull quote do perfil social, equivalente à seção CITAÇÃO da
-- landing) mora direto em `profissionais`: é no máximo uma frase de
-- destaque por profissional, não uma lista — não justifica tabela própria.
alter table profissionais
  add column citacao_texto text,
  add column citacao_fonte text,
  add constraint profissionais_citacao_coerente
    check (citacao_texto is null or length(trim(citacao_texto)) > 0);
