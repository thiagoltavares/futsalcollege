import type { Database } from "@revela10/db";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave secreta (service_role) do Supabase — Admin API e
 * bypass total de RLS. Só pode ser chamado a partir de código que roda no
 * servidor: nunca importe este módulo de um componente "use client", nem
 * repasse a chave para o navegador.
 *
 * Chamadores, cada um atrás da sua trava checada no servidor antes de usar
 * esta função:
 * - o login de desenvolvimento (`entrar/loginDev.*`), atrás de
 *   `loginDevHabilitado()`;
 * - o Questionário da equipe (`/questionario`), atrás de `usuarioDaEquipe()`
 *   (`lib/equipe.ts`) — as respostas da pesquisa não têm política de leitura
 *   na RLS, de propósito.
 */
export function criarClienteAdmin() {
  const chaveSecreta = process.env.SUPABASE_SECRET_KEY;
  if (!chaveSecreta) {
    throw new Error(
      "Faltou SUPABASE_SECRET_KEY no ambiente do servidor (não confundir com a publishable key).",
    );
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, chaveSecreta, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
