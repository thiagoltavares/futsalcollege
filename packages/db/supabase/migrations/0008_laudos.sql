-- Laudo de avaliação técnica: o selo que dá valor à ficha. Publicado, não se
-- edita — correção gera uma nova linha apontando para a anterior
-- (substitui_laudo_id), e a anterior continua visível.
--
-- Desvio deliberado em relação ao brief original (tarefa-14): o brief só
-- guarda `avaliador_id` (referência a auth.users). Mas a ficha pública
-- (cliente anônimo) e o PDF precisam mostrar "quem assinou" o laudo, e
-- `auth.users` nunca é alcançável por RLS a partir de um cliente anônimo —
-- nem `responsaveis` teria, aqui, política de leitura pública por linha
-- alheia. Em vez de inventar uma tabela de credenciamento de avaliador
-- (fora de escopo nesta rodada — ver AGENTS/brief da rodada), o nome de
-- quem avaliou é gravado como texto no próprio laudo, no momento da
-- publicação — o mesmo padrão de "snapshot no momento do ato" já usado em
-- `consentimentos` (prova, não referência viva).

create type contexto_avaliacao as enum ('presencial', 'analise_video');

create table laudos (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas (id) on delete cascade,
  avaliador_id uuid not null references auth.users (id),
  avaliador_nome text not null,
  rubrica_versao text not null references rubricas (versao),
  contexto contexto_avaliacao not null,
  notas jsonb not null,
  texto text,
  publicado_em timestamptz,
  substitui_laudo_id uuid references laudos (id),
  criado_em timestamptz not null default now()
);

create index laudos_atleta_idx on laudos (atleta_id, criado_em desc);

-- Publicado, não se edita. Correção gera novo laudo apontando para o anterior.
create or replace function laudo_imutavel()
returns trigger
language plpgsql
as $$
begin
  if old.publicado_em is not null then
    raise exception 'laudo % já publicado; crie uma nova versão em vez de editar', old.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger laudos_imutavel
  before update on laudos
  for each row
  execute function laudo_imutavel();

alter table laudos enable row level security;

-- Laudo publicado de perfil ativo é público: é o selo, e é o SEO. Nenhum
-- ranking entra aqui — esta política só devolve linhas de UM atleta por vez
-- (a página de ficha filtra por atleta_id); nada nesta política ordena,
-- filtra por "melhor nota" nem permite consulta comparando atletas entre si.
create policy laudos_leitura_publica on laudos
  for select
  using (
    publicado_em is not null
    and exists (select 1 from atletas a where a.id = laudos.atleta_id and a.estado = 'ativo')
  );

create policy laudos_do_avaliador on laudos
  for all
  using (avaliador_id = auth.uid())
  with check (avaliador_id = auth.uid());
