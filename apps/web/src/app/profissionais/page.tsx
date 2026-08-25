import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import Link from "next/link";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto, Cartao } from "@/ui";
import "@/ui/estilos.css";
import { anoDeData } from "@/ui/formato";

export const revalidate = 60;

// Mesmo padrão de fontes por rota pública já usado em /, /atletas,
// /escolinhas e /atleta/[id].
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
  title: "Profissionais — Futsal College",
  description:
    "Quem assina as avaliações técnicas do Futsal College: credencial, cidade e quantos laudos cada profissional já publicou.",
};

/**
 * Cliente anônimo, mesmo padrão do resto das rotas públicas: a listagem
 * nunca depende de sessão, e a RLS (`profissionais_leitura_publica`,
 * migration 0010) é a única coisa decidindo o que sai daqui.
 */
function clienteAnonimo() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/**
 * Só profissionais ativos aparecem na listagem — inativo ainda tem página
 * própria (laudo antigo continua linkando pra ela), só não é oferecido
 * aqui. Colunas escritas à mão, nunca `select("*")`.
 */
async function buscarProfissionais(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("profissionais")
    .select("id, nome, slug, credencial, cidade, estado_uf, atua_desde")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  return data ?? [];
}

/**
 * Quantos laudos publicados cada profissional assinou. A política
 * `laudos_leitura_publica` (migration 0008) já restringe a leitura anônima
 * a laudo publicado de atleta ativo — a mesma régua que decide o que
 * aparece na ficha pública decide o que conta aqui. Não é ranking: a
 * listagem não ordena por essa contagem, só mostra o número ao lado do
 * nome (mesmo raciocínio já usado em `/escolinhas` para "atletas ativos").
 */
async function buscarContagemLaudos(
  supabase: SupabaseClient<Database>,
  profissionalIds: string[],
) {
  if (profissionalIds.length === 0) return new Map<string, number>();

  const { data } = await supabase
    .from("laudos")
    .select("profissional_id")
    .in("profissional_id", profissionalIds)
    .not("publicado_em", "is", null);

  const contagem = new Map<string, number>();
  for (const linha of data ?? []) {
    if (!linha.profissional_id) continue;
    contagem.set(linha.profissional_id, (contagem.get(linha.profissional_id) ?? 0) + 1);
  }
  return contagem;
}

export default async function Profissionais() {
  const supabase = clienteAnonimo();
  const profissionais = await buscarProfissionais(supabase);
  const contagem = await buscarContagemLaudos(
    supabase,
    profissionais.map((p) => p.id),
  );

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo">
        <div className="fc-container">
          <div className="fc-cabecalho-pagina">
            <p className="fc-rotulo-secao fc-etiqueta-rotulo">Navegação pública</p>
            <h1 className="fc-titulo">Profissionais</h1>
            <p className="fc-subtitulo">
              Quem assina as avaliações técnicas do Futsal College. Cada laudo publicado leva o
              nome de quem avaliou — aqui está a credencial e a trajetória por trás da assinatura.
            </p>
          </div>

          {profissionais.length === 0 ? (
            <Cartao>
              <p className="fc-estado-vazio">Nenhum profissional cadastrado ainda.</p>
            </Cartao>
          ) : (
            <ul className="fc-lista fc-grade-cartoes">
              {profissionais.map((p) => {
                const laudos = contagem.get(p.id) ?? 0;
                const localidade = [p.cidade, p.estado_uf].filter(Boolean).join(" · ");
                const desde = anoDeData(p.atua_desde);

                return (
                  <li key={p.id}>
                    <Link href={`/profissional/${p.slug}`} className="fc-atletas-item-link">
                      <Cartao className="fc-cartao-profissional">
                        <span className="fc-cartao-profissional__nome">{p.nome}</span>
                        {p.credencial && (
                          <span className="fc-cartao-profissional__credencial">
                            {p.credencial}
                          </span>
                        )}
                        <span className="fc-cartao-profissional__meta">
                          {localidade}
                          {localidade ? " · " : ""}
                          {laudos} {laudos === 1 ? "laudo assinado" : "laudos assinados"} · desde{" "}
                          {desde}
                        </span>
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
