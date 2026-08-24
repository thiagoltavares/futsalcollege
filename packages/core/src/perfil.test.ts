import { describe, expect, it } from "vitest";
import { ESTADOS_PERFIL, perfilRenderiza, podeTransicionar } from "./perfil";

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
});
