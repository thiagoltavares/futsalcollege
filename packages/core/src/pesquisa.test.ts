import { describe, expect, it } from "vitest";
import { contatoValido, esquemaPesquisa } from "./pesquisa";

const responsavelCompleto = {
  perfil: "responsavel",
  enviou_video: ["whatsapp"],
  publica_video: "conhecidos",
  quem_ve_video: "clubes_verificados",
  aceita_contato: false,
};

describe("esquemaPesquisa", () => {
  it("aceita um responsável com o bloco do filho completo", () => {
    expect(esquemaPesquisa.safeParse(responsavelCompleto).success).toBe(true);
  });

  it("exige a pergunta 1 de quem é responsável", () => {
    const r = esquemaPesquisa.safeParse({ ...responsavelCompleto, enviou_video: [] });
    expect(r.success).toBe(false);
  });

  it("exige de quem é responsável a escolha de quem vê o vídeo", () => {
    const r = esquemaPesquisa.safeParse({ ...responsavelCompleto, quem_ve_video: "" });
    expect(r.success).toBe(false);
  });

  it("aceita WhatsApp com DDD e e-mail como contato de novidades", () => {
    expect(contatoValido("(85) 9 9999-9999")).toBe(true);
    expect(contatoValido("+55 85 99999-9999")).toBe(true);
    expect(contatoValido("pai@exemplo.com")).toBe(true);
    expect(contatoValido("99999-9999")).toBe(false);
    expect(contatoValido("pai@")).toBe(false);
    expect(contatoValido("me liga")).toBe(false);
  });

  it("recusa respostas do pai fora das opções de toque", () => {
    expect(esquemaPesquisa.safeParse({ ...responsavelCompleto, preocupacao: "texto livre" }).success).toBe(
      false,
    );
    expect(esquemaPesquisa.safeParse({ ...responsavelCompleto, gasto_mensal: "prefiro_nao_dizer" }).success).toBe(
      true,
    );
  });

  it("recusa resposta de quem vê o vídeo fora das três saídas", () => {
    const r = esquemaPesquisa.safeParse({ ...responsavelCompleto, quem_ve_video: "talvez" });
    expect(r.success).toBe(false);
  });

  it("não exige o bloco do filho de escolinha ou clube", () => {
    const r = esquemaPesquisa.safeParse({
      perfil: "escolinha",
      organizacao: "Escolinha Exemplo",
      enviou_video: [],
      aceita_contato: false,
    });
    expect(r.success).toBe(true);
  });

  it("recusa novidades aceitas sem e-mail", () => {
    const r = esquemaPesquisa.safeParse({ ...responsavelCompleto, aceita_contato: true, contato: "  " });
    expect(r.success).toBe(false);
  });

  it("recusa novidades aceitas com e-mail incompleto, aceita com e-mail válido", () => {
    expect(
      esquemaPesquisa.safeParse({ ...responsavelCompleto, aceita_contato: true, contato: "pai@" }).success,
    ).toBe(false);
    expect(
      esquemaPesquisa.safeParse({ ...responsavelCompleto, aceita_contato: true, contato: "pai@exemplo.com" })
        .success,
    ).toBe(true);
  });

  it("recusa perfil fora da lista e valor fora das opções", () => {
    expect(esquemaPesquisa.safeParse({ ...responsavelCompleto, perfil: "atleta" }).success).toBe(false);
    expect(
      esquemaPesquisa.safeParse({ ...responsavelCompleto, enviou_video: ["tiktok"] }).success,
    ).toBe(false);
  });

  it("recusa origem que não é slug", () => {
    expect(esquemaPesquisa.safeParse({ ...responsavelCompleto, origem: "Sesc Ceará" }).success).toBe(
      false,
    );
    expect(esquemaPesquisa.safeParse({ ...responsavelCompleto, origem: "sesc-ce" }).success).toBe(true);
  });
});
