-- A Tarefa 9 encontrou um buraco no plano original: nenhuma das tarefas
-- anteriores cria a linha em `responsaveis` quando alguém se cadastra. Sem
-- ela, todo insert em `atletas` falha por violação de FK
-- (responsavel_id -> responsaveis.id), porque um usuário que só passou pelo
-- login por link mágico nunca ganhava linha correspondente.
--
-- `nome` deixa de ser obrigatório: inventar um valor aqui (e-mail, etc.) só
-- para satisfazer NOT NULL seria pior do que deixar vazio, porque
-- `responsaveis.nome` alimenta o termo de consentimento — prova jurídica.
-- O nome real é coletado na Tarefa 10 (tela de consentimento), que precisa
-- exigi-lo antes de gerar o termo.
alter table responsaveis alter column nome drop not null;

-- Gatilho em auth.users no padrão oficial do Supabase para popular tabela
-- pública a partir do signup: security definer (roda com o dono da função,
-- que tem acesso a auth.users) e search_path vazio (evita search_path
-- hijacking — por isso toda referência de tabela abaixo é qualificada com
-- o schema). A função retorna "trigger", então o PostgREST não a expõe como
-- RPC — não precisa de política nem de revoke extra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.responsaveis (id, nome)
  values (new.id, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
