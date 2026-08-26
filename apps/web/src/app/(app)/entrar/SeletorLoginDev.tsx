import { entrarComoDev } from "./loginDev.acoes";
import type { UsuarioLoginDev } from "./loginDev.servidor";
import { Aviso, Botao, Campo, Cartao, Selecao } from "@/ui";

/**
 * Bloco do atalho de login de desenvolvimento. Renderizado só quando
 * `/entrar/page.tsx` já checou `loginDevHabilitado()` — mas continua sem
 * nenhum estado próprio de propósito (nem `"use client"`): é um `<form>`
 * comum, enviado pelo navegador direto para a Server Action
 * `entrarComoDev`, que checa as duas travas de novo antes de criar sessão.
 *
 * A lista já chega ordenada (mais atletas primeiro) de `listarUsuariosLoginDev`
 * — aqui só separamos em dois `<optgroup>`, com atleta e sem atleta, para
 * que quem tem interesse em ver o painel cheio nunca escolha por engano uma
 * conta sem nenhum. O rótulo de cada opção (não o cabeçalho do grupo) é
 * quem diz, com dado real de `profissionais`, se a conta sem atleta é de um
 * profissional — ver `rotuloUsuarioLoginDev` em `loginDev.servidor.ts`.
 */
export function SeletorLoginDev({ usuarios }: { usuarios: UsuarioLoginDev[] }) {
  const comAtleta = usuarios.filter((u) => u.quantidadeAtletas > 0);
  const semAtleta = usuarios.filter((u) => u.quantidadeAtletas === 0);

  return (
    <Cartao className="fc-cartao--dev">
      <Aviso tipo="aviso">
        <strong>Ambiente de demonstração.</strong> Entra direto como qualquer usuário da base, sem
        senha e sem link mágico. Está ligado por <code>NEXT_PUBLIC_LOGIN_DEV</code> — inclusive
        aqui. Os perfis desta base são fictícios, criados para avaliação do produto; nenhuma
        criança real tem cadastro.
      </Aviso>

      {usuarios.length === 0 ? (
        <p className="fc-campo__ajuda" style={{ marginTop: "1rem" }}>
          Nenhum usuário encontrado no banco local. Rode <code>db:reset</code> para carregar o
          seed.
        </p>
      ) : (
        <form action={entrarComoDev} className="fc-form" style={{ marginTop: "1.25rem" }}>
          <Campo
            id="usuario_id"
            rotulo="Entrar como"
            ajuda="Responsáveis com mais atletas aparecem primeiro — são os mais úteis para testar o painel."
          >
            {(campo) => (
              <Selecao {...campo} name="usuario_id" required defaultValue="">
                <option value="" disabled>
                  Escolha um usuário do seed
                </option>
                {comAtleta.length > 0 && (
                  <optgroup label="Responsáveis (com atleta)">
                    {comAtleta.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.rotulo}
                      </option>
                    ))}
                  </optgroup>
                )}
                {semAtleta.length > 0 && (
                  <optgroup label="Sem atleta">
                    {semAtleta.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.rotulo}
                      </option>
                    ))}
                  </optgroup>
                )}
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
