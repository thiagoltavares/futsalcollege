"use server";

import { esquemaLaudo, type ItemRubrica } from "@revela10/core";
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

  // Quem assina é sempre a conta logada, resolvida aqui no servidor pela
  // sessão. O formulário não manda mais `profissional_id`, e mesmo que
  // mandasse seria ignorado: antes desta rodada o id vinha da tela, o que
  // permitia publicar um laudo com o nome de qualquer avaliador ativo da
  // plataforma. A RLS de `laudos` (migration 0016) recusa a inserção se
  // `profissional_id` não for o profissional desta conta — a checagem aqui
  // existe para devolver uma frase em vez de um erro de banco.
  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id, nome, credencial")
    .eq("user_id", sessao.user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (!profissional || !profissional.credencial) {
    return {
      erro: "Esta conta não está credenciada para avaliar. Só profissional ativo, com registro no conselho cadastrado, assina laudo.",
    };
  }

  // A rubrica ativa é buscada de novo aqui, no servidor — nunca confiamos na
  // lista de itens que a tela mandou de volta no FormData. Se a rubrica
  // ativa mudou entre abrir a tela e publicar, é esta versão que vale.
  const { data: rubrica } = await supabase
    .from("rubricas")
    .select("versao, itens")
    .eq("ativa", true)
    .maybeSingle();

  if (!rubrica) return { erro: "Nenhuma rubrica ativa no momento." };

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
    // `avaliador_nome` é snapshot imutável do momento da assinatura: vai o
    // nome que está no banco agora, nunca o que a tela mostrou.
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
