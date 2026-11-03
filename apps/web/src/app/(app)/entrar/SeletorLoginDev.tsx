import { entrarComoDev } from "./loginDev.acoes";
import { ORDEM_PERSONAS, ROTULO_PERSONA, type UsuarioLoginDev } from "./loginDev.servidor";
import { Aviso, Botao, Campo, Cartao, Selecao } from "@/ui";

/**
 * Bloco do atalho de login de demonstração. Renderizado só quando
 * `/entrar/page.tsx` já checou `loginDevHabilitado()` — mas continua sem
 * nenhum estado próprio de propósito (nem `"use client"`): é um `<form>`
 * comum, enviado pelo navegador direto para a Server Action
 * `entrarComoDev`, que checa a trava de novo antes de criar sessão.
 *
 * Um `<optgroup>` por persona, na ordem de `ORDEM_PERSONAS`, com no máximo
 * duas contas em cada — o corte é feito em `listarUsuariosLoginDev`, e aqui
 * só agrupamos o que chegou. Grupos vazios não são desenhados: num seed
 * recém-aplicado, "Sem persona" não existe.
 */
export function SeletorLoginDev({ usuarios }: { usuarios: UsuarioLoginDev[] }) {
  const grupos = ORDEM_PERSONAS.map((persona) => ({
    persona,
    contas: usuarios.filter((u) => u.persona === persona),
  })).filter((g) => g.contas.length > 0);

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
            ajuda="Duas contas por persona — as duas que mais diferem entre si. O banco tem mais, mas abririam a mesma tela."
          >
            {(campo) => (
              <Selecao {...campo} name="usuario_id" required defaultValue="">
                <option value="" disabled>
                  Escolha uma persona
                </option>
                {grupos.map(({ persona, contas }) => (
                  <optgroup key={persona} label={ROTULO_PERSONA[persona]}>
                    {contas.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.rotulo}
                      </option>
                    ))}
                  </optgroup>
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
