import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import { agruparPorEixo, EIXOS, ROTULO_CONTEXTO, ROTULO_EIXO, type ItemRubrica } from "@futsalcollege/core";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublico } from "@/ui";
import "@/ui/estilos.css";

export const revalidate = 300;

// Fontes carregadas só nesta rota — mesmo padrão de /profissional/flavio,
// /plan, da home e do grupo (app): cada rota pública traz as fontes que usa.
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

/**
 * Cliente anônimo de propósito: a ficha pública nunca deve depender de sessão,
 * e assim a RLS é a única coisa decidindo o que sai daqui.
 */
function clienteAnonimo() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/**
 * A Tarefa 11 (adiada de propósito — é só refatoração) vai extrair esta
 * consulta para `buscarFichaPublica` em `packages/api`, com a mesma lista de
 * colunas. Até lá ela mora aqui, inline.
 *
 * A lista de colunas é escrita à mão, nunca `select("*")`: uma coluna nova em
 * `atletas` não pode passar a vazar aqui só por existir na tabela — precisa
 * ser adicionada a esta lista de propósito. A política de RLS
 * (`atletas_leitura_publica`, migration 0002) garante que o cliente anônimo
 * só alcança atletas com `estado = 'ativo'` e nunca alcança
 * `atleta_identificacao` nem `atleta_saude`; esta lista de colunas é a
 * segunda camada, dentro da própria tabela `atletas`. Nome completo, data de
 * nascimento, cidade e qualquer dado de saúde vivem em outras tabelas e nem
 * chegam a ser pedidos aqui.
 *
 * `cache()` (React) faz `generateMetadata` e o componente da página
 * reaproveitarem a mesma consulta numa única renderização, em vez de bater
 * no banco duas vezes para o mesmo `id`.
 */
const buscarFichaPublica = cache(async function buscarFichaPublica(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const { data } = await supabase
    .from("atletas")
    .select(
      "id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf",
    )
    .eq("id", id)
    .eq("estado", "ativo")
    .maybeSingle();

  return data;
});

/**
 * Último laudo publicado do atleta. A política `laudos_leitura_publica`
 * (migration 0008) já é quem decide se alguma linha volta aqui — publicado
 * e atleta ativo, exatamente a mesma condição de `buscarFichaPublica`. Esta
 * função não ordena nem compara atletas entre si: devolve no máximo UM
 * laudo, do atleta já identificado por `id` — nunca uma lista.
 */
async function buscarLaudoPublico(supabase: SupabaseClient<Database>, atletaId: string) {
  const { data: laudo } = await supabase
    .from("laudos")
    .select("id, contexto, avaliador_nome, rubrica_versao, texto, notas, publicado_em")
    .eq("atleta_id", atletaId)
    .not("publicado_em", "is", null)
    .order("publicado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!laudo) return null;

  const { data: rubrica } = await supabase
    .from("rubricas")
    .select("itens")
    .eq("versao", laudo.rubrica_versao)
    .maybeSingle();

  if (!rubrica) return null;

  const itens = rubrica.itens as unknown as ItemRubrica[];
  const notas = laudo.notas as Record<string, number>;

  return { ...laudo, grupos: agruparPorEixo(itens), notas };
}

export async function generateMetadata({
  params,
}: PageProps<"/atleta/[id]">): Promise<Metadata> {
  const { id } = await params;
  const ficha = await buscarFichaPublica(clienteAnonimo(), id);

  if (!ficha) {
    return { title: "Ficha não encontrada" };
  }

  const titulo = `${ficha.apelido} — ${ficha.categoria} · Futsal College`;
  const descricao = [ficha.posicao, ficha.clube_atual, ficha.estado_uf]
    .filter(Boolean)
    .join(" · ") || "Ficha esportiva verificada no Futsal College.";

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      type: "profile",
      locale: "pt_BR",
    },
  };
}

export default async function FichaPublica({ params }: PageProps<"/atleta/[id]">) {
  const { id } = await params;
  const supabase = clienteAnonimo();
  const ficha = await buscarFichaPublica(supabase, id);

  if (!ficha) notFound();

  const laudo = await buscarLaudoPublico(supabase, id);

  const fisico = [
    ficha.altura_cm ? `${ficha.altura_cm} cm` : null,
    ficha.peso_kg ? `${ficha.peso_kg} kg` : null,
  ].filter(Boolean);

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublico />

      <main className="fc-corpo">
        <div className="fc-container fc-container--estreito">
          <div className="fc-ficha-hero">
            <p className="fc-etiqueta-rotulo fc-ficha-eyebrow">Ficha esportiva</p>
            <h1 className="fc-ficha-nome">{ficha.apelido}</h1>

            <div className="fc-ficha-tags">
              <span className="fc-ficha-tag">{ficha.categoria}</span>
              {ficha.posicao && <span className="fc-ficha-tag">{ficha.posicao}</span>}
              {ficha.estado_uf && <span className="fc-ficha-tag">{ficha.estado_uf}</span>}
            </div>
          </div>

          <dl className="fc-ficha-grid">
            {ficha.posicao && (
              <div className="fc-ficha-item">
                <dt>Posição</dt>
                <dd>{ficha.posicao}</dd>
              </div>
            )}
            {ficha.pe_dominante && (
              <div className="fc-ficha-item">
                <dt>Pé dominante</dt>
                <dd>{ficha.pe_dominante}</dd>
              </div>
            )}
            {fisico.length > 0 && (
              <div className="fc-ficha-item">
                <dt>Físico</dt>
                <dd>{fisico.join(" · ")}</dd>
              </div>
            )}
            {ficha.clube_atual && (
              <div className="fc-ficha-item">
                <dt>Clube atual</dt>
                <dd>{ficha.clube_atual}</dd>
              </div>
            )}
            {ficha.estado_uf && (
              <div className="fc-ficha-item">
                <dt>Estado</dt>
                <dd>{ficha.estado_uf}</dd>
              </div>
            )}
          </dl>

          {laudo ? (
            <section className="fc-laudo" aria-labelledby="fc-laudo-titulo">
              <div className="fc-laudo__cabecalho">
                <div>
                  <p className="fc-etiqueta-rotulo fc-ficha-eyebrow">Avaliação técnica</p>
                  <h2 id="fc-laudo-titulo" className="fc-titulo fc-titulo--card">
                    Notas por eixo
                  </h2>
                </div>
                <p className="fc-laudo__meta">
                  Assinado por {laudo.avaliador_nome} · {ROTULO_CONTEXTO[laudo.contexto]} · rubrica{" "}
                  {laudo.rubrica_versao}
                  <br />
                  Publicado em {new Date(laudo.publicado_em!).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="fc-laudo-eixos">
                {EIXOS.filter((eixo) => laudo.grupos[eixo].length > 0).map((eixo) => (
                  <div key={eixo}>
                    <p className="fc-laudo-eixo__rotulo">{ROTULO_EIXO[eixo]}</p>
                    {laudo.grupos[eixo].map((item) => {
                      const nota = laudo.notas[item.chave];
                      return (
                        <div key={item.chave} className="fc-laudo-item">
                          <span className="fc-laudo-item__rotulo">{item.rotulo}</span>
                          <span className="fc-laudo-item__nota">
                            {nota ?? "—"} —{" "}
                            {nota ? item.ancoras[String(nota) as "1"] : "não avaliado"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {laudo.texto && <p className="fc-laudo__texto">{laudo.texto}</p>}

              <p className="fc-laudo__rodape">
                A avaliação compara {ficha.apelido} com o critério da categoria {ficha.categoria}{" "}
                — nunca com outro atleta.
              </p>

              <div className="fc-laudo__acoes">
                <a
                  href={`/api/laudo/${laudo.id}/pdf`}
                  className="fc-botao fc-botao--secundario"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Baixar PDF da avaliação
                </a>
              </div>
            </section>
          ) : (
            <section className="fc-laudo">
              <p className="fc-etiqueta-rotulo fc-ficha-eyebrow">Avaliação técnica</p>
              <p className="fc-estado-vazio">Ainda sem avaliação técnica publicada.</p>
            </section>
          )}

          <p className="fc-ficha-rodape">
            Ficha pública do Futsal College. Estatísticas e avaliação são conferidas por quem
            assina — nome completo, data de nascimento, cidade e vídeos ficam restritos a clube
            verificado.
          </p>
        </div>
      </main>
    </div>
  );
}
