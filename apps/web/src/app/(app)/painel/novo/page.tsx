"use client";

import { CATEGORIAS, POSICOES } from "@futsalcollege/core";
import { useActionState } from "react";
import { criarAtleta } from "./acoes";

export default function NovoAtleta() {
  const [estado, acao, pendente] = useActionState(criarAtleta, null);

  return (
    <main>
      <h1>Cadastrar atleta</h1>

      <form action={acao}>
        <label htmlFor="apelido">Como ele é chamado</label>
        <input id="apelido" name="apelido" required maxLength={40} />

        <label htmlFor="categoria">Categoria</label>
        <select id="categoria" name="categoria" required defaultValue="">
          <option value="" disabled>
            Escolha
          </option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label htmlFor="posicao">Posição</label>
        <select id="posicao" name="posicao" defaultValue="">
          <option value="">Não informada</option>
          {POSICOES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <fieldset>
          <legend>Dados que só olheiro verificado enxerga</legend>

          <label htmlFor="nome_completo">Nome completo</label>
          <input id="nome_completo" name="nome_completo" required maxLength={120} />

          <label htmlFor="data_nascimento">Data de nascimento</label>
          <input id="data_nascimento" name="data_nascimento" type="date" required />

          <label htmlFor="cidade">Cidade</label>
          <input id="cidade" name="cidade" maxLength={80} />
        </fieldset>

        <button type="submit" disabled={pendente}>
          {pendente ? "Salvando..." : "Continuar para a autorização"}
        </button>

        {estado?.erro && <p role="alert">{estado.erro}</p>}
      </form>
    </main>
  );
}
