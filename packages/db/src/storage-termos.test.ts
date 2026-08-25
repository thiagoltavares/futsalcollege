import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { chave } from "./chaves";
import type { Database } from "./tipos";

/**
 * Achado de review (Tarefa 10): se o insert em `consentimentos` falhar depois
 * de um upload bem-sucedido em `termos`, o arquivo enviado fica órfão no
 * bucket sem limpeza. A correção da action chama
 * `storage.from("termos").remove([...])` nesse caso — mas isso só funciona
 * se existir uma política de RLS de delete para o dono. A migration 0005
 * só concedia insert e select; sem delete, a RLS nega por padrão, e o
 * `.remove()` da action falharia em silêncio (documentado ao vivo: rodei a
 * verificação de ponta a ponta ANTES desta migration existir e o arquivo
 * continuou no bucket depois do rollback "funcionar" — ver relatório).
 *
 * A migration 0006 concede delete, mas só para arquivo ÓRFÃO — nenhum
 * `consentimentos.documento_url` aponta para ele. Um arquivo referenciado
 * por um consentimento (vigente OU já revogado) nunca pode ser apagado,
 * pelo mesmo motivo que a linha em `consentimentos` também não pode
 * (migration 0003, "é prova, e prova não se apaga" — documento sumido não é
 * diferente, na prática, de prova apagada). Esta suíte cobre as duas
 * direções: órfão pode, referenciado não pode — para o dono, para outro
 * responsável, e para o visitante anônimo.
 *
 * Portas com offset +200 nesta máquina: API em 54521, não a 54321 padrão.
 */
const URL = process.env.API_URL ?? process.env.SUPABASE_URL ?? "http://127.0.0.1:54521";
const PUBLICAVEL = chave("PUBLISHABLE_KEY", "ANON_KEY");
const SECRETA = chave("SECRET_KEY", "SERVICE_ROLE_KEY");

const SENHA = "senha-de-teste-123";
const BUCKET = "termos";

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

async function novoAtleta(dono: string): Promise<string> {
  const { data, error } = await servico
    .from("atletas")
    .insert({ responsavel_id: dono, apelido: "Teste Storage", categoria: "Sub-13", estado: "aguardando_consentimento" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao criar atleta: ${error?.message}`);
  return data.id;
}

async function enviarArquivo(
  cliente: SupabaseClient<Database>,
  caminho: string,
): Promise<void> {
  const conteudo = new Blob([new TextEncoder().encode("%PDF-1.4\nconteudo de teste")], {
    type: "application/pdf",
  });
  const { error } = await cliente.storage.from(BUCKET).upload(caminho, conteudo, { upsert: false });
  if (error) throw new Error(`Falha ao enviar arquivo de teste ${caminho}: ${error.message}`);
}

async function existeNoBucket(caminho: string): Promise<boolean> {
  const pasta = caminho.split("/")[0];
  const nomeArquivo = caminho.split("/")[1];
  const { data, error } = await servico.storage.from(BUCKET).list(pasta);
  if (error) throw new Error(`Falha ao listar bucket: ${error.message}`);
  return (data ?? []).some((arquivo) => arquivo.name === nomeArquivo);
}

let responsavelId: string;
let responsavelCliente: SupabaseClient<Database>;

beforeAll(async () => {
  const marca = Date.now();
  const responsavel = await criarClienteAutenticado(`storage-${marca}@exemplo.test`);
  responsavelId = responsavel.id;
  responsavelCliente = responsavel.cliente;
  await servico.from("responsaveis").update({ nome: "Responsável Storage" }).eq("id", responsavelId);
});

describe("bucket termos — delete de arquivo órfão (achado de review)", () => {
  it("o dono consegue apagar um arquivo que não está referenciado por nenhum consentimento", async () => {
    const caminho = `${responsavelId}/orfao-${Date.now()}`;
    await enviarArquivo(responsavelCliente, caminho);
    expect(await existeNoBucket(caminho)).toBe(true);

    const { error } = await responsavelCliente.storage.from(BUCKET).remove([caminho]);
    expect(error).toBeNull();
    expect(await existeNoBucket(caminho)).toBe(false);
  });

  it("apagar um caminho que nunca existiu não dá erro (idempotente) e não cria nada", async () => {
    const caminho = `${responsavelId}/nunca-existiu-${Date.now()}`;
    const { error } = await responsavelCliente.storage.from(BUCKET).remove([caminho]);
    expect(error).toBeNull();
    expect(await existeNoBucket(caminho)).toBe(false);
  });
});

describe("bucket termos — arquivo referenciado por um consentimento nunca pode ser apagado (mesma garantia de 0003: prova não se apaga)", () => {
  it("o dono NÃO consegue apagar o arquivo depois que um consentimento passa a referenciá-lo", async () => {
    const atleta = await novoAtleta(responsavelId);
    const caminho = `${responsavelId}/com-consentimento-${Date.now()}`;
    await enviarArquivo(responsavelCliente, caminho);

    const { error: erroConsentimento } = await responsavelCliente.from("consentimentos").insert({
      atleta_id: atleta,
      responsavel_id: responsavelId,
      documento_url: `${BUCKET}/${caminho}`,
      versao_termo: "2026-08-v1",
    });
    expect(erroConsentimento).toBeNull();

    const { data, error } = await responsavelCliente.storage.from(BUCKET).remove([caminho]);
    // O storage não devolve erro para "0 linhas afetadas pela RLS" (mesmo
    // formato do Postgres puro): a política nega silenciosamente, então a
    // prova real é o arquivo continuar existindo depois.
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
    expect(await existeNoBucket(caminho)).toBe(true);
  });

  it("continua impossível apagar mesmo depois do consentimento ser revogado (revogar não é apagar)", async () => {
    const atleta = await novoAtleta(responsavelId);
    const caminho = `${responsavelId}/revogado-${Date.now()}`;
    await enviarArquivo(responsavelCliente, caminho);

    await responsavelCliente.from("consentimentos").insert({
      atleta_id: atleta,
      responsavel_id: responsavelId,
      documento_url: `${BUCKET}/${caminho}`,
      versao_termo: "2026-08-v1",
    });

    const { data: consentimento } = await responsavelCliente
      .from("consentimentos")
      .select("id")
      .eq("atleta_id", atleta)
      .single();
    await responsavelCliente
      .from("consentimentos")
      .update({ revogado_em: new Date().toISOString() })
      .eq("id", consentimento!.id);

    const { error } = await responsavelCliente.storage.from(BUCKET).remove([caminho]);
    expect(error).toBeNull();
    expect(await existeNoBucket(caminho)).toBe(true);
  });
});

describe("bucket termos — RLS: nem outro responsável nem visitante anônimo apagam o arquivo de alguém", () => {
  it("outro responsável autenticado não apaga um arquivo órfão alheio", async () => {
    const outro = await criarClienteAutenticado(`storage-outro-${Date.now()}@exemplo.test`);
    const caminho = `${responsavelId}/orfao-alheio-${Date.now()}`;
    await enviarArquivo(responsavelCliente, caminho);

    const { error } = await outro.cliente.storage.from(BUCKET).remove([caminho]);
    expect(error).toBeNull();
    expect(await existeNoBucket(caminho)).toBe(true);
  });

  it("visitante anônimo não apaga um arquivo órfão de ninguém", async () => {
    const visitante = createClient<Database>(URL, PUBLICAVEL, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const caminho = `${responsavelId}/orfao-anonimo-${Date.now()}`;
    await enviarArquivo(responsavelCliente, caminho);

    const { error } = await visitante.storage.from(BUCKET).remove([caminho]);
    expect(error).toBeNull();
    expect(await existeNoBucket(caminho)).toBe(true);
  });
});
