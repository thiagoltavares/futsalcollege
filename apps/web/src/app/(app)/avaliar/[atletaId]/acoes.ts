"use server";

import { esquemaLaudo, type ItemRubrica } from "@futsalcollege/core";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export async function publicarLaudo(
  atletaId: string,
  _estadoAnterior: unknown,
  formulario: FormData,
) {
  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  // A rubrica ativa é buscada de novo aqui, no servidor — nunca confiamos na
  // lista de itens que a tela mandou de volta no FormData. Se a rubrica
  // ativa mudou entre abrir a tela e publicar, é esta versão que vale.
  const { data: rubrica } = await supabase
    .from("rubricas")
    .select("versao, itens")
    .eq("ativa", true)
    .maybeSingle();

  if (!rubrica) return { erro: "Nenhuma rubrica ativa no momento." };

  // O avaliador é um profissional cadastrado, nunca texto livre vindo do
  // cliente (ver AGENTS/brief da rodada — antes disto, todo laudo criado
  // pela tela nascia órfão de `profissional_id`). Busca de novo no
  // servidor, pela mesma razão de nunca confiar na rubrica devolvida pelo
  // FormData: o id escolhido prova só a intenção, o nome que vai gravado em
  // `avaliador_nome` (snapshot imutável do momento da assinatura) é sempre
  // o que está no banco agora, nunca o que a tela mandou de volta.
  const profissionalId = formulario.get("profissional_id");
  if (typeof profissionalId !== "string" || !profissionalId) {
    return { erro: "Escolha um profissional para assinar o laudo." };
  }

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id, nome")
    .eq("id", profissionalId)
    .eq("ativo", true)
    .maybeSingle();

  if (!profissional) {
    return { erro: "Esse profissional não está mais disponível. Escolha outro da lista." };
  }

  const itens = rubrica.itens as unknown as ItemRubrica[];

  const notas: Record<string, number> = {};
  for (const item of itens) {
    const bruto = formulario.get(`nota_${item.chave}`);
    const nota = bruto ? Number(bruto) : NaN;
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return { erro: `Falta avaliar "${item.rotulo}".` };
    }
    notas[item.chave] = nota;
  }

  const analise = esquemaLaudo.safeParse({
    contexto: formulario.get("contexto"),
    avaliador_nome: profissional.nome,
    texto: formulario.get("texto") || undefined,
    notas,
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = analise.data;

  const { data: laudo, error } = await supabase
    .from("laudos")
    .insert({
      atleta_id: atletaId,
      avaliador_id: sessao.user.id,
      avaliador_nome: d.avaliador_nome,
      profissional_id: profissional.id,
      rubrica_versao: rubrica.versao,
      contexto: d.contexto,
      notas: d.notas,
      texto: d.texto ?? null,
      publicado_em: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !laudo) {
    return { erro: "Não consegui publicar a avaliação. Tente de novo." };
  }

  redirect(`/atleta/${atletaId}`);
}
