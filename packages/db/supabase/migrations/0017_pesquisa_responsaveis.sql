-- Pesquisa de pré-lançamento: o questionário que o Flávio propôs em 03/11
-- para os pais de Sub-9 a Sub-13 do Sesc, hospedado na home do próprio
-- site em vez de um Google Forms — assim a resposta chega junto com a
-- origem do link (qual escolinha mandou, `/?de=sesc`), a UF, a categoria
-- do filho e, para quem quiser, um contato para receber novidades.
--
-- Público primeiro: famílias do Sesc, muitas de baixa renda, respondendo
-- no celular. Por isso, para o responsável, TODA pergunta é de tocar numa
-- opção (pedido do Flávio, 03/11: "objetivo e de fácil acesso"): nenhuma
-- coluna de texto livre no bloco do responsável. O contato aceita WhatsApp
-- ou e-mail, porque WhatsApp é o que todo mundo tem.
--
-- Como a home é pública, quem responde não é só pai: escolinha, clube e
-- olheiro também chegam. `perfil` separa os quatro; o bloco sobre o filho
-- só vale para `responsavel`, e escolinha/clube respondem um bloco curto,
-- com texto livre (esse público escreve), e deixam o nome da organização —
-- o lead que interessa para distribuição.
--
-- Régua de dado: a resposta é do ADULTO e fala de criança, então nenhuma
-- coluna aqui identifica ou localiza o filho — sem nome, sem data de
-- nascimento, sem cidade, sem escolinha do atleta. `estado_uf` e
-- `categoria_filho` são do mesmo nível que a ficha pública já mostra. O
-- contato é do adulto, opcional, e só é gravado com `aceita_contato`
-- marcado — a Server Action descarta o campo no "Agora não", e a
-- constraint abaixo garante isso mesmo se a tela falhar.
--
-- Respostas de escolha são texto com CHECK fechado (não enum): o
-- questionário vai mudar entre rodadas, e `alter type` em enum é mais
-- chato que trocar uma constraint. Texto livre tem teto de tamanho.
--
-- Escrita: qualquer visitante insere (é um formulário público, sem login).
-- Leitura: NINGUÉM pela API — sem política de select, a RLS nega para
-- `anon` e `authenticated`; só o service role (painel do Supabase, script
-- de análise) lê. Mesmo raciocínio de `atleta_identificacao`: o que é
-- pessoal não sai pela API pública.

create table pesquisa_responsaveis (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),

  -- De onde veio o link (`/?de=sesc`), para separar as rodadas por
  -- escolinha. Slug curto, nunca texto livre do visitante.
  origem text,

  -- Quem respondeu.
  perfil text not null,
  estado_uf text,

  -- ---------------- responsável: só respostas de tocar ----------------
  categoria_filho text,
  -- Já mandou vídeo dele para time, treinador ou peneira? Por onde? (várias)
  enviou_video text[] not null default '{}',
  -- E deu em alguma coisa? (só para quem mandou)
  resultado_envio text,
  -- Tem vídeos dele jogando? Onde?
  tem_video text,
  -- Quanto gasta por mês com o futebol dele, além do treino.
  gasto_mensal text,
  -- Posta vídeo dele na internet?
  publica_video text,
  -- Se o perfil tivesse vídeo, quem deixaria ver? Uma escolha só, entre
  -- aberto, só verificado e ninguém: é a decisão em aberto do produto
  -- (vídeo público ou restrito).
  quem_ve_video text,
  -- O que mais preocupa em mostrar o filho na internet.
  preocupacao text,
  -- O que mais ajudaria (pergunta do Flávio).
  beneficio text,

  -- ------------- escolinha, clube, olheiro: texto livre -------------
  -- Nome da escolinha, clube ou projeto — dado institucional, nunca do
  -- atleta.
  organizacao text,
  -- Como descobrem ou mostram atleta de base hoje.
  como_hoje text,
  -- O que precisaria existir para ficar mais fácil.
  pedido text,

  -- WhatsApp ou e-mail do ADULTO para receber novidades, opt-in (último
  -- passo da pesquisa).
  aceita_contato boolean not null default false,
  contato text,

  constraint pesquisa_perfil_valores check (
    perfil in ('responsavel', 'escolinha', 'clube_olheiro', 'outro')
  ),
  constraint pesquisa_origem_slug check (origem is null or origem ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(origem) <= 40),
  constraint pesquisa_estado_uf_formato check (estado_uf is null or estado_uf ~ '^[A-Z]{2}$'),
  constraint pesquisa_categoria_tamanho check (categoria_filho is null or char_length(categoria_filho) <= 20),

  constraint pesquisa_enviou_video_valores check (
    enviou_video <@ array['nunca', 'whatsapp', 'instagram', 'youtube', 'pessoalmente', 'outro']::text[]
  ),
  constraint pesquisa_resultado_envio_valores check (
    resultado_envio is null or resultado_envio in ('chamaram_teste', 'responderam_sem_retorno', 'ninguem_respondeu')
  ),
  constraint pesquisa_tem_video_valores check (
    tem_video is null or tem_video in ('celular', 'redes', 'nao_tem')
  ),
  constraint pesquisa_gasto_mensal_valores check (
    gasto_mensal is null or gasto_mensal in ('nada', 'ate_50', '50_150', '150_300', 'mais_300', 'prefiro_nao_dizer')
  ),
  constraint pesquisa_publica_video_valores check (
    publica_video is null or publica_video in ('aberto', 'conhecidos', 'nao_publica')
  ),
  constraint pesquisa_quem_ve_video_valores check (
    quem_ve_video is null or quem_ve_video in ('qualquer_pessoa', 'clubes_verificados', 'nao_publicaria')
  ),
  constraint pesquisa_preocupacao_valores check (
    preocupacao is null or preocupacao in ('expor_demais', 'mal_intencionados', 'golpe', 'custo', 'nada')
  ),
  constraint pesquisa_beneficio_valores check (
    beneficio is null or beneficio in (
      'divulgar_videos', 'ser_encontrado', 'convites_peneiras',
      'historico_organizado', 'oportunidades_fora', 'seguranca_orientacao'
    )
  ),

  constraint pesquisa_organizacao_tamanho check (organizacao is null or char_length(organizacao) <= 120),
  constraint pesquisa_como_hoje_tamanho check (como_hoje is null or char_length(como_hoje) <= 500),
  constraint pesquisa_pedido_tamanho check (pedido is null or char_length(pedido) <= 500),

  -- O núcleo da resposta de quem é responsável.
  constraint pesquisa_responsavel_completo check (
    perfil <> 'responsavel' or (
      cardinality(enviou_video) > 0
      and publica_video is not null
      and quem_ve_video is not null
    )
  ),
  -- Os blocos não se misturam: responsável não grava campo de
  -- organização, e organização não grava resposta sobre filho.
  constraint pesquisa_blocos_separados check (
    (perfil = 'responsavel' and organizacao is null and como_hoje is null and pedido is null)
    or (
      perfil <> 'responsavel'
      and categoria_filho is null and cardinality(enviou_video) = 0 and resultado_envio is null
      and tem_video is null and gasto_mensal is null and publica_video is null
      and quem_ve_video is null and preocupacao is null and beneficio is null
    )
  ),

  constraint pesquisa_contato_tamanho check (contato is null or char_length(contato) between 5 and 120),
  -- Contato só existe com opt-in; opt-in sem contato é inútil.
  constraint pesquisa_contato_com_aceite check (
    (aceita_contato and contato is not null) or (not aceita_contato and contato is null)
  )
);

create index pesquisa_responsaveis_origem_idx on pesquisa_responsaveis (origem, criado_em);
create index pesquisa_responsaveis_perfil_idx on pesquisa_responsaveis (perfil, criado_em);

alter table pesquisa_responsaveis enable row level security;

-- Qualquer visitante responde. `with check (true)` porque as constraints
-- acima já fecham o formato; o que a RLS decide aqui é só "pode inserir".
create policy pesquisa_insercao_publica on pesquisa_responsaveis
  for insert
  to anon, authenticated
  with check (true);

-- Sem política de select, update ou delete, de propósito (ver cabeçalho).
