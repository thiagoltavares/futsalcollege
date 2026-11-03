"use server";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@revela10/db";
import { esquemaPesquisa } from "@revela10/core";

/**
 * Pesquisa de pré-lançamento (home, migration 0017). Formulário público,
 * sem login: o cliente é o anônimo, e a política `pesquisa_insercao_publica`
 * é o que deixa a linha entrar. Nada de identificação do filho passa por
 * aqui — o esquema (`@revela10/core`) só aceita os campos da tabela, e a
 * tabela não tem onde guardar nome de criança.
 */

export type EstadoPesquisa = { ok: true } | { erro: string } | null;

function clienteAnonimo() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function enviarPesquisa(
  _anterior: EstadoPesquisa,
  formulario: FormData,
): Promise<EstadoPesquisa> {
  // Campo-isca: invisível para gente, preenchido por robô. Responde "ok"
  // sem gravar, para o robô não aprender que foi barrado.
  if (String(formulario.get("site") ?? "") !== "") return { ok: true };

  const bruto = Object.fromEntries(formulario) as Record<string, string>;
  // A trilha de escolinha/clube usa nomes próprios no HTML para a UF (ver
  // `Pesquisa.tsx`); para quem não é responsável, é essa que vale.
  if (bruto.perfil && bruto.perfil !== "responsavel") {
    bruto.estado_uf = bruto.estado_uf_org ?? "";
  }
  const analise = esquemaPesquisa.safeParse({
    ...bruto,
    enviou_video: formulario.getAll("enviou_video"),
    aceita_contato: formulario.get("aceita_contato") === "on",
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Confira as respostas e tente de novo." };
  }

  const d = analise.data;
  // Cada perfil grava só o seu bloco, mesmo que o outro tenha vindo
  // preenchido (quem trocou de perfil no meio). A migration impõe o mesmo
  // com o CHECK `pesquisa_blocos_separados`.
  const responsavel = d.perfil === "responsavel";
  const doFilho = <T,>(valor: T) => (responsavel ? valor : null);
  const daOrganizacao = <T,>(valor: T) => (responsavel ? null : valor);
  // "Nunca mandei" junto com um canal é contradição; vale o canal.
  const enviou = d.enviou_video.length > 1 ? d.enviou_video.filter((v) => v !== "nunca") : d.enviou_video;
  const soNunca = enviou.length === 1 && enviou[0] === "nunca";
  const contato = d.aceita_contato ? (d.contato?.trim() ?? null) : null;

  const { error } = await clienteAnonimo()
    .from("pesquisa_responsaveis")
    .insert({
      perfil: d.perfil,
      origem: d.origem ?? null,
      estado_uf: d.estado_uf ?? null,
      categoria_filho: doFilho(d.categoria_filho ?? null),
      enviou_video: responsavel ? enviou : [],
      resultado_envio: doFilho(soNunca ? null : (d.resultado_envio ?? null)),
      tem_video: doFilho(d.tem_video ?? null),
      gasto_mensal: doFilho(d.gasto_mensal ?? null),
      publica_video: doFilho(d.publica_video ?? null),
      quem_ve_video: doFilho(d.quem_ve_video ?? null),
      preocupacao: doFilho(d.preocupacao ?? null),
      beneficio: doFilho(d.beneficio ?? null),
      organizacao: daOrganizacao(d.organizacao ?? null),
      como_hoje: daOrganizacao(d.como_hoje ?? null),
      pedido: daOrganizacao(d.pedido ?? null),
      aceita_contato: contato !== null,
      contato,
    });

  if (error) return { erro: "Não consegui enviar. Tente de novo em instantes." };

  return { ok: true };
}
