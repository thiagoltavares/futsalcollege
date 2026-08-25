"use server";

import {
  esquemaLegendaMidia,
  TAMANHO_MAX_FOTO_BYTES,
  TAMANHO_MAX_VIDEO_BYTES,
  validarMidia,
} from "@futsalcollege/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

type EstadoEnvioMidia = { erro: string } | null;

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

  const tamanhoMax = validacao.categoria === "foto" ? TAMANHO_MAX_FOTO_BYTES : TAMANHO_MAX_VIDEO_BYTES;
  if (arquivo.size > tamanhoMax) {
    const limiteMb = Math.round(tamanhoMax / (1024 * 1024));
    const tamanhoMb = Math.round(arquivo.size / (1024 * 1024));
    // Mensagem específica por categoria: quem manda um vídeo de celular
    // acima do limite precisa saber o que fazer, não só que passou do
    // tamanho (ver AGENTS/brief da rodada). No caminho comum, com
    // JavaScript, `FormularioEnvioMidia` já pega isso antes de subir
    // qualquer byte (`lib/midia-cliente.ts`); este erro aqui é o reforço
    // para quando o envio chega direto, sem passar pelo cliente.
    const sugestao =
      validacao.categoria === "video"
        ? "Grave em qualidade menor, corte um trecho mais curto ou comprima o vídeo antes de enviar (o próprio app de câmera ou um editor do celular fazem isso)."
        : "Tire a foto com resolução menor ou envie uma versão já comprimida.";
    return {
      erro: `Esse arquivo tem ${tamanhoMb} MB — o limite é ${limiteMb} MB. ${sugestao}`,
    };
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

  // Só existe UMA capa por atleta (índice único, migration 0011), e capa só
  // faz sentido numa foto — `avatarMidia` na ficha pública (atleta/[id]/page.tsx)
  // só olha `tipo === "foto"`. Checa se já existe alguma antes de decidir
  // quem ganha a marca agora: nem sempre é a primeira linha inserida (um
  // vídeo enviado primeiro nunca deve levar `capa`, senão trava o índice
  // único sem nenhuma foto poder assumir depois).
  const { count: contagemCapa } = await supabase
    .from("atleta_midias")
    .select("id", { count: "exact", head: true })
    .eq("atleta_id", atletaId)
    .eq("capa", true);
  const jaTemCapa = (contagemCapa ?? 0) > 0;

  const { error: erroLinha } = await supabase.from("atleta_midias").insert({
    atleta_id: atletaId,
    tipo: validacao.categoria,
    storage_path: caminho,
    legenda: legendaAnalise.data ?? null,
    ordem: count ?? 0,
    capa: validacao.categoria === "foto" && !jaTemCapa,
  });

  if (erroLinha) {
    // Mesmo padrão de rollback compensatório de `assinarConsentimento`: sem
    // isto, o arquivo já enviado ficaria órfão no bucket.
    await supabase.storage.from("midias").remove([caminho]);
    return { erro: "Não consegui salvar a mídia. Tente de novo." };
  }

  // Quadro de capa extraído do vídeo no cliente (ver `lib/midia-cliente.ts`
  // e `Formulario.tsx`) — só existe quando o arquivo principal era vídeo.
  // Falha aqui não derruba o envio do vídeo, que já está salvo: sem quadro
  // de capa, o perfil só fica sem avatar até uma foto de verdade ser
  // enviada, exatamente como já acontecia antes desta rodada.
  const capaExtraida = formulario.get("capa_extraida");
  if (validacao.categoria === "video" && capaExtraida instanceof File && capaExtraida.size > 0) {
    const cabecalhoCapa = new Uint8Array(await capaExtraida.slice(0, 32).arrayBuffer());
    const validacaoCapa = validarMidia(capaExtraida.type, cabecalhoCapa);

    if (validacaoCapa.valido && validacaoCapa.categoria === "foto") {
      const caminhoCapa = `${userId}/${atletaId}/${crypto.randomUUID()}.${extensaoDoTipo(validacaoCapa.tipo)}`;

      const { error: erroEnvioCapa } = await supabase.storage
        .from("midias")
        .upload(caminhoCapa, capaExtraida, { contentType: validacaoCapa.tipo, upsert: false });

      if (!erroEnvioCapa) {
        const { error: erroLinhaCapa } = await supabase.from("atleta_midias").insert({
          atleta_id: atletaId,
          tipo: "foto",
          storage_path: caminhoCapa,
          legenda: null,
          ordem: (count ?? 0) + 1,
          capa: !jaTemCapa,
        });
        if (erroLinhaCapa) {
          await supabase.storage.from("midias").remove([caminhoCapa]);
        }
      }
    }
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
