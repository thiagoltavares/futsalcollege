# REVELA10-HOME-001 — Refinamento de UX/UI da Home

Entrega de 3 de novembro de 2026. Branch `feat/mvp-web`, **sem commit** (alterações
na árvore de trabalho, prontas para revisão). Preview: `http://localhost:3000/`.

## 1. Resumo das mudanças

A identidade (quadra azul, marcação amarela, display condensado, número na
camisa) foi mantida inteira. O que mudou é hierarquia, composição e o que cada
seção faz:

- **Hero** ganhou uma segunda coluna em tela larga: três figurinhas de atleta
  **com vídeo publicado**, dados reais, o mesmo cartão da vitrine, em degraus.
  Título, lead, busca e categorias ficaram à esquerda; o lead encurtou; a busca
  cresceu (input de 3,25rem) e é a ação principal. No celular o mosaico some e a
  grade de destaque começa logo abaixo do placar.
- **Cartão de atleta**: com vídeo, a capa vira miniatura — botão de reprodução
  amarelo no centro, degradê de leitura no rodapé e "1 vídeo" em display no
  canto. Sem vídeo, nenhum indicador: foto é foto. Sem foto, o recorte da quadra
  com a inicial (como antes). Número da camisa continua sendo o que a capa
  mostra; não virou campo nem pontuação.
- **Seções**: "Atletas em destaque" caiu de 12 para 8 cartões e ganhou um botão
  primário no rodapé ("Ver todos os N atletas"). "Perfis novos" virou **esteira
  horizontal** de cartões menores sobre a banda (mesmo componente, outro
  formato). "Para escolinhas / Para clubes e olheiros" entrou **dentro** da
  seção escura "Como funciona", com CTAs, em vez de ser uma terceira grade de
  cartões brancos. "Privacidade" virou três colunas com régua colorida, não três
  cartões. Títulos de seção ganharam um degrau abaixo do H1 (`.fc-titulo--secao`).
- **Cartão de escolinha** foi redesenhado: **horizontal**, com **escudo**
  (recorte em `clip-path`) à esquerda — imagem da escolinha quando existe,
  iniciais da instituição ("AF", "CS") sobre a quadra quando não — e nome em
  display à direita. Empilha em coluna estreita via container query. Nenhum
  logotipo inventado: ou é `escolinhas.foto_storage_path`, ou iniciais.
- **Quem está por trás**: os dois sócios, lado a lado, com papel e descrição
  exatamente como o brief escreveu. Foto só quando existe no banco (Flávio);
  iniciais caso contrário. O link "Conhecer a trajetória completa" continua
  apontando para `/profissional/flavio` quando a linha existe.

## 2. Arquivos modificados

| Arquivo | O quê |
| --- | --- |
| `apps/web/src/app/page.tsx` | Hero com mosaico, contagens de mídia antes da seleção, 8 destaques, esteira de novos, seção escura unificada, fundadores, privacidade em colunas. Mesmas consultas (uma por página), sem `select("*")`. |
| `apps/web/src/ui/CartaoAtleta.tsx` | `data-video` na faixa de capa, `__play` (aria-hidden) e `__videos` com texto ("1 vídeo"). Estrutura de 7 faixas intacta. |
| `apps/web/src/ui/CartaoEscolinha.tsx` | Layout horizontal com escudo; `iniciaisInstituicao()`; cidade/UF e números com vírgula. |
| `apps/web/src/ui/estilos.css` | Regras novas: `.fc-home-hero__mosaico`, `.fc-titulo--secao`, `.fc-home-secao__rodape`, `.fc-esteira__trilho`, `.fc-home-publico`, `.fc-home-fundador*`, `.fc-home-privacidade__coluna`, `.fc-cartao-atleta__play`/`__videos`, `.fc-cartao-escolinha*` reescrito, `container-type` em `.fc-atletas-item-link`. Removidas regras órfãs da home antiga (`.fc-home-eixo*`, `.fc-home-autoridade*`, `.fc-home-duplo`, `.fc-home-acoes`, `.fc-home-h1 em`). |
| `docs/design/2026-11-03-home-refinamento.md` | Este documento. |

Nada mudou em backend, banco, políticas de RLS, consentimento ou contratos de
dados. `AtletaResumoCartao`, `MidiaResumoCartao` e `EscolinhaResumoCartao` são
os mesmos tipos.

## 3. Antes / depois das decisões

| Antes | Depois | Por quê |
| --- | --- | --- |
| Hero com metade direita vazia (só a quadra). | Mosaico de 3 atletas com vídeo à direita (≥64rem). | "Vídeo" era só palavra no título; agora a primeira dobra mostra vídeo de verdade. É filtro de conteúdo (tem vídeo), com ordem aleatória dentro dele — não ranking. |
| Lead de 4 linhas com a frase de privacidade. | Lead de 3 linhas; a frase de privacidade fica só na seção própria. | Hierarquia: a primeira dobra vende uma ideia; a promessa de privacidade tem seção inteira mais abaixo. |
| Badge pequeno "▶ 1" no canto da capa. | Botão de reprodução central + "1 vídeo" + degradê. | O brief pede protagonismo do audiovisual e indicação clara de reprodução. Sem vídeo, nada é desenhado. |
| 12 cartões em destaque + 4 "perfis novos" na mesma grade. | 8 em destaque com CTA primário; 6 novos em esteira horizontal menor. | Menos repetição visual; "novos" fica reconhecível como outra coisa. |
| Escolinha como figurinha vertical com letra gigante. | Cartão horizontal com escudo e nome em display. | Instituição se apresenta por escudo e nome, não por retrato. Separa visualmente de atleta na mesma página. |
| "Para escolinhas / Para clubes" em dois cartões brancos, seção própria. | Dentro de "Como funciona", com fio de giz e CTAs. | Mesmo assunto, menos uma seção, menos um grid de cartões. |
| "Quem está por trás" = só o Flávio, bio do banco. | Dois fundadores, texto do brief. | Pedido explícito do brief. A bio verificada continua na página do Flávio. |
| Privacidade em 3 cartões. | 3 colunas com régua verde/âmbar/vermelha. | Quarta grade de cartões da página; lista não precisa de cartão. |
| H2 de seção no tamanho de título de página. | `.fc-titulo--secao` (1,9–2,75rem). | Hierarquia: um H1 grande, seções menores. |

## 4. Testes e verificações executados

- `tsc --noEmit` (apps/web): **ok**, exit 0.
- `eslint` (apps/web): 1 erro **pré-existente** em
  `app/profissional/[slug]/PerfilProfissional.tsx:249` (`react-hooks/immutability`,
  confirmado antes deste trabalho) e 4 avisos `no-img-element` pré-existentes.
  Nenhum erro novo.
- Folha de estilo parseada com PostCSS após a edição (um bloco ficou aberto
  numa versão intermediária e foi corrigido; chaves balanceadas: 510/510).
- Chrome, `http://localhost:3000/`:
  - Desktop 1920: hero com mosaico, placar, grade 4×2, esteira, escolinhas em
    3 colunas, seção escura, fundadores, privacidade.
  - Mobile 390 e tablet 768 (iframes): sem overflow horizontal
    (`scrollWidth === clientWidth` nos dois); esteira rola com encaixe; cartões
    de escolinha empilham/ficam horizontais conforme a largura.
  - Foco por teclado: `.fc-atletas-item-link` recebe `outline 2px` na cor da
    quadra (regra global `.fc a:focus-visible`); no hero e na seção escura o
    outline é amarelo.
  - `/atletas` e `/escolinhas` (que reusam os cartões) continuam renderizando;
    em `/escolinhas` o cartão empilha o escudo em coluna estreita.
- Não há testes de UI no repositório (`vitest` só em `packages/core` e
  `packages/db`); nada do que mudou toca esses pacotes.

## 5. Limitações e pendências

- **Miniatura de vídeo** é a foto de capa do atleta (`capaUrl`). Não existe
  poster/thumbnail de vídeo no modelo; quando há vídeo e não há foto, o cartão
  mostra a quadra com a inicial + botão de reprodução (verdadeiro: há vídeo).
  Gerar um frame do vídeo exigiria `<video preload="metadata">` por cartão
  (custo de rede num celular ao sol) ou um campo de poster — fora do escopo.
- As capas dos dados mockados são imagens com número de camisa geradas pelo
  seed; em produção serão fotos. O cartão trata as duas como foto.
- Mosaico do hero exige ao menos um atleta com vídeo; sem nenhum, o hero volta
  a ser só texto (sem buraco: a coluna some).
- "Perfis novos" com dados mockados mostra seis "TESTE" sem foto — é o dado,
  não a UI.
- Lint: o erro pré-existente em `PerfilProfissional.tsx` continua.

## 6. Riscos identificados fora do escopo

- **Bucket `midias` público** (migration 0011): qualquer URL de vídeo/foto é
  acessível fora da plataforma mesmo com o perfil suspenso. A home não piora
  isso, mas o destaque ao vídeo torna a decisão "vídeo público vs. só clube
  verificado" mais urgente (ver
  `docs/design/2026-11-02-identidade-revela10.md`, "em aberto").
- O termo de consentimento promete vídeo restrito a olheiro verificado,
  enquanto a vitrine pública mostra vídeo (memória
  `termo-promete-video-restrito`). Decisão de produto/jurídico, não de UI.
- `.fc-atletas-item-link` agora é `container-type: inline-size`. Isso aplica
  contenção de largura ao link em todas as listagens que o usam (atletas,
  escolinhas, profissionais). Em grid com `1fr` não muda nada; se algum dia um
  cartão precisar de largura definida pelo conteúdo, essa regra precisa sair.
