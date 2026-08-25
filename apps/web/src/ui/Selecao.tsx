import type { SelectHTMLAttributes } from "react";
import { cn } from "./util";

export type SelecaoProps = SelectHTMLAttributes<HTMLSelectElement>;

/** `<select>` estilizado, com a setinha desenhada em CSS. Uso normal de `<select>` por baixo — nenhum comportamento de formulário muda. */
export function Selecao({ className, children, ...props }: SelecaoProps) {
  return (
    <span className="fc-select-envolucro">
      <select className={cn("fc-input fc-select", className)} {...props}>
        {children}
      </select>
    </span>
  );
}
