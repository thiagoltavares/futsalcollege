import type { ReactNode } from "react";
import { cn } from "./util";

export type AvisoProps = {
  tipo: "erro" | "sucesso" | "aviso";
  children: ReactNode;
  className?: string;
};

const ICONE: Record<AvisoProps["tipo"], string> = {
  erro: "!",
  sucesso: "✓",
  aviso: "⚠",
};

/**
 * Banner de erro/sucesso/aviso. `role="alert"` em erro (o mesmo papel que as
 * telas já usavam em `<p role="alert">`) e `role="status"` em sucesso e
 * aviso, para leitor de tela anunciar sem exigir foco. `aviso` é o tom
 * usado para destacar algo que existe de propósito mas não é um estado do
 * formulário — ex.: o atalho de login de desenvolvimento em `/entrar`.
 */
export function Aviso({ tipo, children, className }: AvisoProps) {
  return (
    <div
      className={cn("fc-aviso", `fc-aviso--${tipo}`, className)}
      role={tipo === "erro" ? "alert" : "status"}
    >
      <span className="fc-aviso__icone" aria-hidden="true">
        {ICONE[tipo]}
      </span>
      <span>{children}</span>
    </div>
  );
}
