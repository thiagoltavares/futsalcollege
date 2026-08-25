import Link from "next/link";
import { cn } from "./util";
import { sair } from "@/lib/auth/sair.acoes";

const NAV_VISITANTE = [
  { href: "/atletas", rotulo: "Atletas" },
  { href: "/escolinhas", rotulo: "Escolinhas" },
  { href: "/#como-funciona", rotulo: "Como funciona" },
  { href: "/#avaliacao", rotulo: "Avaliação" },
  { href: "/#clubes", rotulo: "Clubes" },
] as const;

// Nav da área logada: bem mais curta que a pública (sem os links de âncora
// da home, que não fazem sentido a partir do painel), então cada item leva
// a classe `fc-cabecalho-nav__logado` para ficar sempre visível — inclusive
// no recorte móvel, que só a esconde a nav pública para caber no espaço.
const NAV_AUTENTICADO = [
  { href: "/atletas", rotulo: "Atletas" },
  { href: "/escolinhas", rotulo: "Escolinhas" },
  { href: "/painel", rotulo: "Painel" },
] as const;

export type CabecalhoPublicoProps = {
  className?: string;
  /**
   * `true` desenha a nav da área logada (Atletas, Escolinhas, Painel e o
   * botão Sair) em vez da nav pública (que termina em "Entrar"). A marca
   * continua levando para a home nos dois casos — é assim que "home"
   * permanece alcançável sem entrar duas vezes na lista de nav.
   *
   * Fica de fora quem chama decidir isto (em vez do componente checar a
   * sessão sozinho) de propósito: várias rotas públicas que usam este
   * cabeçalho (home, /atletas, /atleta/[id], /escolinhas, /escolinha/[id])
   * usam cliente anônimo e `revalidate` para cache — chamar `cookies()`
   * aqui dentro forçaria todas elas a renderização dinâmica.
   */
  autenticado?: boolean;
};

/**
 * Cabeçalho compartilhado por toda a plataforma — rotas públicas (home,
 * vitrine de atletas, ficha do atleta, escolinhas) e área logada (grupo
 * `(app)`: entrar, painel, avaliação, consentimento). Fora do grupo `(app)`,
 * então cada rota que o usa importa `estilos.css` e as fontes do design
 * system por conta própria (mesmo padrão de /profissional/flavio).
 *
 * Os links de âncora da nav pública apontam para `/#secao`: funcionam tanto
 * na própria home quanto a partir de outra rota pública, navegando para a
 * home antes de rolar até a seção.
 */
export function CabecalhoPublico({ className, autenticado = false }: CabecalhoPublicoProps) {
  return (
    <header className={cn("fc-cabecalho", className)}>
      <div className="fc-cabecalho-conteudo">
        <Link href="/" className="fc-marca">
          <span className="fc-marca-nome">
            Futsal <em>College</em>
          </span>
        </Link>
        <nav className="fc-cabecalho-nav">
          {autenticado
            ? NAV_AUTENTICADO.map((item) => (
                <Link key={item.href} href={item.href} className="fc-cabecalho-nav__logado">
                  {item.rotulo}
                </Link>
              ))
            : NAV_VISITANTE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={item.href === "/atletas" ? "fc-cabecalho-nav__atletas" : undefined}
                >
                  {item.rotulo}
                </Link>
              ))}

          {autenticado ? (
            <form action={sair}>
              <button type="submit" className="fc-cabecalho-nav__entrar fc-cabecalho-nav__sair">
                Sair
              </button>
            </form>
          ) : (
            <Link href="/entrar" className="fc-cabecalho-nav__entrar">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
