import { describe, expect, it } from "vitest";
import { CATEGORIAS, esquemaAtleta } from "./esquemas";

describe("esquema do atleta", () => {
  it("aceita um cadastro completo", () => {
    const r = esquemaAtleta.safeParse({
      apelido: "Joãozinho",
      categoria: "Sub-13",
      nome_completo: "João da Silva",
      data_nascimento: "2013-04-02",
      posicao: "Ala",
    });
    expect(r.success).toBe(true);
  });

  it("recusa categoria fora do intervalo Sub-7 a Sub-20", () => {
    const r = esquemaAtleta.safeParse({
      apelido: "X",
      categoria: "Sub-25",
      nome_completo: "Fulano de Tal",
      data_nascimento: "2000-01-01",
    });
    expect(r.success).toBe(false);
  });

  it("cobre todas as categorias de Sub-7 a Sub-20", () => {
    expect(CATEGORIAS).toContain("Sub-7");
    expect(CATEGORIAS).toContain("Sub-20");
    expect(CATEGORIAS).toHaveLength(14);
  });
});

/**
 * Cobertura exaustiva, não por amostra — instrução explícita: testes fracos
 * (que checam só o caminho feliz e um caso de erro) já deixaram passar
 * schema sabotado em tarefas anteriores. Cada limite abaixo é testado nas
 * DUAS bordas (o último valor aceito E o primeiro rejeitado), então afrouxar
 * um `.min`, `.max`, `.length` ou trocar um enum por outro tem que quebrar
 * pelo menos um teste aqui.
 */

const BASE = {
  apelido: "Joãozinho",
  categoria: "Sub-13" as const,
  nome_completo: "João da Silva",
  data_nascimento: "2013-04-02",
};

function aceita(dados: unknown) {
  const r = esquemaAtleta.safeParse(dados);
  return r.success;
}

describe("esquema do atleta — todas as 14 categorias", () => {
  it.each(CATEGORIAS)("aceita a categoria '%s'", (categoria) => {
    expect(aceita({ ...BASE, categoria })).toBe(true);
  });

  it.each([
    "Sub-6", // um abaixo do menor válido
    "Sub-21", // um acima do maior válido
    "Sub-1",
    "Sub-100",
    "sub-13", // caixa errada
    "Sub13", // sem hífen
    "Adulto",
    "",
  ])("recusa a categoria inválida '%s'", (categoria) => {
    expect(aceita({ ...BASE, categoria })).toBe(false);
  });
});

describe("esquema do atleta — campos obrigatórios ausentes", () => {
  const OBRIGATORIOS = ["apelido", "categoria", "nome_completo", "data_nascimento"] as const;

  it.each(OBRIGATORIOS)("recusa quando falta '%s'", (campo) => {
    const dados = { ...BASE };
    delete (dados as Record<string, unknown>)[campo];
    const r = esquemaAtleta.safeParse(dados);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === campo)).toBe(true);
    }
  });

  it("aceita quando só os obrigatórios estão presentes (opcionais ausentes)", () => {
    expect(aceita(BASE)).toBe(true);
  });
});

describe("esquema do atleta — limites de tamanho e faixa, nas bordas", () => {
  it("apelido: string vazia é recusada", () => {
    expect(aceita({ ...BASE, apelido: "" })).toBe(false);
  });

  it("apelido: 1 caractere é aceito (mínimo)", () => {
    expect(aceita({ ...BASE, apelido: "X" })).toBe(true);
  });

  it("apelido: 40 caracteres é aceito (máximo)", () => {
    expect(aceita({ ...BASE, apelido: "A".repeat(40) })).toBe(true);
  });

  it("apelido: 41 caracteres é recusado (acima do máximo)", () => {
    expect(aceita({ ...BASE, apelido: "A".repeat(41) })).toBe(false);
  });

  it("nome_completo: 4 caracteres é recusado (abaixo do mínimo)", () => {
    expect(aceita({ ...BASE, nome_completo: "João" })).toBe(false);
  });

  it("nome_completo: 5 caracteres é aceito (mínimo)", () => {
    expect(aceita({ ...BASE, nome_completo: "Joana" })).toBe(true);
  });

  it("nome_completo: 120 caracteres é aceito (máximo)", () => {
    expect(aceita({ ...BASE, nome_completo: "A".repeat(120) })).toBe(true);
  });

  it("nome_completo: 121 caracteres é recusado (acima do máximo)", () => {
    expect(aceita({ ...BASE, nome_completo: "A".repeat(121) })).toBe(false);
  });

  it("altura_cm: 89 é recusado (abaixo do mínimo)", () => {
    expect(aceita({ ...BASE, altura_cm: 89 })).toBe(false);
  });

  it("altura_cm: 90 é aceito (mínimo)", () => {
    expect(aceita({ ...BASE, altura_cm: 90 })).toBe(true);
  });

  it("altura_cm: 220 é aceito (máximo)", () => {
    expect(aceita({ ...BASE, altura_cm: 220 })).toBe(true);
  });

  it("altura_cm: 221 é recusado (acima do máximo)", () => {
    expect(aceita({ ...BASE, altura_cm: 221 })).toBe(false);
  });

  it("altura_cm: valor não inteiro é recusado", () => {
    expect(aceita({ ...BASE, altura_cm: 150.5 })).toBe(false);
  });

  it("peso_kg: 14.9 é recusado (abaixo do mínimo)", () => {
    expect(aceita({ ...BASE, peso_kg: 14.9 })).toBe(false);
  });

  it("peso_kg: 15 é aceito (mínimo)", () => {
    expect(aceita({ ...BASE, peso_kg: 15 })).toBe(true);
  });

  it("peso_kg: 150 é aceito (máximo)", () => {
    expect(aceita({ ...BASE, peso_kg: 150 })).toBe(true);
  });

  it("peso_kg: 150.1 é recusado (acima do máximo)", () => {
    expect(aceita({ ...BASE, peso_kg: 150.1 })).toBe(false);
  });

  it("clube_atual: 80 caracteres é aceito (máximo)", () => {
    expect(aceita({ ...BASE, clube_atual: "A".repeat(80) })).toBe(true);
  });

  it("clube_atual: 81 caracteres é recusado (acima do máximo)", () => {
    expect(aceita({ ...BASE, clube_atual: "A".repeat(81) })).toBe(false);
  });

  it("estado_uf: 1 caractere é recusado (abaixo do tamanho exigido)", () => {
    expect(aceita({ ...BASE, estado_uf: "C" })).toBe(false);
  });

  it("estado_uf: 2 caracteres é aceito (tamanho exigido)", () => {
    expect(aceita({ ...BASE, estado_uf: "CE" })).toBe(true);
  });

  it("estado_uf: 3 caracteres é recusado (acima do tamanho exigido)", () => {
    expect(aceita({ ...BASE, estado_uf: "CEA" })).toBe(false);
  });

  it("cidade: 80 caracteres é aceito (máximo)", () => {
    expect(aceita({ ...BASE, cidade: "A".repeat(80) })).toBe(true);
  });

  it("cidade: 81 caracteres é recusado (acima do máximo)", () => {
    expect(aceita({ ...BASE, cidade: "A".repeat(81) })).toBe(false);
  });

  it("contato_responsavel: 60 caracteres é aceito (máximo)", () => {
    expect(aceita({ ...BASE, contato_responsavel: "A".repeat(60) })).toBe(true);
  });

  it("contato_responsavel: 61 caracteres é recusado (acima do máximo)", () => {
    expect(aceita({ ...BASE, contato_responsavel: "A".repeat(61) })).toBe(false);
  });
});

describe("esquema do atleta — enums opcionais", () => {
  it.each(["Goleiro", "Fixo", "Ala", "Pivô"])("aceita a posição '%s'", (posicao) => {
    expect(aceita({ ...BASE, posicao })).toBe(true);
  });

  it("recusa posição fora da lista", () => {
    expect(aceita({ ...BASE, posicao: "Zagueiro" })).toBe(false);
  });

  it.each(["Direito", "Esquerdo", "Ambos"])("aceita o pé dominante '%s'", (pe_dominante) => {
    expect(aceita({ ...BASE, pe_dominante })).toBe(true);
  });

  it("recusa pé dominante fora da lista", () => {
    expect(aceita({ ...BASE, pe_dominante: "Canhoto" })).toBe(false);
  });
});

/**
 * Achado de review: um `<select>`/`<input>` de formulário deixado em branco
 * envia `""`, nunca `undefined`. Um campo opcional que recusa `""` trava o
 * cadastro para quem não preenche esse campo — mesmo ele sendo opcional por
 * definição. A correção mora no schema (`objetoComOpcionaisTolerantes`), não
 * em cada formulário; estes testes cobrem TODOS os campos opcionais do
 * schema, não uma amostra, e nas duas direções: `""` tem que ser aceito e
 * resultar em ausente, e um valor inválido não-vazio tem que continuar
 * sendo recusado (a tolerância não pode virar "aceita qualquer coisa").
 */
const CAMPOS_OPCIONAIS = [
  { campo: "posicao", valorInvalido: "Zagueiro" },
  { campo: "pe_dominante", valorInvalido: "Canhoto" },
  { campo: "altura_cm", valorInvalido: 500 },
  { campo: "peso_kg", valorInvalido: 999 },
  { campo: "clube_atual", valorInvalido: "A".repeat(81) },
  { campo: "estado_uf", valorInvalido: "CEA" },
  { campo: "cidade", valorInvalido: "A".repeat(81) },
  { campo: "contato_responsavel", valorInvalido: "A".repeat(61) },
] as const;

describe("esquema do atleta — campos opcionais toleram string vazia (achado de review)", () => {
  it.each(CAMPOS_OPCIONAIS)(
    "'$campo': string vazia é aceita e resulta em ausente",
    ({ campo }) => {
      const dados = { ...BASE, [campo]: "" };
      const r = esquemaAtleta.safeParse(dados);
      expect(r.success).toBe(true);
      if (r.success) {
        expect((r.data as Record<string, unknown>)[campo]).toBeUndefined();
      }
    },
  );

  it.each(CAMPOS_OPCIONAIS)(
    "'$campo': valor inválido não-vazio continua sendo recusado",
    ({ campo, valorInvalido }) => {
      const dados = { ...BASE, [campo]: valorInvalido };
      expect(aceita(dados)).toBe(false);
    },
  );

  it("campo obrigatório com string vazia continua sendo recusado (a tolerância é só para opcionais)", () => {
    expect(aceita({ ...BASE, apelido: "" })).toBe(false);
    expect(aceita({ ...BASE, nome_completo: "" })).toBe(false);
    expect(aceita({ ...BASE, categoria: "" })).toBe(false);
    expect(aceita({ ...BASE, data_nascimento: "" })).toBe(false);
  });
});

describe("esquema do atleta — formato de data de nascimento", () => {
  it("aceita AAAA-MM-DD", () => {
    expect(aceita({ ...BASE, data_nascimento: "2013-04-02" })).toBe(true);
  });

  it.each([
    "2013-4-2", // sem zero à esquerda
    "13-04-02", // ano com 2 dígitos
    "2013/04/02", // separador errado
    "02-04-2013", // ordem invertida
    "2013-04-02T00:00:00Z", // com horário
    "hoje",
    "",
    "2013-04", // incompleto
  ])("recusa o formato inválido '%s'", (data_nascimento) => {
    expect(aceita({ ...BASE, data_nascimento })).toBe(false);
  });
});
