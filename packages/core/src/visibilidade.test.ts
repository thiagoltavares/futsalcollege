import { describe, expect, it } from "vitest";
import {
  CAMPOS_ATLETA,
  campoVisivel,
  camposVisiveis,
  type CampoAtleta,
  type Contexto,
  type Sensibilidade,
} from "./visibilidade";

/**
 * Classificação esperada de cada campo, mantida independente de
 * `CAMPOS_ATLETA` de propósito: isto é a especificação, não um espelho da
 * implementação. Se alguém reclassificar um campo em `visibilidade.ts` (ex.:
 * mover `historico_lesao` de "saude" para "identificacao"), os testes abaixo
 * precisam falhar — o que não acontece se o "esperado" for lido da própria
 * tabela que está sendo testada.
 */
const SENSIBILIDADE_ESPERADA: Record<CampoAtleta, Sensibilidade> = {
  apelido: "publico",
  categoria: "publico",
  posicao: "publico",
  pe_dominante: "publico",
  altura: "publico",
  peso: "publico",
  clube_atual: "publico",
  estado: "publico",

  nome_completo: "identificacao",
  data_nascimento: "identificacao",
  cidade: "identificacao",
  contato_responsavel: "identificacao",

  avaliacao_postural: "saude",
  massa_magra: "saude",
  historico_lesao: "saude",
};

const ACESSO_ESPERADO: Record<Sensibilidade, readonly Contexto[]> = {
  publico: ["publico", "verificado", "responsavel", "profissional"],
  identificacao: ["verificado", "responsavel", "profissional"],
  saude: ["responsavel", "profissional"],
};

const CONTEXTOS: readonly Contexto[] = [
  "publico",
  "verificado",
  "responsavel",
  "profissional",
];

function camposEsperados(sensibilidade: Sensibilidade): string[] {
  return Object.entries(SENSIBILIDADE_ESPERADA)
    .filter(([, s]) => s === sensibilidade)
    .map(([campo]) => campo);
}

describe("política de visibilidade", () => {
  it("a especificação do teste cobre exatamente os campos de CAMPOS_ATLETA", () => {
    // Se um campo novo for adicionado a CAMPOS_ATLETA sem ganhar uma entrada
    // aqui, este teste falha — garante que a verificação abaixo é exaustiva,
    // não uma amostra.
    expect(Object.keys(SENSIBILIDADE_ESPERADA).sort()).toEqual(
      Object.keys(CAMPOS_ATLETA).sort(),
    );
  });

  it("expõe publicamente só o que descreve o atleta", () => {
    expect(camposVisiveis("publico").sort()).toEqual(
      camposEsperados("publico").sort(),
    );
  });

  it("não expõe publicamente nada que identifique a pessoa", () => {
    for (const campo of camposEsperados("identificacao")) {
      expect(campoVisivel(campo, "publico")).toBe(false);
    }
  });

  it("libera identificação para olheiro verificado", () => {
    for (const campo of camposEsperados("identificacao")) {
      expect(campoVisivel(campo, "verificado")).toBe(true);
    }
  });

  it("nunca expõe dado de saúde a público ou a olheiro verificado", () => {
    for (const campo of camposEsperados("saude")) {
      expect(campoVisivel(campo, "publico")).toBe(false);
      expect(campoVisivel(campo, "verificado")).toBe(false);
    }
  });

  it("libera dado de saúde só para responsável e profissional", () => {
    for (const campo of camposEsperados("saude")) {
      expect(campoVisivel(campo, "responsavel")).toBe(true);
      expect(campoVisivel(campo, "profissional")).toBe(true);
    }
  });

  it("camposVisiveis bate exatamente com a classificação esperada, em todo contexto", () => {
    for (const contexto of CONTEXTOS) {
      const esperado = Object.entries(SENSIBILIDADE_ESPERADA)
        .filter(([, sensibilidade]) =>
          ACESSO_ESPERADO[sensibilidade].includes(contexto),
        )
        .map(([campo]) => campo);
      expect(camposVisiveis(contexto).sort()).toEqual(esperado.sort());
    }
  });

  it("não conhece nenhum campo que localize a criança", () => {
    for (const proibido of [
      "bairro",
      "endereco",
      "escola",
      "horario_treino",
      "local_treino",
    ]) {
      expect(Object.keys(CAMPOS_ATLETA)).not.toContain(proibido);
    }
  });

  it("é seguro por padrão: campo desconhecido não é visível em nenhum contexto", () => {
    for (const contexto of CONTEXTOS) {
      expect(campoVisivel("campo_inexistente", contexto)).toBe(false);
    }
  });
});
