import { Atkinson_Hyperlegible_Next, Saira_Extra_Condensed } from "next/font/google";

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
 * baixo brilho. Variável, então 400–700 custam um arquivo só.
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

const corpo = Atkinson_Hyperlegible_Next({
  variable: "--font-fc-corpo",
  subsets: ["latin"],
  display: "swap",
});

export const fontesFc = `${display.variable} ${corpo.variable}`;
