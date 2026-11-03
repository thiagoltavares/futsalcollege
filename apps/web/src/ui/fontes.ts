import { Saira_Extra_Condensed } from "next/font/google";
import localFont from "next/font/local";

/**
 * As duas famílias do Revela 10, carregadas uma vez e compartilhadas por
 * toda rota que usa `estilos.css` (home, listagens, fichas, grupo `(app)`).
 *
 * Display: Saira Extra Condensed — a fonte do número nas costas da camisa e
 * do placar do ginásio. Extra condensada de propósito: título grande cabe
 * em 375px sem quebrar palavra, e numeral (contagem de vídeo, stats da
 * ficha) lê como placar. Só os dois pesos que a folha usa.
 *
 * Corpo: Atkinson Hyperlegible Next — desenhada para distinguir letras
 * parecidas (I/l/1, O/0) em condição ruim de leitura. É o caso do público
 * principal: pai preenchendo formulário no celular, ao sol, em tela de
 * baixo brilho. Variável (200–800), então 400–700 custam um arquivo só.
 *
 * Servida LOCAL (`next/font/local`, arquivo em `./fontes/`) e não pelo
 * `next/font/google` como a Saira: o Turbopack do Next 16.3 quebra o
 * `next build` com esta fonte vinda do Google ("next/font/google queries
 * have exactly one entry"), enquanto o webpack passa. O woff2 é o subset
 * latin que o próprio Google Fonts serve (cobre todo o português), baixado
 * uma vez; a licença (OFL) permite redistribuir. Quando o bug do Turbopack
 * for corrigido, pode voltar ao Google — ou não: local é um domínio a menos
 * no build e no carregamento.
 *
 * Rota que precisa das fontes espalha `fontesFc` na classe do elemento
 * `.fc` raiz — as variáveis `--font-fc-display` e `--font-fc-corpo` são as
 * que `estilos.css` consome.
 */
const display = Saira_Extra_Condensed({
  variable: "--font-fc-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const corpo = localFont({
  variable: "--font-fc-corpo",
  src: [{ path: "./fontes/atkinson-hyperlegible-next-latin.woff2", weight: "200 800", style: "normal" }],
  display: "swap",
});

export const fontesFc = `${display.variable} ${corpo.variable}`;

/** A fonte de corpo sozinha, para rota que usa outro conjunto de variáveis (ver `/plan`). */
export const fonteCorpo = corpo;
