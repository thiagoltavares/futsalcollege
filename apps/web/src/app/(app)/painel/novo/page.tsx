"use client";

import { CATEGORIAS, POSICOES } from "@futsalcollege/core";
import { useActionState } from "react";
import { criarAtleta } from "./acoes";
import { Aviso, Botao, Campo, Cartao, Selecao } from "@/ui";

export default function NovoAtleta() {
  const [estado, acao, pendente] = useActionState(criarAtleta, null);

  return (
    <div className="fc-container fc-container--estreito">
      <div className="fc-cabecalho-pagina">
        <p className="fc-rotulo-secao fc-etiqueta-rotulo">Novo cadastro</p>
        <h1 className="fc-titulo">Cadastrar atleta</h1>
        <p className="fc-subtitulo">
          Os dados abaixo formam a ficha pública. Nome completo, data de nascimento
          e cidade só ficam visíveis para olheiro verificado.
        </p>
      </div>

      <Cartao>
        <form action={acao} className="fc-form">
          <Campo id="apelido" rotulo="Como ele é chamado">
            {(campo) => <input {...campo} name="apelido" required maxLength={40} />}
          </Campo>

          <Campo id="categoria" rotulo="Categoria">
            {(campo) => (
              <Selecao {...campo} name="categoria" required defaultValue="">
                <option value="" disabled>
                  Escolha
                </option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Selecao>
            )}
          </Campo>

          <Campo id="posicao" rotulo="Posição" opcional>
            {(campo) => (
              <Selecao {...campo} name="posicao" defaultValue="">
                <option value="">Não informada</option>
                {POSICOES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Selecao>
            )}
          </Campo>

          <fieldset className="fc-fieldset fc-form">
            <legend className="fc-fieldset__legenda">
              Dados que só olheiro verificado enxerga
            </legend>

            <Campo id="nome_completo" rotulo="Nome completo">
              {(campo) => <input {...campo} name="nome_completo" required maxLength={120} />}
            </Campo>

            <Campo id="data_nascimento" rotulo="Data de nascimento">
              {(campo) => <input {...campo} name="data_nascimento" type="date" required />}
            </Campo>

            <Campo id="cidade" rotulo="Cidade" opcional>
              {(campo) => <input {...campo} name="cidade" maxLength={80} />}
            </Campo>
          </fieldset>

          <Botao type="submit" carregando={pendente}>
            Continuar para a autorização
          </Botao>

          {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
        </form>
      </Cartao>
    </div>
  );
}
