-- "Visto" nas respostas da pesquisa de pré-lançamento (0017), para a
-- equipe acompanhar o que chegou de novo na página `/questionario`.
--
-- Sem política nova de RLS, de propósito: a leitura e a marcação continuam
-- fora da API pública. Quem lê e marca é o servidor, com a chave de
-- serviço, depois de conferir que a sessão é de alguém da equipe
-- (`EQUIPE_EMAILS`, ver `apps/web/src/lib/preLancamento.ts`).

alter table pesquisa_responsaveis
  add column visto_em timestamptz,
  -- Quem marcou. `set null` se a conta sumir: a marcação vale mais que o
  -- nome de quem a fez.
  add column visto_por uuid references auth.users (id) on delete set null;

-- A lista abre pelas que ainda não foram vistas.
create index pesquisa_responsaveis_nao_vistas_idx
  on pesquisa_responsaveis (criado_em desc)
  where visto_em is null;
