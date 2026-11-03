import type { SVGAttributes } from "react";
import { cn } from "./util";

export type QuadraProps = SVGAttributes<SVGSVGElement>;

/**
 * A marcação da quadra de futsal — o grafismo de marca do Revela 10.
 *
 * Desenhada em escala real (40 × 20 m, 30 px por metro): linha lateral e de
 * fundo, linha central com o círculo de 3 m, as duas áreas em "D" (arcos de
 * 6 m a partir de cada poste, emendados por 3,16 m de reta), marca do
 * pênalti aos 6 m e segunda marca aos 10 m, arcos de escanteio de 25 cm e
 * as marcas da zona de substituição a 5 m da linha central. Quem joga
 * reconhece: é futsal, não campo, não basquete.
 *
 * O componente só desenha o traço em `currentColor`; cor, posição e
 * recorte vêm da classe `.fc-quadra` e suas variantes em `estilos.css`
 * (`.fc-home-hero .fc-quadra` amplia e corta pelo canto; `.fc-quadra--recorte`
 * é o pedaço para fundos pequenos, como a capa de cartão sem foto). Quem
 * usa garante `position: relative` e `overflow: hidden` no ancestral.
 *
 * Todo traço leva `pathLength={1}`: não muda nada no desenho, mas deixa a
 * home de pré-lançamento animar a marcação sendo pintada só com
 * `stroke-dasharray: 1` / `stroke-dashoffset`, sem medir cada linha.
 */
export function Quadra({ className, ...props }: QuadraProps) {
  return (
    <svg
      className={cn("fc-quadra", className)}
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        {/* laterais e fundo */}
        <rect x="0" y="0" width="1200" height="600" strokeWidth="6" pathLength={1} />
        {/* linha central e círculo de 3 m */}
        <line x1="600" y1="0" x2="600" y2="600" pathLength={1} />
        <circle cx="600" cy="300" r="90" pathLength={1} />
        <circle cx="600" cy="300" r="4" fill="currentColor" stroke="none" />
        {/* área esquerda: arcos de 6 m a partir dos postes (y = 255 e 345) */}
        <path d="M0 75 A180 180 0 0 1 180 255 L180 345 A180 180 0 0 1 0 525" pathLength={1} />
        {/* área direita */}
        <path d="M1200 75 A180 180 0 0 0 1020 255 L1020 345 A180 180 0 0 0 1200 525" pathLength={1} />
        {/* marcas do pênalti (6 m) e segunda marca (10 m) */}
        <circle cx="180" cy="300" r="4" fill="currentColor" stroke="none" />
        <circle cx="300" cy="300" r="4" fill="currentColor" stroke="none" />
        <circle cx="1020" cy="300" r="4" fill="currentColor" stroke="none" />
        <circle cx="900" cy="300" r="4" fill="currentColor" stroke="none" />
        {/* gols (3 m de boca) */}
        <rect x="-30" y="255" width="30" height="90" pathLength={1} />
        <rect x="1200" y="255" width="30" height="90" pathLength={1} />
        {/* arcos de escanteio */}
        <path d="M0 24 A24 24 0 0 0 24 0" pathLength={1} />
        <path d="M1176 0 A24 24 0 0 0 1200 24" pathLength={1} />
        <path d="M0 576 A24 24 0 0 1 24 600" pathLength={1} />
        <path d="M1176 600 A24 24 0 0 1 1200 576" pathLength={1} />
        {/* zona de substituição: marcas a 5 m da linha central, na lateral */}
        <line x1="450" y1="0" x2="450" y2="24" pathLength={1} />
        <line x1="750" y1="0" x2="750" y2="24" pathLength={1} />
        <line x1="450" y1="576" x2="450" y2="600" pathLength={1} />
        <line x1="750" y1="576" x2="750" y2="600" pathLength={1} />
      </g>
    </svg>
  );
}
