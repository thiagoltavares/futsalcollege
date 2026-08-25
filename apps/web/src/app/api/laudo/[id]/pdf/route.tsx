import type { ItemRubrica } from "@futsalcollege/core";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { LaudoPDF } from "@/pdf/LaudoPDF";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: RouteContext<"/api/laudo/[id]/pdf">) {
  const { id } = await ctx.params;
  const supabase = await criarClienteServidor();

  // A política `laudos_leitura_publica` (migration 0008) já garante que só
  // um laudo publicado, de um atleta ativo, chega até aqui — a mesma regra
  // que decide se ele aparece na ficha pública decide se o PDF existe.
  const { data: laudo } = await supabase
    .from("laudos")
    .select(
      "notas, texto, contexto, rubrica_versao, avaliador_nome, publicado_em, atletas(apelido, categoria, posicao, escolinhas(nome)), profissionais(credencial, cidade, estado_uf)",
    )
    .eq("id", id)
    .not("publicado_em", "is", null)
    .maybeSingle();

  if (!laudo) return new NextResponse("Laudo não encontrado", { status: 404 });

  const { data: rubrica } = await supabase
    .from("rubricas")
    .select("itens")
    .eq("versao", laudo.rubrica_versao)
    .single();

  const atleta = laudo.atletas as unknown as {
    apelido: string;
    categoria: string;
    posicao: string | null;
    escolinhas: { nome: string } | null;
  };
  // `profissional_id` é opcional em `laudos` (laudo antigo pode não ter
  // vínculo — ver migration 0010): sem profissional, a "assinatura" do PDF
  // cai só no nome gravado no próprio laudo (`avaliador_nome`).
  const profissional = laudo.profissionais as unknown as {
    credencial: string | null;
    cidade: string | null;
    estado_uf: string | null;
  } | null;
  const avaliadorLocal = profissional
    ? [profissional.cidade, profissional.estado_uf].filter(Boolean).join(" · ") || null
    : null;

  const buffer = await renderToBuffer(
    <LaudoPDF
      dados={{
        apelido: atleta.apelido,
        categoria: atleta.categoria,
        posicao: atleta.posicao,
        escolinhaNome: atleta.escolinhas?.nome ?? null,
        contexto: laudo.contexto === "presencial" ? "Presencial" : "Análise de vídeo",
        avaliador: laudo.avaliador_nome,
        avaliadorCredencial: profissional?.credencial ?? null,
        avaliadorLocal,
        rubricaVersao: laudo.rubrica_versao,
        publicadoEm: new Date(laudo.publicado_em!).toLocaleDateString("pt-BR"),
        itens: rubrica!.itens as unknown as ItemRubrica[],
        notas: laudo.notas as Record<string, number>,
        texto: laudo.texto,
      }}
    />,
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="avaliacao-${atleta.apelido}.pdf"`,
    },
  });
}
