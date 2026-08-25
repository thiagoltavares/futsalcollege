"use server";

import { esquemaAtleta } from "@futsalcollege/core";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export async function criarAtleta(_estadoAnterior: unknown, formulario: FormData) {
  const bruto = Object.fromEntries(formulario) as Record<string, string>;

  const analise = esquemaAtleta.safeParse({
    ...bruto,
    altura_cm: bruto.altura_cm ? Number(bruto.altura_cm) : undefined,
    peso_kg: bruto.peso_kg ? Number(bruto.peso_kg) : undefined,
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  const d = analise.data;

  const { data: atleta, error } = await supabase
    .from("atletas")
    .insert({
      responsavel_id: sessao.user.id,
      apelido: d.apelido,
      categoria: d.categoria,
      posicao: d.posicao ?? null,
      pe_dominante: d.pe_dominante ?? null,
      altura_cm: d.altura_cm ?? null,
      peso_kg: d.peso_kg ?? null,
      clube_atual: d.clube_atual ?? null,
      estado_uf: d.estado_uf ?? null,
      estado: "aguardando_consentimento",
    })
    .select("id")
    .single();

  if (error || !atleta) return { erro: "Não consegui salvar. Tente de novo." };

  await supabase.from("atleta_identificacao").insert({
    atleta_id: atleta.id,
    nome_completo: d.nome_completo,
    data_nascimento: d.data_nascimento,
    cidade: d.cidade ?? null,
    contato_responsavel: d.contato_responsavel ?? null,
  });

  redirect(`/painel/${atleta.id}/consentimento`);
}
