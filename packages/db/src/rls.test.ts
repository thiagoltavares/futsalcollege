import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { chave } from "./chaves";
import type { Database, Enums } from "./tipos";

/**
 * Estes testes são o coração da garantia de privacidade. Se algum deles falhar,
 * é porque uma criança está exposta — não é falha de estilo.
 *
 * Cobertura exaustiva, não por amostra: para cada tabela restrita e cada
 * operação (select/insert/update/delete), o anônimo não consegue nada; para
 * `atletas`, o anônimo só lê `estado = 'ativo'` — testado nos cinco estados,
 * não só em um; o olheiro verificado alcança identificação mas nunca saúde;
 * um responsável não alcança atleta de outro responsável.
 *
 * Valores vindos de `supabase status` no ambiente local (portas com offset
 * +200 nesta máquina: API em 54521, não a 54321 padrão).
 */
const URL = process.env.API_URL ?? process.env.SUPABASE_URL ?? "http://127.0.0.1:54521";
const PUBLICAVEL = chave("PUBLISHABLE_KEY", "ANON_KEY");
const SECRETA = chave("SECRET_KEY", "SERVICE_ROLE_KEY");

const SENHA = "senha-de-teste-123";

type Estado = Enums<"estado_perfil">;
const TODOS_OS_ESTADOS: Estado[] = [
  "rascunho",
  "aguardando_consentimento",
  "ativo",
  "suspenso",
  "removido",
];

const servico = createClient<Database>(URL, SECRETA, { auth: { persistSession: false } });

/** Cria um usuário autenticado e devolve um cliente logado com a chave publicável. */
async function criarClienteAutenticado(
  email: string,
  appMetadata?: Record<string, unknown>,
): Promise<{ id: string; cliente: SupabaseClient<Database> }> {
  const { data, error } = await servico.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
    app_metadata: appMetadata,
  });
  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário de teste ${email}: ${error?.message}`);
  }

  const cliente = createClient<Database>(URL, PUBLICAVEL, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: erroLogin } = await cliente.auth.signInWithPassword({ email, password: SENHA });
  if (erroLogin) {
    throw new Error(`Falha ao logar ${email}: ${erroLogin.message}`);
  }

  return { id: data.user.id, cliente };
}

const visitante = createClient<Database>(URL, PUBLICAVEL, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let responsavelA: { id: string; cliente: SupabaseClient<Database> };
let responsavelB: { id: string; cliente: SupabaseClient<Database> };
let olheiro: { id: string; cliente: SupabaseClient<Database> };

/** Um atleta ativo por responsável A, para cada um dos cinco estados possíveis. */
let atletasA: Record<Estado, string>;
/** Atleta em rascunho do responsável B — nunca público, serve para provar isolamento entre responsáveis. */
let atletaB: string;

beforeAll(async () => {
  const marca = Date.now();
  [responsavelA, responsavelB, olheiro] = await Promise.all([
    criarClienteAutenticado(`resp-a-${marca}@exemplo.test`),
    criarClienteAutenticado(`resp-b-${marca}@exemplo.test`),
    criarClienteAutenticado(`olheiro-${marca}@exemplo.test`, { papel: "olheiro_verificado" }),
  ]);

  await servico.from("responsaveis").insert([
    { id: responsavelA.id, nome: "Responsável A" },
    { id: responsavelB.id, nome: "Responsável B" },
  ]);

  atletasA = {} as Record<Estado, string>;
  for (const estado of TODOS_OS_ESTADOS) {
    const { data, error } = await servico
      .from("atletas")
      .insert({
        responsavel_id: responsavelA.id,
        apelido: `Atleta ${estado}`,
        categoria: "Sub-13",
        estado,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`Falha ao criar atleta ${estado}: ${error?.message}`);
    atletasA[estado] = data.id;
  }

  const { data: b } = await servico
    .from("atletas")
    .insert({
      responsavel_id: responsavelB.id,
      apelido: "Atleta de B",
      categoria: "Sub-11",
      estado: "rascunho",
    })
    .select("id")
    .single();
  atletaB = b!.id;

  await servico.from("atleta_identificacao").insert([
    {
      atleta_id: atletasA.ativo,
      nome_completo: "João da Silva Santos",
      data_nascimento: "2013-04-02",
      cidade: "Fortaleza",
    },
    {
      atleta_id: atletaB,
      nome_completo: "Maria de Souza Lima",
      data_nascimento: "2015-08-10",
      cidade: "Recife",
    },
  ]);

  await servico.from("atleta_saude").insert([
    { atleta_id: atletasA.ativo, massa_magra_pct: 41.5 },
    { atleta_id: atletaB, massa_magra_pct: 38.2 },
  ]);
});

describe("RLS — anônimo e atletas", () => {
  it("anônimo lê a ficha pública de perfil ativo", async () => {
    const { data } = await visitante.from("atletas").select("apelido").eq("id", atletasA.ativo);
    expect(data).toHaveLength(1);
    expect(data![0]!.apelido).toBe("Atleta ativo");
  });

  it.each(TODOS_OS_ESTADOS.filter((e) => e !== "ativo"))(
    "anônimo não enxerga perfil no estado '%s'",
    async (estado) => {
      const { data } = await visitante.from("atletas").select("apelido").eq("id", atletasA[estado]);
      expect(data ?? []).toHaveLength(0);
    },
  );

  it("anônimo não insere atleta", async () => {
    const { data, error } = await visitante
      .from("atletas")
      .insert({ responsavel_id: responsavelA.id, apelido: "Intruso", categoria: "Sub-9" })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("anônimo não atualiza atleta ativo (ficha pública é só leitura)", async () => {
    const { data } = await visitante
      .from("atletas")
      .update({ apelido: "Hackeado" })
      .eq("id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);

    const { data: continua } = await servico
      .from("atletas")
      .select("apelido")
      .eq("id", atletasA.ativo)
      .single();
    expect(continua!.apelido).toBe("Atleta ativo");
  });

  it("anônimo não apaga atleta ativo", async () => {
    const { data } = await visitante.from("atletas").delete().eq("id", atletasA.ativo).select();
    expect(data ?? []).toHaveLength(0);

    const { data: continua } = await servico.from("atletas").select("id").eq("id", atletasA.ativo);
    expect(continua).toHaveLength(1);
  });
});

describe("RLS — anônimo nunca alcança tabelas restritas", () => {
  it("select em responsaveis não retorna nada", async () => {
    const { data } = await visitante.from("responsaveis").select("*");
    expect(data ?? []).toHaveLength(0);
  });

  it("insert em responsaveis é negado", async () => {
    const { data, error } = await visitante
      .from("responsaveis")
      .insert({ id: crypto.randomUUID(), nome: "Fantasma" })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("update em responsaveis não afeta nada", async () => {
    const { data } = await visitante
      .from("responsaveis")
      .update({ nome: "Renomeado" })
      .eq("id", responsavelA.id)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("delete em responsaveis não afeta nada", async () => {
    const { data } = await visitante.from("responsaveis").delete().eq("id", responsavelA.id).select();
    expect(data ?? []).toHaveLength(0);
  });

  it("select em atleta_identificacao não retorna nada", async () => {
    const { data } = await visitante.from("atleta_identificacao").select("nome_completo");
    expect(data ?? []).toHaveLength(0);
  });

  it("insert em atleta_identificacao é negado", async () => {
    const { data, error } = await visitante
      .from("atleta_identificacao")
      .insert({
        atleta_id: atletasA.ativo,
        nome_completo: "Forjado",
        data_nascimento: "2013-01-01",
      })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("update em atleta_identificacao não afeta nada", async () => {
    const { data } = await visitante
      .from("atleta_identificacao")
      .update({ cidade: "Alterada" })
      .eq("atleta_id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("delete em atleta_identificacao não afeta nada", async () => {
    const { data } = await visitante
      .from("atleta_identificacao")
      .delete()
      .eq("atleta_id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("select em atleta_saude não retorna nada", async () => {
    const { data } = await visitante.from("atleta_saude").select("massa_magra_pct");
    expect(data ?? []).toHaveLength(0);
  });

  it("insert em atleta_saude é negado", async () => {
    const { data, error } = await visitante
      .from("atleta_saude")
      .insert({ atleta_id: atletasA.ativo, massa_magra_pct: 99 })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("update em atleta_saude não afeta nada", async () => {
    const { data } = await visitante
      .from("atleta_saude")
      .update({ massa_magra_pct: 1 })
      .eq("atleta_id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("delete em atleta_saude não afeta nada", async () => {
    const { data } = await visitante
      .from("atleta_saude")
      .delete()
      .eq("atleta_id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);
  });
});

describe("RLS — olheiro verificado alcança identificação, nunca saúde", () => {
  it("olheiro lê identificação de atleta ativo", async () => {
    const { data } = await olheiro.cliente
      .from("atleta_identificacao")
      .select("nome_completo")
      .eq("atleta_id", atletasA.ativo);
    expect(data).toHaveLength(1);
    expect(data![0]!.nome_completo).toBe("João da Silva Santos");
  });

  it.each(TODOS_OS_ESTADOS.filter((e) => e !== "ativo"))(
    "olheiro NÃO lê identificação de atleta no estado '%s'",
    async (estado) => {
      const atletaId = atletasA[estado];
      await servico.from("atleta_identificacao").insert({
        atleta_id: atletaId,
        nome_completo: `Identificação ${estado}`,
        data_nascimento: "2013-04-02",
        cidade: "Fortaleza",
      });

      const { data } = await olheiro.cliente
        .from("atleta_identificacao")
        .select("nome_completo")
        .eq("atleta_id", atletaId);
      expect(data ?? []).toHaveLength(0);
    },
  );

  it("olheiro não insere em identificação", async () => {
    const { data, error } = await olheiro.cliente
      .from("atleta_identificacao")
      .insert({ atleta_id: atletasA.rascunho, nome_completo: "X", data_nascimento: "2013-01-01" })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("olheiro não atualiza identificação", async () => {
    const { data } = await olheiro.cliente
      .from("atleta_identificacao")
      .update({ cidade: "Alterada pelo olheiro" })
      .eq("atleta_id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("olheiro não apaga identificação", async () => {
    const { data } = await olheiro.cliente
      .from("atleta_identificacao")
      .delete()
      .eq("atleta_id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("olheiro NUNCA lê dado de saúde", async () => {
    const { data } = await olheiro.cliente
      .from("atleta_saude")
      .select("massa_magra_pct")
      .eq("atleta_id", atletasA.ativo);
    expect(data ?? []).toHaveLength(0);
  });

  it("olheiro não insere dado de saúde", async () => {
    const { data, error } = await olheiro.cliente
      .from("atleta_saude")
      .insert({ atleta_id: atletasA.rascunho, massa_magra_pct: 50 })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("olheiro não atualiza dado de saúde", async () => {
    const { data } = await olheiro.cliente
      .from("atleta_saude")
      .update({ massa_magra_pct: 1 })
      .eq("atleta_id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it("olheiro não apaga dado de saúde", async () => {
    const { data } = await olheiro.cliente
      .from("atleta_saude")
      .delete()
      .eq("atleta_id", atletasA.ativo)
      .select();
    expect(data ?? []).toHaveLength(0);
  });
});

describe("RLS — responsável alcança os próprios atletas em qualquer estado", () => {
  it.each(TODOS_OS_ESTADOS)("responsável A lê o próprio atleta no estado '%s'", async (estado) => {
    const { data } = await responsavelA.cliente
      .from("atletas")
      .select("apelido")
      .eq("id", atletasA[estado]);
    expect(data).toHaveLength(1);
  });

  it("responsável A lê a própria identificação e saúde", async () => {
    const { data: ident } = await responsavelA.cliente
      .from("atleta_identificacao")
      .select("nome_completo")
      .eq("atleta_id", atletasA.ativo);
    expect(ident).toHaveLength(1);

    const { data: saude } = await responsavelA.cliente
      .from("atleta_saude")
      .select("massa_magra_pct")
      .eq("atleta_id", atletasA.ativo);
    expect(saude).toHaveLength(1);
  });
});

describe("RLS — um responsável não alcança atleta de outro responsável", () => {
  it("responsável A não lê o rascunho de B (não é público nem é dono)", async () => {
    const { data } = await responsavelA.cliente.from("atletas").select("apelido").eq("id", atletaB);
    expect(data ?? []).toHaveLength(0);
  });

  it("responsável A não atualiza atleta de B", async () => {
    const { data } = await responsavelA.cliente
      .from("atletas")
      .update({ apelido: "Roubado" })
      .eq("id", atletaB)
      .select();
    expect(data ?? []).toHaveLength(0);

    const { data: continua } = await servico.from("atletas").select("apelido").eq("id", atletaB).single();
    expect(continua!.apelido).toBe("Atleta de B");
  });

  it("responsável A não apaga atleta de B", async () => {
    const { data } = await responsavelA.cliente.from("atletas").delete().eq("id", atletaB).select();
    expect(data ?? []).toHaveLength(0);

    const { data: continua } = await servico.from("atletas").select("id").eq("id", atletaB);
    expect(continua).toHaveLength(1);
  });

  it("responsável A não lê identificação do atleta de B", async () => {
    const { data } = await responsavelA.cliente
      .from("atleta_identificacao")
      .select("nome_completo")
      .eq("atleta_id", atletaB);
    expect(data ?? []).toHaveLength(0);
  });

  it("responsável A não lê saúde do atleta de B", async () => {
    const { data } = await responsavelA.cliente
      .from("atleta_saude")
      .select("massa_magra_pct")
      .eq("atleta_id", atletaB);
    expect(data ?? []).toHaveLength(0);
  });

  it("responsável A não insere identificação para atleta de B", async () => {
    const { data, error } = await responsavelA.cliente
      .from("atleta_identificacao")
      .insert({ atleta_id: atletaB, nome_completo: "Forjado", data_nascimento: "2015-01-01" })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("responsável A não insere saúde para atleta de B", async () => {
    const { data, error } = await responsavelA.cliente
      .from("atleta_saude")
      .insert({ atleta_id: atletaB, massa_magra_pct: 10 })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("responsável A não lê a linha de responsaveis de B", async () => {
    const { data } = await responsavelA.cliente.from("responsaveis").select("nome").eq("id", responsavelB.id);
    expect(data ?? []).toHaveLength(0);
  });

  it("responsável A não atualiza a linha de responsaveis de B", async () => {
    const { data } = await responsavelA.cliente
      .from("responsaveis")
      .update({ nome: "Sequestrado" })
      .eq("id", responsavelB.id)
      .select();
    expect(data ?? []).toHaveLength(0);
  });
});

describe("RLS — desenho da tabela pública", () => {
  it("a tabela pública não tem nenhuma coluna que localize a criança", async () => {
    const { data } = await servico.rpc("colunas_da_tabela" as never, { nome: "atletas" } as never);
    const colunas = ((data ?? []) as { column_name: string }[]).map((c) => c.column_name);
    for (const proibida of ["bairro", "endereco", "escola", "horario_treino", "local_treino"]) {
      expect(colunas).not.toContain(proibida);
    }
  });

  it("anônimo não consegue chamar colunas_da_tabela (função é só para o cliente de serviço nos testes)", async () => {
    const { data, error } = await visitante.rpc("colunas_da_tabela" as never, {
      nome: "atleta_saude",
    } as never);
    expect(data ?? null).toBeNull();
    expect(error).toBeTruthy();
  });
});
