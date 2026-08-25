"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { VERSAO_TERMO } from "@/conteudo/termo-2026-08-v1";
import { criarClienteServidor } from "@/lib/supabase/servidor";

type EstadoConsentimento = { erro: string } | null;

export async function assinarConsentimento(
  atletaId: string,
  _estadoAnterior: EstadoConsentimento,
  formulario: FormData,
): Promise<EstadoConsentimento> {
  // O nome do responsável tem peso jurídico aqui: é o termo que serve de
  // prova de quem consentiu. `responsaveis.nome` fica nulo desde o signup
  // (migration 0004) até este ponto — não se assina sem preenchê-lo.
  const nomeResponsavel = formulario.get("nome_responsavel");
  const nome = typeof nomeResponsavel === "string" ? nomeResponsavel.trim() : "";
  if (!nome) {
    return { erro: "Informe o nome completo do responsável." };
  }

  const aceite = formulario.get("aceite");
  if (aceite !== "on") {
    return { erro: "Confirme que leu e autoriza os termos." };
  }

  const documento = formulario.get("documento");
  if (!(documento instanceof File) || documento.size === 0) {
    return { erro: "Anexe um documento de identidade." };
  }
  if (documento.size > 8 * 1024 * 1024) {
    return { erro: "O arquivo precisa ter menos de 8 MB." };
  }

  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  const { error: erroNome } = await supabase
    .from("responsaveis")
    .update({ nome })
    .eq("id", sessao.user.id);

  if (erroNome) return { erro: "Não consegui salvar seu nome. Tente de novo." };

  const caminho = `${sessao.user.id}/${atletaId}-${Date.now()}`;
  const { error: erroEnvio } = await supabase.storage
    .from("termos")
    .upload(caminho, documento, { upsert: false });

  if (erroEnvio) return { erro: "Não consegui enviar o documento. Tente de novo." };

  const { error: erroConsentimento } = await supabase.from("consentimentos").insert({
    atleta_id: atletaId,
    responsavel_id: sessao.user.id,
    documento_url: `termos/${caminho}`,
    versao_termo: VERSAO_TERMO,
  });

  if (erroConsentimento) return { erro: "Não consegui registrar o consentimento." };

  // O gatilho do banco só deixa passar porque o consentimento acima já existe.
  const { error: erroAtivacao } = await supabase
    .from("atletas")
    .update({ estado: "ativo" })
    .eq("id", atletaId);

  if (erroAtivacao) return { erro: "Consentimento salvo, mas o perfil não ativou." };

  revalidatePath(`/atleta/${atletaId}`);
  revalidatePath("/painel");
  redirect("/painel");
}

export async function revogarConsentimento(atletaId: string) {
  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  // O gatilho derrubar_ao_revogar suspende o perfil sozinho.
  const { error } = await supabase
    .from("consentimentos")
    .update({ revogado_em: new Date().toISOString() })
    .eq("atleta_id", atletaId)
    .is("revogado_em", null);

  if (error) return { erro: "Não consegui revogar. Tente de novo." };

  revalidatePath(`/atleta/${atletaId}`);
  revalidatePath("/painel");
  return { ok: true };
}
