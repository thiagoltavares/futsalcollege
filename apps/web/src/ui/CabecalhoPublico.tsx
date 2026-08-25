import Link from "next/link";
import { cn } from "./util";
import { sair } from "@/lib/auth/sair.acoes";

const NAV_VISITANTE_ATLETAS = { href: "/atletas", rotulo: "Atletas" } as const;

// Itens "secundários" da nav pública: em telas largas ficam lado a lado com
// Atletas e Entrar; abaixo do recorte móvel entram dentro do disclosure
// `.fc-cabecalho-menu` (`<details>`/`<summary>`, sem JavaScript de
// framework) — não sobra faixa horizontal no cabeçalho para os cinco links
// de uma vez, mas isso não pode significar que somem: um pai cadastrando o
// filho pelo celular precisa alcançar Escolinhas, Como funciona, Avaliação
// e Clubes tanto quanto alguém no desktop.
const NAV_VISITANTE_MENU = [
  { href: "/escolinhas", rotulo: "Escolinhas" },
  { href: "/profissionais", rotulo: "Profissionais" },
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
  { href: "/profissionais", rotulo: "Profissionais" },
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
   * aqui dentro forçaria todas elas a renderização dinâmica. Essas rotas
   * usam `CabecalhoPublicoAuto` em vez deste componente diretamente: ele
   * renderiza `autenticado={false}` no servidor (mantendo o cache) e troca
   * para `true` no cliente, depois de consultar a sessão no navegador.
   */
  autenticado?: boolean;
};

/**
 * Cabeçalho compartilhado por toda a plataforma — rotas públicas (home,
 * vitrine de atletas, ficha do atleta, escolinhas) e área logada (grupo
 * `(app)`: entrar, painel, avaliação, consentimento). Fora do grupo `(app)`,
 * então cada rota que o usa importa `estilos.css` e as fontes do design
 * system por conta própria (mesmo padrão de /profissional/[slug]).
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
          {autenticado ? (
            NAV_AUTENTICADO.map((item) => (
              <Link key={item.href} href={item.href} className="fc-cabecalho-nav__logado">
                {item.rotulo}
              </Link>
            ))
          ) : (
            <>
              <Link href={NAV_VISITANTE_ATLETAS.href} className="fc-cabecalho-nav__atletas">
                {NAV_VISITANTE_ATLETAS.rotulo}
              </Link>

              {/* Mesmos 4 itens renderizados duas vezes, e o CSS
                  (`.fc-cabecalho-nav__desktop` / `.fc-cabecalho-menu` em
                  estilos.css) mostra só um dos dois por vez conforme a
                  largura: acima do recorte móvel, a lista lado a lado
                  abaixo; abaixo do recorte, o disclosure `<details>` logo
                  em seguida. Duas listas em vez de reaproveitar uma via CSS
                  porque navegadores atuais escondem o conteúdo de um
                  `<details>` fechado com `content-visibility: hidden`
                  (contenção de tamanho), não só `display: none` — não dá
                  para forçar esse conteúdo a ficar visível e ocupar espaço
                  normal fora do disclosure só girando `display` de volta. */}
              {NAV_VISITANTE_MENU.map((item) => (
                <Link key={item.href} href={item.href} className="fc-cabecalho-nav__desktop">
                  {item.rotulo}
                </Link>
              ))}

              {/* Disclosure nativo: funciona renderizado no servidor, sem
                  JavaScript de framework, com semântica de
                  expandido/recolhido e foco já dados pelo navegador. */}
              <details className="fc-cabecalho-menu">
                <summary className="fc-cabecalho-menu__botao">
                  Menu
                  <svg
                    aria-hidden="true"
                    className="fc-cabecalho-menu__seta"
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                  >
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="fc-cabecalho-menu__lista">
                  {NAV_VISITANTE_MENU.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.rotulo}
                    </Link>
                  ))}
                </div>
              </details>
            </>
          )}

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
