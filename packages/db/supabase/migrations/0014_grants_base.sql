-- Restaura os GRANTs de base que o Supabase normalmente concede aos papéis
-- da API.
--
-- Sintoma: o site inteiro voltava vazio — "Nenhum atleta encontrado" — com o
-- banco cheio. Causa: `anon`, `authenticated` e `service_role` não tinham
-- SELECT nas tabelas de `public`. Sem o GRANT de base, a RLS sequer é
-- avaliada; o Postgres barra antes, e toda consulta volta com zero linhas.
--
-- Por que faltava: as default privileges do papel `postgres` concedem esses
-- direitos, mas `alter default privileges` não age retroativamente — vale
-- só para tabelas criadas DEPOIS. As nossas nasceram antes disso valer, e
-- ficaram sem grant nenhum.
--
-- Isto NÃO afrouxa o modelo de acesso. No Supabase quem decide o que cada
-- papel enxerga é a RLS, que continua ligada nas 13 tabelas e inalterada por
-- esta migration. O GRANT é a camada por baixo dela: sem ele a RLS não roda,
-- com ele a RLS volta a ser quem manda.
grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines  in schema public to postgres, anon, authenticated, service_role;

-- E para as tabelas que vierem depois desta migration.
alter default privileges in schema public
  grant all on tables    to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines  to postgres, anon, authenticated, service_role;

-- A função de introspecção da 0002 continua fora do alcance do público.
revoke execute on function colunas_da_tabela(text) from public;
revoke execute on function colunas_da_tabela(text) from anon;
