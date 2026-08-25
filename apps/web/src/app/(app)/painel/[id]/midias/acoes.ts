"use server";

import { esquemaLegendaMidia, validarMidia } from "@futsalcollege/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

type EstadoEnvioMidia = { erro: string } | null;

const TAMANHO_MAX_FOTO = 8 * 1024 * 1024; // 8 MB
const TAMANHO_MAX_VIDEO = 40 * 1024 * 1024; // 40 MB

async function clienteAutenticado() {
  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");
  return { supabase, userId: sessao.user.id };
}

function extensaoDoTipo(tipo: string): string {
  const sub = tipo.split("/")[1] ?? "bin";
  return sub === "quicktime" ? "mov" : sub;
}

export async function enviarMidia(
  atletaId: string,
  _estadoAnterior: EstadoEnvioMidia,
  formulario: FormData,
): Promise<EstadoEnvioMidia> {
  const arquivo = formulario.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Escolha uma foto ou um vídeo." };
  }

  const legendaBruta = formulario.get("legenda");
  const legendaAnalise = esquemaLegendaMidia.safeParse(
    typeof legendaBruta === "string" && legendaBruta.trim() ? legendaBruta.trim() : undefined,
  );
  if (!legendaAnalise.success) {
    return { erro: legendaAnalise.error.issues[0]?.message ?? "Legenda inválida." };
  }

  // Mesmo raciocínio de `assinarConsentimento` (painel/[id]/consentimento/acoes.ts):
  // o `type` do FormData vem da extensão do arquivo e é falsificável — só a
  // assinatura dos primeiros bytes prova o formato real.
  const cabecalho = new Uint8Array(await arquivo.slice(0, 32).arrayBuffer());
  const validacao = validarMidia(arquivo.type, cabecalho);
  if (!validacao.valido) return { erro: validacao.motivo };

  const tamanhoMax = validacao.categoria === "foto" ? TAMANHO_MAX_FOTO : TAMANHO_MAX_VIDEO;
  if (arquivo.size > tamanhoMax) {
    return { erro: `O arquivo precisa ter menos de ${Math.round(tamanhoMax / (1024 * 1024))} MB.` };
  }

  const { supabase, userId } = await clienteAutenticado();

  const { data: atleta } = await supabase
    .from("atletas")
    .select("id")
    .eq("id", atletaId)
    .eq("responsavel_id", userId)
    .maybeSingle();
  if (!atleta) return { erro: "Não encontrei esse atleta." };

  const caminho = `${userId}/${atletaId}/${crypto.randomUUID()}.${extensaoDoTipo(validacao.tipo)}`;

  const { error: erroEnvio } = await supabase.storage
    .from("midias")
    .upload(caminho, arquivo, { contentType: validacao.tipo, upsert: false });
  if (erroEnvio) return { erro: "Não consegui enviar o arquivo. Tente de novo." };

  const { count } = await supabase
    .from("atleta_midias")
    .select("id", { count: "exact", head: true })
    .eq("atleta_id", atletaId);

  const { error: erroLinha } = await supabase.from("atleta_midias").insert({
    atleta_id: atletaId,
    tipo: validacao.categoria,
    storage_path: caminho,
    legenda: legendaAnalise.data ?? null,
    ordem: count ?? 0,
    capa: (count ?? 0) === 0,
  });

  if (erroLinha) {
    // Mesmo padrão de rollback compensatório de `assinarConsentimento`: sem
    // isto, o arquivo já enviado ficaria órfão no bucket.
    await supabase.storage.from("midias").remove([caminho]);
    return { erro: "Não consegui salvar a mídia. Tente de novo." };
  }

  revalidatePath(`/painel/${atletaId}/midias`);
  revalidatePath(`/atleta/${atletaId}`);
  return null;
}

export async function apagarMidia(atletaId: string, midiaId: string) {
  const { supabase } = await clienteAutenticado();

  const { data: midia } = await supabase
    .from("atleta_midias")
    .select("id, storage_path")
    .eq("id", midiaId)
    .eq("atleta_id", atletaId)
    .maybeSingle();
  if (!midia) return;

  // Diferente de `termos` (documento com peso jurídico), mídia não tem
  // valor de prova a preservar: apaga a linha e o arquivo direto. Ordem
  // "linha primeiro" é de propósito — se o delete do storage falhar depois,
  // sobra um arquivo órfão inofensivo (bucket já é público, sem referência
  // nenhuma apontando pra ele), nunca uma linha apontando pra um arquivo
  // que já sumiu.
  const { error } = await supabase.from("atleta_midias").delete().eq("id", midiaId);
  if (!error) {
    await supabase.storage.from("midias").remove([midia.storage_path]);
  }

  revalidatePath(`/painel/${atletaId}/midias`);
  revalidatePath(`/atleta/${atletaId}`);
}

export async function definirCapa(atletaId: string, midiaId: string) {
  const { supabase } = await clienteAutenticado();

  await supabase
    .from("atleta_midias")
    .update({ capa: false })
    .eq("atleta_id", atletaId)
    .eq("capa", true);
  await supabase.from("atleta_midias").update({ capa: true }).eq("id", midiaId).eq("atleta_id", atletaId);

  revalidatePath(`/painel/${atletaId}/midias`);
  revalidatePath(`/atleta/${atletaId}`);
}

export async function atualizarLegenda(atletaId: string, midiaId: string, formulario: FormData) {
  const { supabase } = await clienteAutenticado();

  const bruta = formulario.get("legenda");
  const analise = esquemaLegendaMidia.safeParse(
    typeof bruta === "string" && bruta.trim() ? bruta.trim() : undefined,
  );
  if (!analise.success) return;

  await supabase
    .from("atleta_midias")
    .update({ legenda: analise.data ?? null })
    .eq("id", midiaId)
    .eq("atleta_id", atletaId);

  revalidatePath(`/painel/${atletaId}/midias`);
  revalidatePath(`/atleta/${atletaId}`);
}

export async function moverMidia(atletaId: string, midiaId: string, direcao: "cima" | "baixo") {
  const { supabase } = await clienteAutenticado();

  const { data: midias } = await supabase
    .from("atleta_midias")
    .select("id, ordem")
    .eq("atleta_id", atletaId)
    .order("ordem", { ascending: true });
  if (!midias) return;

  const indiceAtual = midias.findIndex((m) => m.id === midiaId);
  if (indiceAtual === -1) return;
  const indiceAlvo = direcao === "cima" ? indiceAtual - 1 : indiceAtual + 1;
  if (indiceAlvo < 0 || indiceAlvo >= midias.length) return;

  const atual = midias[indiceAtual]!;
  const alvo = midias[indiceAlvo]!;

  await supabase.from("atleta_midias").update({ ordem: alvo.ordem }).eq("id", atual.id);
  await supabase.from("atleta_midias").update({ ordem: atual.ordem }).eq("id", alvo.id);

  revalidatePath(`/painel/${atletaId}/midias`);
  revalidatePath(`/atleta/${atletaId}`);
}
