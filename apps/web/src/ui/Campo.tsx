import type { ReactNode } from "react";
import { cn } from "./util";

export type CampoRenderProps = {
  id: string;
  className: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

export type CampoProps = {
  id: string;
  rotulo: string;
  ajuda?: string;
  erro?: string;
  opcional?: boolean;
  className?: string;
  /**
   * O campo em si (input, select, textarea) é responsabilidade de quem
   * chama — `Campo` só cuida do rótulo, da mensagem de ajuda e do erro, e
   * entrega de volta o `id`/`aria-describedby`/`aria-invalid`/`className`
   * já calculados para conectar tudo corretamente. Isso evita clonar o
   * elemento filho às cegas (frágil com componentes como `Selecao`) e deixa
   * explícito, no local de uso, que atributos como `name`, `required` e
   * `defaultValue` continuam sendo escritos por quem já os escrevia.
   */
  children: (campo: CampoRenderProps) => ReactNode;
};

export function Campo({ id, rotulo, ajuda, erro, opcional, className, children }: CampoProps) {
  const ajudaId = ajuda ? `${id}-ajuda` : undefined;
  const erroId = erro ? `${id}-erro` : undefined;
  const describedBy = [ajudaId, erroId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("fc-campo", className)}>
      <label htmlFor={id} className="fc-campo__rotulo">
        {rotulo}
        {opcional && <span className="fc-campo__opcional"> (opcional)</span>}
      </label>

      {children({
        id,
        className: cn("fc-input", erro && "fc-input--erro"),
        "aria-describedby": describedBy,
        "aria-invalid": erro ? true : undefined,
      })}

      {ajuda && (
        <p id={ajudaId} className="fc-campo__ajuda">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={erroId} role="alert" className="fc-campo__erro">
          {erro}
        </p>
      )}
    </div>
  );
}
