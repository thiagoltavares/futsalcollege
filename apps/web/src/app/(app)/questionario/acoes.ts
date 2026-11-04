"use server";

import { revalidatePath } from "next/cache";
import { usuarioDaEquipe } from "@/lib/equipe";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Marcação de "visto" nas respostas da pesquisa (migration 0018). A tabela
 * não tem política de escrita na RLS para isto, então a marcação usa a
 * chave de serviço — e só depois de conferir, aqui no servidor, que a
 * sessão é de alguém da equipe.
 */

export async function marcarVista(id: string, vista: boolean): Promise<void> {
  const usuario = await usuarioDaEquipe();
  if (!usuario) return;

  await criarClienteAdmin()
    .from("pesquisa_responsaveis")
    .update(
      vista
        ? { visto_em: new Date().toISOString(), visto_por: usuario.id }
        : { visto_em: null, visto_por: null },
    )
    .eq("id", id);

  revalidatePath("/questionario");
}

export async function marcarTodasVistas(): Promise<void> {
  const usuario = await usuarioDaEquipe();
  if (!usuario) return;

  await criarClienteAdmin()
    .from("pesquisa_responsaveis")
    .update({ visto_em: new Date().toISOString(), visto_por: usuario.id })
    .is("visto_em", null);

  revalidatePath("/questionario");
}
