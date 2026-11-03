"use client";

import { useEffect, useState } from "react";
import { Quadra } from "@/ui/Quadra";
import { Pesquisa } from "./Pesquisa";

type Fase = "inicio" | "pesquisa";

/**
 * A home de pré-lançamento é uma tela só, que anda de lado sobre a quadra.
 *
 * Duas telas, lado a lado num trilho com o dobro da largura da janela, e
 * uma quadra só desenhada por trás das duas:
 *
 *   inicio   — o hero: a marcação se desenhando, o "10" em traço, o título
 *              e o botão para responder.
 *   pesquisa — o trilho anda meia largura para a esquerda: o hero inteiro
 *              sai pela esquerda (título, "10" e linhas juntos) e a pesquisa
 *              ocupa a tela, no outro lado da mesma quadra.
 *
 * A fase vive na URL (`#pesquisa`), via `history.pushState` — que o Next
 * integra ao roteador (docs "Native History API"). É isso que faz o botão
 * voltar do celular devolver ao hero em vez de sair da página no meio da
 * pesquisa. Nenhum estado próprio vai para o histórico: a fase é lida do
 * `location.hash`.
 *
 * A tela que não está à vista fica `inert`: fora do foco do teclado e do
 * leitor de tela, mesmo enquanto ainda desliza.
 */
export function Palco({ origem }: { origem: string | null }) {
  const [fase, setFase] = useState<Fase>("inicio");

  useEffect(() => {
    const sincronizar = () => setFase(window.location.hash === "#pesquisa" ? "pesquisa" : "inicio");
    window.addEventListener("popstate", sincronizar);
    window.addEventListener("hashchange", sincronizar);
    return () => {
      window.removeEventListener("popstate", sincronizar);
      window.removeEventListener("hashchange", sincronizar);
    };
  }, []);

  function comecar() {
    window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#pesquisa`);
    setFase("pesquisa");
  }

  function voltarAoInicio() {
    if (window.location.hash === "#pesquisa") {
      window.history.back();
    } else {
      setFase("inicio");
    }
  }

  const naPesquisa = fase === "pesquisa";

  return (
    <section className="fc-pre-palco" data-fase={fase} aria-labelledby="pre-titulo">
      <div className="fc-pre-trilho">
        <Quadra />

        <div className="fc-pre-tela fc-pre-tela--inicio" inert={naPesquisa}>
          <svg className="fc-pre-dez" viewBox="14 6 372 382" aria-hidden="true" focusable="false">
            <text x="200" y="384" textAnchor="middle">
              10
            </text>
          </svg>

          <div className="fc-container fc-pre-tela__conteudo">
            <div className="fc-pre-texto">
              <p className="fc-pre-hero__status">
                <span className="fc-pre-hero__ponto" aria-hidden="true" />
                Em construção. Abre em breve, para todo o Brasil.
              </p>
              <h1 id="pre-titulo" className="fc-pre-h1">
                A base vai entrar em quadra.
              </h1>
              <p className="fc-pre-lead">
                Um lugar para mostrar o futsal e o fut7 de base em vídeo. Cada atleta com o seu
                perfil, visto por clubes e olheiros, sem expor a criança.
              </p>
              <div className="fc-pre-hero__acoes">
                <button type="button" className="fc-botao fc-botao--primario" onClick={comecar}>
                  Responder a pesquisa
                </button>
                <p className="fc-pre-hero__nota">
                  Leva 2 minutos. É só tocar nas respostas, sem cadastro.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="fc-pre-tela fc-pre-tela--pesquisa" inert={!naPesquisa}>
          <div className="fc-container fc-pre-tela__conteudo">
            <Pesquisa origem={origem} ativa={naPesquisa} onSair={voltarAoInicio} />
          </div>
        </div>
      </div>
    </section>
  );
}
