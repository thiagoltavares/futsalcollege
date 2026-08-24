import { describe, expect, it } from "vitest";
import {
  CAMPOS_ATLETA,
  campoVisivel,
  camposVisiveis,
} from "./visibilidade";

describe("política de visibilidade", () => {
  it("expõe publicamente só o que descreve o atleta", () => {
    expect(camposVisiveis("publico").sort()).toEqual(
      [
        "apelido",
        "categoria",
        "clube_atual",
        "estado",
        "peso",
        "pe_dominante",
        "posicao",
        "altura",
      ].sort(),
    );
  });

  it("não expõe publicamente nada que identifique a pessoa", () => {
    for (const campo of ["nome_completo", "data_nascimento", "cidade", "contato_responsavel"]) {
      expect(campoVisivel(campo, "publico")).toBe(false);
    }
  });

  it("libera identificação para olheiro verificado", () => {
    expect(campoVisivel("nome_completo", "verificado")).toBe(true);
    expect(campoVisivel("cidade", "verificado")).toBe(true);
  });

  it("nunca expõe dado de saúde a olheiro verificado", () => {
    expect(campoVisivel("avaliacao_postural", "verificado")).toBe(false);
    expect(campoVisivel("massa_magra", "verificado")).toBe(false);
  });

  it("libera dado de saúde só para responsável e profissional", () => {
    expect(campoVisivel("massa_magra", "responsavel")).toBe(true);
    expect(campoVisivel("massa_magra", "profissional")).toBe(true);
  });

  it("não conhece nenhum campo que localize a criança", () => {
    for (const proibido of ["bairro", "endereco", "escola", "horario_treino", "local_treino"]) {
      expect(Object.keys(CAMPOS_ATLETA)).not.toContain(proibido);
    }
  });
});
