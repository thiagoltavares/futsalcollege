"use client";

import { useActionState } from "react";
import { assinarConsentimento } from "./acoes";
import { Aviso, Botao, Campo, EnvioArquivo } from "@/ui";

export function FormularioConsentimento({
  atletaId,
  nomeInicial,
}: {
  atletaId: string;
  nomeInicial: string;
}) {
  const acao = assinarConsentimento.bind(null, atletaId);
  const [estado, disparar, pendente] = useActionState(acao, null);

  return (
    <form action={disparar} className="fc-form">
      <Campo id="nome_responsavel" rotulo="Seu nome completo (responsável legal)">
        {(campo) => (
          <input {...campo} name="nome_responsavel" required maxLength={120} defaultValue={nomeInicial} />
        )}
      </Campo>

      <Campo
        id="documento"
        rotulo="Documento de identidade do responsável"
        ajuda="JPEG, PNG, WEBP, HEIC ou PDF."
      >
        {({ id, "aria-describedby": descritoPor, "aria-invalid": invalido }) => (
          <EnvioArquivo
            id={id}
            aria-describedby={descritoPor}
            aria-invalid={invalido}
            name="documento"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            required
          />
        )}
      </Campo>

      <label className="fc-checkbox-linha">
        <input type="checkbox" name="aceite" required />
        Li e autorizo o tratamento dos dados do atleta nos termos acima.
      </label>

      <Botao type="submit" carregando={pendente}>
        Assinar e ativar o perfil
      </Botao>

      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
    </form>
  );
}
