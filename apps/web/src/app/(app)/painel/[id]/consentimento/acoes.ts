"use server";

import { validarDocumento } from "@futsalcollege/core";
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

  // O `type` de um FormData é informado pelo navegador a partir da extensão
  // do arquivo e é falsificável (renomear um executável para `.pdf` já
  // basta) — por isso a checagem real olha para a assinatura dos primeiros
  // bytes, não só para o `type` declarado. Este é o documento de
  // identidade do responsável, prova jurídica do consentimento.
  const cabecalho = new Uint8Array(await documento.slice(0, 32).arrayBuffer());
  const validacaoDocumento = validarDocumento(documento.type, cabecalho);
  if (!validacaoDocumento.valido) {
    return { erro: validacaoDocumento.motivo };
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

  if (erroConsentimento) {
    // Sem isto, o arquivo já enviado ficaria órfão no bucket — ninguém
    // aponta para ele, mas ele continua ocupando espaço e existindo fora de
    // qualquer registro. Mesmo padrão de rollback compensatório usado em
    // `painel/novo/acoes.ts` para o insert de `atleta_identificacao`.
    await supabase.storage.from("termos").remove([caminho]);
    return { erro: "Não consegui registrar o consentimento." };
  }

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

  // `.select("id")` força o Postgres a devolver as linhas de fato afetadas
  // pelo update. Sem isso, um `update` que não muda nenhuma linha não é um
  // erro para o Postgres nem para o Supabase — "sem erro" não distingue
  // "revoguei" de "não havia nada vigente para revogar" (inclusive o caso
  // da RLS filtrar a linha silenciosamente, ex. atleta que não é deste
  // responsável): as duas situações devolviam `{ ok: true }`, uma
  // confirmação falsa de que a revogação aconteceu.
  const { data, error } = await supabase
    .from("consentimentos")
    .update({ revogado_em: new Date().toISOString() })
    .eq("atleta_id", atletaId)
    .is("revogado_em", null)
    .select("id");

  if (error) return { ok: false as const, erro: "Não consegui revogar. Tente de novo." };

  if (!data || data.length === 0) {
    return { ok: false as const, erro: "Não havia autorização vigente para revogar." };
  }

  // O gatilho derrubar_ao_revogar suspende o perfil sozinho.
  revalidatePath(`/atleta/${atletaId}`);
  revalidatePath("/painel");
  return { ok: true as const };
}
