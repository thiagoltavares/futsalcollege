import Link from "next/link";
import { cn } from "./util";

const NAV = [
  { href: "/#como-funciona", rotulo: "Como funciona" },
  { href: "/#avaliacao", rotulo: "Avaliação" },
  { href: "/#escolinhas", rotulo: "Escolinhas" },
  { href: "/#clubes", rotulo: "Clubes" },
] as const;

export type CabecalhoPublicoProps = {
  className?: string;
};

/**
 * Cabeçalho das rotas públicas (home e ficha do atleta) — fora do grupo
 * `(app)`, então cada rota que o usa importa `estilos.css` e as fontes do
 * design system por conta própria (mesmo padrão de /profissional/flavio).
 * Os links de âncora apontam para `/#secao`: funcionam tanto na própria
 * home quanto a partir da ficha pública, navegando para a home antes de
 * rolar até a seção.
 */
export function CabecalhoPublico({ className }: CabecalhoPublicoProps) {
  return (
    <header className={cn("fc-cabecalho", className)}>
      <div className="fc-cabecalho-conteudo">
        <Link href="/" className="fc-marca">
          <span className="fc-marca-nome">
            Futsal <em>College</em>
          </span>
        </Link>
        <nav className="fc-cabecalho-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.rotulo}
            </Link>
          ))}
          <Link href="/entrar" className="fc-cabecalho-nav__entrar">
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
