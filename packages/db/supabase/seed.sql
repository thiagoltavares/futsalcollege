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
-- Avaliador — usuário autenticado que assina os laudos abaixo. Nesta rodada
-- não existe credenciamento (ver AGENTS/brief da rodada): qualquer usuário
-- autenticado pode avaliar, então este é só um exemplo de conta que
-- entraria pelo mesmo link mágico. Mesmo padrão dos três responsáveis
-- acima, para não colidir com o comportamento da GoTrue local.
-- --------------------------------------------------------------------------

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at, role, aud,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, created_at, updated_at
)
values
  ('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
   'avaliador.tecnico@exemplo.test',
   crypt('senha-de-teste-123', gen_salt('bf')), now(), 'authenticated', 'authenticated',
   '', '', '', '', '', '', now(), now());

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users
where id = 'a4444444-4444-4444-4444-444444444444';

-- --------------------------------------------------------------------------
-- Laudos publicados — 4 avaliações em atletas ativos diferentes (Manu, DL,
-- Nardinho, JP), para a ficha pública e o PDF terem o que mostrar sem
-- precisar preencher o formulário primeiro. Gabigol Cearense fica ativo e
-- SEM laudo de propósito, para exercitar o estado "ainda sem avaliação
-- publicada" na ficha pública.
-- --------------------------------------------------------------------------

insert into laudos
  (atleta_id, avaliador_id, avaliador_nome, rubrica_versao, contexto, notas, texto, publicado_em)
values
  (
    'b0000000-0000-0000-0000-000000000003', -- Manu, Sub-13, ativo
    'a4444444-4444-4444-4444-444444444444', 'Prof. Ricardo Bezerra', 'v1', 'presencial',
    '{
      "passe_recepcao": 4, "drible_protecao_bola": 3, "finalizacao": 3,
      "velocidade_deslocamento": 4, "resistencia": 3, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 3, "posicionamento_sem_bola": 4, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 5, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 4
    }'::jsonb,
    'Manu se destaca pela intensidade e pela movimentação sem bola. O passe sob pressão já é ponto forte; a finalização ainda varia bastante entre treino e jogo — vale trabalhar repertório de conclusão nas próximas semanas.',
    now() - interval '12 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000004', -- DL, Sub-15, ativo (goleiro)
    'a4444444-4444-4444-4444-444444444444', 'Prof. Ricardo Bezerra', 'v1', 'presencial',
    '{
      "passe_recepcao": 4, "drible_protecao_bola": 2, "finalizacao": 2,
      "velocidade_deslocamento": 3, "resistencia": 4, "agilidade_mudanca_direcao": 5,
      "leitura_jogo": 5, "posicionamento_sem_bola": 4, "transicao_ataque_defesa": 4,
      "atitude_competitiva": 4, "trabalho_em_equipe": 4, "disciplina_tatica_escuta": 5
    }'::jsonb,
    'Leitura de jogo muito acima da categoria — organiza a linha defensiva com clareza e antecipa cruzamentos com segurança. Itens de drible e finalização pesam pouco na função de goleiro; ainda assim, valem para o histórico completo do atleta.',
    now() - interval '7 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000008', -- Nardinho, Sub-20, ativo
    'a4444444-4444-4444-4444-444444444444', 'Prof. Ricardo Bezerra', 'v1', 'analise_video',
    '{
      "passe_recepcao": 5, "drible_protecao_bola": 4, "finalizacao": 5,
      "velocidade_deslocamento": 4, "resistencia": 4, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 5, "posicionamento_sem_bola": 5, "transicao_ataque_defesa": 4,
      "atitude_competitiva": 5, "trabalho_em_equipe": 5, "disciplina_tatica_escuta": 4
    }'::jsonb,
    'Avaliação feita a partir de três vídeos de jogo enviados pelo clube. Nardinho finaliza com as duas pernas e decide bem em situação de superioridade numérica — perfil pronto para observação mais próxima em categoria de transição.',
    now() - interval '3 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000010', -- JP, Sub-14, ativo (goleiro)
    'a4444444-4444-4444-4444-444444444444', 'Prof. Ricardo Bezerra', 'v1', 'presencial',
    '{
      "passe_recepcao": 3, "drible_protecao_bola": 2, "finalizacao": 2,
      "velocidade_deslocamento": 3, "resistencia": 3, "agilidade_mudanca_direcao": 4,
      "leitura_jogo": 3, "posicionamento_sem_bola": 3, "transicao_ataque_defesa": 3,
      "atitude_competitiva": 4, "trabalho_em_equipe": 3, "disciplina_tatica_escuta": 3
    }'::jsonb,
    'Primeira avaliação de JP na plataforma. Boa base de agilidade; ainda em desenvolvimento na saída jogando sob pressão. Reavaliar em 3 a 4 meses para acompanhar evolução.',
    now() - interval '1 day'
  );
