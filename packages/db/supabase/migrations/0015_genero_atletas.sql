-- Gênero do atleta — falta na tabela desde a migration 0001. A base sempre
-- teve atletas masculinos e femininos (ver `responsavel.feminino@exemplo.test`
-- no seed), mas não existia coluna para registrar isso, então `/atletas`
-- nunca pôde filtrar por gênero.
--
-- Mesma régua de sensibilidade de `posicao`/`pe_dominante` (migration 0001):
-- não identifica nem localiza a criança — é atributo esportivo, não dado de
-- `atleta_identificacao`. Fica em `atletas`, então herda a mesma política
-- `atletas_leitura_publica` (migration 0002, `estado = 'ativo'`) sem
-- precisar de política nova.
--
-- `check` em vez de enum novo: mesmo padrão de `pe_dominante` (texto livre
-- validado na aplicação, não tipo do Postgres) — mais barato de estender
-- depois sem `alter type`. Nullable: perfil existente (ou cadastrado antes
-- de a tela de cadastro vir a coletar isto) fica "não informado", não quebra
-- a linha nem é forçado a escolher um dos dois valores.
alter table atletas
  add column genero text
    check (genero is null or genero in ('Masculino', 'Feminino'));

-- Mesmo padrão de `atletas_categoria_idx` (0001): índice parcial só entre os
-- ativos, que é o universo que a listagem pública filtra.
create index atletas_genero_idx on atletas (genero) where estado = 'ativo';
