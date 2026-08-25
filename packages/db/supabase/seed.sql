-- Massa de dados para teste manual (smoke test na mão, sem Playwright) e
-- para a vitrine pública ter volume de verdade — home, /atletas,
-- /escolinhas e a ficha de cada atleta.
--
-- `select setseed(...)` deixa todo `random()` usado abaixo determinístico
-- dentro desta sessão: cada `supabase db reset` gera exatamente a mesma
-- massa "aleatória" (alturas, notas, datas, etc.), o que ajuda a comparar
-- screenshot com screenshot entre uma rodada de teste e outra.
select setseed(0.4231);

-- Correção que já valia no seed anterior e continua valendo: `responsaveis`
-- NÃO recebe insert direto. Desde a migration 0004, um gatilho em
-- `auth.users` (`on_auth_user_created`) já cria a linha em `responsaveis`
-- (com `nome` nulo) assim que o usuário é inserido em `auth.users` — um
-- insert explícito colidiria com a chave primária. O nome de cada
-- responsável é preenchido com `update`, depois do insert em `auth.users`.
--
-- ==========================================================================
-- LOGIN (magic link / OTP, ou o atalho de dev em /entrar com
-- NEXT_PUBLIC_LOGIN_DEV=1) — para o link mágico de verdade, abra
-- http://127.0.0.1:54524 (Mailpit) e pegue o link enviado ao digitar o
-- e-mail em /entrar:
-- ==========================================================================
--
-- RESPONSÁVEIS (9 — cobrem o painel do responsável, cadastro e consentimento)
--
--   responsavel.multiplos@exemplo.test
--     Erivan Costa Lima — 5 filhos: Kadu (rascunho), Bira (aguardando
--     consentimento, vinculado a escolinha), Manu (ativo, 2 laudos —
--     evolução), DL (ativo, goleiro, 1 laudo), Miguelzinho (removido).
--     Cobre 4 dos 5 estados de perfil num painel só.
--
--   responsavel.dois@exemplo.test
--     Adriana Nascimento Freire — 3 filhos (rascunho, ativo, aguardando
--     consentimento). Painel de tamanho médio; confirma que o painel de um
--     responsável NUNCA mostra o filho de outro.
--
--   responsavel.solo@exemplo.test
--     Cícero Wagner Pontes — 2 filhos: Gabigol Cearense (ativo, SEM laudo
--     de propósito — exercita "ainda sem avaliação publicada") e Rafinha
--     (suspenso por revogação de consentimento — o filho já chega pronto
--     para mostrar a tela pós-revogação).
--
--   responsavel.gemeos@exemplo.test
--     Fabiana Melo Rocha — 2 filhas (Bibi e Duda), mesma escolinha, ambas
--     ativas. Bibi tem 2 laudos em datas diferentes — outro caso de
--     "evolução" além de Manu.
--
--   responsavel.avaliacoes@exemplo.test
--     Marcos Aurélio Nunes — 4 filhos, todos vinculados a escolinha
--     diferente cada um. Théozinho e Nardinho têm 2 laudos cada (evolução);
--     bom responsável para testar a ficha pública com histórico mais longo.
--
--   responsavel.interior@exemplo.test
--     Socorro Helena Bezerra — 2 filhos em escolinhas do interior do Ceará
--     (Sobral e Crato), ambos ativos com 1 laudo.
--
--   responsavel.fora_ceara@exemplo.test
--     Antônio Carlos Rego — 2 filhos fora do Ceará (PE e RN) — bom para
--     testar o filtro de estado em /atletas com dado fora do eixo cearense.
--
--   responsavel.feminino@exemplo.test
--     Patrícia Gurgel Aragão — 3 filhas na mesma escolinha (Instituto Bola
--     na Rede), estados variados (ativo com laudo, ativo sem laudo,
--     rascunho).
--
--   responsavel.sem_escolinha@exemplo.test
--     Raimundo Nonato Filho — 3 filhos independentes, sem escolinha nem
--     clube — perfil "avulso", cadastrado direto pelo responsável.
--
-- Todos os nove entram por link mágico (sem senha) ou pelo atalho de dev.
-- `email_confirmed_at` já vem preenchido, então o OTP local funciona de
-- primeira.
--
-- AVALIADORES (4 — assinam os laudos abaixo; nesta rodada não existe
-- credenciamento, então qualquer um destes é só um exemplo de conta que
-- entraria pelo mesmo link mágico e acessaria /avaliar/[atletaId]):
--
--   avaliador.tecnico@exemplo.test        — Prof. Ricardo Bezerra
--   avaliadora.camila@exemplo.test        — Profa. Camila Studart
--   avaliador.everton@exemplo.test        — Prof. Everton Aragão Filho
--   avaliadora.larissa@exemplo.test       — Profa. Larissa Monteiro Cid
--
-- PROFISSIONAIS (5 — migration 0010, tabela `profissionais`, página
-- pública /profissionais e /profissional/[slug]): os 4 acima, mais Flávio
-- Barbosa (slug `flavio`, sem conta de login, sem laudo no seed — página
-- especial já existente em /profissional/flavio, que o Next.js resolve no
-- lugar da rota genérica para esse slug).
--
-- RESPONSÁVEIS EM MASSA (14 — só para dar volume aos 60-80 atletas da
-- vitrine; não valem a pena documentar um a um, e o seletor de login de dev
-- lista TODOS os usuários do banco, então não são o foco de nenhum roteiro
-- de teste manual). E-mails seguem o padrão
-- `familia.bulkNN@exemplo.test` (NN de 01 a 14), mesma senha de teste dos
-- demais, e entram pelos mesmos dois caminhos de login.
--
-- ==========================================================================
-- NÚMEROS DESTE SEED (conferir após alterar isto): 13 escolinhas (7
-- credenciadas), 23 responsáveis (9 nomeados + 14 em massa), 72 atletas
-- (26 nomeados + 46 em massa) — maioria ativo, alguns em cada um dos outros
-- quatro estados —, 4 avaliadores (+ 1 profissional sem laudo, Flávio
-- Barbosa — 5 linhas em `profissionais`), e por volta de 32 laudos
-- publicados (17 nos atletas nomeados + 15 nos atletas em massa), cobrindo
-- atletas com mais de um laudo em datas diferentes.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Escolinhas — entidades públicas, sem dado de criança. Fortaleza, região
-- metropolitana e interior do Ceará. Nomes fictícios (ou livremente
-- inspirados em clubes/CTs reais, sem relação com o perfil do Flávio
-- Barbosa).
-- --------------------------------------------------------------------------

insert into escolinhas (id, nome, cidade, estado_uf, credenciada, credenciada_desde)
values
  ('c0000000-0000-0000-0000-000000000001', 'CT Sesc Ceará Futsal', 'Fortaleza', 'CE', true, '2016-03-10'),
  ('c0000000-0000-0000-0000-000000000002', 'Fortaleza Futsal Clube — Base', 'Fortaleza', 'CE', true, '2014-06-01'),
  ('c0000000-0000-0000-0000-000000000003', 'Horizonte Futsal', 'Horizonte', 'CE', true, '2018-01-15'),
  ('c0000000-0000-0000-0000-000000000004', 'Sport Club Eusébio', 'Eusébio', 'CE', false, null),
  ('c0000000-0000-0000-0000-000000000005', 'Guarani de Juazeiro', 'Juazeiro do Norte', 'CE', false, null),
  ('c0000000-0000-0000-0000-000000000006', 'Quixadá Futsal Clube', 'Quixadá', 'CE', true, '2019-05-20'),
  ('c0000000-0000-0000-0000-000000000007', 'CT Gol de Placa', 'Maracanaú', 'CE', false, null),
  ('c0000000-0000-0000-0000-000000000008', 'Escolinha Estrela do Sertão', 'Maranguape', 'CE', true, '2020-02-11'),
  ('c0000000-0000-0000-0000-000000000009', 'Craques do Amanhã', 'Caucaia', 'CE', false, null),
  ('c0000000-0000-0000-0000-000000000010', 'Instituto Bola na Rede', 'Fortaleza', 'CE', true, '2012-08-19'),
  ('c0000000-0000-0000-0000-000000000011', 'Vaqueiros FC Escolinha', 'Sobral', 'CE', false, null),
  ('c0000000-0000-0000-0000-000000000012', 'Academia Futsal Cariri', 'Crato', 'CE', true, '2017-04-04'),
  ('c0000000-0000-0000-0000-000000000013', 'Litoral Futsal Icapuí', 'Icapuí', 'CE', false, null);

-- --------------------------------------------------------------------------
-- Responsáveis nomeados (9)
-- --------------------------------------------------------------------------

-- `instance_id` não tem default na tabela e precisa ser o UUID zerado (o
-- instance_id padrão de instalação self-hosted/local): sem ele, GoTrue
-- busca o usuário existente e não encontra, tenta "criar" de novo e colide
-- com a constraint de e-mail único — 500 tanto em `/auth/v1/otp` quanto no
-- link mágico de verdade. Achado ao testar o login manualmente numa rodada
-- anterior desta tarefa.
-- Os campos de token abaixo (confirmation_token etc.) também precisam ser
-- string vazia, não null: o código Go da GoTrue lê a linha inteira do
-- usuário com destino a campos `string` comuns (não `sql.NullString`), e
-- null nesses campos derruba QUALQUER consulta que leia a linha (inclusive
-- o /otp de login) com "converting NULL to string is unsupported". Um
-- signup feito pela própria GoTrue sempre grava "" nesses campos; aqui
-- reproduzimos isso à mão pelo mesmo motivo.
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, created_at, updated_at
)
values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'responsavel.multiplos@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'responsavel.dois@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'responsavel.solo@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
   'responsavel.gemeos@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000',
   'responsavel.avaliacoes@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000',
   'responsavel.interior@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000',
   'responsavel.fora_ceara@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000',
   'responsavel.feminino@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000',
   'responsavel.sem_escolinha@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now());

update responsaveis set nome = 'Erivan Costa Lima' where id = 'a0000000-0000-0000-0000-000000000001';
update responsaveis set nome = 'Adriana Nascimento Freire' where id = 'a0000000-0000-0000-0000-000000000002';
update responsaveis set nome = 'Cícero Wagner Pontes' where id = 'a0000000-0000-0000-0000-000000000003';
update responsaveis set nome = 'Fabiana Melo Rocha' where id = 'a0000000-0000-0000-0000-000000000004';
update responsaveis set nome = 'Marcos Aurélio Nunes' where id = 'a0000000-0000-0000-0000-000000000005';
update responsaveis set nome = 'Socorro Helena Bezerra' where id = 'a0000000-0000-0000-0000-000000000006';
update responsaveis set nome = 'Antônio Carlos Rego' where id = 'a0000000-0000-0000-0000-000000000007';
update responsaveis set nome = 'Patrícia Gurgel Aragão' where id = 'a0000000-0000-0000-0000-000000000008';
update responsaveis set nome = 'Raimundo Nonato Filho' where id = 'a0000000-0000-0000-0000-000000000009';

-- O login por link mágico depende de auth.identities, não só de
-- auth.users. Sem uma linha aqui (provider 'email'), o admin da GoTrue
-- tenta "criar" a identidade a cada tentativa de link e colide com a
-- constraint de e-mail único — 500 em vez de link. Só o próprio GoTrue
-- popula `identities` no signup normal; aqui reproduzimos à mão.
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users
where id in (
  'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000009'
);

-- --------------------------------------------------------------------------
-- Atletas nomeados (26) — inseridos no estado em que podem nascer sem
-- gatilho reclamar. 'ativo' exige consentimento vigente (gatilho
-- atletas_exigir_consentimento), então todo atleta que vai terminar 'ativo'
-- ou 'suspenso' nasce como 'aguardando_consentimento' e só sobe depois de o
-- consentimento existir — ver os blocos mais abaixo. 'rascunho',
-- 'aguardando_consentimento' (sem promoção) e 'removido' nascem já no
-- estado final, porque nada disso passa pelo gatilho de consentimento.
-- --------------------------------------------------------------------------

-- Família de Erivan Costa Lima (responsavel.multiplos@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Kadu', 'Sub-9', 'Ala', 'Destro', null, null, null, 'CE', null, 'rascunho'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Bira', 'Sub-11', 'Pivô', 'Canhoto', 141, 33.40, null, 'CE', 'c0000000-0000-0000-0000-000000000001', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Manu', 'Sub-13', 'Fixo', 'Destro', 153, 43.20, null, 'CE', null, 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'DL', 'Sub-15', 'Goleiro', 'Ambos', 168, 55.00, null, 'CE', 'c0000000-0000-0000-0000-000000000002', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'Miguelzinho', 'Sub-7', null, null, null, null, null, 'CE', null, 'removido');

-- Família de Adriana Nascimento Freire (responsavel.dois@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002',
   'Yaya', 'Sub-10', 'Ala', 'Destro', null, null, null, 'CE', null, 'rascunho'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002',
   'JP', 'Sub-14', 'Goleiro', 'Ambos', 161, 48.60, null, 'CE', null, 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002',
   'Lica', 'Sub-16', 'Pivô', 'Destro', null, null, null, 'CE', 'c0000000-0000-0000-0000-000000000005', 'aguardando_consentimento');

-- Família de Cícero Wagner Pontes (responsavel.solo@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003',
   'Gabigol Cearense', 'Sub-12', 'Fixo', 'Canhoto', 148, 39.50, null, 'CE', null, 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003',
   'Rafinha', 'Sub-18', 'Ala', 'Destro', 174, 66.00, null, 'CE', 'c0000000-0000-0000-0000-000000000006', 'aguardando_consentimento');

-- Família de Fabiana Melo Rocha (responsavel.gemeos@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000004',
   'Bibi', 'Sub-11', 'Ala', 'Destro', 139, 31.00, null, 'CE', 'c0000000-0000-0000-0000-000000000008', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000004',
   'Duda', 'Sub-11', 'Fixo', 'Canhoto', 137, 30.20, null, 'CE', 'c0000000-0000-0000-0000-000000000008', 'aguardando_consentimento');

-- Família de Marcos Aurélio Nunes (responsavel.avaliacoes@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000005',
   'Théozinho', 'Sub-19', 'Fixo', 'Destro', 179, 71.00, null, 'CE', 'c0000000-0000-0000-0000-000000000003', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000005',
   'Nardinho', 'Sub-20', 'Pivô', 'Canhoto', 181, 75.50, null, 'CE', 'c0000000-0000-0000-0000-000000000004', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000005',
   'Bebeto', 'Sub-16', 'Ala', 'Destro', 163, 52.00, null, 'CE', 'c0000000-0000-0000-0000-000000000007', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000005',
   'Coió', 'Sub-8', 'Pivô', 'Destro', null, null, null, 'CE', null, 'aguardando_consentimento');

-- Família de Socorro Helena Bezerra (responsavel.interior@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000006',
   'Vaqueirinho', 'Sub-17', 'Ala', 'Destro', 172, 64.00, null, 'CE', 'c0000000-0000-0000-0000-000000000011', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000006',
   'Estrelinha', 'Sub-13', 'Pivô', 'Canhoto', 150, 40.50, null, 'CE', 'c0000000-0000-0000-0000-000000000012', 'aguardando_consentimento');

-- Família de Antônio Carlos Rego (responsavel.fora_ceara@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000007',
   'Rego Jr', 'Sub-15', 'Fixo', 'Destro', 166, 56.00, null, 'PE', null, 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000007',
   'Carlinhos', 'Sub-9', 'Ala', 'Destro', null, null, null, 'RN', null, 'aguardando_consentimento');

-- Família de Patrícia Gurgel Aragão (responsavel.feminino@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000008',
   'Guerreira', 'Sub-14', 'Ala', 'Destro', 158, 46.00, null, 'CE', 'c0000000-0000-0000-0000-000000000010', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000008',
   'Sereia', 'Sub-12', 'Pivô', 'Canhoto', 146, 38.00, null, 'CE', 'c0000000-0000-0000-0000-000000000010', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000008',
   'Furacão', 'Sub-18', 'Fixo', 'Destro', null, null, null, 'CE', null, 'rascunho');

-- Família de Raimundo Nonato Filho (responsavel.sem_escolinha@exemplo.test)
insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
values
  ('b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000009',
   'Nonatinho', 'Sub-10', 'Ala', 'Destro', 128, 26.00, null, 'CE', null, 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000009',
   'Painho Jr', 'Sub-19', 'Goleiro', 'Ambos', 182, 74.00, null, 'CE', null, 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000009',
   'Buiu', 'Sub-7', null, null, null, null, null, 'CE', null, 'removido');

-- --------------------------------------------------------------------------
-- Identificação — nome completo e data de nascimento para os 26 nomeados,
-- como o olheiro verificado enxergaria. `contato_responsavel` repete o
-- telefone da família.
-- --------------------------------------------------------------------------

insert into atleta_identificacao (atleta_id, nome_completo, data_nascimento, cidade, contato_responsavel)
values
  ('b0000000-0000-0000-0000-000000000001', 'Kauê Ferreira Lima', '2017-03-14', 'Fortaleza', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000002', 'Vitor Marreira Sousa', '2015-07-02', 'Maracanaú', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000003', 'Emanuel Costa Rocha', '2013-11-20', 'Fortaleza', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000004', 'Davi Lucca Pereira Lima', '2011-02-08', 'Eusébio', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000005', 'Miguel Barros Lima', '2019-09-17', 'Fortaleza', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000006', 'Yasmin Freire Bezerra', '2016-04-11', 'Fortaleza', '+55 85 99011-1234'),
  ('b0000000-0000-0000-0000-000000000007', 'João Pedro Freire Lima', '2012-08-19', 'Fortaleza', '+55 85 99011-1234'),
  ('b0000000-0000-0000-0000-000000000008', 'Alícia Freire Nogueira', '2010-06-27', 'Juazeiro do Norte', '+55 88 99011-1234'),
  ('b0000000-0000-0000-0000-000000000009', 'Gabriel Pontes Aguiar', '2014-10-05', 'Quixadá', '+55 88 99055-5678'),
  ('b0000000-0000-0000-0000-000000000010', 'Rafael Pontes Dutra', '2008-03-22', 'Quixadá', '+55 88 99055-5678'),
  ('b0000000-0000-0000-0000-000000000011', 'Beatriz Melo Rocha', '2015-05-12', 'Maranguape', '+55 85 98123-4567'),
  ('b0000000-0000-0000-0000-000000000012', 'Eduarda Melo Rocha', '2015-09-30', 'Maranguape', '+55 85 98123-4567'),
  ('b0000000-0000-0000-0000-000000000013', 'Théo Aurélio Nunes', '2007-01-25', 'Horizonte', '+55 85 98322-7744'),
  ('b0000000-0000-0000-0000-000000000014', 'Bernardo Nunes Sales', '2006-12-04', 'Eusébio', '+55 85 98322-7744'),
  ('b0000000-0000-0000-0000-000000000015', 'Roberto Nunes Filho', '2010-06-18', 'Maracanaú', '+55 85 98322-7744'),
  ('b0000000-0000-0000-0000-000000000016', 'Francisco Nunes Neto', '2018-09-02', 'Maracanaú', '+55 85 98322-7744'),
  ('b0000000-0000-0000-0000-000000000017', 'José Wellington Bezerra Filho', '2009-08-14', 'Sobral', '+55 88 99234-5678'),
  ('b0000000-0000-0000-0000-000000000018', 'Maria Clara Bezerra Lopes', '2013-02-27', 'Crato', '+55 88 99234-5678'),
  ('b0000000-0000-0000-0000-000000000019', 'Antônio Carlos Rego Filho', '2011-05-19', 'Recife', '+55 81 99876-5432'),
  ('b0000000-0000-0000-0000-000000000020', 'Carlos Eduardo Rego Silva', '2017-01-08', 'Natal', '+55 84 99876-1234'),
  ('b0000000-0000-0000-0000-000000000021', 'Maria Eduarda Gurgel Aragão', '2012-03-03', 'Fortaleza', '+55 85 99765-4321'),
  ('b0000000-0000-0000-0000-000000000022', 'Isadora Gurgel Aragão', '2014-07-21', 'Fortaleza', '+55 85 99765-4321'),
  ('b0000000-0000-0000-0000-000000000023', 'Lucas Gurgel Aragão', '2008-11-11', 'Fortaleza', '+55 85 99765-4321'),
  ('b0000000-0000-0000-0000-000000000024', 'Raimundo Nonato Neto', '2016-06-06', 'Fortaleza', '+55 85 98456-7890'),
  ('b0000000-0000-0000-0000-000000000025', 'José Raimundo Filho', '2007-10-10', 'Fortaleza', '+55 85 98456-7890'),
  ('b0000000-0000-0000-0000-000000000026', 'Antônio Raimundo Neto', '2019-01-01', 'Fortaleza', '+55 85 98456-7890');

-- --------------------------------------------------------------------------
-- Saúde — só numa amostra dos que vão ficar ativos, para o painel ter algo
-- a mostrar sem precisar disso em todo mundo. Um deles sem histórico de
-- lesão, de propósito, para a tela não presumir que o campo vem sempre
-- preenchido.
-- --------------------------------------------------------------------------

insert into atleta_saude (atleta_id, avaliacao_postural, massa_magra_pct, historico_lesao)
values
  ('b0000000-0000-0000-0000-000000000003',
   '{"observacao": "Leve assimetria de ombro, sem impacto funcional"}', 38.90, null),
  ('b0000000-0000-0000-0000-000000000004',
   '{"observacao": "Postura adequada"}', 41.20, 'Entorse de tornozelo leve em 2025, recuperado'),
  ('b0000000-0000-0000-0000-000000000007',
   '{"observacao": "Postura adequada"}', 39.75, null),
  ('b0000000-0000-0000-0000-000000000011',
   '{"observacao": "Boa mobilidade geral"}', 35.60, null),
  ('b0000000-0000-0000-0000-000000000014',
   '{"observacao": "Boa mobilidade de quadril"}', 44.60, null),
  ('b0000000-0000-0000-0000-000000000017',
   '{"observacao": "Acompanhar flexibilidade posterior de coxa"}', 43.10, 'Fadiga muscular leve após período de treino intenso em 2026, sem afastamento');

-- --------------------------------------------------------------------------
-- Consentimentos + ativação dos 16 nomeados que ficam 'ativo'. O gatilho
-- atletas_exigir_consentimento só deixa o update de estado passar depois de
-- o consentimento já existir, então a ordem importa: primeiro o
-- consentimento, depois o estado.
-- --------------------------------------------------------------------------

insert into consentimentos (atleta_id, responsavel_id, documento_url, versao_termo)
values
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'termos/seed/manu.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'termos/seed/dl.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'termos/seed/jp.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'termos/seed/gabigol.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000004', 'termos/seed/bibi.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000004', 'termos/seed/duda.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000005', 'termos/seed/theozinho.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000005', 'termos/seed/nardinho.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000005', 'termos/seed/bebeto.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000006', 'termos/seed/vaqueirinho.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000006', 'termos/seed/estrelinha.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000007', 'termos/seed/regojr.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000008', 'termos/seed/guerreira.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000008', 'termos/seed/sereia.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000009', 'termos/seed/nonatinho.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000009', 'termos/seed/painhojr.pdf', '2026-08-v1');

update atletas set estado = 'ativo'
where id in (
  'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000009',
  'b0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000012',
  'b0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000014',
  'b0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000017',
  'b0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000019',
  'b0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000022',
  'b0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000025'
);

-- --------------------------------------------------------------------------
-- Suspenso por revogação — Rafinha (Cícero) passa primeiro por 'ativo' com
-- consentimento vigente e é revogado na sequência. O gatilho
-- derrubar_ao_revogar faz o trabalho de derrubar o perfil para 'suspenso'
-- sozinho — não setamos o estado à mão.
-- --------------------------------------------------------------------------

insert into consentimentos (atleta_id, responsavel_id, documento_url, versao_termo)
values ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'termos/seed/rafinha.pdf', '2026-08-v1');

update atletas set estado = 'ativo' where id = 'b0000000-0000-0000-0000-000000000010';

update consentimentos set revogado_em = now()
where atleta_id = 'b0000000-0000-0000-0000-000000000010' and revogado_em is null;

-- ==========================================================================
-- RUBRICA v1 (ESBOÇO) — o conteúdo real (itens, escala, âncoras) é trabalho
-- do Flávio e ainda não existe. Os 12 itens abaixo (3 por eixo) são um
-- esboço plausível só para dar o que avaliar durante o smoke test manual —
-- não é o método final do produto.
-- ==========================================================================

insert into rubricas (versao, itens, ativa)
values (
  'v1',
  '[
    {
      "eixo": "tecnico", "chave": "passe_recepcao", "rotulo": "Passe e recepção",
      "ancoras": {
        "1": "Erra passes simples e perde a bola na recepção com frequência",
        "2": "Executa passe e recepção parado, sem pressão de marcação",
        "3": "Executa passe e recepção sob marcação leve, em ritmo de jogo",
        "4": "Executa com precisão sob pressão, em velocidade e com os dois pés",
        "5": "Executa sob pressão e ainda cria vantagem para quem recebe (passe que rompe linha)"
      }
    },
    {
      "eixo": "tecnico", "chave": "drible_protecao_bola", "rotulo": "Drible e proteção de bola",
      "ancoras": {
        "1": "Perde a bola no primeiro contato do adversário",
        "2": "Protege a bola parado, de costas para a marcação",
        "3": "Protege a bola e sai jogando sob marcação em ritmo baixo",
        "4": "Dribla e protege a bola em velocidade, trocando de perna",
        "5": "Dribla sob pressão e desequilibra a defesa adversária"
      }
    },
    {
      "eixo": "tecnico", "chave": "finalizacao", "rotulo": "Finalização",
      "ancoras": {
        "1": "Não ameaça o gol — finalização sem direção ou força",
        "2": "Finaliza parado, com pouca variação de perna ou ângulo",
        "3": "Finaliza em movimento, com noção de canto",
        "4": "Finaliza em velocidade, com as duas pernas, em situações variadas",
        "5": "Finaliza com eficiência mesmo sob pressão e em ângulos difíceis"
      }
    },
    {
      "eixo": "fisico", "chave": "velocidade_deslocamento", "rotulo": "Velocidade de deslocamento",
      "ancoras": {
        "1": "Chega atrasado nas disputas por lentidão de deslocamento",
        "2": "Acompanha o ritmo do jogo em trechos curtos",
        "3": "Mantém boa velocidade em transições ofensivas e defensivas",
        "4": "Destaca-se em corridas de recuperação e apoio ofensivo",
        "5": "Velocidade acima da média para a categoria, decide jogadas sozinho"
      }
    },
    {
      "eixo": "fisico", "chave": "resistencia", "rotulo": "Resistência",
      "ancoras": {
        "1": "Cai de rendimento visivelmente antes da metade do jogo ou treino",
        "2": "Mantém o rendimento em blocos curtos, com quedas frequentes",
        "3": "Sustenta o ritmo por boa parte do jogo, com queda no fim",
        "4": "Sustenta intensidade alta do início ao fim da partida",
        "5": "Mantém alta intensidade mesmo em prorrogação ou sequência de jogos"
      }
    },
    {
      "eixo": "fisico", "chave": "agilidade_mudanca_direcao", "rotulo": "Agilidade e mudança de direção",
      "ancoras": {
        "1": "Movimentos rígidos, demora para mudar de direção",
        "2": "Muda de direção em ritmo baixo, sem perder o equilíbrio",
        "3": "Muda de direção em ritmo de jogo, com equilíbrio",
        "4": "Muda de direção em alta velocidade sem perder controle de bola",
        "5": "Agilidade referência na categoria — decide em espaços curtos"
      }
    },
    {
      "eixo": "tatico", "chave": "leitura_jogo", "rotulo": "Leitura de jogo",
      "ancoras": {
        "1": "Não antecipa jogadas, reage tarde às situações",
        "2": "Entende situações simples, mas erra em momentos de pressão",
        "3": "Lê o jogo e toma decisões corretas na maior parte do tempo",
        "4": "Antecipa jogadas e ajusta posicionamento antes do lance acontecer",
        "5": "Referência tática em quadra — organiza os colegas em tempo real"
      }
    },
    {
      "eixo": "tatico", "chave": "posicionamento_sem_bola", "rotulo": "Posicionamento sem a bola",
      "ancoras": {
        "1": "Fica estático, sem procurar espaço ou linha de passe",
        "2": "Movimenta-se pouco, ocupa espaço de forma previsível",
        "3": "Procura espaço e se oferece como opção de passe",
        "4": "Movimenta-se para criar linhas de passe e desmarcar companheiros",
        "5": "Cria superioridade numérica com movimentação constante e inteligente"
      }
    },
    {
      "eixo": "tatico", "chave": "transicao_ataque_defesa", "rotulo": "Transição ataque-defesa",
      "ancoras": {
        "1": "Demora a voltar para a marcação depois de perder a bola",
        "2": "Volta para a defesa, mas em ritmo lento",
        "3": "Transita em ritmo adequado entre ataque e defesa",
        "4": "Transita rapidamente e já chega posicionado taticamente",
        "5": "Lidera a transição, orienta companheiros na troca de fase"
      }
    },
    {
      "eixo": "comportamental", "chave": "atitude_competitiva", "rotulo": "Atitude competitiva",
      "ancoras": {
        "1": "Desiste de disputas e demonstra pouco empenho",
        "2": "Compete de forma irregular, varia conforme o placar",
        "3": "Compete com empenho constante durante o jogo ou treino",
        "4": "Mantém intensidade e postura competitiva mesmo em desvantagem",
        "5": "Referência de postura competitiva — contagia o time"
      }
    },
    {
      "eixo": "comportamental", "chave": "trabalho_em_equipe", "rotulo": "Trabalho em equipe",
      "ancoras": {
        "1": "Joga isolado, não busca combinações com companheiros",
        "2": "Colabora quando solicitado, com pouca iniciativa",
        "3": "Busca combinações e ajuda companheiros nas duas fases",
        "4": "Prioriza o coletivo e facilita o jogo dos companheiros",
        "5": "Articula o time — os companheiros rendem mais perto dele"
      }
    },
    {
      "eixo": "comportamental", "chave": "disciplina_tatica_escuta", "rotulo": "Disciplina tática e escuta",
      "ancoras": {
        "1": "Ignora orientações e repete os mesmos erros",
        "2": "Segue orientações simples, mas esquece sob pressão",
        "3": "Segue as orientações combinadas na maior parte do jogo",
        "4": "Aplica orientações com consistência, mesmo sob pressão",
        "5": "Corrige-se sozinho e ajuda a manter o combinado entre os colegas"
      }
    }
  ]'::jsonb,
  true
);

-- --------------------------------------------------------------------------
-- Avaliadores (4) — usuários autenticados que assinam os laudos abaixo.
-- Nesta rodada não existe credenciamento (ver AGENTS/brief da rodada):
-- qualquer usuário autenticado pode avaliar, então isto é só um exemplo de
-- contas que entrariam pelo mesmo link mágico. Mesmo padrão dos
-- responsáveis acima, para não colidir com o comportamento da GoTrue local.
-- --------------------------------------------------------------------------

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, created_at, updated_at
)
values
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'avaliador.tecnico@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'avaliadora.camila@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'avaliador.everton@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
   'avaliadora.larissa@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now());

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users
where id in (
  'e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004'
);

-- --------------------------------------------------------------------------
-- Profissionais (5) — a página pública de quem assina (migration 0010).
-- Os 4 primeiros são as contas de avaliador acima, com credencial e bio
-- plausíveis (professor de educação física, ex-atleta, técnico de base —
-- todos fictícios). O quinto, Flávio Barbosa, é a autoridade citada na
-- home ("Quem assina"): não tem conta de login nesta rodada
-- (`user_id` nulo) e nenhum laudo assinado no seed — a página dele já
-- existe, cuidada à mão, em `/profissional/flavio` (rota estática, que o
-- Next.js resolve antes da rota dinâmica `/profissional/[slug]` para o
-- mesmo caminho — ver AGENTS/brief da rodada e o relatório desta tarefa).
-- Dados só do que já está escrito em docs/flavio-barbosa-bio.md e em
-- app/profissional/flavio/data.ts — nada inventado.
-- --------------------------------------------------------------------------

insert into profissionais (id, user_id, nome, slug, credencial, cidade, estado_uf, bio, ativo, atua_desde)
values
  ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
   'Ricardo Bezerra', 'ricardo-bezerra',
   'Educação Física — UECE · ex-atleta de futsal',
   'Fortaleza', 'CE',
   'Professor de Educação Física formado pela UECE, jogou futsal de base e adulto em clubes de Fortaleza antes de migrar para a avaliação técnica. Aplica a rubrica do Futsal College desde 2018, presencial e por vídeo.',
   true, '2018-03-01'),
  ('d0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002',
   'Camila Studart', 'camila-studart',
   'Educação Física — UFC · técnica de categorias de base',
   'Fortaleza', 'CE',
   'Técnica de categorias de base há mais de dez anos, com passagem por escolinhas da região metropolitana de Fortaleza. Formada em Educação Física pela UFC, com foco em desenvolvimento tático de Sub-9 a Sub-15.',
   true, '2019-08-15'),
  ('d0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003',
   'Everton Aragão Filho', 'everton-aragao-filho',
   'Ex-atleta profissional de futsal · técnico de base',
   'Maracanaú', 'CE',
   'Ex-atleta profissional de futsal no Ceará e no Nordeste, hoje técnico de categorias de base em Maracanaú. Traz para a avaliação técnica a régua de quem viveu o jogo adulto de alto nível.',
   true, '2016-02-10'),
  ('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004',
   'Larissa Monteiro Cid', 'larissa-monteiro-cid',
   'Educação Física — Unifor · avaliação física e postural',
   'Fortaleza', 'CE',
   'Professora de Educação Física pela Unifor, especializada em avaliação física e postural de atletas em formação. Entrou na plataforma em 2020 e concentra boa parte das avaliações por análise de vídeo.',
   true, '2020-05-04'),
  ('d0000000-0000-0000-0000-000000000005', null,
   'Flávio Barbosa', 'flavio',
   'Técnico · Futsal Sesc Ceará',
   'Fortaleza', 'CE',
   'Flávio Barbosa venceu treze títulos em quatorze anos de futsal cearense — cinco Campeonatos Cearenses adultos e três do Nordeste, por sete clubes. Hoje treina as seleções de base do Sesc Ceará, e é campeão mundial de futebol de salão Sub-13 como técnico.',
   -- `atua_desde` aqui é o trabalho de BASE, não a carreira de atleta. A bio
   -- verificada registra que ele começou a formar o grupo do Sesc em 2021; foi
   -- esse grupo que venceu a Liga Ceará Sub-20 em 2023. Usar 2006 (primeiro
   -- título dele COMO ATLETA) faria a listagem de profissionais afirmar que
   -- ele avalia desde 2006, o que não está escrito em lugar nenhum.
   true, '2021-01-01');

-- --------------------------------------------------------------------------
-- Laudos publicados nos atletas nomeados (17) — Manu, Théozinho, Nardinho e
-- Bibi têm 2 laudos cada, em datas diferentes, para dar noção de evolução
-- na ficha pública. Gabigol Cearense, Sereia e Painho Jr ficam ativos e SEM
-- laudo de propósito, para exercitar o estado "ainda sem avaliação
-- publicada". Notas variadas — nada de nota 5 em tudo.
-- --------------------------------------------------------------------------

insert into laudos
  (atleta_id, avaliador_id, avaliador_nome, rubrica_versao, contexto, notas, texto, publicado_em)
values
  ( -- Manu, Sub-13, ativo — avaliação mais antiga
    'b0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000001', 'Prof. Ricardo Bezerra', 'v1', 'presencial',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 2, "finalizacao": 2,
      "velocidade_deslocamento": 3, "resistencia": 3, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 2, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 2,
      "atitude_competitiva": 4, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Primeira avaliação de Manu na plataforma. Boa atitude competitiva; passe e finalização ainda inconsistentes sob pressão. Ponto de partida claro para acompanhar a evolução nas próximas avaliações.',
    now() - interval '95 days'
  ),
  ( -- Manu — avaliação mais recente, evolução
    'b0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000001', 'Prof. Ricardo Bezerra', 'v1', 'presencial',
    '{
      "passe_recepcao": 4, "drible_protecao_bola": 3, "finalizacao": 3,
      "velocidade_deslocamento": 4, "resistencia": 3, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 3, "posicionamento_sem_bola": 4, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 5, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 4
    }'::jsonb,
    'Manu se destaca pela intensidade e pela movimentação sem bola. O passe sob pressão evoluiu bastante desde a última avaliação; a finalização ainda varia entre treino e jogo — vale trabalhar repertório de conclusão.',
    now() - interval '12 days'
  ),
  ( -- DL, Sub-15, ativo (goleiro)
    'b0000000-0000-0000-0000-000000000004',
    'e0000000-0000-0000-0000-000000000001', 'Prof. Ricardo Bezerra', 'v1', 'presencial',
    '{
      "passe_recepcao": 4, "drible_protecao_bola": 2, "finalizacao": 2,
      "velocidade_deslocamento": 3, "resistencia": 4, "agilidade_mudanca_direcao": 5,
      "leitura_jogo": 5, "posicionamento_sem_bola": 4, "transicao_ataque_defesa": 4,
      "atitude_competitiva": 4, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 5
    }'::jsonb,
    'Leitura de jogo muito acima da categoria — organiza a linha defensiva com clareza e antecipa cruzamentos com segurança. Itens de drible e finalização pesam pouco na função de goleiro; ainda assim, valem para o histórico completo do atleta.',
    now() - interval '7 days'
  ),
  ( -- JP, Sub-14, ativo (goleiro)
    'b0000000-0000-0000-0000-000000000007',
    'e0000000-0000-0000-0000-000000000002', 'Profa. Camila Studart', 'v1', 'presencial',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 2, "finalizacao": 2,
      "velocidade_deslocamento": 3, "resistencia": 3, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 3, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 4, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Primeira avaliação de JP na plataforma. Boa base de agilidade; ainda em desenvolvimento na saída jogando sob pressão. Reavaliar em 3 a 4 meses para acompanhar evolução.',
    now() - interval '1 day'
  ),
  ( -- Bibi — avaliação mais antiga
    'b0000000-0000-0000-0000-000000000011',
    'e0000000-0000-0000-0000-000000000003', 'Prof. Everton Aragão Filho', 'v1', 'presencial',
    '{
      "passe_recepcao": 2, "drible_protecao_bola": 3, "finalizacao": 2,
      "velocidade_deslocamento": 3, "resistencia": 2, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 2, "posicionamento_sem_bola": 2, "transicao_ataque_defesa": 2,
      "atitude_competitiva": 3, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Bibi chega à escolinha com bom drible individual, mas ainda joga muito sozinha — pouca combinação com as companheiras. Resistência é o ponto a trabalhar primeiro.',
    now() - interval '110 days'
  ),
  ( -- Bibi — avaliação recente, evolução
    'b0000000-0000-0000-0000-000000000011',
    'e0000000-0000-0000-0000-000000000003', 'Prof. Everton Aragão Filho', 'v1', 'presencial',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 4, "finalizacao": 3,
      "velocidade_deslocamento": 4, "resistencia": 3, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 3, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 4, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 4
    }'::jsonb,
    'Evolução clara na resistência e no jogo coletivo desde a última avaliação. O drible continua o ponto mais forte; passe sob pressão é o próximo degrau.',
    now() - interval '15 days'
  ),
  ( -- Duda
    'b0000000-0000-0000-0000-000000000012',
    'e0000000-0000-0000-0000-000000000003', 'Prof. Everton Aragão Filho', 'v1', 'presencial',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 2, "finalizacao": 3,
      "velocidade_deslocamento": 3, "resistencia": 3, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 3, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 2,
      "atitude_competitiva": 4, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Duda é a mais organizada taticamente das duas irmãs — erra pouco no posicionamento. Transição defensiva ainda precisa de mais intensidade.',
    now() - interval '15 days'
  ),
  ( -- Théozinho — avaliação mais antiga
    'b0000000-0000-0000-0000-000000000013',
    'e0000000-0000-0000-0000-000000000001', 'Prof. Ricardo Bezerra', 'v1', 'analise_video',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 3, "finalizacao": 3,
      "velocidade_deslocamento": 3, "resistencia": 3, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 3, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 4, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Avaliação inicial a partir de vídeo de jogo cedido pela escolinha. Perfil regular em todos os eixos, sem destaque nem fragilidade evidente ainda.',
    now() - interval '60 days'
  ),
  ( -- Théozinho — avaliação recente, evolução
    'b0000000-0000-0000-0000-000000000013',
    'e0000000-0000-0000-0000-000000000001', 'Prof. Ricardo Bezerra', 'v1', 'presencial',
    '{
      "passe_recepcao": 4, "drible_protecao_bola": 4, "finalizacao": 4,
      "velocidade_deslocamento": 4, "resistencia": 4, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 4, "posicionamento_sem_bola": 4, "transicao_ataque_defesa": 4,
      "atitude_competitiva": 5, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 4
    }'::jsonb,
    'Salto de desempenho consistente em quase todos os eixos desde a última avaliação. Théozinho já se apresenta como referência de atitude competitiva no time da Sub-19.',
    now() - interval '5 days'
  ),
  ( -- Nardinho — avaliação mais antiga
    'b0000000-0000-0000-0000-000000000014',
    'e0000000-0000-0000-0000-000000000004', 'Profa. Larissa Monteiro Cid', 'v1', 'presencial',
    '{
      "passe_recepcao": 4, "drible_protecao_bola": 3, "finalizacao": 4,
      "velocidade_deslocamento": 3, "resistencia": 3, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 4, "posicionamento_sem_bola": 4, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 4, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Nardinho já mostra boa finalização com as duas pernas nesta primeira avaliação. Resistência abaixo do restante do perfil — indicado reforçar preparo físico.',
    now() - interval '45 days'
  ),
  ( -- Nardinho — avaliação recente
    'b0000000-0000-0000-0000-000000000014',
    'e0000000-0000-0000-0000-000000000004', 'Profa. Larissa Monteiro Cid', 'v1', 'analise_video',
    '{
      "passe_recepcao": 5, "drible_protecao_bola": 4, "finalizacao": 5,
      "velocidade_deslocamento": 4, "resistencia": 4, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 5, "posicionamento_sem_bola": 5, "transicao_ataque_defesa": 4,
      "atitude_competitiva": 5, "trabalho_em_equipe": 5, "disciplina_tatica_escuta": 4
    }'::jsonb,
    'Avaliação feita a partir de três vídeos de jogo enviados pelo clube. Nardinho finaliza com as duas pernas e decide bem em situação de superioridade numérica — resistência já em outro patamar desde a avaliação anterior.',
    now() - interval '3 days'
  ),
  ( -- Bebeto
    'b0000000-0000-0000-0000-000000000015',
    'e0000000-0000-0000-0000-000000000004', 'Profa. Larissa Monteiro Cid', 'v1', 'presencial',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 3, "finalizacao": 2,
      "velocidade_deslocamento": 4, "resistencia": 3, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 3, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 3, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Bebeto usa bem a velocidade nas duas fases do jogo. Finalização é o ponto mais distante do resto do perfil — trabalhar repertório de conclusão em velocidade.',
    now() - interval '20 days'
  ),
  ( -- Vaqueirinho
    'b0000000-0000-0000-0000-000000000017',
    'e0000000-0000-0000-0000-000000000002', 'Profa. Camila Studart', 'v1', 'presencial',
    '{
      "passe_recepcao": 4, "drible_protecao_bola": 4, "finalizacao": 3,
      "velocidade_deslocamento": 4, "resistencia": 4, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 4, "posicionamento_sem_bola": 4, "transicao_ataque_defesa": 4,
      "atitude_competitiva": 5, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 4
    }'::jsonb,
    'Perfil consistente em quase todos os eixos, com destaque para a atitude competitiva. Avaliação feita presencialmente durante visita à escolinha em Sobral.',
    now() - interval '30 days'
  ),
  ( -- Estrelinha
    'b0000000-0000-0000-0000-000000000018',
    'e0000000-0000-0000-0000-000000000002', 'Profa. Camila Studart', 'v1', 'presencial',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 3, "finalizacao": 4,
      "velocidade_deslocamento": 3, "resistencia": 3, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 3, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 2,
      "atitude_competitiva": 4, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Estrelinha finaliza melhor que a média da categoria, com boa noção de canto. Transição defensiva é o ponto a desenvolver — ainda demora a voltar para a marcação.',
    now() - interval '40 days'
  ),
  ( -- Rego Jr
    'b0000000-0000-0000-0000-000000000019',
    'e0000000-0000-0000-0000-000000000001', 'Prof. Ricardo Bezerra', 'v1', 'analise_video',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 3, "finalizacao": 3,
      "velocidade_deslocamento": 3, "resistencia": 2, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 3, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 3, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Avaliação por vídeo enviado pela família, de Recife. Perfil equilibrado, sem destaque; resistência é o eixo mais baixo do laudo.',
    now() - interval '25 days'
  ),
  ( -- Guerreira
    'b0000000-0000-0000-0000-000000000021',
    'e0000000-0000-0000-0000-000000000002', 'Profa. Camila Studart', 'v1', 'presencial',
    '{
      "passe_recepcao": 4, "drible_protecao_bola": 3, "finalizacao": 4,
      "velocidade_deslocamento": 4, "resistencia": 3, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 4, "posicionamento_sem_bola": 4, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 4, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 4
    }'::jsonb,
    'Guerreira finaliza com as duas pernas e lê bem o jogo para a categoria. Resistência é o único eixo abaixo do restante do perfil.',
    now() - interval '10 days'
  ),
  ( -- Nonatinho
    'b0000000-0000-0000-0000-000000000024',
    'e0000000-0000-0000-0000-000000000003', 'Prof. Everton Aragão Filho', 'v1', 'presencial',
    '{
      "passe_recepcao": 2, "drible_protecao_bola": 3, "finalizacao": 2,
      "velocidade_deslocamento": 3, "resistencia": 2, "agilidade_mudanca_direcao": 3,
      "leitura_jogo": 2, "posicionamento_sem_bola": 2, "transicao_ataque_defesa": 2,
      "atitude_competitiva": 3, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 2
    }'::jsonb,
    'Primeira avaliação de Nonatinho, perfil independente sem vínculo com escolinha. Boa base de drible; leitura de jogo e passe ainda em estágio inicial, típico da categoria.',
    now() - interval '18 days'
  );

-- ==========================================================================
-- ATLETAS EM MASSA (46) — dão volume à vitrine pública sem precisar de mais
-- de duas dezenas de personagens escritos à mão. Gerados via `generate_series`
-- (um responsável por vez, um atleta por vez dentro dele), com listas de
-- nomes, faixas de altura/peso por categoria e um punhado de estados
-- especiais espalhados pelo meio — o resto fica 'ativo', que é a maioria
-- pedida pelo brief. Funções auxiliares em `pg_temp` (limpas automaticamente
-- no fim da sessão) só para não repetir a mesma expressão de sorteio dez
-- vezes.
-- ==========================================================================

create function pg_temp.nota_aleatoria() returns int language sql as $$
  select (array[2,3,3,4,4,4,5,3,2])[1 + floor(random() * 9)::int];
$$;

create function pg_temp.notas_aleatorias() returns jsonb language plpgsql as $$
declare
  chaves text[] := array[
    'passe_recepcao','drible_protecao_bola','finalizacao',
    'velocidade_deslocamento','resistencia','agilidade_mudanca_direcao',
    'leitura_jogo','posicionamento_sem_bola','transicao_ataque_defesa',
    'atitude_competitiva','trabalho_em_equipe','disciplina_tatica_escuta'
  ];
  chave text;
  notas jsonb := '{}'::jsonb;
begin
  foreach chave in array chaves loop
    notas := notas || jsonb_build_object(chave, pg_temp.nota_aleatoria());
  end loop;
  return notas;
end;
$$;

create function pg_temp.telefone(ddd text) returns text language sql as $$
  select '+55 ' || ddd || ' 9' || lpad(floor(random() * 10000)::text, 4, '0')
    || '-' || lpad(floor(random() * 10000)::text, 4, '0');
$$;

do $$
declare
  -- Responsáveis em massa: nomes, e-mails e quantos filhos cada um tem
  -- (soma 46 — ver comentário no topo do arquivo).
  nomes_resp text[] := array[
    'Francisco Wagner Almeida', 'Maria do Socorro Teixeira', 'José Ribamar Cavalcante',
    'Ana Paula Siqueira Lima', 'Raimunda Nonata Vasconcelos', 'Pedro Henrique Bastos',
    'Luzia Helena Moraes', 'Antônia Fátima Rocha', 'Sebastião Carlos Nunes',
    'Francisca Edilene Costa', 'João Batista Farias', 'Rosângela Maria Pinheiro',
    'Expedito José Bezerra', 'Cleonice Aparecida Souza'
  ];
  filhos_por_resp int[] := array[4, 3, 3, 4, 3, 2, 4, 3, 3, 4, 3, 3, 4, 3];

  -- 46 posições; nas 12 marcadas (múltiplos de 4, mais a última) o estado
  -- sai da lista de "estados especiais" abaixo, ciclando; todas as outras
  -- ficam 'ativo'. rascunho×3, aguardando_consentimento×2, suspenso×4,
  -- removido×3 = 12, exatamente os "alguns em cada um dos outros quatro
  -- estados" pedidos pelo brief.
  indices_especiais int[] := array[4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 46];
  estados_especiais estado_perfil[] := array[
    'rascunho', 'aguardando_consentimento', 'suspenso', 'removido',
    'suspenso', 'rascunho', 'suspenso', 'removido',
    'aguardando_consentimento', 'suspenso', 'removido', 'rascunho'
  ]::estado_perfil[];

  apelidos text[] := array[
    'Pipoca', 'Formiguinha', 'Zezinho', 'Cabeção', 'Foguinho', 'Trovão', 'Sapão',
    'Passarinho', 'Corisco', 'Mazinho', 'Robinho', 'Onça', 'Coió Neto', 'Cajá',
    'Sertanejo', 'Gavião', 'Beiçola', 'Xerimbabo', 'Painho', 'Mainha', 'Ceará',
    'Vulcão', 'Pantera', 'Careca', 'Índio', 'Tico', 'Chapéu', 'Fera', 'Borboleta',
    'Aurora', 'Duna', 'Ventania', 'Faísca', 'Furacãozinho', 'Cometa', 'Sapeca',
    'Xuxu', 'Anjinho', 'Pé de Vento', 'Relâmpago', 'Curumim', 'Bochecha', 'Neném',
    'Ziriguidum', 'Papito', 'Bolinha', 'Pixote', 'Sabiá', 'Beija-flor', 'Trevo'
  ];
  primeiros_nomes text[] := array[
    'Kauê', 'Miguel', 'Davi', 'Arthur', 'Heitor', 'Théo', 'Pedro', 'Gabriel',
    'Bernardo', 'Lorenzo', 'Enzo', 'Matheus', 'Rafael', 'Vitor', 'Guilherme',
    'Nicolas', 'João', 'Bryan', 'Samuel', 'Lucas', 'Cauã', 'Erick', 'Yago',
    'Wesley', 'Renan', 'Alice', 'Sophia', 'Helena', 'Valentina', 'Laura',
    'Isabella', 'Manuela', 'Giovanna', 'Maria Clara', 'Maria Eduarda', 'Yasmin',
    'Beatriz', 'Lorena', 'Emanuelly', 'Ana Lívia', 'Rebeca', 'Vitória',
    'Alícia', 'Isadora', 'Larissa'
  ];
  sobrenomes text[] := array[
    'Aguiar', 'Bezerra', 'Rocha', 'Nogueira', 'Freire', 'Pontes', 'Sousa',
    'Ferreira', 'Lima', 'Costa', 'Correia', 'Melo', 'Aragão', 'Gurgel',
    'Nunes', 'Rego', 'Dutra', 'Barros', 'Sales', 'Cid', 'Studart', 'Monteiro',
    'Vasconcelos', 'Teixeira', 'Cavalcante'
  ];
  posicoes text[] := array['Ala', 'Ala', 'Ala', 'Fixo', 'Fixo', 'Fixo', 'Pivô', 'Pivô', 'Goleiro'];
  pes text[] := array['Destro', 'Destro', 'Destro', 'Canhoto', 'Ambos'];
  clubes_independentes text[] := array[
    'Furacão Futsal', 'Estrela Azul FC', 'Recreativo Bom Jardim', 'Unidos do Bairro Futsal', 'Amigos da Bola FC'
  ];

  -- Escolinhas (mesmos 13 IDs inseridos acima), com cidade — usada para o
  -- atleta vinculado nascer na mesma cidade da escolinha, em vez de sortear
  -- uma cidade qualquer sem relação.
  escolinha_ids uuid[] := array[
    'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000013'
  ];
  escolinha_cidades text[] := array[
    'Fortaleza', 'Fortaleza', 'Horizonte', 'Eusébio', 'Juazeiro do Norte', 'Quixadá',
    'Maracanaú', 'Maranguape', 'Caucaia', 'Fortaleza', 'Sobral', 'Crato', 'Icapuí'
  ];

  -- Alturas/pesos por categoria (índice 1 = Sub-7 … índice 14 = Sub-20),
  -- faixas plausíveis de crescimento infanto-juvenil.
  alturas_min int[] := array[110,115,120,125,130,136,142,150,155,160,163,165,166,167];
  alturas_max int[] := array[125,130,135,140,145,152,160,170,176,180,183,185,186,188];
  pesos_min numeric[] := array[18,20,22,24,27,30,34,38,42,46,50,52,54,55];
  pesos_max numeric[] := array[24,27,30,34,38,44,50,58,64,70,75,78,80,82];

  ufs_fora text[] := array['PE', 'RN', 'PI', 'BA', 'MA'];
  cidades_fora text[] := array['Recife', 'Natal', 'Teresina', 'Salvador', 'São Luís'];
  ddds_fora text[] := array['81', '84', '86', '71', '98'];

  textos_laudo text[] := array[
    '%1$s vem evoluindo dentro do esperado para a %2$s. Mantém boa postura em treino e responde bem às correções durante o jogo.',
    'Avaliação de %1$s mostra perfil equilibrado para a %2$s, sem destaque isolado — o trabalho agora é consistência entre os eixos.',
    '%1$s se destaca pela atitude competitiva mesmo em situações de desvantagem no placar. Os fundamentos técnicos seguem em desenvolvimento, normal para a %2$s.',
    'Boa leitura de jogo para a idade. %1$s ainda erra em decisões sob pressão, mas evolui a cada treino observado.',
    'Perfil físico compatível com a %2$s. %1$s responde bem a estímulos de velocidade e agilidade; passe sob pressão é o próximo passo.',
    '%1$s demonstra disciplina tática acima da média da %2$s, seguindo bem as orientações combinadas em quadra.',
    'Avaliação de rotina de %1$s na %2$s — sem alteração relevante frente ao perfil esperado para a categoria.',
    '%1$s tem boa base técnica, mas ainda joga isolado — trabalho em equipe é o eixo a priorizar nas próximas semanas.'
  ];

  -- Nomes dos avaliadores para o campo denormalizado avaliador_nome.
  avaliador_ids uuid[] := array[
    'e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004'
  ];
  avaliador_nomes text[] := array[
    'Prof. Ricardo Bezerra', 'Profa. Camila Studart', 'Prof. Everton Aragão Filho', 'Profa. Larissa Monteiro Cid'
  ];

  resp_id uuid;
  resp_idx int;
  filho_idx int;
  global_i int := 0;
  especial_idx int := 1;

  -- Prefixo v_ nas variáveis abaixo de propósito: sem ele, colidiriam com
  -- colunas de mesmo nome em atletas/atleta_identificacao/consentimentos/
  -- laudos, e o PL/pgSQL rejeitaria (ou pior, ambiguaria em silêncio) toda
  -- consulta que misturasse a variável com a tabela — o caso mais grave
  -- seria "where atleta_id = atleta_id" na revogação de consentimento, que
  -- teria comparado a coluna com ela mesma em vez de com o atleta sorteado.
  v_atleta_id uuid;
  numero_categoria int;
  v_categoria text;
  idx_categoria int;
  v_posicao text;
  pe text;
  altura int;
  peso numeric;
  escolinha uuid;
  clube text;
  uf text;
  v_cidade text;
  ddd text;
  estado_final estado_perfil;
  ano int;
  mes int;
  dia int;
  v_nome_completo text;
  v_apelido text;

  ativos_bulk uuid[] := array[]::uuid[];
  laudos_alvo uuid[];
  alvo uuid;
  avaliador_escolha int;
  dias_atras int;
  v_contexto contexto_avaliacao;
begin
  for resp_idx in 1 .. array_length(nomes_resp, 1) loop
    resp_id := gen_random_uuid();

    insert into auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, role, aud,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, reauthentication_token, created_at, updated_at
    ) values (
      resp_id, '00000000-0000-0000-0000-000000000000',
      format('familia.bulk%s@exemplo.test', lpad(resp_idx::text, 2, '0')),
      crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
      '', '', '', '', '', '', now(), now()
    );

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (resp_id::text, resp_id, jsonb_build_object('sub', resp_id::text, 'email', format('familia.bulk%s@exemplo.test', lpad(resp_idx::text, 2, '0'))), 'email', now(), now(), now());

    update responsaveis set nome = nomes_resp[resp_idx] where id = resp_id;

    for filho_idx in 1 .. filhos_por_resp[resp_idx] loop
      global_i := global_i + 1;

      -- Categoria: espalha pelas 14 categorias ao longo de toda a
      -- população em massa, não só dentro de uma família.
      idx_categoria := 1 + ((global_i - 1) % 14);
      numero_categoria := 6 + idx_categoria; -- 7..20
      v_categoria := 'Sub-' || numero_categoria;

      v_posicao := posicoes[1 + floor(random() * array_length(posicoes, 1))::int];
      pe := pes[1 + floor(random() * array_length(pes, 1))::int];

      if random() < 0.8 then
        altura := alturas_min[idx_categoria] + floor(random() * (alturas_max[idx_categoria] - alturas_min[idx_categoria] + 1))::int;
        peso := round((pesos_min[idx_categoria] + random() * (pesos_max[idx_categoria] - pesos_min[idx_categoria]))::numeric, 2);
      else
        altura := null;
        peso := null;
      end if;

      if random() < 0.7 then
        escolinha := escolinha_ids[1 + floor(random() * array_length(escolinha_ids, 1))::int];
      else
        escolinha := null;
      end if;

      if escolinha is null and random() < 0.3 then
        clube := clubes_independentes[1 + floor(random() * array_length(clubes_independentes, 1))::int];
      else
        clube := null;
      end if;

      if global_i % 8 = 0 then
        -- Um a cada oito nasce fora do Ceará, para o filtro de estado em
        -- /atletas ter o que filtrar além de CE.
        uf := ufs_fora[1 + ((global_i / 8 - 1) % array_length(ufs_fora, 1))];
        v_cidade := cidades_fora[1 + ((global_i / 8 - 1) % array_length(cidades_fora, 1))];
        ddd := ddds_fora[1 + ((global_i / 8 - 1) % array_length(ddds_fora, 1))];
        escolinha := null; -- escolinhas do seed são todas cearenses
      else
        uf := 'CE';
        ddd := case when random() < 0.7 then '85' else '88' end;
        if escolinha is not null then
          v_cidade := escolinha_cidades[array_position(escolinha_ids, escolinha)];
        else
          v_cidade := (array['Fortaleza', 'Caucaia', 'Maracanaú', 'Eusébio', 'Maranguape', 'Horizonte'])[1 + floor(random() * 6)::int];
        end if;
      end if;

      -- Estado final: 'ativo' na maioria; nos 12 índices marcados, sai da
      -- lista de estados especiais (ciclando).
      if global_i = any(indices_especiais) then
        estado_final := estados_especiais[especial_idx];
        especial_idx := especial_idx + 1;
      else
        estado_final := 'ativo';
      end if;

      -- Data de nascimento coerente com a categoria (idade aproximada
      -- numero-1, com 0 ou 1 ano de variação).
      ano := 2026 - (numero_categoria - 1) - floor(random() * 2)::int;
      mes := 1 + floor(random() * 12)::int;
      dia := 1 + floor(random() * 28)::int;

      v_apelido := apelidos[global_i];
      v_nome_completo := primeiros_nomes[1 + floor(random() * array_length(primeiros_nomes, 1))::int]
        || ' ' || sobrenomes[1 + floor(random() * array_length(sobrenomes, 1))::int]
        || ' ' || sobrenomes[1 + floor(random() * array_length(sobrenomes, 1))::int];

      v_atleta_id := gen_random_uuid();

      insert into atletas
        (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, escolinha_id, estado)
      values
        (v_atleta_id, resp_id, v_apelido, v_categoria, v_posicao, pe, altura, peso, clube, uf, escolinha,
         case when estado_final in ('ativo', 'suspenso') then 'aguardando_consentimento'::estado_perfil else estado_final end);

      insert into atleta_identificacao (atleta_id, nome_completo, data_nascimento, cidade, contato_responsavel)
      values (v_atleta_id, v_nome_completo, make_date(ano, mes, dia), v_cidade, pg_temp.telefone(ddd));

      if estado_final in ('ativo', 'suspenso') then
        insert into consentimentos (atleta_id, responsavel_id, documento_url, versao_termo)
        values (v_atleta_id, resp_id, format('termos/seed/bulk-%s.pdf', v_atleta_id), '2026-08-v1');

        update atletas set estado = 'ativo' where id = v_atleta_id;

        if estado_final = 'suspenso' then
          update consentimentos set revogado_em = now() - (floor(random() * 60)::int || ' days')::interval
          where atleta_id = v_atleta_id and revogado_em is null;
        else
          ativos_bulk := array_append(ativos_bulk, v_atleta_id);
        end if;
      end if;
    end loop;
  end loop;

  -- Laudos em cima de um terço, aproximadamente, dos ativos em massa —
  -- realista: nem todo atleta ativo tem avaliação publicada ainda.
  select array_agg(id) into laudos_alvo
  from (
    select unnest(ativos_bulk) as id order by random() limit 15
  ) escolhidos;

  if laudos_alvo is not null then
    foreach alvo in array laudos_alvo loop
      avaliador_escolha := 1 + floor(random() * 4)::int;
      dias_atras := 1 + floor(random() * 90)::int;
      v_contexto := case when random() < 0.65 then 'presencial' else 'analise_video' end;

      insert into laudos (atleta_id, avaliador_id, avaliador_nome, rubrica_versao, contexto, notas, texto, publicado_em)
      select
        alvo,
        avaliador_ids[avaliador_escolha],
        avaliador_nomes[avaliador_escolha],
        'v1',
        v_contexto,
        pg_temp.notas_aleatorias(),
        format(
          textos_laudo[1 + floor(random() * array_length(textos_laudo, 1))::int],
          a.apelido, a.categoria
        ),
        now() - (dias_atras || ' days')::interval
      from atletas a where a.id = alvo;
    end loop;
  end if;
end $$;

-- --------------------------------------------------------------------------
-- Liga todo laudo (nomeado e em massa) ao profissional correspondente —
-- um único update no fim, em vez de repetir `profissional_id` em cada uma
-- das dezenas de linhas de laudo acima. `avaliador_id` (conta de login) e
-- `profissionais.user_id` apontam para a mesma pessoa nos 4 avaliadores
-- deste seed, então o casamento é direto.
update laudos l
set profissional_id = p.id
from profissionais p
where p.user_id = l.avaliador_id and l.profissional_id is null;

