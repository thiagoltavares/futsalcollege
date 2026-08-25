import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { chave } from "./chaves";
import type { Database } from "./tipos";

/**
 * Achado da Tarefa 9: nenhuma tarefa anterior criava a linha em
 * `responsaveis` no cadastro. Um usuário que só passava pelo login por link
 * mágico nunca ganhava linha correspondente, e qualquer insert em `atletas`
 * (FK responsavel_id -> responsaveis.id) falhava. A migration 0004 fecha
 * isso com um gatilho em auth.users, no padrão oficial do Supabase para
 * popular tabela pública a partir do signup.
 *
 * `nome` fica nulo: só tem valor jurídico quando coletado no termo de
 * consentimento (Tarefa 10) — não faz sentido inventar um nome aqui.
 *
 * Portas com offset +200 nesta máquina: API em 54521, não a 54321 padrão.
 */
const URL = process.env.API_URL ?? process.env.SUPABASE_URL ?? "http://127.0.0.1:54521";
const SECRETA = chave("SECRET_KEY", "SERVICE_ROLE_KEY");
const SENHA = "senha-de-teste-123";

const servico = createClient<Database>(URL, SECRETA, { auth: { persistSession: false } });

describe("responsaveis — linha criada automaticamente no signup", () => {
  it("criar um usuário em auth.users cria a linha correspondente em responsaveis, com nome nulo", async () => {
    const email = `signup-${Date.now()}@exemplo.test`;
    const { data, error } = await servico.auth.admin.createUser({
      email,
      password: SENHA,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Falha ao criar usuário de teste ${email}: ${error?.message}`);
    }

    const { data: linha, error: erroLeitura } = await servico
      .from("responsaveis")
      .select("id, nome")
      .eq("id", data.user.id)
      .single();

    expect(erroLeitura).toBeNull();
    expect(linha).not.toBeNull();
    expect(linha!.id).toBe(data.user.id);
    expect(linha!.nome).toBeNull();
  });

  it("apagar o usuário continua removendo a linha de responsaveis em cascata", async () => {
    const email = `signup-delete-${Date.now()}@exemplo.test`;
    const { data, error } = await servico.auth.admin.createUser({
      email,
      password: SENHA,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Falha ao criar usuário de teste ${email}: ${error?.message}`);
    }

    const { data: antes } = await servico.from("responsaveis").select("id").eq("id", data.user.id);
    expect(antes).toHaveLength(1);

    const { error: erroDelete } = await servico.auth.admin.deleteUser(data.user.id);
    expect(erroDelete).toBeNull();

    const { data: depois } = await servico.from("responsaveis").select("id").eq("id", data.user.id);
    expect(depois ?? []).toHaveLength(0);
  });
});
