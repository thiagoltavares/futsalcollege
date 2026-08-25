"use client";

import { CONTEXTOS_AVALIACAO, ROTULO_CONTEXTO } from "@futsalcollege/core";
import type { Eixo, ItemRubrica } from "@futsalcollege/core";
import { useActionState } from "react";
import { publicarLaudo } from "./acoes";
import { Aviso, Botao, Campo, Selecao } from "@/ui";

const NOTAS = ["1", "2", "3", "4", "5"] as const;

type Grupo = { eixo: Eixo; rotulo: string; itens: ItemRubrica[] };

export function FormularioAvaliacao({
  atletaId,
  grupos,
  nomeInicial,
}: {
  atletaId: string;
  rubricaVersao: string;
  grupos: Grupo[];
  nomeInicial: string;
}) {
  const acao = publicarLaudo.bind(null, atletaId);
  const [estado, disparar, pendente] = useActionState(acao, null);

  return (
    <form action={disparar} className="fc-form">
      {grupos
        .filter((grupo) => grupo.itens.length > 0)
        .map((grupo) => (
          <fieldset key={grupo.eixo} className="fc-fieldset fc-form">
            <legend className="fc-fieldset__legenda">{grupo.rotulo}</legend>

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

        <Campo id="avaliador_nome" rotulo="Seu nome (avaliador)">
          {(campo) => (
            <input
              {...campo}
              name="avaliador_nome"
              required
              maxLength={120}
              defaultValue={nomeInicial}
            />
          )}
        </Campo>

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
