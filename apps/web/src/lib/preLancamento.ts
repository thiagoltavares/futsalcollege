/**
 * Modo pré-lançamento: enquanto o Revela 10 não abre, o site público é só a
 * home (a página de "em breve" com a pesquisa) e o caminho de login. Todo o
 * resto — vitrine, fichas, escolinhas, profissionais, painel, /plan — só
 * abre para quem é da equipe. A trava vive em `src/proxy.ts`.
 *
 * FECHADO POR PADRÃO, de propósito: para abrir o site é preciso definir
 * `REVELA_ABERTO=1` no ambiente. Esquecer uma variável no deploy deixa o
 * site fechado, nunca aberto com dado de demonstração (perfis TESTE,
 * atletas fictícios) à mostra.
 */
export function siteAberto(): boolean {
  return process.env.REVELA_ABERTO === "1";
}

/** O que qualquer visitante alcança com o site fechado. */
const ROTAS_PUBLICAS: RegExp[] = [
  /^\/$/,
  /^\/entrar(\/|$)/,
  /^\/auth\//,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  // Arte de compartilhamento e ícones: o preview do WhatsApp busca sem
  // sessão nenhuma, e sem isto a trava devolvia a home no lugar da imagem.
  /^\/opengraph-image/,
  /^\/twitter-image/,
  /^\/apple-icon/,
  /^\/icon/,
];

export function rotaPublicaNoPreLancamento(caminho: string): boolean {
  return ROTAS_PUBLICAS.some((regra) => regra.test(caminho));
}

/**
 * Quem é da equipe: e-mails em `EQUIPE_EMAILS`, separados por vírgula.
 * Não basta estar logado — `/entrar` cria conta para qualquer e-mail, e
 * uma conta qualquer não pode destrancar o site.
 *
 * Sem a variável: em desenvolvimento, qualquer conta logada passa (é o que
 * o atalho de login de demonstração precisa); em produção, ninguém passa.
 */
export function ehEquipe(email: string | null | undefined): boolean {
  if (!email) return false;
  const lista = (process.env.EQUIPE_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (lista.length === 0) return process.env.NODE_ENV === "development";
  return lista.includes(email.toLowerCase());
}
