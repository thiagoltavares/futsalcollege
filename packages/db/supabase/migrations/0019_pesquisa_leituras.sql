-- "Visto" individual no Questionário da equipe. A 0018 pôs uma marcação só
-- por resposta (visto_em/visto_por): quem marcava primeiro tirava a
-- resposta da lista de "não vistas" do outro. O Thiago e o Flávio querem
-- cada um a sua: uma linha por pessoa e resposta.
--
-- Sem política de RLS, de propósito, como a própria pesquisa: quem lê e
-- marca é o servidor, com a chave de serviço, depois de conferir que a
-- sessão é da equipe (`apps/web/src/lib/equipe.ts`).

create table pesquisa_leituras (
  resposta_id uuid not null references pesquisa_responsaveis (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  visto_em timestamptz not null default now(),
  primary key (resposta_id, user_id)
);

-- "Quais respostas esta pessoa já viu" é a consulta da página.
create index pesquisa_leituras_user_idx on pesquisa_leituras (user_id);

alter table pesquisa_leituras enable row level security;

-- A marcação compartilhada da 0018 sai (o índice parcial vai junto com a
-- coluna). Nenhuma resposta tinha sido marcada em produção.
alter table pesquisa_responsaveis
  drop column visto_em,
  drop column visto_por;
