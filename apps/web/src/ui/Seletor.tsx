"use client";

import { useId, useRef, useState } from "react";
import { cn } from "./util";

export type OpcaoSeletor = {
  valor: string;
  /** O que aparece no botão da opção (ex.: "CE"). */
  rotulo: string;
  /** Nome por extenso para leitor de tela, quando o rótulo é sigla (ex.: "Ceará"). */
  nomeAcessivel?: string;
};

export type SeletorProps = {
  /** `name` do campo no formulário: o valor vai num `<input type="hidden">`. */
  nome: string;
  rotulo: string;
  opcoes: readonly OpcaoSeletor[];
  /**
   * Texto da opção vazia, sempre a primeira da grade. Escolher ela grava
   * string vazia — o mesmo que um `<select>` com `<option value="">`.
   */
  vazio?: string;
  opcional?: boolean;
  ajuda?: string;
  /** Colunas da grade de opções na folha (o celular é o alvo). */
  colunas?: 2 | 3 | 4 | 5;
  valorInicial?: string;
  className?: string;
};

/**
 * Seleção do design system, no lugar do `<select>` nativo — a roleta do
 * celular é pequena, cobre metade da tela e não segue a marca.
 *
 * O campo parece um input: mostra o valor escolhido e uma seta. Tocar abre
 * uma folha que sobe de baixo (no celular) ou uma janela no meio (tela
 * larga), com as opções em grade de botões grandes. Tocar numa opção
 * escolhe e fecha.
 *
 * Feito sobre o `<dialog>` nativo com `showModal()`: Esc fecha, o foco
 * fica preso dentro enquanto está aberto e volta para o campo ao fechar, e
 * a folha vai para a camada de cima do navegador — aparece inteira mesmo
 * dentro de um contêiner com `overflow` cortado ou `transform` (a home de
 * pré-lançamento tem os dois).
 *
 * O valor viaja num `<input type="hidden">`, então o formulário em volta
 * lê `FormData` igual leria um `<select>`.
 */
export function Seletor({
  nome,
  rotulo,
  opcoes,
  vazio = "Prefiro não dizer",
  opcional,
  ajuda,
  colunas = 3,
  valorInicial = "",
  className,
}: SeletorProps) {
  const [valor, setValor] = useState(valorInicial);
  const folhaRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const atual = opcoes.find((o) => o.valor === valor);

  function abrir() {
    const folha = folhaRef.current;
    if (!folha) return;
    folha.showModal();
    // Abre já com o foco na opção marcada, não no botão de fechar.
    folha.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
  }

  function escolher(novo: string) {
    setValor(novo);
    folhaRef.current?.close();
  }

  const todas: OpcaoSeletor[] = [{ valor: "", rotulo: vazio }, ...opcoes];

  return (
    <div className={cn("fc-campo fc-seletor", className)}>
      <span className="fc-campo__rotulo" id={`${id}-rotulo`}>
        {rotulo}
        {opcional && <span className="fc-campo__opcional"> (opcional)</span>}
      </span>

      <input type="hidden" name={nome} value={valor} />

      <button
        type="button"
        id={`${id}-campo`}
        className="fc-input fc-seletor__campo"
        aria-haspopup="dialog"
        aria-labelledby={`${id}-rotulo ${id}-campo`}
        aria-describedby={ajuda ? `${id}-ajuda` : undefined}
        data-vazio={valor === "" ? "" : undefined}
        onClick={abrir}
      >
        <span>{atual ? (atual.nomeAcessivel ? `${atual.nomeAcessivel} (${atual.rotulo})` : atual.rotulo) : vazio}</span>
      </button>

      {ajuda && (
        <p id={`${id}-ajuda`} className="fc-campo__ajuda">
          {ajuda}
        </p>
      )}

      <dialog
        ref={folhaRef}
        className="fc-seletor__folha"
        aria-labelledby={`${id}-titulo`}
        // Toque fora da folha (no fundo escurecido) fecha.
        onClick={(evento) => {
          if (evento.target === evento.currentTarget) folhaRef.current?.close();
        }}
      >
        <div className="fc-seletor__conteudo">
          <div className="fc-seletor__topo">
            <p className="fc-seletor__titulo" id={`${id}-titulo`}>
              {rotulo}
            </p>
            <button
              type="button"
              className="fc-seletor__fechar"
              onClick={() => folhaRef.current?.close()}
            >
              Fechar
            </button>
          </div>

          <div className="fc-seletor__grade" data-colunas={colunas} role="group" aria-labelledby={`${id}-titulo`}>
            {todas.map((opcao) => (
              <button
                key={opcao.valor || "vazio"}
                type="button"
                className="fc-seletor__opcao"
                data-vazio={opcao.valor === "" ? "" : undefined}
                aria-pressed={opcao.valor === valor}
                aria-label={opcao.nomeAcessivel}
                onClick={() => escolher(opcao.valor)}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}
