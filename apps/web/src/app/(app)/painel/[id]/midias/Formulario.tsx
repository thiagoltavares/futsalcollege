"use client";

import { useActionState } from "react";
import { Aviso, Botao, Campo, EnvioArquivo } from "@/ui";
import { enviarMidia } from "./acoes";

export function FormularioEnvioMidia({ atletaId }: { atletaId: string }) {
  const acao = enviarMidia.bind(null, atletaId);
  const [estado, disparar, pendente] = useActionState(acao, null);

  return (
    <form action={disparar} className="fc-form">
      <Campo
        id="arquivo"
        rotulo="Foto ou vídeo"
        ajuda="JPEG, PNG, WEBP, HEIC, MP4, MOV ou WEBM."
      >
        {({ id, "aria-describedby": descritoPor }) => (
          <EnvioArquivo
            id={id}
            aria-describedby={descritoPor}
            name="arquivo"
            accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
            required
          />
        )}
      </Campo>

      <Campo
        id="legenda"
        rotulo="Legenda"
        opcional
        ajuda="Texto livre, até 280 caracteres. Nunca escreva escola, local ou horário de treino, nem telefone — isso não aparece em lugar nenhum público."
      >
        {(campo) => <textarea {...campo} name="legenda" maxLength={280} rows={2} />}
      </Campo>

      <Botao type="submit" carregando={pendente}>
        Enviar
      </Botao>

      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
    </form>
  );
}
