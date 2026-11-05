-- Escolinha x rendimento: a separação que o Flávio pediu em 05/11.
--
-- O problema dele, nas palavras dele: "tem muito pai que quer realizar o
-- sonho de uma criança mas ele não tá pronto ainda, tá só numa escolinha" —
-- e, do outro lado, "já tem atleta que já tá no rendimento competindo, já
-- disputa campeonato regional, estadual, brasileiro". Hoje a ficha e a
-- listagem tratam os dois como a mesma coisa, então um Sub-11 que treina
-- uma vez por semana aparece ao lado de um Sub-11 que joga o Brasileiro.
-- Para quem procura atleta (o olheiro, o clube), isso torna a lista inútil;
-- para a família da criança que está começando, cria uma comparação que o
-- produto não quer fazer.
--
-- Duas pontas, nesta migration:
--
--   atletas.nivel                 — o atributo do perfil, que a listagem
--                                   filtra e a ficha mostra.
--   pesquisa_responsaveis.nivel_filho — a mesma pergunta na pesquisa de
--                                   pré-lançamento, para saber a proporção
--                                   antes de abrir o cadastro.
--
-- Dois valores, não três: o Flávio agrupou "iniciação e academy" de um lado
-- e "rendimento" do outro. Se depois ele quiser separar academy, é um valor
-- a mais no CHECK, não um redesenho.

-- ---------------------------------------------------------------- atletas

-- Mesma régua de `genero` (0015) e `posicao` (0001): atributo esportivo,
-- não identifica nem localiza a criança, então mora em `atletas` e herda a
-- política `atletas_leitura_publica` (0002, `estado = 'ativo'`) sem
-- política nova. `check` em vez de enum novo, pelo mesmo motivo de 0015:
-- estender depois é trocar uma constraint, não `alter type`.
--
-- Nullable: perfil cadastrado antes de a tela coletar isto fica "não
-- informado" em vez de ser empurrado para um dos dois lados. A listagem
-- trata o nulo como "sem informar", nunca como escolinha.
alter table atletas
  add column nivel text
    check (nivel is null or nivel in ('Escolinha', 'Rendimento'));

-- Mesmo padrão de `atletas_categoria_idx` e `atletas_genero_idx`: índice
-- parcial só entre os ativos, o universo que a listagem pública filtra.
create index atletas_nivel_idx on atletas (nivel) where estado = 'ativo';

-- -------------------------------------------------- pesquisa (0017)

-- A pergunta na pesquisa. `nao_sei` existe porque a fronteira é real: tem
-- família que não sabe dizer se o filho "compete" — e empurrar essa pessoa
-- para um dos dois lados estragaria justamente o número que queremos.
alter table pesquisa_responsaveis
  add column nivel_filho text;

alter table pesquisa_responsaveis
  add constraint pesquisa_nivel_filho_valores check (
    nivel_filho is null or nivel_filho in ('escolinha', 'rendimento', 'nao_sei')
  );

-- `nivel_filho` é do bloco do filho: escolinha, clube e olheiro não
-- gravam. Recriar `pesquisa_blocos_separados` com a coluna nova valida as
-- linhas que já existem — todas com `nivel_filho` nulo, então passam.
alter table pesquisa_responsaveis drop constraint pesquisa_blocos_separados;

alter table pesquisa_responsaveis
  add constraint pesquisa_blocos_separados check (
    (perfil = 'responsavel' and organizacao is null and como_hoje is null and pedido is null)
    or (
      perfil <> 'responsavel'
      and categoria_filho is null and cardinality(enviou_video) = 0 and resultado_envio is null
      and tem_video is null and gasto_mensal is null and publica_video is null
      and quem_ve_video is null and preocupacao is null and beneficio is null
      and nivel_filho is null
    )
  );
