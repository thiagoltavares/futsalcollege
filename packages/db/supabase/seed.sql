-- Massa de dados para teste manual (smoke test na mão, sem Playwright).
--
-- Correção ao brief original: `responsaveis` NÃO recebe insert direto aqui.
-- Desde a migration 0004, um gatilho em `auth.users` (`on_auth_user_created`)
-- já cria a linha em `responsaveis` (com `nome` nulo) assim que o usuário é
-- inserido em `auth.users` — um insert explícito colidiria com a chave
-- primária. O nome de cada responsável é preenchido com `update`, no mesmo
-- padrão já usado pelas fixtures de `packages/db/src/rls.test.ts` e por este
-- próprio arquivo antes desta reescrita.
--
-- ==========================================================================
-- LOGIN (magic link / OTP) — abra http://127.0.0.1:54524 (Mailpit) para
-- pegar o link enviado, digitando o e-mail em /entrar:
-- ==========================================================================
--
--   responsavel.multiplos@exemplo.test
--     Erivan Costa Lima — 8 filhos. É o perfil principal para testar o
--     painel "cheio": cobre os 5 estados de perfil (rascunho, aguardando
--     consentimento, ativo, suspenso, removido), várias categorias
--     (Sub-7 a Sub-20) e as quatro posições. Tem filho com clube e sem,
--     com altura/peso e sem.
--
--   responsavel.dois@exemplo.test
--     Adriana Nascimento Freire — 3 filhos (um rascunho, um ativo, um
--     aguardando consentimento). Bom para testar um painel de tamanho médio
--     e confirmar que o painel de um responsável NUNCA mostra o filho de
--     outro (os apelidos de Erivan não podem aparecer aqui).
--
--   responsavel.solo@exemplo.test
--     Cícero Wagner Pontes — 2 filhos (um ativo, um suspenso por
--     revogação de consentimento). Painel enxuto, bom para testar o botão
--     "Revogar autorização" → efeito em cascata (o filho suspenso já chega
--     pronto para mostrar como fica a tela depois da revogação; o ativo
--     serve para revogar na mão durante o teste, se quiser).
--
-- Todos os três entram por link mágico (sem senha). `email_confirmed_at` já
-- vem preenchido, então o OTP local funciona de primeira.
--
-- ==========================================================================
-- ATLETAS — 13 ao todo, cobrindo os 5 estados de perfil, categorias de
-- Sub-7 a Sub-20, as quatro posições, com e sem clube, com e sem
-- altura/peso. Nomes e apelidos fictícios, mas no estilo do futsal de base
-- cearense (clubes citados também são fictícios ou lendas locais livres,
-- sem relação com o perfil real do Flávio Barbosa).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Responsáveis
-- --------------------------------------------------------------------------

-- `instance_id` não tem default na tabela e o insert original (herdado do
-- seed anterior) nunca o preenchia — fica null. GoTrue busca o usuário
-- existente filtrando por `instance_id = 00000000-0000-0000-0000-000000000000`
-- (o instance_id padrão de instalação self-hosted/local); com null, a busca
-- não encontra ninguém, GoTrue conclui que o e-mail é novo e tenta criar o
-- usuário de novo — e colide com a constraint de e-mail único do usuário
-- que já existe (`users_email_partial_key`), devolvendo 500 tanto em
-- `/auth/v1/otp` quanto no link mágico de verdade. Achado ao testar o login
-- manualmente durante esta tarefa: sem este campo, nenhum dos três
-- responsáveis conseguia entrar.
-- Os campos de token abaixo (confirmation_token etc.) também precisam ser
-- string vazia, não null: o código Go da GoTrue lê a linha inteira do
-- usuário com destino a campos `string` comuns (não `sql.NullString`), e
-- null nesses campos derruba QUALQUER consulta que leia a linha (inclusive
-- o /otp de login) com "converting NULL to string is unsupported". Um
-- signup feito pela própria GoTrue sempre grava "" nesses campos; aqui
-- reproduzimos isso à mão pelo mesmo motivo do comentário acima.
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, created_at, updated_at
)
values
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'responsavel.multiplos@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'responsavel.dois@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now()),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'responsavel.solo@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now());

update responsaveis set nome = 'Erivan Costa Lima'
where id = 'a1111111-1111-1111-1111-111111111111';

update responsaveis set nome = 'Adriana Nascimento Freire'
where id = 'a2222222-2222-2222-2222-222222222222';

update responsaveis set nome = 'Cícero Wagner Pontes'
where id = 'a3333333-3333-3333-3333-333333333333';

-- O login por link mágico depende de auth.identities, não só de
-- auth.users. Sem uma linha aqui (provider 'email'), o admin da GoTrue
-- tenta "criar" a identidade a cada tentativa de link e colide com a
-- constraint de e-mail único do usuário que já existe — 500 em vez de link.
-- O insert direto em auth.users nunca criou essa linha (nem o seed anterior
-- criava), porque só o próprio GoTrue popula `identities` no signup normal;
-- aqui reproduzimos à mão o que ele faria.
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users
where id in (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

-- --------------------------------------------------------------------------
-- Atletas — inseridos no estado em que podem nascer sem gatilho reclamar.
-- 'ativo' exige consentimento vigente (gatilho atletas_exigir_consentimento),
-- então todo atleta que vai terminar 'ativo' ou 'suspenso' nasce como
-- 'aguardando_consentimento' e só sobe para 'ativo' depois de o
-- consentimento existir — ver os blocos mais abaixo.
--
-- Família de Erivan Costa Lima (responsavel.multiplos@exemplo.test)
-- --------------------------------------------------------------------------

insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, estado)
values
  ('b0000000-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111',
   'Kadu', 'Sub-9', 'Ala', 'Destro', null, null, null, 'CE', 'rascunho'),
  ('b0000000-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111',
   'Bira', 'Sub-11', 'Pivô', 'Canhoto', 141, 33.40, 'Futsal Sesc Ceará', 'CE', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000003', 'a1111111-1111-1111-1111-111111111111',
   'Manu', 'Sub-13', 'Fixo', 'Destro', 153, 43.20, null, 'CE', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000004', 'a1111111-1111-1111-1111-111111111111',
   'DL', 'Sub-15', 'Goleiro', 'Ambos', 168, 55.00, 'Fortaleza Futsal Clube', 'CE', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000005', 'a1111111-1111-1111-1111-111111111111',
   'Tornado', 'Sub-17', 'Ala', 'Destro', null, null, null, 'CE', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000006', 'a1111111-1111-1111-1111-111111111111',
   'Miguelzinho', 'Sub-7', null, null, null, null, null, 'CE', 'removido'),
  ('b0000000-0000-0000-0000-000000000007', 'a1111111-1111-1111-1111-111111111111',
   'Théozinho', 'Sub-19', 'Fixo', 'Destro', 179, 71.00, 'Horizonte Futsal', 'CE', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000008', 'a1111111-1111-1111-1111-111111111111',
   'Nardinho', 'Sub-20', 'Pivô', 'Canhoto', 181, 75.50, 'Sport Club Eusébio', 'CE', 'aguardando_consentimento');

-- Família de Adriana Nascimento Freire (responsavel.dois@exemplo.test)

insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, estado)
values
  ('b0000000-0000-0000-0000-000000000009', 'a2222222-2222-2222-2222-222222222222',
   'Yaya', 'Sub-10', 'Ala', 'Destro', null, null, null, 'CE', 'rascunho'),
  ('b0000000-0000-0000-0000-000000000010', 'a2222222-2222-2222-2222-222222222222',
   'JP', 'Sub-14', 'Goleiro', 'Ambos', 161, 48.60, 'Futsal Sesc Ceará', 'CE', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000011', 'a2222222-2222-2222-2222-222222222222',
   'Lica', 'Sub-16', 'Pivô', 'Destro', null, null, 'Guarani de Juazeiro', 'CE', 'aguardando_consentimento');

-- Família de Cícero Wagner Pontes (responsavel.solo@exemplo.test)

insert into atletas
  (id, responsavel_id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, estado)
values
  ('b0000000-0000-0000-0000-000000000012', 'a3333333-3333-3333-3333-333333333333',
   'Gabigol Cearense', 'Sub-12', 'Fixo', 'Canhoto', 148, 39.50, null, 'CE', 'aguardando_consentimento'),
  ('b0000000-0000-0000-0000-000000000013', 'a3333333-3333-3333-3333-333333333333',
   'Rafinha', 'Sub-18', 'Ala', 'Destro', 174, 66.00, 'Quixadá Futsal Clube', 'CE', 'aguardando_consentimento');

-- --------------------------------------------------------------------------
-- Identificação — nome completo e data de nascimento para os 13, como o
-- olheiro verificado enxergaria. `contato_responsavel` repete o telefone da
-- família (é o contato de quem leva a criança, não um dado por atleta).
-- --------------------------------------------------------------------------

insert into atleta_identificacao (atleta_id, nome_completo, data_nascimento, cidade, contato_responsavel)
values
  ('b0000000-0000-0000-0000-000000000001', 'Kauê Ferreira Lima', '2017-03-14', 'Fortaleza', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000002', 'Vitor Marreira Sousa', '2015-07-02', 'Maracanaú', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000003', 'Emanuel Costa Rocha', '2013-11-20', 'Fortaleza', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000004', 'Davi Lucca Pereira Lima', '2011-02-08', 'Eusébio', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000005', 'Heitor Alencar Lima', '2009-05-30', 'Fortaleza', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000006', 'Miguel Barros Lima', '2019-09-17', 'Fortaleza', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000007', 'Théo Correia Lima', '2007-01-25', 'Horizonte', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000008', 'Bernardo Lima Sales', '2006-12-04', 'Eusébio', '+55 85 98811-2233'),
  ('b0000000-0000-0000-0000-000000000009', 'Yasmin Freire Bezerra', '2016-04-11', 'Fortaleza', '+55 85 99011-1234'),
  ('b0000000-0000-0000-0000-000000000010', 'João Pedro Freire Lima', '2012-08-19', 'Fortaleza', '+55 85 99011-1234'),
  ('b0000000-0000-0000-0000-000000000011', 'Alícia Freire Nogueira', '2010-06-27', 'Juazeiro do Norte', '+55 88 99011-1234'),
  ('b0000000-0000-0000-0000-000000000012', 'Gabriel Pontes Aguiar', '2014-10-05', 'Quixadá', '+55 88 99055-5678'),
  ('b0000000-0000-0000-0000-000000000013', 'Rafael Pontes Dutra', '2008-03-22', 'Quixadá', '+55 88 99055-5678');

-- --------------------------------------------------------------------------
-- Saúde — só nos que vão ficar ativos, para o painel ter algo a mostrar
-- (mesmo padrão do seed anterior). Um deles sem histórico de lesão, de
-- propósito, para a tela não presumir que o campo vem sempre preenchido.
-- --------------------------------------------------------------------------

insert into atleta_saude (atleta_id, avaliacao_postural, massa_magra_pct, historico_lesao)
values
  ('b0000000-0000-0000-0000-000000000003',
   '{"observacao": "Leve assimetria de ombro, sem impacto funcional"}', 38.90, null),
  ('b0000000-0000-0000-0000-000000000004',
   '{"observacao": "Postura adequada"}', 41.20, 'Entorse de tornozelo leve em 2025, recuperado'),
  ('b0000000-0000-0000-0000-000000000008',
   '{"observacao": "Boa mobilidade de quadril"}', 44.60, null),
  ('b0000000-0000-0000-0000-000000000010',
   '{"observacao": "Postura adequada"}', 39.75, null),
  ('b0000000-0000-0000-0000-000000000012',
   '{"observacao": "Acompanhar flexibilidade posterior de coxa"}', 37.80, null);

-- --------------------------------------------------------------------------
-- Consentimentos + ativação — 5 atletas ficam 'ativo' com consentimento
-- vigente (Manu, DL, Nardinho, JP, Gabigol Cearense). O gatilho
-- atletas_exigir_consentimento só deixa o update de estado passar depois
-- de o consentimento já existir, então a ordem abaixo importa: primeiro o
-- consentimento, depois o estado.
-- --------------------------------------------------------------------------

insert into consentimentos (atleta_id, responsavel_id, documento_url, versao_termo)
values
  ('b0000000-0000-0000-0000-000000000003', 'a1111111-1111-1111-1111-111111111111',
   'termos/seed/manu.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000004', 'a1111111-1111-1111-1111-111111111111',
   'termos/seed/dl.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000008', 'a1111111-1111-1111-1111-111111111111',
   'termos/seed/nardinho.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000010', 'a2222222-2222-2222-2222-222222222222',
   'termos/seed/jp.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000012', 'a3333333-3333-3333-3333-333333333333',
   'termos/seed/gabigol.pdf', '2026-08-v1');

update atletas set estado = 'ativo'
where id in (
  'b0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000010',
  'b0000000-0000-0000-0000-000000000012'
);

-- --------------------------------------------------------------------------
-- Suspensos por revogação — Tornado (Erivan) e Rafinha (Cícero) passam
-- primeiro por 'ativo' com consentimento vigente e são revogados na
-- sequência. O gatilho derrubar_ao_revogar faz o trabalho de derrubar o
-- perfil para 'suspenso' sozinho — não setamos o estado à mão.
-- --------------------------------------------------------------------------

insert into consentimentos (atleta_id, responsavel_id, documento_url, versao_termo)
values
  ('b0000000-0000-0000-0000-000000000005', 'a1111111-1111-1111-1111-111111111111',
   'termos/seed/tornado.pdf', '2026-08-v1'),
  ('b0000000-0000-0000-0000-000000000013', 'a3333333-3333-3333-3333-333333333333',
   'termos/seed/rafinha.pdf', '2026-08-v1');

update atletas set estado = 'ativo'
where id in (
  'b0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000013'
);

update consentimentos set revogado_em = now()
where atleta_id in (
  'b0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000013'
)
and revogado_em is null;
