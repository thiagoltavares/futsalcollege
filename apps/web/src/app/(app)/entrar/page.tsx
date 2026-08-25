"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { Aviso, Botao, Campo, Cartao } from "@/ui";

export default function Entrar() {
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

  return (
    <div className="fc-container fc-container--estreito">
      <div className="fc-cabecalho-pagina">
        <p className="fc-rotulo-secao fc-etiqueta-rotulo">Acesso do responsável</p>
        <h1 className="fc-titulo">Entrar</h1>
        <p className="fc-subtitulo">
          Enviamos um link de acesso para o seu e-mail. Sem senha para lembrar.
        </p>
      </div>

      <Cartao>
        {enviado ? (
          <Aviso tipo="sucesso">
            Link enviado para <strong>{email}</strong>. Abra o e-mail para entrar.
          </Aviso>
        ) : (
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
        )}
      </Cartao>
    </div>
  );
}
