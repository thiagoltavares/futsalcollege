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

-- Consentimento é prova, e prova não se apaga. Revogar (update de
-- revogado_em) já é o caminho correto para desfazer um consentimento — ele
-- preserva a trilha. Por isso a RLS abaixo concede select, insert e update
-- ao responsável dono, mas NUNCA delete: sem política de delete, a RLS nega
-- por padrão. Antes disso era uma única política `for all`, que concedia
-- delete de graça — um responsável autenticado conseguia apagar
-- fisicamente o único consentimento de um atleta ativo, e o atleta
-- continuava 'ativo' com zero linhas em consentimentos (o gatilho
-- consentimentos_derrubar só dispara em update de revogado_em, nunca em
-- delete). A garantia central da tarefa dependia de a linha nunca sumir.
alter table consentimentos enable row level security;

create policy consentimentos_do_responsavel_select on consentimentos
  for select
  using (responsavel_id = auth.uid());

create policy consentimentos_do_responsavel_insert on consentimentos
  for insert
  with check (responsavel_id = auth.uid());

create policy consentimentos_do_responsavel_update on consentimentos
  for update
  using (responsavel_id = auth.uid())
  with check (responsavel_id = auth.uid());

-- A mesma política `for all` antiga também deixava o responsável reescrever
-- documento_url, aceito_em e versao_termo de um consentimento já criado —
-- ou seja, editar a evidência do que foi consentido, sem deixar rastro.
-- Registro que se reescreve não é registro. Este gatilho restringe update
-- em consentimentos a uma única coisa: revogar (revogado_em de null para um
-- timestamp). Qualquer tentativa de mudar atleta_id, responsavel_id,
-- documento_url, versao_termo ou aceito_em falha. E revogação não se
-- desfaz: uma vez setado, revogado_em não pode voltar a null — para
-- reativar um atleta, cria-se um consentimento novo.
create or replace function impedir_reescrita_consentimento()
returns trigger
language plpgsql
as $$
begin
  if new.atleta_id is distinct from old.atleta_id
     or new.responsavel_id is distinct from old.responsavel_id
     or new.documento_url is distinct from old.documento_url
     or new.versao_termo is distinct from old.versao_termo
     or new.aceito_em is distinct from old.aceito_em
  then
    raise exception 'consentimento não pode ser editado — apenas revogar (revogado_em) é permitido; para reativar, crie um novo consentimento'
      using errcode = 'check_violation';
  end if;

  if old.revogado_em is not null and new.revogado_em is null then
    raise exception 'revogação não pode ser desfeita — crie um novo consentimento para reativar o atleta'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger consentimentos_impedir_reescrita
  before update on consentimentos
  for each row
  execute function impedir_reescrita_consentimento();

-- As políticas de select/insert/update acima (sem delete) só protegem contra
-- roles sujeitas a RLS. O role service_role tem rolbypassrls = true — RLS
-- não existe para ele, então "não conceder política de delete" não segura
-- nada nesse caminho. Um delete direto na tabela, feito com a chave secreta,
-- apaga a prova de qualquer jeito: mesmo bug do achado original (perfil
-- 'ativo' com zero consentimentos), só que pelo backend em vez do cliente do
-- responsável.
--
-- Gatilho é a ferramenta certa aqui porque, ao contrário de política de RLS,
-- ele dispara para QUALQUER role, incluindo service_role — é exatamente por
-- isso que os dois gatilhos acima (exigir_responsavel_do_atleta e
-- impedir_reescrita_consentimento) seguram o cliente de serviço, e por isso
-- este segue o mesmo padrão.
--
-- A pegadinha: consentimentos tem "on delete cascade" a partir de atletas e
-- de responsaveis, e isso é comportamento desejado — apagar o atleta (ou o
-- responsável) deve levar junto perfil, identificação e prova, como num
-- pedido de exclusão. Um gatilho "before delete" ingênuo rejeitaria também
-- esse caminho, quebrando a exclusão.
--
-- pg_trigger_depth() resolve a distinção. Ações de FK ON DELETE CASCADE são
-- implementadas pelo Postgres como gatilhos internos na tabela referenciada:
-- apagar um atleta dispara o gatilho interno de cascata de atletas (entramos
-- em profundidade 1), que por sua vez apaga a linha em consentimentos —
-- disparando ESTE gatilho já em profundidade 2. Já um delete direto em
-- consentimentos, feito por um cliente (service_role ou não), é a primeira
-- invocação de gatilho da transação: profundidade 1. Ou seja:
--   profundidade <= 1  → delete direto na própria tabela → rejeitar
--   profundidade  > 1  → delete chegou via cascata de FK  → deixar passar
create or replace function impedir_delete_consentimento()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() <= 1 then
    raise exception 'consentimento não pode ser apagado — é prova, e prova não se apaga. Isto vale inclusive para o service_role, que ignora RLS mas não gatilhos. Para desfazer um consentimento, revogue-o (revogado_em); apagar o atleta ou o responsável continua removendo os consentimentos por cascata.'
      using errcode = 'check_violation';
  end if;
  return old;
end;
$$;

create trigger consentimentos_impedir_delete
  before delete on consentimentos
  for each row
  execute function impedir_delete_consentimento();
