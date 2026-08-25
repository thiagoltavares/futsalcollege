"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { Aviso, Botao, Campo } from "@/ui";

/** Formulário de login por link mágico — extraído da página para deixar
 * `/entrar/page.tsx` como Server Component, capaz de buscar (no servidor,
 * atrás das duas travas) a lista de usuários do atalho de desenvolvimento. */
export function FormularioEntrar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/confirmar` },
    });

    setEnviando(false);
    if (error) setErro("Não consegui enviar o link. Confira o e-mail e tente de novo.");
    else setEnviado(true);
  }

  if (enviado) {
    return (
      <Aviso tipo="sucesso">
        Link enviado para <strong>{email}</strong>. Abra o e-mail para entrar.
      </Aviso>
    );
  }

  return (
    <form onSubmit={enviar} className="fc-form">
      <Campo id="email" rotulo="E-mail do responsável">
        {(campo) => (
          <input
            {...campo}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />
        )}
      </Campo>

      <Botao type="submit" carregando={enviando}>
        Receber link de acesso
      </Botao>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </form>
  );
}
