import type { HTMLAttributes } from "react";
import { cn } from "./util";

export type CartaoProps = HTMLAttributes<HTMLDivElement> & {
  /** Remove sombra/relevo — para cartão dentro de outro cartão, por exemplo. */
  plano?: boolean;
};

export function Cartao({ plano, className, children, ...props }: CartaoProps) {
  return (
    <div className={cn("fc-cartao", plano && "fc-cartao--plana", className)} {...props}>
      {children}
    </div>
  );
}
