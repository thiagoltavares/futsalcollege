import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import Link from "next/link";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublico, Cartao } from "@/ui";
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
 * Contagem de atletas ATIVOS por escolinha, calculada no servidor a partir
 * da mesma política pública de `atletas` (`atletas_leitura_publica`,
 * migration 0002) — só `estado = 'ativo'` sai daqui de qualquer forma. Não
 * é ranking: a lista de escolinhas não ordena por essa contagem, só exibe
 * o número ao lado do nome.
 */
async function buscarContagemAtivos(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("atletas")
    .select("escolinha_id")
    .eq("estado", "ativo")
    .not("escolinha_id", "is", null);

  const contagem = new Map<string, number>();
  for (const linha of data ?? []) {
    if (!linha.escolinha_id) continue;
    contagem.set(linha.escolinha_id, (contagem.get(linha.escolinha_id) ?? 0) + 1);
  }
  return contagem;
}

export default async function Escolinhas() {
  const supabase = clienteAnonimo();
  const [escolinhas, contagem] = await Promise.all([
    buscarEscolinhas(supabase),
    buscarContagemAtivos(supabase),
  ]);

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublico />

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
            <ul className="fc-lista">
              {escolinhas.map((e) => {
                const ativos = contagem.get(e.id) ?? 0;
                return (
                  <li key={e.id}>
                    <Link href={`/escolinha/${e.id}`} className="fc-atletas-item-link">
                      <Cartao className="fc-item-atleta">
                        <div className="fc-item-atleta__info">
                          <span className="fc-item-atleta__nome">
                            {e.nome}
                            {e.credenciada && (
                              <span className="fc-etiqueta fc-etiqueta--sucesso fc-escolinha-selo">
                                Credenciada
                              </span>
                            )}
                          </span>
                          <span className="fc-item-atleta__meta">
                            {e.cidade} · {e.estado_uf}
                            {ativos > 0
                              ? ` · ${ativos} ${ativos === 1 ? "atleta ativo" : "atletas ativos"}`
                              : ""}
                          </span>
                        </div>
                      </Cartao>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
