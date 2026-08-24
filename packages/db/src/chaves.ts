/**
 * As chaves `anon` e `service_role` foram substituídas por publishable
 * (`sb_publishable_…`) e secret (`sb_secret_…`), e as legadas são desativadas
 * até o fim de 2026. Versões mais antigas do CLI ainda emitem os nomes velhos
 * no `supabase status`, então lemos os dois, preferindo o novo.
 */
export function chave(nova: string, legada: string): string {
  const valor = process.env[nova] ?? process.env[legada];

  if (!valor) {
    throw new Error(
      `Faltou ${nova} (ou ${legada}) no ambiente. ` +
        "Rode: pnpm --filter @futsalcollege/db db:start && supabase status -o env > .env.test",
    );
  }

  return valor;
}
