import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import { agruparPorEixo, EIXOS, type Eixo, type ItemRubrica } from "@futsalcollege/core";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto } from "@/ui";
import "@/ui/estilos.css";
import { linhaFisico } from "@/ui/formato";
import {
  PerfilFicha,
  type DestaquePublico,
  type LaudoDetalhado,
  type LaudoResumo,
  type MidiaPublica,
} from "./PerfilFicha";

export const revalidate = 300;

// Fontes carregadas só nesta rota — mesmo padrão de /profissional/[slug],
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
 * chegam a ser pedidos aqui. `criado_em` entrou nesta rodada só para calcular
 * "temporadas" no cabeçalho — é metadado estrutural (quando o perfil nasceu
 * na plataforma), não dado que localiza a criança.
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
      "id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, criado_em, escolinha:escolinhas(id, nome, credenciada)",
    )
    .eq("id", id)
    .eq("estado", "ativo")
    .maybeSingle();

  return data;
});

/** Mídia pública do atleta — a política `midias_leitura_publica` (migration 0011) já restringe a atleta `ativo`. */
async function buscarMidiasPublicas(supabase: SupabaseClient<Database>, atletaId: string) {
  const { data } = await supabase
    .from("atleta_midias")
    .select("id, tipo, storage_path, legenda, ordem, capa")
    .eq("atleta_id", atletaId)
    .order("ordem", { ascending: true });
  return data ?? [];
}

/** Destaques públicos (stories fixos) — mesma régua de leitura de `atleta_midias`. */
async function buscarDestaquesPublicos(supabase: SupabaseClient<Database>, atletaId: string) {
  const { data } = await supabase
    .from("atleta_destaques")
    .select("id, titulo, ordem, midia:atleta_midias(id, storage_path, tipo)")
    .eq("atleta_id", atletaId)
    .order("ordem", { ascending: true });
  return data ?? [];
}

function calcularPorEixo(
  notas: Record<string, number>,
  itens: ItemRubrica[],
): Record<Eixo, number | null> {
  const grupos = agruparPorEixo(itens);
  const resultado = {} as Record<Eixo, number | null>;
  for (const eixo of EIXOS) {
    const itensComNota = grupos[eixo].filter((item) => notas[item.chave] != null);
    resultado[eixo] =
      itensComNota.length > 0
        ? itensComNota.reduce((soma, item) => soma + notas[item.chave]!, 0) / itensComNota.length
        : null;
  }
  return resultado;
}

/**
 * Histórico completo de laudos publicados do atleta, do mais antigo ao mais
 * recente — diferente da ficha antiga, que só buscava o último. É o que
 * sustenta a aba "Avaliações" (radar + barras do laudo mais recente) e a
 * evolução ao longo do tempo. Mesma régua de `laudos_leitura_publica`
 * (migration 0008): publicado, de atleta ativo, nunca comparando atletas
 * entre si — cada linha aqui é sempre de UM atleta só.
 */
async function buscarHistoricoAvaliacoes(
  supabase: SupabaseClient<Database>,
  atletaId: string,
): Promise<{ atual: LaudoDetalhado | null; historico: LaudoResumo[] }> {
  const { data: laudos } = await supabase
    .from("laudos")
    .select(
      "id, contexto, avaliador_nome, rubrica_versao, texto, notas, publicado_em, profissional:profissionais(slug, nome)",
    )
    .eq("atleta_id", atletaId)
    .not("publicado_em", "is", null)
    .order("publicado_em", { ascending: true });

  if (!laudos || laudos.length === 0) return { atual: null, historico: [] };

  const versoes = [...new Set(laudos.map((l) => l.rubrica_versao))];
  const { data: rubricas } = await supabase.from("rubricas").select("versao, itens").in("versao", versoes);
  const itensPorVersao = new Map<string, ItemRubrica[]>();
  for (const rubrica of rubricas ?? []) {
    itensPorVersao.set(rubrica.versao, rubrica.itens as unknown as ItemRubrica[]);
  }

  const resumos: LaudoDetalhado[] = laudos.map((laudo) => {
    const itens = itensPorVersao.get(laudo.rubrica_versao) ?? [];
    const notas = laudo.notas as Record<string, number>;
    const porEixo = calcularPorEixo(notas, itens);
    const valores = Object.values(porEixo).filter((v): v is number => v != null);
    const media = valores.length > 0 ? valores.reduce((s, v) => s + v, 0) / valores.length : 0;

    return {
      id: laudo.id,
      publicadoEm: laudo.publicado_em!,
      contexto: laudo.contexto,
      avaliadorNome: laudo.avaliador_nome,
      profissional: laudo.profissional,
      texto: laudo.texto,
      rubricaVersao: laudo.rubrica_versao,
      porEixo,
      media,
      grupos: agruparPorEixo(itens),
      notas,
    };
  });

  return { atual: resumos[resumos.length - 1] ?? null, historico: resumos };
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

  const [midiasBrutas, destaquesBrutos, { atual: laudoAtual, historico }] = await Promise.all([
    buscarMidiasPublicas(supabase, id),
    buscarDestaquesPublicos(supabase, id),
    buscarHistoricoAvaliacoes(supabase, id),
  ]);

  const urlPublica = (caminho: string) => supabase.storage.from("midias").getPublicUrl(caminho).data.publicUrl;

  const midias: MidiaPublica[] = midiasBrutas.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    url: urlPublica(m.storage_path),
    legenda: m.legenda,
    capa: m.capa,
  }));

  const destaques: DestaquePublico[] = destaquesBrutos.map((d) => ({
    id: d.id,
    titulo: d.titulo,
    midiaUrl: d.midia ? urlPublica(d.midia.storage_path) : null,
    midiaTipo: d.midia?.tipo ?? null,
  }));

  const avatarMidia =
    midias.find((m) => m.capa && m.tipo === "foto") ?? midias.find((m) => m.tipo === "foto") ?? null;

  const fisico = linhaFisico(ficha.altura_cm, ficha.peso_kg);

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo fc-corpo--perfil">
        <div className="fc-container fc-container--estreito">
          <PerfilFicha
            atleta={{
              apelido: ficha.apelido,
              categoria: ficha.categoria,
              posicao: ficha.posicao,
              peDominante: ficha.pe_dominante,
              fisico,
              estadoUf: ficha.estado_uf,
              escolinhaNome: ficha.escolinha?.nome ?? ficha.clube_atual ?? null,
              escolinhaId: ficha.escolinha?.id ?? null,
              escolinhaCredenciada: ficha.escolinha?.credenciada ?? false,
              avatarUrl: avatarMidia?.url ?? null,
            }}
            stats={{
              avaliacoes: historico.length,
              fotos: midias.filter((m) => m.tipo === "foto").length,
              videos: midias.filter((m) => m.tipo === "video").length,
            }}
            destaques={destaques}
            midias={midias}
            laudoAtual={laudoAtual}
            historico={historico}
          />
        </div>
      </main>
    </div>
  );
}
