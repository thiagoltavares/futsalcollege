import { describe, expect, it } from "vitest";
import {
  ESTADOS_PERFIL,
  type EstadoPerfil,
  perfilRenderiza,
  podeTransicionar,
} from "./perfil";

/**
 * Matriz de transições esperadas: mantida independente de `podeTransicionar`
 * de propósito. Isto é a especificação, não um espelho da implementação.
 * Se alguém mudasse a tabela `TRANSICOES` em `perfil.ts` (ex.: tornando
 * `removido` reversível), os testes abaixo precisam falhar — o que não
 * acontece se o "esperado" for lido da própria função que está sendo testada.
 */
const TRANSICOES_ESPERADAS: Record<EstadoPerfil, readonly EstadoPerfil[]> = {
  rascunho: ["aguardando_consentimento", "removido"],
  aguardando_consentimento: ["ativo", "removido"],
  ativo: ["suspenso", "removido"],
  suspenso: ["ativo", "removido"],
  removido: [],
};

describe("máquina de estados do perfil", () => {
  it("só o estado ativo renderiza", () => {
    for (const estado of ESTADOS_PERFIL) {
      expect(perfilRenderiza(estado)).toBe(estado === "ativo");
    }
  });

  it("segue o caminho feliz do cadastro", () => {
    expect(podeTransicionar("rascunho", "aguardando_consentimento")).toBe(true);
    expect(podeTransicionar("aguardando_consentimento", "ativo")).toBe(true);
  });

  it("não deixa pular o consentimento", () => {
    expect(podeTransicionar("rascunho", "ativo")).toBe(false);
  });

  it("permite suspender e reativar", () => {
    expect(podeTransicionar("ativo", "suspenso")).toBe(true);
    expect(podeTransicionar("suspenso", "ativo")).toBe(true);
  });

  it("remoção é terminal", () => {
    expect(podeTransicionar("removido", "ativo")).toBe(false);
    expect(podeTransicionar("removido", "rascunho")).toBe(false);
  });

  it("cobrir todos os 25 pares de transição contra a especificação", () => {
    // Garante que a especificação cobre exatamente os estados conhecidos
    expect(Object.keys(TRANSICOES_ESPERADAS).sort()).toEqual(
      ESTADOS_PERFIL.slice().sort(),
    );

    // Testa cada par (de, para) contra a matriz esperada
    for (const de of ESTADOS_PERFIL) {
      for (const para of ESTADOS_PERFIL) {
        const esperado = TRANSICOES_ESPERADAS[de].includes(para);
        const resultado = podeTransicionar(de, para);
        expect(resultado).toBe(esperado);
      }
    }
  });
});
