"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

export default function Entrar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/confirmar` },
    });

    if (error) setErro("Não consegui enviar o link. Confira o e-mail e tente de novo.");
    else setEnviado(true);
  }

  if (enviado) {
    return <p>Link enviado para {email}. Abra o e-mail para entrar.</p>;
  }

  return (
    <form onSubmit={enviar}>
      <label htmlFor="email">E-mail do responsável</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Receber link de acesso</button>
      {erro && <p role="alert">{erro}</p>}
    </form>
  );
}
