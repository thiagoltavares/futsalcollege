alter table responsaveis enable row level security;
alter table atletas enable row level security;
alter table atleta_identificacao enable row level security;
alter table atleta_saude enable row level security;

-- Ficha pública: qualquer um lê, mas só perfil ativo.
create policy atletas_leitura_publica on atletas
  for select
  using (estado = 'ativo');

-- O responsável enxerga e edita os próprios atletas em qualquer estado.
create policy atletas_do_responsavel on atletas
  for all
  using (responsavel_id = auth.uid())
  with check (responsavel_id = auth.uid());

create policy responsaveis_proprio on responsaveis
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- Identificação: responsável dono, e olheiro verificado.
create policy identificacao_responsavel on atleta_identificacao
  for all
  using (
    exists (
      select 1 from atletas a
      where a.id = atleta_identificacao.atleta_id
        and a.responsavel_id = auth.uid()
    )
  );

create policy identificacao_olheiro_verificado on atleta_identificacao
  for select
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'papel', '') = 'olheiro_verificado'
  );

-- Saúde: só o responsável dono. Olheiro verificado não entra aqui.
create policy saude_responsavel on atleta_saude
  for all
  using (
    exists (
      select 1 from atletas a
      where a.id = atleta_saude.atleta_id
        and a.responsavel_id = auth.uid()
    )
  );

-- Função auxiliar de teste: lista as colunas de uma tabela do schema public.
-- Usada para provar que campos que localizam a criança (bairro, endereço,
-- escola, horário/local de treino) nunca existiram como coluna.
create or replace function colunas_da_tabela(nome text)
returns table (column_name text)
language sql
stable
as $$
  select c.column_name::text
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = nome;
$$;
