import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { chave } from "./chaves";
import type { Database } from "./tipos";

/**
 * Quem pode assinar um laudo.
 *
 * Até a migration 0016, a política `laudos_do_avaliador` era `for all` com
 * `avaliador_id = auth.uid()`: qualquer conta autenticada inseria um laudo, e
 * a tela ainda deixava escolher qual profissional apareceria assinando.
 * Somadas, as duas coisas permitiam publicar uma avaliação com o nome de
 * qualquer avaliador da plataforma — o selo, que é o produto, estava
 * emprestado a quem pedisse.
 *
 * Estes testes são a prova de que isso não volta. Se algum deles falhar, é
 * porque alguém pode assinar no lugar de outra pessoa.
 */
const URL = process.env.API_URL ?? process.env.SUPABASE_URL ?? "http://127.0.0.1:54521";
const PUBLICAVEL = chave("PUBLISHABLE_KEY", "ANON_KEY");
const SECRETA = chave("SECRET_KEY", "SERVICE_ROLE_KEY");

const SENHA = "senha-de-teste-123";

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
  if (erroLogin) throw new Error(`Falha ao logar ${email}: ${erroLogin.message}`);

  return { id: data.user.id, cliente };
}

/** Cria a linha de `profissionais` ligada a uma conta e devolve o id dela. */
async function criarProfissional(
  marca: number,
  sufixo: string,
  userId: string | null,
  opcoes: { credencial: string | null; ativo: boolean },
): Promise<string> {
  const { data, error } = await servico
    .from("profissionais")
    .insert({
      user_id: userId,
      nome: `Profissional ${sufixo}`,
      slug: `prof-${sufixo}-${marca}`,
      credencial: opcoes.credencial,
      ativo: opcoes.ativo,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao criar profissional ${sufixo}: ${error?.message}`);
  return data.id;
}

let credenciado: { id: string; cliente: SupabaseClient<Database> };
let semCredencial: { id: string; cliente: SupabaseClient<Database> };
let desativado: { id: string; cliente: SupabaseClient<Database> };
let responsavel: { id: string; cliente: SupabaseClient<Database> };

let profCredenciado: string;
let profSemCredencial: string;
let profDesativado: string;
/** Profissional de outra pessoa — o alvo da tentativa de assinar no lugar dela. */
let profDeOutro: string;

let atletaId: string;
let rubricaVersao: string;

beforeAll(async () => {
  const marca = Date.now();

  [credenciado, semCredencial, desativado, responsavel] = await Promise.all([
    criarClienteAutenticado(`prof-ok-${marca}@exemplo.test`),
    criarClienteAutenticado(`prof-sem-cred-${marca}@exemplo.test`),
    criarClienteAutenticado(`prof-off-${marca}@exemplo.test`),
    criarClienteAutenticado(`resp-${marca}@exemplo.test`),
  ]);

  [profCredenciado, profSemCredencial, profDesativado, profDeOutro] = await Promise.all([
    criarProfissional(marca, "ok", credenciado.id, { credencial: "CREF 000123-G/CE", ativo: true }),
    criarProfissional(marca, "sem-cred", semCredencial.id, { credencial: null, ativo: true }),
    criarProfissional(marca, "off", desativado.id, { credencial: "CREF 000456-G/CE", ativo: false }),
    criarProfissional(marca, "outro", null, { credencial: "CREF 000789-G/CE", ativo: true }),
  ]);

  const { data: atleta, error: erroAtleta } = await servico
    .from("atletas")
    .insert({
      responsavel_id: responsavel.id,
      apelido: `Atleta laudo ${marca}`,
      categoria: "Sub-13",
      estado: "aguardando_consentimento",
    })
    .select("id")
    .single();
  if (erroAtleta || !atleta) throw new Error(`Falha ao criar atleta: ${erroAtleta?.message}`);
  atletaId = atleta.id;

  // Reaproveita a rubrica ativa do seed em vez de inserir outra: o índice
  // `rubricas_uma_ativa` (migration 0007) só permite uma ativa por vez.
  const { data: rubrica } = await servico
    .from("rubricas")
    .select("versao")
    .eq("ativa", true)
    .maybeSingle();
  if (!rubrica) throw new Error("Nenhuma rubrica ativa: rode o seed antes dos testes.");
  rubricaVersao = rubrica.versao;
});

/** O laudo que cada teste tenta inserir, variando só quem assina. */
function laudo(avaliadorId: string, profissionalId: string | null) {
  return {
    atleta_id: atletaId,
    avaliador_id: avaliadorId,
    avaliador_nome: "Quem Assina",
    profissional_id: profissionalId,
    rubrica_versao: rubricaVersao,
    contexto: "presencial" as const,
    notas: { passe_recepcao: 3 },
    publicado_em: new Date().toISOString(),
  };
}

describe("quem assina um laudo", () => {
  it("profissional ativo e credenciado assina em nome próprio", async () => {
    const { error } = await credenciado.cliente
      .from("laudos")
      .insert(laudo(credenciado.id, profCredenciado));
    expect(error).toBeNull();
  });

  it("responsável não assina — não tem linha em profissionais", async () => {
    const { error } = await responsavel.cliente
      .from("laudos")
      .insert(laudo(responsavel.id, profCredenciado));
    expect(error).not.toBeNull();
  });

  it("profissional não assina no lugar de outro profissional", async () => {
    const { error } = await credenciado.cliente
      .from("laudos")
      .insert(laudo(credenciado.id, profDeOutro));
    expect(error).not.toBeNull();
  });

  it("profissional sem credencial não assina", async () => {
    const { error } = await semCredencial.cliente
      .from("laudos")
      .insert(laudo(semCredencial.id, profSemCredencial));
    expect(error).not.toBeNull();
  });

  it("profissional desativado não assina", async () => {
    const { error } = await desativado.cliente
      .from("laudos")
      .insert(laudo(desativado.id, profDesativado));
    expect(error).not.toBeNull();
  });

  it("laudo sem profissional_id não entra", async () => {
    const { error } = await credenciado.cliente
      .from("laudos")
      .insert(laudo(credenciado.id, null));
    expect(error).not.toBeNull();
  });

  it("ninguém assina com avaliador_id de outra conta", async () => {
    const { error } = await credenciado.cliente
      .from("laudos")
      .insert(laudo(responsavel.id, profCredenciado));
    expect(error).not.toBeNull();
  });
});

describe("laudo não se edita nem se apaga", () => {
  let laudoId: string;

  beforeAll(async () => {
    const { data, error } = await credenciado.cliente
      .from("laudos")
      .insert(laudo(credenciado.id, profCredenciado))
      .select("id")
      .single();
    if (error || !data) throw new Error(`Falha ao criar laudo da fixture: ${error?.message}`);
    laudoId = data.id;
  });

  // Sem política de update nem de delete (migration 0016), o Postgres não
  // devolve erro: ele simplesmente não enxerga a linha para alterar. O que
  // se prova aqui é que nada mudou e nada sumiu.
  it("o próprio avaliador não edita a nota depois de publicar", async () => {
    await credenciado.cliente.from("laudos").update({ notas: { passe_recepcao: 5 } }).eq("id", laudoId);

    const { data } = await servico.from("laudos").select("notas").eq("id", laudoId).single();
    expect(data?.notas).toEqual({ passe_recepcao: 3 });
  });

  it("o próprio avaliador não apaga o laudo", async () => {
    await credenciado.cliente.from("laudos").delete().eq("id", laudoId);

    const { data } = await servico.from("laudos").select("id").eq("id", laudoId).maybeSingle();
    expect(data?.id).toBe(laudoId);
  });
});
