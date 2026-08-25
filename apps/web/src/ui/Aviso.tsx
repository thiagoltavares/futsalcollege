import type { ReactNode } from "react";
import { cn } from "./util";

export type AvisoProps = {
  tipo: "erro" | "sucesso";
  children: ReactNode;
  className?: string;
};

/**
 * Banner de erro/sucesso. `role="alert"` em erro (o mesmo papel que as
 * telas já usavam em `<p role="alert">`) e `role="status"` em sucesso, para
 * leitor de tela anunciar sem exigir foco.
 */
export function Aviso({ tipo, children, className }: AvisoProps) {
  return (
    <div
      className={cn("fc-aviso", `fc-aviso--${tipo}`, className)}
      role={tipo === "erro" ? "alert" : "status"}
    >
      <span className="fc-aviso__icone" aria-hidden="true">
        {tipo === "erro" ? "!" : "✓"}
      </span>
      <span>{children}</span>
    </div>
  );
}
