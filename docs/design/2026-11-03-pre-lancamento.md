# Pré-lançamento: home de "em breve" com pesquisa

3 de novembro de 2026. Sem commit.

## O que mudou

- **Site fechado por padrão.** `src/proxy.ts` manda para `/` qualquer visitante
  fora da equipe que tente abrir algo além da home, `/entrar`, `/auth/*` e
  `robots.txt`. Equipe = conta logada com e-mail em `EQUIPE_EMAILS`. Para
  abrir: `REVELA_ABERTO=1`. Esquecer a variável deixa fechado, nunca aberto.
- **`/` é a página de pré-lançamento** (`app/_pre-lancamento/`), uma tela só,
  mobile first. Duas telas lado a lado num trilho sobre uma quadra contínua:
  o hero (a marcação se desenha, o "10" é pintado em traço, "A base vai
  entrar em quadra.") e a pesquisa. Ao tocar em "Responder a pesquisa", o
  hero inteiro sai pela esquerda e a pesquisa ocupa a tela, do outro lado da
  mesma quadra. Sem cartão: pergunta grande em branco sobre o azul. A fase
  vive na URL (`#pesquisa`), então o voltar do celular devolve ao hero.
  Nenhuma consulta ao banco para montar a página; nenhum atleta aparece.
  "O que vem aí" e "Quem está fazendo" saíram da home (os fundadores
  continuam na vitrine).
- **A vitrine foi para `/vitrine`** (só equipe). Com `REVELA_ABERTO=1`, `/`
  volta a renderizar a vitrine. Os links "Como funciona" e "Clubes" do
  cabeçalho do produto agora apontam para `/vitrine#...`.
- **Pesquisa em passos, feita para as famílias do Sesc** (migration 0017,
  tabela `pesquisa_responsaveis`). Pedido do Flávio em 03/11: objetiva e de
  fácil acesso, porque parte do público é carente. Um passo por tela, barra
  de progresso amarela, número do passo no selo do "10".
  - Primeiro passo: quem está respondendo (pai ou mãe, treinador ou
    escolinha, clube ou olheiro, outro). Avança sozinho.
  - Pai: 10 ou 11 passos, **só de tocar**, sem nenhum campo de texto, em
    palavras do dia a dia. Nos passos de resposta única, tocar já avança.
    Quem marcou "nunca mandei vídeo" pula "E deu em alguma coisa?". O gasto
    mensal tem "Prefiro não dizer". A única hipotética é a decisão em aberto
    do produto, numa escolha só: "Se seu filho tivesse um perfil com vídeo,
    quem você deixaria ver?" (qualquer pessoa / só clubes e olheiros
    conferidos / ninguém).
  - Escolinha, clube e olheiro: 5 passos, com texto livre e o nome da
    organização, em colunas próprias (`organizacao`, `como_hoje`, `pedido`).
    A migration impede misturar os dois blocos.
  - Último passo para todos: "Quer receber novidades do Revela 10?" (Sim /
    Agora não). O campo aceita **WhatsApp ou e-mail**, porque WhatsApp é o
    que todo mundo tem; só aparece e só é gravado no Sim, e é conferido no
    navegador e no servidor (número com DDD ou e-mail completo).
  - Categoria e estado usam o **Seletor** novo do design system
    (`ui/Seletor.tsx`): uma folha que sobe de baixo com botões grandes, no
    lugar do select nativo do celular.
  - Na pesquisa a quadra apaga e as opções têm fundo sólido, para nenhuma
    linha amarela atravessar uma resposta.
  - No celular, Voltar e Continuar ficam presos embaixo. `?de=sesc` no link
    registra a origem. Insert público, leitura só pelo service role.
- Depois de responder, botão para mandar o link pelo WhatsApp, com a mesma
  origem.
- `robots.txt`: só `/` indexável enquanto fechado.
- Fundadores num módulo só (`lib/fundadores.ts`), usado pela home nova e pela
  vitrine. Texto do Thiago sem "de Fortaleza".

## Verificado

- Anônimo: `/` e `/entrar` 200; `/vitrine`, `/atletas`, `/escolinhas`,
  `/profissionais`, `/plan`, `/painel`, `/atleta/x` e a API de PDF voltam
  307 para `/`.
- Logado (login de demonstração, dev): `/vitrine` e `/atletas` abrem.
- Envio como responsável e como escolinha gravados no banco local com perfil,
  origem e contato certos; o papel `anon` lê 0 linhas.
- 390 px e 1280/1920 px sem rolagem lateral; transição do hero para a
  pesquisa conferida no meio do movimento; voltar do navegador devolve ao
  hero; trilhas de responsável e de escolinha enviadas até o fim, incluindo
  o passo do e-mail (sem escolha, e-mail incompleto e e-mail válido).
- `tsc` ok, `next build` ok, 11 testes novos do esquema passam. Lint: só o
  erro antigo de `PerfilProfissional.tsx`. Core: 2 testes antigos de
  posição do atleta falham, sem relação com esta mudança.

## Para ir ao ar

1. Restaurar o projeto Supabase `futsal-college` (está pausado) e aplicar as
   migrations pendentes até a 0017.
2. Na Vercel: `EQUIPE_EMAILS` com os e-mails do Thiago e do Flávio. Não
   definir `REVELA_ABERTO`.
3. Merge de `feat/mvp-web` em `main` (ou promover o preview).
4. Conferir em produção: anônimo vê só a home; envio da pesquisa grava.

## Em aberto

- Imagem de compartilhamento (Open Graph) para o link no WhatsApp: hoje sai
  sem imagem.
- As respostas só são lidas pelo painel do Supabase. Uma tela de leitura para
  a equipe é o próximo passo natural quando houver volume.
- O e-mail guardado é dado pessoal de adulto com consentimento para
  novidades: falta uma linha de política de privacidade e um jeito de
  descadastrar antes do primeiro envio de e-mail.
