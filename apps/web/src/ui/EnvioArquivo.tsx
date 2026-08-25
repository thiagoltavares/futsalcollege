"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "./util";

export type EnvioArquivoProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Texto do botão visível. */
  textoBotao?: string;
};

/**
 * Input de arquivo estilizado que mostra o nome do arquivo escolhido.
 * Continua sendo um `<input type="file">` real com o mesmo `name`/`id`
 * recebidos — o `FormData` de quem consome o formulário não muda.
 */
export function EnvioArquivo({
  className,
  textoBotao = "Escolher arquivo",
  onChange,
  id: idExterno,
  ...props
}: EnvioArquivoProps) {
  const idGerado = useId();
  const id = idExterno ?? idGerado;
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  return (
    <label htmlFor={id} className={cn("fc-arquivo", className)}>
      <input
        id={id}
        type="file"
        className="fc-arquivo__input"
        onChange={(evento) => {
          setNomeArquivo(evento.target.files?.[0]?.name ?? null);
          onChange?.(evento);
        }}
        {...props}
      />
      <span className="fc-arquivo__botao">{textoBotao}</span>
      <span className="fc-arquivo__nome" data-escolhido={nomeArquivo ? "true" : "false"}>
        {nomeArquivo ?? "Nenhum arquivo escolhido"}
      </span>
    </label>
  );
}
