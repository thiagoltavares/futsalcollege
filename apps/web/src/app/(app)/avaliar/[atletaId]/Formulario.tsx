"use client";

import { CONTEXTOS_AVALIACAO, ROTULO_CONTEXTO } from "@revela10/core";
import type { Eixo, ItemRubrica } from "@revela10/core";
import { useActionState } from "react";
import { publicarLaudo } from "./acoes";
import { Aviso, Botao, Campo, Selecao } from "@/ui";

const NOTAS = ["1", "2", "3", "4", "5"] as const;

type Grupo = { eixo: Eixo; rotulo: string; itens: ItemRubrica[] };
type Assinante = { nome: string; credencial: string };

export function FormularioAvaliacao({
  atletaId,
  grupos,
  assinante,
}: {
  atletaId: string;
  rubricaVersao: string;
  grupos: Grupo[];
  assinante: Assinante;
}) {
  const acao = publicarLaudo.bind(null, atletaId);
  const [estado, disparar, pendente] = useActionState(acao, null);

  return (
    <form action={disparar} className="fc-form">
      {grupos
        .filter((grupo) => grupo.itens.length > 0)
        .map((grupo) => (
          <fieldset key={grupo.eixo} className="fc-fieldset fc-form" data-eixo={grupo.eixo}>
            <legend className="fc-fieldset__legenda fc-fieldset__legenda--eixo">{grupo.rotulo}</legend>

            {grupo.itens.map((item) => (
              <fieldset key={item.chave} className="fc-item-avaliar">
                <legend className="fc-item-avaliar__legenda">{item.rotulo}</legend>
                <div className="fc-escala" role="radiogroup" aria-label={item.rotulo}>
                  {NOTAS.map((nota) => (
                    <label key={nota} className="fc-escala__opcao">
                      <input type="radio" name={`nota_${item.chave}`} value={nota} required />
                      <span className="fc-escala__numero" aria-hidden="true">
                        {nota}
                      </span>
                      <span className="fc-escala__ancora">{item.ancoras[nota]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </fieldset>
        ))}

      <fieldset className="fc-fieldset fc-form">
        <legend className="fc-fieldset__legenda">Sobre esta avaliação</legend>

        <Campo id="contexto" rotulo="Contexto da avaliação">
          {(campo) => (
            <Selecao {...campo} name="contexto" required defaultValue="">
              <option value="" disabled>
                Escolha
              </option>
              {CONTEXTOS_AVALIACAO.map((c) => (
                <option key={c} value={c}>
                  {ROTULO_CONTEXTO[c]}
                </option>
              ))}
            </Selecao>
          )}
        </Campo>

        {/* Quem assina não é mais escolha: é sempre a conta logada. O campo
            de seleção que existia aqui deixava publicar laudo com o nome de
            outro avaliador. O servidor resolve o assinante de novo pela
            sessão e ignora qualquer coisa que venha do formulário — isto
            abaixo é só o aviso de quem vai assinar. */}
        <div className="fc-campo">
          <span className="fc-campo__rotulo">Avaliador</span>
          <p className="fc-assinante">
            <strong>{assinante.nome}</strong>
            <span className="fc-assinante__credencial">{assinante.credencial}</span>
          </p>
          <p className="fc-campo__ajuda">
            Você assina em nome próprio. A ficha do atleta vira link para a sua página.
          </p>
        </div>

        <Campo
          id="texto"
          rotulo="Observações"
          opcional
          ajuda="Texto corrido — aparece na ficha pública e no PDF."
        >
          {(campo) => <textarea {...campo} name="texto" rows={5} maxLength={4000} />}
        </Campo>
      </fieldset>

      <Botao type="submit" carregando={pendente}>
        Publicar avaliação
      </Botao>
      <p className="fc-campo__ajuda">
        Depois de publicada, esta avaliação não pode mais ser editada — uma correção cria uma
        nova versão, e a anterior continua visível.
      </p>

      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
    </form>
  );
}
