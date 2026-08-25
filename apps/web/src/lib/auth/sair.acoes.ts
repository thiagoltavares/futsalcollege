"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/**
 * Encerra a sessão do Supabase (apaga os cookies de autenticação) e volta
 * para a home. Usada como `action` de um `<form>` de um único botão no
 * cabeçalho da área logada (`CabecalhoPublico`, variante `autenticado`) —
 * sem essa ação não havia como trocar de usuário sem limpar cookie na mão.
 */
export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
