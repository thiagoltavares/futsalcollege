import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";

export type ResumoAvaliacao = {
  quantidade: number;
  ultimaEm: string;
  avaliadorNome: string;
};

/**
 * Resumo de avaliação por atleta — quantos laudos publicados, a data do
 * mais recente e quem assinou esse mais recente. Compartilhado por
 * `/atletas`, `/escolinha/[id]` e a home: as três listagens públicas de
 * atleta querem a mesma informação de densidade a mais, sem repetir a
 * consulta em cada arquivo.
 *
 * A política `laudos_leitura_publica` (migration 0008) já restringe a
 * leitura anônima a laudo publicado de atleta ativo — a mesma régua que
 * decide o que sai na ficha pública decide o que entra neste resumo. Nunca
 * devolve nota nem ordena atleta por nota: só existência, contagem e data.
 */
export async function buscarResumoAvaliacoes(
  supabase: SupabaseClient<Database>,
  atletaIds: string[],
): Promise<Map<string, ResumoAvaliacao>> {
  if (atletaIds.length === 0) return new Map();

  const { data } = await supabase
    .from("laudos")
    .select("atleta_id, publicado_em, avaliador_nome")
    .in("atleta_id", atletaIds)
    .not("publicado_em", "is", null)
    .order("publicado_em", { ascending: false });

  const resumo = new Map<string, ResumoAvaliacao>();
  for (const linha of data ?? []) {
    const existente = resumo.get(linha.atleta_id);
    if (!existente) {
      // Primeira ocorrência de cada atleta_id é sempre a mais recente,
      // porque a consulta já vem ordenada por publicado_em decrescente.
      resumo.set(linha.atleta_id, {
        quantidade: 1,
        ultimaEm: linha.publicado_em!,
        avaliadorNome: linha.avaliador_nome,
      });
    } else {
      existente.quantidade += 1;
    }
  }
  return resumo;
}
