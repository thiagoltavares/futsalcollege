import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto, Cartao } from "@/ui";
import "@/ui/estilos.css";
import { anoDeData, formatarTempoDesde } from "@/ui/formato";

export const revalidate = 60;

// `/profissional/flavio` (rota estática, feita à mão) nunca chega aqui: o
// Next.js resolve um segmento literal ("flavio") antes de cair no segmento
// dinâmico ([slug]) para o mesmo caminho — é assim que a landing especial
// do Flávio convive com esta página genérica sem checagem nenhuma em
// código (ver relatório desta tarefa para a decisão completa).
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

/**
 * Não filtra por `ativo`: um profissional que saiu da plataforma continua
 * com página alcançável (laudo antigo que ele assinou continua linkando
 * pra cá) — só some da listagem em `/profissionais`. `cache()` faz
 * `generateMetadata` e o componente da página reaproveitarem a mesma
 * consulta.
 */
const buscarProfissional = cache(async function buscarProfissional(
  supabase: SupabaseClient<Database>,
  slug: string,
) {
  const { data } = await supabase
    .from("profissionais")
    .select("id, nome, slug, credencial, cidade, estado_uf, bio, ativo, atua_desde")
    .eq("slug", slug)
    .maybeSingle();

  return data;
});

/**
 * Laudos publicados assinados por este profissional, do mais novo ao mais
 * antigo. A política `laudos_leitura_publica` (migration 0008) já restringe
 * a leitura anônima a laudo publicado de atleta ATIVO — é a mesma régua que
 * garante "só os ativos" na lista de atletas avaliados desta página, sem
 * filtro extra aqui. Colunas escritas à mão, e nenhuma delas é nota: esta
 * consulta não devolve nem ordena por avaliação, só existência e data.
 */
async function buscarLaudosDoProfissional(
  supabase: SupabaseClient<Database>,
  profissionalId: string,
) {
  const { data } = await supabase
    .from("laudos")
    .select("id, publicado_em, atleta:atletas(id, apelido, categoria)")
    .eq("profissional_id", profissionalId)
    .not("publicado_em", "is", null)
    .order("publicado_em", { ascending: false });

  return data ?? [];
}

export async function generateMetadata({
  params,
}: PageProps<"/profissional/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profissional = await buscarProfissional(clienteAnonimo(), slug);

  if (!profissional) return { title: "Profissional não encontrado" };

  const titulo = `${profissional.nome} — Futsal College`;
  const descricao =
    profissional.credencial ??
    "Profissional credenciado a assinar avaliações técnicas no Futsal College.";

  return {
    title: titulo,
    description: descricao,
    openGraph: { title: titulo, description: descricao, type: "profile", locale: "pt_BR" },
  };
}

export default async function ProfissionalDetalhe({
  params,
}: PageProps<"/profissional/[slug]">) {
  const { slug } = await params;
  const supabase = clienteAnonimo();
  const profissional = await buscarProfissional(supabase, slug);

  if (!profissional) notFound();

  const laudos = await buscarLaudosDoProfissional(supabase, profissional.id);

  // Lista de atletas avaliados, sem repetir: um profissional pode ter mais
  // de um laudo no mesmo atleta (evolução) — a página mostra o atleta uma
  // vez só, com a data do laudo mais recente (a consulta acima já vem
  // ordenada do mais novo pro mais antigo).
  const atletasVistos = new Set<string>();
  const atletasAvaliados: { id: string; apelido: string; categoria: string; publicadoEm: string }[] =
    [];
  for (const l of laudos) {
    const atleta = l.atleta as unknown as { id: string; apelido: string; categoria: string } | null;
    if (!atleta || atletasVistos.has(atleta.id)) continue;
    atletasVistos.add(atleta.id);
    atletasAvaliados.push({ ...atleta, publicadoEm: l.publicado_em! });
  }

  const localidade = [profissional.cidade, profissional.estado_uf].filter(Boolean).join(" · ");
  const tempoDesde = formatarTempoDesde(profissional.atua_desde);

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo">
        <div className="fc-container fc-container--estreito">
          <div className="fc-ficha-hero">
            <p className="fc-etiqueta-rotulo fc-ficha-eyebrow">
              <Link href="/profissionais">Profissionais</Link>
            </p>
            <h1 className="fc-ficha-nome">{profissional.nome}</h1>

            <div className="fc-ficha-tags">
              {profissional.credencial && (
                <span className="fc-ficha-tag">{profissional.credencial}</span>
              )}
              {localidade && <span className="fc-ficha-tag">{localidade}</span>}
              {!profissional.ativo && (
                <span className="fc-ficha-tag">Não avalia mais na plataforma</span>
              )}
            </div>
          </div>

          {profissional.bio && <p className="fc-subtitulo fc-subtitulo--livre">{profissional.bio}</p>}

          <dl className="fc-ficha-grid">
            <div className="fc-ficha-item">
              <dt>Laudos assinados</dt>
              <dd>{laudos.length}</dd>
            </div>
            <div className="fc-ficha-item">
              <dt>Atua na plataforma</dt>
              <dd>
                {tempoDesde ?? "—"}
                <span className="fc-campo__ajuda" style={{ display: "block", marginTop: "0.2rem" }}>
                  desde {anoDeData(profissional.atua_desde)}
                </span>
              </dd>
            </div>
          </dl>

          <section className="fc-laudo" aria-labelledby="fc-profissional-atletas-titulo">
            <p className="fc-etiqueta-rotulo fc-ficha-eyebrow">Trabalho publicado</p>
            <h2 id="fc-profissional-atletas-titulo" className="fc-titulo fc-titulo--card">
              Atletas avaliados
            </h2>

            {atletasAvaliados.length === 0 ? (
              <p className="fc-estado-vazio">Ainda sem avaliação publicada.</p>
            ) : (
              <ul className="fc-lista fc-espaco-topo">
                {atletasAvaliados.map((a) => (
                  <li key={a.id}>
                    <Link href={`/atleta/${a.id}`} className="fc-atletas-item-link">
                      <Cartao className="fc-item-atleta">
                        <div className="fc-item-atleta__info">
                          <span className="fc-item-atleta__nome">{a.apelido}</span>
                          <span className="fc-item-atleta__meta">
                            {a.categoria} · avaliado em{" "}
                            {new Date(a.publicadoEm).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </Cartao>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="fc-ficha-rodape">
            Página pública do profissional no Futsal College. Só atletas com perfil ativo e
            avaliação publicada aparecem aqui.
          </p>
        </div>
      </main>
    </div>
  );
}
