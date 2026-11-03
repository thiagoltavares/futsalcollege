# Identidade visual — Revela 10 (pós-pivô)

Data: 2 de novembro de 2026. Entregue como tokens CSS e regras de componente em
`apps/web/src/ui/estilos.css` (escopo `.fc`), não como imagem. Este documento
explica as decisões; a folha é a fonte da verdade.

## O princípio

**Quadra azul, marcação amarela, número na camisa.**

Três coisas que qualquer pessoa que já pisou num ginásio reconhece sem
explicação: o piso azul das quadras de futsal, a linha amarela pintada por cima
dele (na quadra compartilhada da escola, cada esporte tem a sua cor, e a do
futsal é a amarela) e o número grande nas costas. É isso que torna o produto
reconhecível como *este*, e não como qualquer plataforma esportiva.

O que a identidade **não** é: grama de campo (é quadra), cartão SaaS com raio
grande e sombra cinza, papel creme com serifa e acento terracota (o visual
anterior, que hoje é o padrão de qualquer site gerado), verde-amarelo de
seleção, dashboard.

A ousadia foi gasta em um lugar só: o hero da home é a quadra, com a marcação
desenhada em escala por trás do título. O resto da página é cal e cartão.

## Paleta (6 cores nomeadas)

| Nome | Hex | Papel |
|---|---|---|
| **quadra** | `#10355f` | Superfície escura de marca: cabeçalho, hero, cabeçalho da ficha, seção "Como funciona". Também é o **acento sobre fundo claro** (link, botão primário, foco, rótulo). 11:1 sobre a cal. |
| **amarelo** | `#ffd23f` | A marcação da quadra. Acento sobre a quadra: borda de 3px do cabeçalho, numerais da ficha, botão do hero, anel do avatar, o retângulo do "10". **Nunca é texto sobre fundo claro** (2,1:1, não passa). |
| **cal** | `#f4f4f1` | Parede caiada: fundo das telas de produto. Não é papel creme. Degraus `cal-2` `#e9eae4` e `cal-3` `#dcded6`. |
| **tinta** | `#0f1b2b` | Texto sobre a cal. Azul-preto, não preto puro: é a quadra vista no escuro. Degraus por opacidade: `tinta-2` .84, `tinta-3` .68, `tinta-4` .64 (o menor passa 4,6:1 — texto pequeno de apoio). |
| **giz** | `#ffffff` | Texto sobre a quadra. Degraus `giz-2` .78 e `giz-3` .62 (5,5:1). |
| **branco** | `#ffffff` | Superfície de cartão e input sobre a cal. |

Apoio: `banda` `#e4ebf2` (quadra desbotada, para dar ritmo às seções da home
sem recorrer ao par claro/escuro; dentro dela os tokens de texto escurecem um
degrau). Semântica: `sucesso` `#1f7a4d`, `alerta` `#8a5200`, `perigo`
`#b42318` — vermelho fechado, não laranja, para não confundir com o eixo
técnico.

### Os quatro eixos da avaliação

Cor com função, separada da identidade: nenhum eixo reusa o azul nem o
amarelo. Quatro matizes afastados entre si (25°, 145°, 270°, 335°), cada um
com variante AA para fundo claro e `-forte` para fundo escuro.

| Eixo | Claro (AA sobre cal) | Forte (sobre quadra) |
|---|---|---|
| Técnico | `#c2410c` laranja | `#fb923c` |
| Físico | `#15803d` verde | `#4ade80` |
| Tático | `#6d28d9` roxo | `#b7a4fc` |
| Comportamental | `#be185d` rosa | `#f68cc3` |

Na `banda`, técnico e físico escurecem (`#a63a0b`, `#116b33`) para manter AA.
Físico e `sucesso` dividem a família verde, em contextos que não se encontram
(radar e formulário vs. selo e consentimento).

### Mapa dos tokens antigos

| Antes | Agora |
|---|---|
| `--fc-gol` / `-hover` / `-suave` | `--fc-acento` / `-hover` / `-suave` (azul) |
| `--fc-gol-forte` | `--fc-acento-forte` = `--fc-amarelo` |
| `--fc-ink` / `--fc-ink-2` | `--fc-quadra` / `--fc-quadra-2` |
| `--fc-osso` / `-70` / `-45` | `--fc-giz` / `-2` / `-3` |
| `--fc-papel` / `-2` / `-3` | `--fc-cal` / `-2` / `-3` |
| `--fc-areia` | `--fc-banda` |
| `--fc-tinta-80` / `-60` / `-40` | `--fc-tinta-2` / `-3` / `-4` |

56 tokens definidos, todos usados. Nenhum valor da paleta antiga sobrou
hardcoded na folha.

## Tipografia

Duas famílias, papéis claros, sem serifa.

- **Saira Extra Condensed** (600/700/800) — display. A fonte do número nas
  costas da camisa e do placar do ginásio. Extra condensada de propósito: título
  grande cabe em 375px sem quebrar palavra, e numeral lê como placar. Caixa alta,
  tracking +0.01em, entrelinha 0.9–0.92. Usada em: títulos, apelido no cartão,
  nome na ficha, numerais (placar, stats, contagem de vídeo), pastilha de
  categoria, wordmark.
- **Atkinson Hyperlegible Next** (variável) — corpo. Desenhada para distinguir
  letras parecidas (I/l/1, O/0) em condição ruim de leitura: o pai preenchendo
  formulário ao sol, em tela de baixo brilho. Rótulo, input, erro, ajuda, lead.

As fontes saíram das 9 rotas que repetiam o mesmo bloco e vivem em
`apps/web/src/ui/fontes.ts` (`fontesFc`). O PDF do laudo continua com os
arquivos TTF antigos (Big Shoulders + Barlow) porque trocar exige baixar as
fontes novas para `apps/web/fontes/`; só a paleta do PDF foi alinhada.

### O que saiu

- Instrument Serif (a serifa) — era o tique de "site gerado" mais forte.
- Eyebrow em caixa alta espaçada acima de cada título ("Vitrine", "Acabou de
  entrar", "Navegação pública"…). `.fc-etiqueta-rotulo` virou sentence case,
  peso 600, sem tracking, e a home perdeu os rótulos redundantes.
- Ponto-do-meio como separador em metadado de cartão ("Destro · 1,52 m").
  Virou vírgula: "Destro, 152 cm, 40,5 kg" lê como frase.

## Wordmark

`REVELA` em display + **10** como número de camisa: retângulo amarelo com o
numeral na cor da quadra, igual ao número costurado nas costas. O retângulo é o
que torna a marca independente do fundo — sobre a quadra escura do cabeçalho e
sobre o branco de um PDF, o 10 é o mesmo objeto. Nunca é só a cor que muda.

Implementação: `.fc-marca-nome em` em `estilos.css`. Favicon em
`apps/web/src/app/icon.svg` (quadra, pedaço de arco, o 10).

O wordmark continua **em aberto** como marca registrável — isto é o que existe
em CSS. Nome está decidido, desenho não.

## Hero da home

Antes: manchete + busca + pills sobre cal, grafismo de quadra em tinta a 8%.
Agora: **a quadra**. Fundo azul emendado no cabeçalho (a marcação de 3px do
cabeçalho vira a linha lateral), a marcação de futsal desenhada em escala real
(`ui/Quadra.tsx`: áreas em "D", marca de 6 m e 10 m, zona de substituição —
quem joga reconhece que é futsal, não campo nem basquete) em amarelo a 34% por
trás, título em display de 13vw, busca com botão amarelo, categorias como
pastilhas sobre a quadra.

Manchete: **"A base jogando, em vídeo."** — o produto é vídeo de quem joga a
base; a frase é curta o bastante para a display extra condensada e não vende
registro nem laudo. Lead cita "em todo o Brasil".

Logo abaixo, o **placar**: a marcação amarela atravessando a página com os
três números (vídeos primeiro, depois atletas, depois escolinhas) em display na
cor da quadra, numa linha só. Não é "número grande com rótulo em gradiente"; é
placar de ginásio.

Decisão deliberada: o hero **não** toca vídeo nem mostra foto de criança. A
pergunta "vídeo é público ou só para olheiro" está em aberto, e o hero
funciona nos dois cenários — a vitrine logo abaixo já mostra os cartões.

## Cartão de atleta — a figurinha

O átomo do produto, nas quatro listagens. Virou a figurinha do álbum, que todo
pai e toda criança conhecem:

1. **Capa em retrato 4:5** (era 4:3). Vídeo de celular e foto de criança
   jogando são mais altos que largos. Sem foto: pedaço da quadra com a inicial
   do apelido em amarelo, nunca um buraco.
2. **Contagem de vídeos sobre a capa** (`▶ 2`), só quando há vídeo. É a
   informação que o pivô pôs na frente, então vai onde o olho chega primeiro.
3. **Apelido em display**, caixa alta, uma linha — o nome nas costas.
4. **Categoria como pastilha** (quadra em miniatura: fundo azul, texto amarelo
   em display) + posição em texto.
5. Físico em uma linha ("Destro, 152 cm, 40,5 kg"), origem em outra
   ("Academia Futsal Cariri, CE").
6. Selos (linha própria, sempre presente).
7. Contagem de mídia ("2 vídeos e 5 fotos" / "Perfil novo, ainda sem vídeo").

Grade: **duas colunas já no celular** (piso 9,75rem), 13rem a partir de 48rem,
15,5rem a partir de 64rem. Era uma coluna no celular — página de álbum tem mais
de uma figurinha por linha. Hover/foco: borda azul, não translação.

Raio de cartão caiu de 10px para 6px e a sombra ficou mais discreta: a
marcação da quadra tem canto vivo, e cartão com raio grande é a pinta de SaaS
que o brief pede para evitar.

## Outros componentes retokenizados

- Cabeçalho: quadra, marcação amarela de 3px, nav em giz.
- Cabeçalho da ficha (atleta, escolinha, profissional): quadra com a marcação
  recortada por trás, avatar com anel amarelo, numerais dos stats em amarelo.
- Botão primário: azul com texto branco (12:1). No hero, amarelo com texto
  azul. Secundário: borda tinta.
- Foco de teclado: anel azul sobre claro, amarelo sobre a quadra.
- Seleção de texto: amarelo com tinta por cima (giz no quadro).
- Radar: polígono azul, pontos e rótulos na cor do eixo. Formulário de
  avaliação: cada eixo marca sua opção na própria cor (técnico ganhou o bloco
  que antes herdava do acento).
- Destaques (stories): anel amarelo sólido.
- Lightbox: fundo quadra a 90%.
- `/plan`: continua documento em papel com Source Serif, mas acento, tinta e
  display alinhados (azul, Saira).

## Resíduo pré-pivô removido

- "Futsal College" em `/escolinhas` e no PDF do laudo.
- Escopo "Fortaleza, região metropolitana e interior do Ceará" na home e em
  `/escolinhas` → "em todo o Brasil".
- "Cada aluno ganha o registro do próprio trabalho" → "o próprio perfil, com
  vídeo e foto". "Entrada separada, busca por dado verificado" → busca com o
  vídeo no perfil.
- "O que o menino joga" → "o atleta" (há filtro de gênero).
- Título raiz "Futsal / Projeto de futsal" → Revela 10. Fundo do `<html>` era
  o preto da landing antiga → cal.

## Piso de qualidade verificado

- Contraste calculado para todos os pares de texto (script no histórico): o
  menor par de texto é `tinta-4` sobre cal, 4,6:1.
- Celular (390px) checado em: home, `/atletas`, `/atleta/[id]`,
  `/escolinha/[id]`. Desktop: home, ficha com avaliação, `/escolinhas`.
- `tsc --noEmit` limpo. `eslint`: 1 erro pré-existente
  (`react-hooks/immutability`), não introduzido aqui.
- `prefers-reduced-motion`: as regras existentes continuam; nenhuma animação
  nova.

## Em aberto (não decidido aqui)

- **Vídeo público ou só para olheiro.** O hero e o cartão funcionam nos dois
  cenários. A lista "Público" da seção de privacidade da home não cita vídeo
  nem foto — hoje a ficha anônima mostra os dois. Quando o sócio decidir, a
  lista e a contagem no cartão seguem a decisão.
- **Wordmark como marca.** O que existe é CSS; registro precisa de desenho.
- **Fontes do PDF.** Trocar Big Shoulders/Barlow pelos TTF de Saira Extra
  Condensed e Atkinson Hyperlegible Next em `apps/web/fontes/`.
- **Capas do seed.** As imagens de teste (número vermelho sobre fundo) ainda
  carregam a paleta antiga; são dados, não marca.
