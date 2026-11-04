"use server";

import { revalidatePath } from "next/cache";
import { usuarioDaEquipe } from "@/lib/equipe";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * "Visto" individual nas respostas da pesquisa (migration 0019): cada
 * pessoa da equipe tem a sua leitura, uma linha em `pesquisa_leituras`.
 * Marcar não muda nada para o outro. A tabela não tem política de escrita
 * na RLS, então a marcação usa a chave de serviço — e só depois de
 * conferir, aqui no servidor, que a sessão é de alguém da equipe.
 */

export async function marcarVista(id: string, vista: boolean): Promise<void> {
  const usuario = await usuarioDaEquipe();
  if (!usuario) return;
  const admin = criarClienteAdmin();

  if (vista) {
    await admin
      .from("pesquisa_leituras")
      .upsert({ resposta_id: id, user_id: usuario.id }, { onConflict: "resposta_id,user_id" });
  } else {
    await admin.from("pesquisa_leituras").delete().eq("resposta_id", id).eq("user_id", usuario.id);
  }

  revalidatePath("/questionario");
}

export async function marcarTodasVistas(): Promise<void> {
  const usuario = await usuarioDaEquipe();
  if (!usuario) return;
  const admin = criarClienteAdmin();

  const [{ data: respostas }, { data: lidas }] = await Promise.all([
    admin.from("pesquisa_responsaveis").select("id"),
    admin.from("pesquisa_leituras").select("resposta_id").eq("user_id", usuario.id),
  ]);
  const jaLidas = new Set((lidas ?? []).map((l) => l.resposta_id));
  const novas = (respostas ?? []).filter((r) => !jaLidas.has(r.id));
  if (novas.length === 0) return;

  await admin
    .from("pesquisa_leituras")
    .upsert(
      novas.map((r) => ({ resposta_id: r.id, user_id: usuario.id })),
      { onConflict: "resposta_id,user_id" },
    );

  revalidatePath("/questionario");
}
