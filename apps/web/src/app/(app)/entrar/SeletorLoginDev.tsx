import { entrarComoDev } from "./loginDev.acoes";
import type { UsuarioLoginDev } from "./loginDev.servidor";
import { Aviso, Botao, Campo, Cartao, Selecao } from "@/ui";

/**
 * Bloco do atalho de login de desenvolvimento. Renderizado só quando
 * `/entrar/page.tsx` já checou `loginDevHabilitado()` — mas continua sem
 * nenhum estado próprio de propósito (nem `"use client"`): é um `<form>`
 * comum, enviado pelo navegador direto para a Server Action
 * `entrarComoDev`, que checa as duas travas de novo antes de criar sessão.
 */
export function SeletorLoginDev({ usuarios }: { usuarios: UsuarioLoginDev[] }) {
  return (
    <Cartao className="fc-cartao--dev">
      <Aviso tipo="aviso">
        <strong>Atalho de desenvolvimento.</strong> Entra direto como um usuário do banco local,
        sem passar pelo link mágico. Só existe fora de produção, com{" "}
        <code>NEXT_PUBLIC_LOGIN_DEV</code> ligado — nunca aparece para um responsável de verdade.
      </Aviso>

      {usuarios.length === 0 ? (
        <p className="fc-campo__ajuda" style={{ marginTop: "1rem" }}>
          Nenhum usuário encontrado no banco local. Rode <code>db:reset</code> para carregar o
          seed.
        </p>
      ) : (
        <form action={entrarComoDev} className="fc-form" style={{ marginTop: "1.25rem" }}>
          <Campo id="usuario_id" rotulo="Entrar como">
            {(campo) => (
              <Selecao {...campo} name="usuario_id" required defaultValue="">
                <option value="" disabled>
                  Escolha um usuário do seed
                </option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.rotulo}
                  </option>
                ))}
              </Selecao>
            )}
          </Campo>

          <Botao type="submit" variante="secundario">
            Entrar direto (dev)
          </Botao>
        </form>
      )}
    </Cartao>
  );
}
