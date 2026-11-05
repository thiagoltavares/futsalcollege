import { describe, expect, it } from "vitest";
import { contatoValido, esquemaPesquisa, formatarContato, mascaraContato } from "./pesquisa";

const responsavelCompleto = {
  perfil: "responsavel",
  nivel_filho: "rendimento",
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

  it("exige de quem é responsável dizer escolinha ou rendimento", () => {
    expect(esquemaPesquisa.safeParse({ ...responsavelCompleto, nivel_filho: "" }).success).toBe(
      false,
    );
    const semCampo = { ...responsavelCompleto } as Record<string, unknown>;
    delete semCampo.nivel_filho;
    expect(esquemaPesquisa.safeParse(semCampo).success).toBe(false);
  });

  it("aceita os três valores de escolinha ou rendimento e recusa o resto", () => {
    for (const nivel of ["escolinha", "rendimento", "nao_sei"]) {
      expect(esquemaPesquisa.safeParse({ ...responsavelCompleto, nivel_filho: nivel }).success).toBe(
        true,
      );
    }
    expect(esquemaPesquisa.safeParse({ ...responsavelCompleto, nivel_filho: "academy" }).success).toBe(
      false,
    );
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

  it("formata telefone do jeito que for digitado no mesmo padrão", () => {
    expect(formatarContato("85996595034")).toBe("(85) 99659-5034");
    expect(formatarContato("(85) 99615-5722")).toBe("(85) 99615-5722");
    expect(formatarContato("+55 85 9 9615-5722")).toBe("(85) 99615-5722");
    expect(formatarContato("5585996595034")).toBe("(85) 99659-5034");
    expect(formatarContato("85 3456.7890")).toBe("(85) 3456-7890");
  });

  it("deixa e-mail e texto que não é telefone como vieram", () => {
    expect(formatarContato("  Pai@Exemplo.com ")).toBe("pai@exemplo.com");
    expect(formatarContato("99999")).toBe("99999");
  });

  it("mascara o telefone aos poucos enquanto a pessoa digita", () => {
    expect(mascaraContato("8")).toBe("(8");
    expect(mascaraContato("85")).toBe("(85");
    expect(mascaraContato("859")).toBe("(85) 9");
    expect(mascaraContato("8599659")).toBe("(85) 99659");
    expect(mascaraContato("85996595")).toBe("(85) 99659-5");
    expect(mascaraContato("8534567890")).toBe("(85) 3456-7890");
    expect(mascaraContato("85996595034")).toBe("(85) 99659-5034");
    expect(mascaraContato("(85) 99659-50345")).toBe("(85) 99659-5034");
    expect(mascaraContato("5585996595034")).toBe("(85) 99659-5034");
    expect(mascaraContato("")).toBe("");
  });

  it("não mascara quando é e-mail", () => {
    expect(mascaraContato("pai@")).toBe("pai@");
    expect(mascaraContato("joao85")).toBe("joao85");
  });
});
