-- Profissionais: quem assina um laudo passa a ter página pública própria —
-- é o "cartel do avaliador" do PRD. Até aqui `laudos.avaliador_nome` (ver
-- 0008) era só texto livre, sem tabela nem página por trás: o olheiro via
-- um nome, mas não tinha como saber quem essa pessoa é nem o que ela já
-- avaliou.
--
-- `avaliador_nome` continua existindo em `laudos` — é o snapshot histórico
-- do laudo no momento em que foi publicado (mesmo raciocínio de "prova no
-- momento do ato" já documentado em 0008 para o próprio `avaliador_nome`, e
-- em `consentimentos` para o termo aceito). `profissional_id` é o vínculo
-- vivo com a página pública; nasce nulo em laudo antigo sem profissional
-- conhecido, e é a migração de dados abaixo que preenche o que dá.

create extension if not exists unaccent with schema extensions;
-- A chamada abaixo é qualificada como `extensions.unaccent`, e não `unaccent`:
-- o Supabase local traz `extensions` no search_path e o remoto não, então a
-- versão sem schema aplicava aqui e quebrava no projeto de produção.

create table profissionais (
  id uuid primary key default gen_random_uuid(),

  -- Vínculo opcional com a conta que faz login (mesmo `auth.users` que já
  -- assina `laudos.avaliador_id`). Fica nulo para quem tem página mas não
  -- tem conta na plataforma — caso do Flávio Barbosa, autoridade da home
  -- sem vínculo de login nesta rodada. `on delete set null`: a página do
  -- profissional e os laudos que ele já assinou não desaparecem se a conta
  -- de login for removida.
  user_id uuid unique references auth.users (id) on delete set null,

  nome text not null,
  slug text not null unique,
  credencial text,
  cidade text,
  estado_uf text,
  bio text,
  ativo boolean not null default true,

  -- "Desde quando" avalia na plataforma — não é a carreira inteira da
  -- pessoa, é o que a página pública mostra ao lado da contagem de laudos.
  atua_desde date not null default current_date,

  criado_em timestamptz not null default now(),

  constraint profissionais_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index profissionais_ativo_idx on profissionais (ativo) where ativo;

alter table profissionais enable row level security;

-- Leitura pública, mesmo raciocínio de `escolinhas` (migration 0009): nome,
-- credencial, cidade e bio de um profissional não têm nada da régua de
-- "criança não é vitrine" — é a pessoa que assina o laudo, não o atleta.
-- Sem política de insert/update/delete de propósito: cadastro de
-- profissional (tela de admin) não faz parte desta rodada — o seed escreve
-- como dono da migração/service role, que não passa por RLS.
create policy profissionais_leitura_publica on profissionais
  for select
  using (true);

alter table laudos
  add column profissional_id uuid references profissionais (id);

create index laudos_profissional_idx on laudos (profissional_id)
  where profissional_id is not null;

-- `laudo_imutavel()` (migration 0008) bloqueia QUALQUER update depois de
-- publicado — inclusive este backfill de `profissional_id` logo abaixo, e
-- qualquer backfill futuro do mesmo tipo. `profissional_id` não é conteúdo
-- do laudo (não é nota, não é texto, não é quem assinou no momento — isso
-- é `avaliador_nome`, que continua imutável): é só o vínculo com a página
-- pública de quem assinou, e esse vínculo pode nascer depois da publicação
-- (é exatamente o caso desta migração, ligando laudo antigo a um
-- profissional novo). Redefine o gatilho para permitir mudar só esta
-- coluna depois de publicado; qualquer outra mudança continua proibida.
create or replace function laudo_imutavel()
returns trigger
language plpgsql
as $$
begin
  if old.publicado_em is not null then
    if new.atleta_id is distinct from old.atleta_id
      or new.avaliador_id is distinct from old.avaliador_id
      or new.avaliador_nome is distinct from old.avaliador_nome
      or new.rubrica_versao is distinct from old.rubrica_versao
      or new.contexto is distinct from old.contexto
      or new.notas is distinct from old.notas
      or new.texto is distinct from old.texto
      or new.publicado_em is distinct from old.publicado_em
      or new.substitui_laudo_id is distinct from old.substitui_laudo_id
      or new.criado_em is distinct from old.criado_em
    then
      raise exception 'laudo % já publicado; crie uma nova versão em vez de editar', old.id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

-- Migração de dados: qualquer laudo já existente (produção real — no banco
-- que só o seed povoa, isto roda sobre zero linhas, porque migration roda
-- antes do seed) ganha uma linha de profissional de verdade a partir do
-- texto livre em `avaliador_nome`, deduplicado por nome. O sufixo do slug
-- (hash curto do próprio nome) existe só para garantir unicidade
-- automática aqui; o seed usa slugs escolhidos à mão para os profissionais
-- que ganham página cuidada.
with distintos as (
  select distinct avaliador_nome as nome
  from laudos
  where profissional_id is null and avaliador_nome is not null
),
gerados as (
  insert into profissionais (nome, slug, ativo, atua_desde)
  select
    d.nome,
    trim(both '-' from regexp_replace(lower(extensions.unaccent(d.nome)), '[^a-z0-9]+', '-', 'g'))
      || '-' || substr(md5(d.nome), 1, 6),
    true,
    current_date
  from distintos d
  returning id, nome
)
update laudos l
set profissional_id = g.id
from gerados g
where l.avaliador_nome = g.nome and l.profissional_id is null;
