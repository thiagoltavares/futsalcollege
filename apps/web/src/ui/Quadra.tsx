import type { SVGAttributes } from "react";
import { cn } from "./util";

export type QuadraProps = SVGAttributes<SVGSVGElement>;

/**
 * Grafismo de linhas de quadra de futsal, para o fundo de um cabeçalho —
 * hoje só o hero da home, mas pensado para outros cabeçalhos reaproveitarem
 * (por isso mora em `ui/`, não dentro de `app/page.tsx`).
 *
 * Recuperado da página antiga do Flávio (`profissional/flavio/page.tsx`,
 * antes da unificação em `5ad4165` — ver histórico do Git), que tinha fundo
 * escuro e traço osso a 14% de opacidade. Aqui o fundo é claro (osso/papel,
 * ver `estilos.css`), então a cor não pode ser reaproveitada como estava:
 * osso quase-transparente sobre osso não apareceria. `.fc-quadra` (abaixo)
 * troca para tinta a uma opacidade bem baixa — sutil o bastante para não
 * brigar com o título em Big Shoulders nem com o texto de apoio, que
 * continuam por cima via `z-index` de quem usa este componente.
 *
 * Posicionamento (`position: absolute; inset: 0`) e cor vêm da classe
 * `.fc-quadra`; este componente só desenha o traço. Quem usa precisa
 * garantir `position: relative` (ou similar) no ancestral direto para o
 * `absolute` valer em relação a ele, e `overflow: hidden` se a rotação
 * puder vazar para fora da caixa.
 */
export function Quadra({ className, ...props }: QuadraProps) {
  return (
    <svg
      className={cn("fc-quadra", className)}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g transform="rotate(-7 600 400)" fill="none" stroke="currentColor" strokeWidth="1.25">
        <rect x="60" y="60" width="1080" height="680" />
        <line x1="600" y1="60" x2="600" y2="740" />
        <circle cx="600" cy="400" r="112" />
        <circle cx="600" cy="400" r="3.5" fill="currentColor" stroke="none" />
        <path d="M60 250 A 170 170 0 0 1 60 550" />
        <path d="M1140 250 A 170 170 0 0 0 1140 550" />
        <line x1="230" y1="392" x2="230" y2="408" />
        <line x1="970" y1="392" x2="970" y2="408" />
      </g>
    </svg>
  );
}
