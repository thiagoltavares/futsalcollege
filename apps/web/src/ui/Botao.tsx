import type { ButtonHTMLAttributes } from "react";
import { cn } from "./util";

type Variante = "primario" | "secundario" | "perigo";

export type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  carregando?: boolean;
};

/**
 * Botão do design system. Não decide nada sobre envio de formulário —
 * apenas repassa `type`, `disabled`, `onClick` etc. como um `<button>`
 * comum, para não mudar o comportamento de nenhuma Server Action existente.
 *
 * `carregando` some com o texto (mantendo a largura do botão) e mostra um
 * spinner por cima, além de forçar `disabled` — mesmo padrão do estado
 * `pendente` de `useActionState` que as telas já usavam antes deste design
 * system existir.
 */
export function Botao({
  variante = "primario",
  carregando = false,
  disabled,
  className,
  children,
  ...props
}: BotaoProps) {
  return (
    <button
      className={cn(
        "fc-botao",
        `fc-botao--${variante}`,
        carregando && "fc-botao--carregando",
        className,
      )}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {children}
      {carregando && (
        <span className="fc-botao__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
    </button>
  );
}
