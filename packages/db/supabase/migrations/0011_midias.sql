-- Mídia do atleta (fotos e vídeos) e destaques fixos — a infraestrutura que
-- faz o perfil parecer rede social, não sistema de gestão. Duas tabelas
-- novas, mesmo raciocínio de separação por sensibilidade já usado em
-- `atleta_identificacao`/`atleta_saude` (migration 0001): nada aqui pode
-- carregar bairro, escola, local/horário de treino ou qualquer dado que
-- localize a criança — é só o arquivo, uma legenda de texto livre do
-- responsável, e a ordem de exibição. A legenda é validada só por tamanho
-- aqui; o rótulo do campo no formulário (não o banco) é quem avisa o
-- responsável do que não escrever ali — ver `EnvioMidia` no app.
--
-- Bucket próprio (`midias`), PÚBLICO — decisão explícita do produto para
-- esta rodada, para a demonstração não depender de URL assinada por mídia
-- (troque para privado com URL assinada quando o produto tratar bloqueio de
-- visibilidade; ver AGENTS/brief). Só atleta `ativo` é lido publicamente
-- pela tabela; o bucket em si serve qualquer objeto por URL pública direta
-- (limitação do Supabase Storage: bucket público não tem RLS na rota
-- `/object/public/...`), então o nome do arquivo em si nunca deve carregar
-- informação sensível — a Server Action de envio gera nomes aleatórios.

create type tipo_midia as enum ('foto', 'video');

create table atleta_midias (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas (id) on delete cascade,
  tipo tipo_midia not null,

  -- Caminho dentro do bucket `midias`, não a URL completa — a URL pública
  -- é montada em runtime a partir daqui (mesma decisão de `documento_url`
  -- em `consentimentos`, migration 0003, que guarda "bucket/caminho").
  storage_path text not null,

  -- Texto livre do responsável. Nunca aceite aqui um rótulo de formulário
  -- que sugira escola, local/horário de treino ou telefone — ver o
  -- comentário no topo deste arquivo.
  legenda text,

  ordem integer not null default 0,
  capa boolean not null default false,
  criado_em timestamptz not null default now(),

  constraint atleta_midias_legenda_tamanho check (legenda is null or char_length(legenda) <= 280)
);

-- Só uma capa por atleta — mesmo padrão de "só uma ativa" de `rubricas`
-- (migration 0007). A Server Action que troca a capa desmarca a anterior
-- antes de marcar a nova; este índice é quem garante isso mesmo se a Server
-- Action tiver um bug.
create unique index atleta_midias_uma_capa on atleta_midias (atleta_id) where capa;
create index atleta_midias_atleta_idx on atleta_midias (atleta_id, ordem);

alter table atleta_midias enable row level security;

-- Leitura pública: mesma régua de `laudos_leitura_publica` (migration
-- 0008) — só mídia de atleta com estado = 'ativo'.
create policy midias_leitura_publica on atleta_midias
  for select
  using (
    exists (select 1 from atletas a where a.id = atleta_midias.atleta_id and a.estado = 'ativo')
  );

-- Escrita só do responsável dono do atleta — mesmo padrão de
-- `identificacao_responsavel` (migration 0002): não é o próprio
-- `responsavel_id` na linha (não existe essa coluna aqui de propósito, a
-- mídia pertence ao atleta, não a uma conta), é o dono do atleta pai.
create policy midias_do_responsavel on atleta_midias
  for all
  using (
    exists (
      select 1 from atletas a where a.id = atleta_midias.atleta_id and a.responsavel_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from atletas a where a.id = atleta_midias.atleta_id and a.responsavel_id = auth.uid()
    )
  );

-- Destaques: equivalente a "stories fixos" no topo do perfil — conquista,
-- marco, evolução. `midia_id` é só a imagem de capa do círculo/pílula;
-- perder a mídia (delete) não apaga o destaque, só o deixa sem imagem — o
-- título continua de pé. Sem tela de gestão nesta rodada (fora do escopo
-- do brief): populado pelo seed, lido pela ficha pública.
create table atleta_destaques (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas (id) on delete cascade,
  titulo text not null,
  midia_id uuid references atleta_midias (id) on delete set null,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),

  constraint atleta_destaques_titulo_tamanho check (char_length(titulo) between 1 and 60)
);

create index atleta_destaques_atleta_idx on atleta_destaques (atleta_id, ordem);

alter table atleta_destaques enable row level security;

create policy destaques_leitura_publica on atleta_destaques
  for select
  using (
    exists (select 1 from atletas a where a.id = atleta_destaques.atleta_id and a.estado = 'ativo')
  );

create policy destaques_do_responsavel on atleta_destaques
  for all
  using (
    exists (
      select 1 from atletas a where a.id = atleta_destaques.atleta_id and a.responsavel_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from atletas a where a.id = atleta_destaques.atleta_id and a.responsavel_id = auth.uid()
    )
  );

-- Bucket público (decisão explícita, ver comentário no topo do arquivo).
insert into storage.buckets (id, name, public)
values ('midias', 'midias', true)
on conflict (id) do nothing;

-- Leitura por política também existe (além do acesso público direto por
-- rota, que independe de RLS): mantém o client de storage funcionando por
-- igual num bucket que um dia possa deixar de ser público.
create policy midias_bucket_leitura_publica on storage.objects
  for select
  using (bucket_id = 'midias');

create policy midias_bucket_envio_do_responsavel on storage.objects
  for insert
  with check (bucket_id = 'midias' and owner = auth.uid());

create policy midias_bucket_atualizacao_do_responsavel on storage.objects
  for update
  using (bucket_id = 'midias' and owner = auth.uid())
  with check (bucket_id = 'midias' and owner = auth.uid());

-- Diferente do bucket `termos` (migration 0006), aqui não existe prova
-- jurídica em jogo — apagar uma foto/vídeo é a funcionalidade pedida
-- ("reordenar, apagar" no painel), não um risco de sumir com evidência.
-- Delete direto pelo dono, sem a régua estreita de "só se órfão".
create policy midias_bucket_delete_do_responsavel on storage.objects
  for delete
  using (bucket_id = 'midias' and owner = auth.uid());
