import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto, Cartao, CartaoAtleta } from "@/ui";
import "@/ui/estilos.css";
import { buscarResumoAvaliacoes } from "@/lib/avaliacoes";

export const revalidate = 60;

// Mesmo padrão de fontes por rota pública já usado em /, /atletas,
// /atleta/[id] e /escolinhas.
const display = Big_Shoulders({
  variable: "--font-fc-display",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-fc-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const corpo = Barlow({
  variable: "--font-fc-corpo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

function clienteAnonimo() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

const buscarEscolinha = cache(async function buscarEscolinha(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const { data } = await supabase
    .from("escolinhas")
    .select("id, nome, cidade, estado_uf, credenciada, credenciada_desde")
    .eq("id", id)
    .maybeSingle();

  return data;
});

/**
 * Atletas da escolinha, com a mesma lista de colunas públicas de
 * `/atletas` (menos `escolinha_id`, que já está implícito nesta página) —
 * a política `atletas_leitura_publica` (migration 0002) garante que só
 * `estado = 'ativo'` sai daqui de qualquer forma.
 */
async function buscarAtletasDaEscolinha(supabase: SupabaseClient<Database>, escolinhaId: string) {
  const { data } = await supabase
    .from("atletas")
    .select("id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, estado_uf, criado_em")
    .eq("escolinha_id", escolinhaId)
    .eq("estado", "ativo")
    .order("criado_em", { ascending: false });

  return data ?? [];
}

export async function generateMetadata({
  params,
}: PageProps<"/escolinha/[id]">): Promise<Metadata> {
  const { id } = await params;
  const escolinha = await buscarEscolinha(clienteAnonimo(), id);

  if (!escolinha) return { title: "Escolinha não encontrada" };

  const titulo = `${escolinha.nome} — Futsal College`;
  const descricao = `${escolinha.cidade} · ${escolinha.estado_uf}${escolinha.credenciada ? " · escolinha credenciada" : ""}`;

  return {
    title: titulo,
    description: descricao,
    openGraph: { title: titulo, description: descricao, type: "website", locale: "pt_BR" },
  };
}

export default async function EscolinhaDetalhe({ params }: PageProps<"/escolinha/[id]">) {
  const { id } = await params;
  const supabase = clienteAnonimo();
  const escolinha = await buscarEscolinha(supabase, id);

  if (!escolinha) notFound();

  const atletas = await buscarAtletasDaEscolinha(supabase, id);
  const resumoAvaliacoes = await buscarResumoAvaliacoes(
    supabase,
    atletas.map((a) => a.id),
  );

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo">
        <div className="fc-container">
          <div className="fc-cabecalho-pagina">
            <p className="fc-rotulo-secao fc-etiqueta-rotulo">
              <Link href="/escolinhas">Escolinhas</Link>
            </p>
            <h1 className="fc-titulo">{escolinha.nome}</h1>
            <p className="fc-subtitulo">
              {escolinha.cidade} · {escolinha.estado_uf}
              {escolinha.credenciada && escolinha.credenciada_desde
                ? ` · credenciada desde ${new Date(escolinha.credenciada_desde).toLocaleDateString("pt-BR", { year: "numeric", month: "long" })}`
                : ""}
              {escolinha.credenciada && (
                <span className="fc-etiqueta fc-etiqueta--sucesso fc-escolinha-selo-titulo">
                  Credenciada
                </span>
              )}
            </p>
          </div>

          <div className="fc-cabecalho-pagina">
            <h2 className="fc-titulo fc-titulo--card">
              {atletas.length === 0
                ? "Nenhum atleta ativo nesta escolinha ainda"
                : `${atletas.length} ${atletas.length === 1 ? "atleta ativo" : "atletas ativos"}`}
            </h2>
            {atletas.length > 0 && (
              <p className="fc-subtitulo">
                {resumoAvaliacoes.size} {resumoAvaliacoes.size === 1 ? "já avaliado" : "já avaliados"}{" "}
                com laudo publicado.
              </p>
            )}
          </div>

          {atletas.length === 0 ? (
            <Cartao>
              <p className="fc-estado-vazio">
                Assim que um responsável vinculado a esta escolinha ativar o perfil do filho, o
                atleta aparece aqui.
              </p>
            </Cartao>
          ) : (
            <ul className="fc-lista fc-grade-cartoes">
              {atletas.map((a) => (
                <li key={a.id}>
                  <CartaoAtleta
                    atleta={a}
                    avaliacao={resumoAvaliacoes.get(a.id) ?? null}
                    ocultarClube
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
