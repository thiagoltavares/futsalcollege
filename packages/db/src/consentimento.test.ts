import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { chave } from "./chaves";
import type { Database, Enums } from "./tipos";

/**
 * O consentimento do responsável é a garantia de que nenhuma criança fica
 * exposta por uma tela que esqueceu de checar alguma coisa. A regra mora no
 * banco, não na aplicação — por isso a cobertura aqui é exaustiva, não por
 * amostra:
 *
 * - ativar sem consentimento falha a partir de CADA estado de origem, não só
 *   de `aguardando_consentimento`;
 * - consentimento revogado não conta como vigente;
 * - revogar derruba o perfil ativo na hora, mas não "ressuscita" um perfil
 *   que já não estava ativo, e não derruba se ainda houver outro
 *   consentimento vigente para o mesmo atleta;
 * - a RLS da tabela nova isola um responsável do consentimento de outro.
 *
 * Portas com offset +200 nesta máquina: API em 54521, não a 54321 padrão.
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
const ESTADOS_NAO_ATIVOS = TODOS_OS_ESTADOS.filter((e) => e !== "ativo");

const servico = createClient<Database>(URL, SECRETA, { auth: { persistSession: false } });

async function criarClienteAutenticado(
  email: string,
): Promise<{ id: string; cliente: SupabaseClient<Database> }> {
  const { data, error } = await servico.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
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

let responsavelId: string;
let responsavelBId: string;

async function novoAtleta(estado: Estado, dono: string = responsavelId): Promise<string> {
  const { data, error } = await servico
    .from("atletas")
    .insert({ responsavel_id: dono, apelido: "Teste", categoria: "Sub-13", estado })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao criar atleta: ${error?.message}`);
  return data.id;
}

async function novoConsentimento(atletaId: string, dono: string = responsavelId): Promise<string> {
  const { data, error } = await servico
    .from("consentimentos")
    .insert({
      atleta_id: atletaId,
      responsavel_id: dono,
      documento_url: "storage://termos/exemplo.pdf",
      versao_termo: "2026-08-v1",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao criar consentimento: ${error?.message}`);
  return data.id;
}

async function estadoAtual(atletaId: string): Promise<Estado> {
  const { data, error } = await servico.from("atletas").select("estado").eq("id", atletaId).single();
  if (error || !data) throw new Error(`Falha ao ler estado: ${error?.message}`);
  return data.estado;
}

async function revogar(consentimentoId: string) {
  return servico
    .from("consentimentos")
    .update({ revogado_em: new Date().toISOString() })
    .eq("id", consentimentoId);
}

beforeAll(async () => {
  const marca = Date.now();
  const { data } = await servico.auth.admin.createUser({
    email: `cons-${marca}@exemplo.test`,
    password: SENHA,
    email_confirm: true,
  });
  responsavelId = data.user!.id;
  // O gatilho de signup (migration 0004) já criou a linha em `responsaveis`
  // com nome nulo assim que `admin.createUser` inseriu em auth.users; um
  // insert aqui colidiria com a PK. Só damos nome à fixture com update.
  await servico.from("responsaveis").update({ nome: "Responsável" }).eq("id", responsavelId);

  const { data: dataB } = await servico.auth.admin.createUser({
    email: `cons-b-${marca}@exemplo.test`,
    password: SENHA,
    email_confirm: true,
  });
  responsavelBId = dataB.user!.id;
  await servico.from("responsaveis").update({ nome: "Responsável B" }).eq("id", responsavelBId);
});

describe("consentimento — bloqueio de ativação (do brief)", () => {
  it("impede ativar perfil sem consentimento", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const { error } = await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
    expect(error).not.toBeNull();
    expect(error!.message).toContain("consentimento");
  });

  it("permite ativar depois do consentimento", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    await novoConsentimento(atleta);

    const { error } = await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
    expect(error).toBeNull();
    expect(await estadoAtual(atleta)).toBe("ativo");
  });

  it("revogar consentimento suspende o perfil na hora", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const consentimentoId = await novoConsentimento(atleta);

    await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
    await revogar(consentimentoId);

    expect(await estadoAtual(atleta)).toBe("suspenso");
  });
});

describe("consentimento — ativação bloqueada a partir de CADA estado de origem", () => {
  it.each(ESTADOS_NAO_ATIVOS)(
    "sem consentimento, ativar a partir de '%s' falha",
    async (estadoOrigem) => {
      const atleta = await novoAtleta(estadoOrigem);
      const { error } = await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
      expect(error).not.toBeNull();
      expect(error!.message).toContain("consentimento");
      expect(await estadoAtual(atleta)).toBe(estadoOrigem);
    },
  );

  it.each(ESTADOS_NAO_ATIVOS)(
    "com consentimento vigente, ativar a partir de '%s' funciona",
    async (estadoOrigem) => {
      const atleta = await novoAtleta(estadoOrigem);
      await novoConsentimento(atleta);
      const { error } = await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
      expect(error).toBeNull();
      expect(await estadoAtual(atleta)).toBe("ativo");
    },
  );
});

describe("consentimento — revogado não conta como vigente", () => {
  it("ativar continua falhando se o único consentimento já foi revogado antes da tentativa", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const consentimentoId = await novoConsentimento(atleta);
    await revogar(consentimentoId);

    const { error } = await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
    expect(error).not.toBeNull();
    expect(error!.message).toContain("consentimento");
    expect(await estadoAtual(atleta)).toBe("aguardando_consentimento");
  });
});

describe("consentimento — revogar perfil que não está ativo não o ressuscita", () => {
  it("revogar consentimento de atleta em 'rascunho' não move o estado", async () => {
    const atleta = await novoAtleta("rascunho");
    const consentimentoId = await novoConsentimento(atleta);

    const { error } = await revogar(consentimentoId);
    expect(error).toBeNull();
    expect(await estadoAtual(atleta)).toBe("rascunho");
  });

  it("revogar consentimento de atleta 'removido' não o traz de volta para 'suspenso'", async () => {
    const atleta = await novoAtleta("removido");
    const consentimentoId = await novoConsentimento(atleta);

    const { error } = await revogar(consentimentoId);
    expect(error).toBeNull();
    expect(await estadoAtual(atleta)).toBe("removido");
  });

  it("revogar consentimento de atleta já 'suspenso' mantém 'suspenso'", async () => {
    const atleta = await novoAtleta("suspenso");
    const consentimentoId = await novoConsentimento(atleta);

    const { error } = await revogar(consentimentoId);
    expect(error).toBeNull();
    expect(await estadoAtual(atleta)).toBe("suspenso");
  });
});

describe("consentimento — mais de um consentimento para o mesmo atleta", () => {
  it("revogar um consentimento não derruba o perfil se outro ainda estiver vigente", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const primeiro = await novoConsentimento(atleta);
    const segundo = await novoConsentimento(atleta);

    await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
    expect(await estadoAtual(atleta)).toBe("ativo");

    await revogar(primeiro);
    expect(await estadoAtual(atleta)).toBe("ativo");

    await revogar(segundo);
    expect(await estadoAtual(atleta)).toBe("suspenso");
  });
});

describe("consentimento — reativação depois de suspenso exige consentimento novo", () => {
  it("revogar o único consentimento suspende; um consentimento novo permite reativar explicitamente", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const consentimentoId = await novoConsentimento(atleta);
    await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
    expect(await estadoAtual(atleta)).toBe("ativo");

    await revogar(consentimentoId);
    expect(await estadoAtual(atleta)).toBe("suspenso");

    await novoConsentimento(atleta);
    const { error } = await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);
    expect(error).toBeNull();
    expect(await estadoAtual(atleta)).toBe("ativo");
  });
});

describe("consentimento — insert direto em atletas com estado 'ativo'", () => {
  it("é barrado pelo gatilho quando não há consentimento vigente", async () => {
    const { data, error } = await servico
      .from("atletas")
      .insert({ responsavel_id: responsavelId, apelido: "Teste", categoria: "Sub-13", estado: "ativo" })
      .select("id");
    expect(data ?? []).toHaveLength(0);
    expect(error).not.toBeNull();
    expect(error!.message).toContain("consentimento");
  });
});

describe("consentimento — é prova, não se apaga (achado 1)", () => {
  it("o próprio responsável dono não consegue apagar o consentimento (nem via service_role a política importaria — aqui via cliente publicável)", async () => {
    const responsavel = await criarClienteAutenticado(`cons-delete-${Date.now()}@exemplo.test`);
    await servico.from("responsaveis").update({ nome: "Responsável Delete" }).eq("id", responsavel.id);
    const atleta = await novoAtleta("aguardando_consentimento", responsavel.id);
    const consentimentoId = await novoConsentimento(atleta, responsavel.id);
    await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);

    const { data } = await responsavel.cliente
      .from("consentimentos")
      .delete()
      .eq("id", consentimentoId)
      .select();
    expect(data ?? []).toHaveLength(0);

    const { data: continua } = await servico.from("consentimentos").select("id").eq("id", consentimentoId);
    expect(continua).toHaveLength(1);
    expect(await estadoAtual(atleta)).toBe("ativo");
  });
});

describe("consentimento — delete direto é sempre rejeitado, mesmo pelo service_role (achado da review)", () => {
  it("o cliente de serviço (que ignora RLS por rolbypassrls) não consegue apagar consentimento diretamente", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const consentimentoId = await novoConsentimento(atleta);
    await servico.from("atletas").update({ estado: "ativo" }).eq("id", atleta);

    const { error } = await servico.from("consentimentos").delete().eq("id", consentimentoId);
    expect(error).not.toBeNull();

    const { data: continua } = await servico
      .from("consentimentos")
      .select("id")
      .eq("id", consentimentoId);
    expect(continua).toHaveLength(1);
    expect(await estadoAtual(atleta)).toBe("ativo");
  });

  it("o cliente do responsável dono continua sem conseguir apagar diretamente", async () => {
    const responsavel = await criarClienteAutenticado(`cons-delete-svc-${Date.now()}@exemplo.test`);
    await servico
      .from("responsaveis")
      .update({ nome: "Responsável Delete Svc" })
      .eq("id", responsavel.id);
    const atleta = await novoAtleta("aguardando_consentimento", responsavel.id);
    const consentimentoId = await novoConsentimento(atleta, responsavel.id);

    const { data } = await responsavel.cliente
      .from("consentimentos")
      .delete()
      .eq("id", consentimentoId)
      .select();
    expect(data ?? []).toHaveLength(0);

    const { data: continua } = await servico
      .from("consentimentos")
      .select("id")
      .eq("id", consentimentoId);
    expect(continua).toHaveLength(1);
  });

  it("apagar o atleta continua apagando os consentimentos por cascata — não é bloqueado", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const consentimentoId = await novoConsentimento(atleta);

    const { error } = await servico.from("atletas").delete().eq("id", atleta);
    expect(error).toBeNull();

    const { data: consentimentoSumiu } = await servico
      .from("consentimentos")
      .select("id")
      .eq("id", consentimentoId);
    expect(consentimentoSumiu ?? []).toHaveLength(0);

    const { data: atletaSumiu } = await servico.from("atletas").select("id").eq("id", atleta);
    expect(atletaSumiu ?? []).toHaveLength(0);
  });
});

describe("consentimento — registro não se reescreve (achado 2)", () => {
  it("update de documento_url, versao_termo ou aceito_em falha", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const consentimentoId = await novoConsentimento(atleta);

    const { error: erroDocumento } = await servico
      .from("consentimentos")
      .update({ documento_url: "storage://termos/forjado.pdf" })
      .eq("id", consentimentoId);
    expect(erroDocumento).not.toBeNull();

    const { error: erroVersao } = await servico
      .from("consentimentos")
      .update({ versao_termo: "2099-01-v9" })
      .eq("id", consentimentoId);
    expect(erroVersao).not.toBeNull();

    const { error: erroAceito } = await servico
      .from("consentimentos")
      .update({ aceito_em: new Date().toISOString() })
      .eq("id", consentimentoId);
    expect(erroAceito).not.toBeNull();
  });

  it("update de atleta_id ou responsavel_id falha", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const outroAtleta = await novoAtleta("aguardando_consentimento");
    const consentimentoId = await novoConsentimento(atleta);

    const { error: erroAtleta } = await servico
      .from("consentimentos")
      .update({ atleta_id: outroAtleta })
      .eq("id", consentimentoId);
    expect(erroAtleta).not.toBeNull();

    const { error: erroResponsavel } = await servico
      .from("consentimentos")
      .update({ responsavel_id: responsavelBId })
      .eq("id", consentimentoId);
    expect(erroResponsavel).not.toBeNull();
  });

  it("revogado_em não pode voltar a null depois de setado", async () => {
    const atleta = await novoAtleta("aguardando_consentimento");
    const consentimentoId = await novoConsentimento(atleta);
    await revogar(consentimentoId);

    const { error } = await servico
      .from("consentimentos")
      .update({ revogado_em: null })
      .eq("id", consentimentoId);
    expect(error).not.toBeNull();

    const { data } = await servico
      .from("consentimentos")
      .select("revogado_em")
      .eq("id", consentimentoId)
      .single();
    expect(data!.revogado_em).not.toBeNull();
  });
});

describe("consentimento — gatilho impede consentimento com responsavel_id que não é o dono do atleta", () => {
  it("mesmo o cliente de serviço (que ignora RLS) não passa por cima do gatilho", async () => {
    const atletaDeA = await novoAtleta("aguardando_consentimento", responsavelId);
    const { data, error } = await servico
      .from("consentimentos")
      .insert({
        atleta_id: atletaDeA,
        responsavel_id: responsavelBId,
        documento_url: "storage://termos/forjado.pdf",
        versao_termo: "2026-08-v1",
      })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).not.toBeNull();
  });
});

describe("consentimento — RLS: um responsável não alcança consentimento de outro", () => {
  let responsavelA: { id: string; cliente: SupabaseClient<Database> };
  let responsavelB: { id: string; cliente: SupabaseClient<Database> };
  let visitante: SupabaseClient<Database>;
  let atletaDeA: string;
  let consentimentoDeA: string;

  beforeAll(async () => {
    const marca = Date.now();
    responsavelA = await criarClienteAutenticado(`cons-rls-a-${marca}@exemplo.test`);
    responsavelB = await criarClienteAutenticado(`cons-rls-b-${marca}@exemplo.test`);
    visitante = createClient<Database>(URL, PUBLICAVEL, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    await Promise.all([
      servico.from("responsaveis").update({ nome: "Responsável RLS A" }).eq("id", responsavelA.id),
      servico.from("responsaveis").update({ nome: "Responsável RLS B" }).eq("id", responsavelB.id),
    ]);

    atletaDeA = await novoAtleta("aguardando_consentimento", responsavelA.id);
    consentimentoDeA = await novoConsentimento(atletaDeA, responsavelA.id);
  });

  it("responsável A lê o próprio consentimento", async () => {
    const { data } = await responsavelA.cliente
      .from("consentimentos")
      .select("id")
      .eq("id", consentimentoDeA);
    expect(data).toHaveLength(1);
  });

  it("responsável B não lê o consentimento de A", async () => {
    const { data } = await responsavelB.cliente
      .from("consentimentos")
      .select("id")
      .eq("id", consentimentoDeA);
    expect(data ?? []).toHaveLength(0);
  });

  it("responsável B não atualiza (nem revoga) o consentimento de A", async () => {
    const { data } = await responsavelB.cliente
      .from("consentimentos")
      .update({ revogado_em: new Date().toISOString() })
      .eq("id", consentimentoDeA)
      .select();
    expect(data ?? []).toHaveLength(0);

    const { data: continua } = await servico
      .from("consentimentos")
      .select("revogado_em")
      .eq("id", consentimentoDeA)
      .single();
    expect(continua!.revogado_em).toBeNull();
  });

  it("responsável B não apaga o consentimento de A", async () => {
    const { data } = await responsavelB.cliente
      .from("consentimentos")
      .delete()
      .eq("id", consentimentoDeA)
      .select();
    expect(data ?? []).toHaveLength(0);

    const { data: continua } = await servico.from("consentimentos").select("id").eq("id", consentimentoDeA);
    expect(continua).toHaveLength(1);
  });

  it("responsável B não consegue forjar consentimento para o atleta de A usando o próprio responsavel_id", async () => {
    // A RLS por si só liberaria esta inserção (responsavel_id = auth.uid()
    // de B). É o gatilho exigir_responsavel_do_atleta que barra: B não é o
    // responsável cadastrado do atleta de A.
    const { data, error } = await responsavelB.cliente
      .from("consentimentos")
      .insert({
        atleta_id: atletaDeA,
        responsavel_id: responsavelB.id,
        documento_url: "storage://termos/forjado.pdf",
        versao_termo: "2026-08-v1",
      })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();

    const { data: naoForjou } = await servico
      .from("consentimentos")
      .select("id")
      .eq("atleta_id", atletaDeA)
      .eq("responsavel_id", responsavelB.id);
    expect(naoForjou ?? []).toHaveLength(0);
  });

  it("visitante anônimo não lê nenhum consentimento", async () => {
    const { data } = await visitante.from("consentimentos").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("visitante anônimo não insere consentimento", async () => {
    const { data, error } = await visitante
      .from("consentimentos")
      .insert({
        atleta_id: atletaDeA,
        responsavel_id: responsavelA.id,
        documento_url: "storage://termos/intruso.pdf",
        versao_termo: "2026-08-v1",
      })
      .select();
    expect(data ?? []).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("visitante anônimo não revoga consentimento de ninguém", async () => {
    const { data } = await visitante
      .from("consentimentos")
      .update({ revogado_em: new Date().toISOString() })
      .eq("id", consentimentoDeA)
      .select();
    expect(data ?? []).toHaveLength(0);
  });
});
