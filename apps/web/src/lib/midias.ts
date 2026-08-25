import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";

/**
 * Foto de capa por atleta (bucket `midias`, migration 0011) — já resolvida
 * como URL pública, pronta para o `<img src>` da faixa de mídia do cartão
 * (`CartaoAtleta`). Sem capa marcada (`atleta_midias.capa`), cai para a
 * primeira foto por `ordem`; sem foto nenhuma, o atleta simplesmente não
 * entra no mapa — o cartão decide o grafismo de substituição (inicial do
 * apelido sobre gradiente de marca), nunca um espaço vazio.
 *
 * Compartilhado pelas mesmas listagens públicas de atleta que já usam
 * `buscarResumoAvaliacoes` (`lib/avaliacoes.ts`): home, `/atletas`,
 * `/escolinha/[id]` e `/profissional/[slug]` — uma consulta batida por
 * página, nunca uma por atleta. A política `midias_leitura_publica`
 * (migration 0011) já restringe a leitura anônima a mídia de atleta
 * `ativo`.
 */
export async function buscarCapasAtletas(
  supabase: SupabaseClient<Database>,
  atletaIds: string[],
): Promise<Map<string, string>> {
  if (atletaIds.length === 0) return new Map();

  const { data } = await supabase
    .from("atleta_midias")
    .select("atleta_id, storage_path, capa")
    .eq("tipo", "foto")
    .in("atleta_id", atletaIds)
    .order("capa", { ascending: false })
    .order("ordem", { ascending: true });

  const capas = new Map<string, string>();
  for (const midia of data ?? []) {
    if (capas.has(midia.atleta_id)) continue;
    // Primeira ocorrência de cada atleta_id já é a capa (se houver — ORDER
    // BY capa DESC) ou a foto mais antiga por ordem, mesmo fallback usado
    // na ficha pública (`/atleta/[id]/page.tsx`).
    capas.set(
      midia.atleta_id,
      supabase.storage.from("midias").getPublicUrl(midia.storage_path).data.publicUrl,
    );
  }
  return capas;
}
