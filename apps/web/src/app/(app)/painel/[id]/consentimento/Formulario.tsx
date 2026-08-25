"use client";

import { useActionState } from "react";
import { assinarConsentimento } from "./acoes";

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
    <form action={disparar}>
      <label htmlFor="nome_responsavel">Seu nome completo (responsável legal)</label>
      <input
        id="nome_responsavel"
        name="nome_responsavel"
        required
        maxLength={120}
        defaultValue={nomeInicial}
      />

      <label htmlFor="documento">Documento de identidade do responsável</label>
      <input
        id="documento"
        name="documento"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        required
      />

      <label>
        <input type="checkbox" name="aceite" required />
        Li e autorizo o tratamento dos dados do atleta nos termos acima.
      </label>

      <button type="submit" disabled={pendente}>
        {pendente ? "Enviando..." : "Assinar e ativar o perfil"}
      </button>

      {estado?.erro && <p role="alert">{estado.erro}</p>}
    </form>
  );
}
