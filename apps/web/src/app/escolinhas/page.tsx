import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto, Cartao, CartaoEscolinha } from "@/ui";
import "@/ui/estilos.css";

export const revalidate = 60;

// Mesmo padrão de fontes por rota pública já usado em /, /atletas,
// /atleta/[id] e /profissional/flavio.
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

export const metadata: Metadata = {
  title: "Escolinhas — Futsal College",
  description:
    "Escolinhas e CTs de futsal parceiros do Futsal College, em Fortaleza, região metropolitana e interior do Ceará.",
};

function clienteAnonimo() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/**
 * Nenhuma coluna de `escolinhas` identifica ou localiza uma criança — é
 * informação institucional (nome, cidade, UF, selo). Ainda assim, colunas
 * escritas à mão: mesma disciplina do resto das rotas públicas.
 */
async function buscarEscolinhas(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("escolinhas")
    .select("id, nome, cidade, estado_uf, credenciada, credenciada_desde")
    .order("credenciada", { ascending: false })
    .order("nome", { ascending: true });

  return data ?? [];
}

/**
 * Atletas ATIVOS por escolinha (id do atleta + id da escolinha), calculado
 * no servidor a partir da mesma política pública de `atletas`
 * (`atletas_leitura_publica`, migration 0002) — só `estado = 'ativo'` sai
 * daqui de qualquer forma. Base para duas contagens (ativos e avaliados);
 * não é ranking: a lista de escolinhas não ordena por nenhuma delas, só
 * exibe os números ao lado do nome.
 */
async function buscarAtivosPorEscolinha(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("atletas")
    .select("id, escolinha_id")
    .eq("estado", "ativo")
    .not("escolinha_id", "is", null);

  return data ?? [];
}

/**
 * Dentre os atletas ativos já levantados acima, quais têm laudo publicado —
 * mesma régua de `laudos_leitura_publica` (migration 0008). Nunca devolve
 * nem ordena por nota, só existência.
 */
async function buscarIdsComLaudoPublicado(supabase: SupabaseClient<Database>, atletaIds: string[]) {
  if (atletaIds.length === 0) return new Set<string>();

  const { data } = await supabase
    .from("laudos")
    .select("atleta_id")
    .in("atleta_id", atletaIds)
    .not("publicado_em", "is", null);

  return new Set((data ?? []).map((l) => l.atleta_id));
}

export default async function Escolinhas() {
  const supabase = clienteAnonimo();
  const [escolinhas, ativosPorEscolinha] = await Promise.all([
    buscarEscolinhas(supabase),
    buscarAtivosPorEscolinha(supabase),
  ]);

  const idsComLaudo = await buscarIdsComLaudoPublicado(
    supabase,
    ativosPorEscolinha.map((a) => a.id),
  );

  const contagemAtivos = new Map<string, number>();
  const contagemAvaliados = new Map<string, number>();
  for (const a of ativosPorEscolinha) {
    if (!a.escolinha_id) continue;
    contagemAtivos.set(a.escolinha_id, (contagemAtivos.get(a.escolinha_id) ?? 0) + 1);
    if (idsComLaudo.has(a.id)) {
      contagemAvaliados.set(a.escolinha_id, (contagemAvaliados.get(a.escolinha_id) ?? 0) + 1);
    }
  }

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo">
        <div className="fc-container">
          <div className="fc-cabecalho-pagina">
            <p className="fc-rotulo-secao fc-etiqueta-rotulo">Navegação pública</p>
            <h1 className="fc-titulo">Escolinhas</h1>
            <p className="fc-subtitulo">
              Escolinhas e CTs de futsal parceiros, em Fortaleza, região metropolitana e interior
              do Ceará. O selo de credenciada indica escolinha auditada pelo método do Futsal
              College — não é ranking entre elas.
            </p>
          </div>

          {escolinhas.length === 0 ? (
            <Cartao>
              <p className="fc-estado-vazio">Nenhuma escolinha cadastrada ainda.</p>
            </Cartao>
          ) : (
            <ul className="fc-lista fc-grade-cartoes">
              {escolinhas.map((e) => (
                <li key={e.id}>
                  <CartaoEscolinha
                    escolinha={e}
                    ativos={contagemAtivos.get(e.id) ?? 0}
                    avaliados={contagemAvaliados.get(e.id) ?? 0}
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
