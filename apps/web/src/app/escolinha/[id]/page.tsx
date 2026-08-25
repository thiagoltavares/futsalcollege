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

/** Duas primeiras iniciais do nome da escolinha — mesmo raciocínio do
 * avatar do atleta e do profissional: não há foto própria, então a
 * identidade visual do cabeçalho cai para as iniciais. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
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
  const avaliados = atletas.filter((a) => resumoAvaliacoes.has(a.id)).length;

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo fc-corpo--perfil">
        <div className="fc-container fc-container--estreito">
          <p className="fc-etiqueta-rotulo" style={{ marginBottom: "0.75rem" }}>
            <Link href="/escolinhas">← Escolinhas</Link>
          </p>

          <section className="fc-perfil-header fc-perfil-header--capa">
            <div className="fc-perfil-header__topo">
              <span className="fc-perfil-avatar" aria-hidden="true">
                <span>{iniciais(escolinha.nome)}</span>
              </span>

              <dl className="fc-perfil-stats">
                <div>
                  <dt>Atletas ativos</dt>
                  <dd>{atletas.length}</dd>
                </div>
                <div>
                  <dt>Avaliados</dt>
                  <dd>{avaliados}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd className="fc-perfil-stats__texto">{escolinha.estado_uf}</dd>
                </div>
              </dl>
            </div>

            <h1 className="fc-perfil-nome">{escolinha.nome}</h1>

            <div className="fc-perfil-tags">
              <span className="fc-ficha-tag">
                {escolinha.cidade} · {escolinha.estado_uf}
              </span>
              {escolinha.credenciada && (
                <span className="fc-ficha-tag fc-ficha-tag--selo">
                  ✓ Credenciada
                  {escolinha.credenciada_desde
                    ? ` desde ${new Date(escolinha.credenciada_desde).toLocaleDateString("pt-BR", { year: "numeric", month: "long" })}`
                    : ""}
                </span>
              )}
            </div>
          </section>

          <div className="fc-espaco" />

          <div className="fc-elenco-cabecalho">
            <div>
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">Elenco</p>
              <h2 className="fc-titulo fc-titulo--card">
                {atletas.length === 0
                  ? "Nenhum atleta ativo ainda"
                  : `${atletas.length} ${atletas.length === 1 ? "atleta ativo" : "atletas ativos"}`}
              </h2>
            </div>
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
