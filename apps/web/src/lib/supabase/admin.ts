import type { Database } from "@futsalcollege/db";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave secreta (service_role) do Supabase — Admin API e
 * bypass total de RLS. Só pode ser chamado a partir de código que roda no
 * servidor: nunca importe este módulo de um componente "use client", nem
 * repasse a chave para o navegador.
 *
 * Hoje o único chamador é o login de desenvolvimento (`entrar/loginDev.*`),
 * sempre atrás das duas travas de ambiente (`NODE_ENV` e
 * `NEXT_PUBLIC_LOGIN_DEV`) checadas no servidor antes de qualquer uso desta
 * função — ver `loginDevHabilitado()`.
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
