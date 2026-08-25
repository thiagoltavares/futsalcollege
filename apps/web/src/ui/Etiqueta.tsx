import type { ReactNode } from "react";
import { cn } from "./util";

const VARIANTE_POR_ESTADO: Record<string, "neutro" | "alerta" | "sucesso" | "perigo"> = {
  rascunho: "neutro",
  aguardando_consentimento: "alerta",
  ativo: "sucesso",
  suspenso: "perigo",
  removido: "neutro",
};

export type EtiquetaProps = {
  /** Estado do perfil (`rascunho`, `aguardando_consentimento`, `ativo`, `suspenso`, `removido`) — decide a cor. O texto exibido continua vindo de quem chama. */
  estado: string;
  children: ReactNode;
  className?: string;
};

export function Etiqueta({ estado, children, className }: EtiquetaProps) {
  const variante = VARIANTE_POR_ESTADO[estado] ?? "neutro";
  return <span className={cn("fc-etiqueta", `fc-etiqueta--${variante}`, className)}>{children}</span>;
}
