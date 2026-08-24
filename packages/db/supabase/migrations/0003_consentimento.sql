-- O treinador cadastra, mas quem consente é sempre o responsável. Um perfil só
-- chega a 'ativo' com consentimento vigente, e a checagem mora no banco: não
-- adianta uma tela esquecer de validar.

create table consentimentos (
  id uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references atletas (id) on delete cascade,
  responsavel_id uuid not null references responsaveis (id) on delete cascade,
  documento_url text not null,
  versao_termo text not null,
  aceito_em timestamptz not null default now(),
  revogado_em timestamptz,
  ip inet,
  agente text
);

create index consentimentos_atleta_idx on consentimentos (atleta_id);

-- A RLS abaixo só garante que a LINHA pertence a quem a criou
-- (responsavel_id = auth.uid()). Sozinha, ela não impede que um responsável
-- registre um "consentimento" para o atleta de OUTRO responsável — bastaria
-- inserir com o próprio responsavel_id e um atleta_id alheio, e essa linha
-- passaria a contar como vigente para uma criança que não é sua. Este
-- gatilho fecha esse buraco: o responsavel_id da linha tem que ser,
-- de fato, o responsável cadastrado do atleta.
create or replace function exigir_responsavel_do_atleta()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from atletas a
    where a.id = new.atleta_id
      and a.responsavel_id = new.responsavel_id
  ) then
    raise exception 'responsavel_id % não é o responsável cadastrado do atleta %', new.responsavel_id, new.atleta_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger consentimentos_exigir_responsavel_do_atleta
  before insert or update of atleta_id, responsavel_id on consentimentos
  for each row
  execute function exigir_responsavel_do_atleta();

create or replace function consentimento_vigente(p_atleta uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from consentimentos c
    where c.atleta_id = p_atleta and c.revogado_em is null
  );
$$;

create or replace function exigir_consentimento()
returns trigger
language plpgsql
as $$
begin
  if new.estado = 'ativo' and not consentimento_vigente(new.id) then
    raise exception 'perfil % não pode ficar ativo sem consentimento vigente', new.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger atletas_exigir_consentimento
  before insert or update of estado on atletas
  for each row
  when (new.estado = 'ativo')
  execute function exigir_consentimento();

-- Revogar consentimento derruba o perfil na hora — mas só quando o
-- consentimento revogado era o que sustentava o perfil. Duas guardas:
--
-- 1. `not consentimento_vigente(new.atleta_id)`: se o atleta ainda tem outro
--    consentimento vigente (mais de um responsável, ou renovação), revogar
--    este não derruba nada — o que importa é se ALGUM consentimento vigente
--    continua de pé, não qual foi revogado agora.
-- 2. `where … and estado = 'ativo'`: só mexe no perfil se ele estava ativo.
--    Um perfil em 'rascunho' ou já 'removido' não deve ser "ressuscitado"
--    para 'suspenso' só porque um consentimento antigo, associado a ele,
--    foi revogado depois — a atualização simplesmente não afeta nenhuma
--    linha quando o estado atual não é 'ativo'.
create or replace function derrubar_ao_revogar()
returns trigger
language plpgsql
as $$
begin
  if new.revogado_em is not null
     and old.revogado_em is null
     and not consentimento_vigente(new.atleta_id)
  then
    update atletas
    set estado = 'suspenso'
    where id = new.atleta_id
      and estado = 'ativo';
  end if;
  return new;
end;
$$;

create trigger consentimentos_derrubar
  after update of revogado_em on consentimentos
  for each row
  execute function derrubar_ao_revogar();

alter table consentimentos enable row level security;

create policy consentimentos_do_responsavel on consentimentos
  for all
  using (responsavel_id = auth.uid())
  with check (responsavel_id = auth.uid());
