-- Rubrica versionada de avaliação técnica. É o ativo da empresa: é ela que
-- faz dois avaliadores diferentes chegarem perto no mesmo atleta. O
-- conteúdo (itens, escala, âncoras descritivas) é trabalho de um
-- especialista — a v1 inserida no seed é um ESBOÇO plausível para teste, não
-- o método final.
--
-- Versionada porque o método vai evoluir, e o laudo (migration 0008) grava
-- em qual versão foi feito: sem isso o histórico de um atleta ao longo de
-- anos fica incomparável.

create table rubricas (
  versao text primary key,
  itens jsonb not null,
  publicada_em timestamptz not null default now(),
  ativa boolean not null default false
);

-- Só uma versão ativa por vez.
create unique index rubricas_uma_ativa on rubricas (ativa) where ativa;

alter table rubricas enable row level security;

-- Leitura pública: a rubrica em si não identifica ninguém — só descreve o
-- critério. A ficha pública e o PDF do laudo precisam dela para traduzir
-- nota em âncora descritiva.
create policy rubricas_leitura on rubricas for select using (true);
