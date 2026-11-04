"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { Aviso, Botao, Campo } from "@/ui";

/** Formulário de login por link mágico — extraído da página para deixar
 * `/entrar/page.tsx` como Server Component, capaz de buscar (no servidor,
 * atrás das duas travas) a lista de usuários do atalho de desenvolvimento.
 *
 * `permitirCadastro` decide se um e-mail novo vira conta. No
 * pré-lançamento (site fechado, ver `lib/preLancamento.ts`) é `false`: só
 * quem já tem conta recebe o link, e um visitante curioso não cria conta
 * nem gasta o limite de envio de e-mail do Supabase. Nesse modo a resposta
 * é a mesma para e-mail com e sem conta, para a tela não revelar quem tem
 * acesso. Isto é a camada da tela; a trava de verdade é o cadastro
 * desligado nas configurações de Auth do Supabase. */
export function FormularioEntrar({ permitirCadastro }: { permitirCadastro: boolean }) {
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
      options: {
        emailRedirectTo: `${location.origin}/auth/confirmar`,
        shouldCreateUser: permitirCadastro,
      },
    });

    setEnviando(false);
    // Sem cadastro, e-mail sem conta volta erro ("signups not allowed"):
    // trata como enviado, para não revelar quem tem acesso. Erro de envio
    // de verdade (limite, rede) continua aparecendo.
    const semConta = error && !permitirCadastro && /signup|not allowed|otp_disabled/i.test(`${error.code ?? ""} ${error.message}`);
    if (error && !semConta) setErro("Não consegui enviar o link. Confira o e-mail e tente de novo.");
    else setEnviado(true);
  }

  if (enviado) {
    return (
      <Aviso tipo="sucesso">
        {permitirCadastro ? (
          <>
            Link enviado para <strong>{email}</strong>. Abra o e-mail para entrar.
          </>
        ) : (
          <>
            Se <strong>{email}</strong> tiver acesso, o link chega em instantes. Abra o e-mail
            para entrar.
          </>
        )}
      </Aviso>
    );
  }

  return (
    <form onSubmit={enviar} className="fc-form">
      <Campo id="email" rotulo={permitirCadastro ? "E-mail do responsável" : "Seu e-mail"}>
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
