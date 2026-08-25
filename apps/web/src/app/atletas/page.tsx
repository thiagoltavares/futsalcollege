import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import { CATEGORIAS, POSICOES } from "@futsalcollege/core";
import Link from "next/link";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto, Campo, Cartao, CartaoAtleta, Selecao } from "@/ui";
import "@/ui/estilos.css";
import { buscarResumoAvaliacoes } from "@/lib/avaliacoes";

export const revalidate = 60;

// Mesmo padrão de fontes por rota pública já usado em /, /atleta/[id] e
// /profissional/[slug].
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
  title: "Atletas — Futsal College",
  description:
    "Navegue pelos atletas com perfil ativo no Futsal College. Filtre por categoria, posição e estado — sem ranking, sem comparação entre crianças.",
};

const UFS = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

/**
 * Cliente anônimo, mesmo padrão de `/atleta/[id]`: esta página nunca depende
 * de sessão, então a RLS (`atletas_leitura_publica`, migration 0002) é a
 * única coisa decidindo o que sai daqui — só `estado = 'ativo'`.
 */
function clienteAnonimo() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

function primeiroValor(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

/**
 * Colunas escritas à mão, nunca `select("*")`: só os campos públicos da
 * ficha (mesma lista de `/atleta/[id]`, menos `id`/`apelido` que sempre
 * viajam). Nome completo, data de nascimento, cidade e contato do
 * responsável moram em `atleta_identificacao` — tabela que este cliente
 * anônimo nem tenta alcançar.
 */
async function buscarAtletas(
  supabase: SupabaseClient<Database>,
  filtros: { categoria: string; posicao: string; uf: string; busca: string; ordenar: string },
) {
  let consulta = supabase
    .from("atletas")
    .select(
      "id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, criado_em, escolinha:escolinhas(nome, credenciada)",
    )
    .eq("estado", "ativo");

  if (filtros.categoria) consulta = consulta.eq("categoria", filtros.categoria);
  if (filtros.posicao) consulta = consulta.eq("posicao", filtros.posicao);
  if (filtros.uf) consulta = consulta.eq("estado_uf", filtros.uf);
  if (filtros.busca) consulta = consulta.ilike("apelido", `%${filtros.busca}%`);

  // Regra de produto: nunca ordenar por nota de avaliação, posição em lista
  // nem qualquer coisa que compare atletas entre si. Só "mais recente" ou
  // apelido — as duas únicas opções que o seletor de ordenação oferece.
  consulta =
    filtros.ordenar === "apelido"
      ? consulta.order("apelido", { ascending: true })
      : consulta.order("criado_em", { ascending: false });

  const { data } = await consulta.limit(200);
  return data ?? [];
}

export default async function Atletas({ searchParams }: PageProps<"/atletas">) {
  const parametros = await searchParams;

  const filtros = {
    categoria: primeiroValor(parametros.categoria),
    posicao: primeiroValor(parametros.posicao),
    uf: primeiroValor(parametros.uf),
    busca: primeiroValor(parametros.busca).trim(),
    ordenar: primeiroValor(parametros.ordenar) === "apelido" ? "apelido" : "recentes",
  };
  const somenteAvaliados = primeiroValor(parametros.avaliados) === "1";
  const filtrosAtivos = [
    filtros.categoria,
    filtros.posicao,
    filtros.uf,
    filtros.busca,
    somenteAvaliados,
  ].filter(Boolean).length;

  const supabase = clienteAnonimo();
  const atletas = await buscarAtletas(supabase, filtros);
  const resumoAvaliacoes = await buscarResumoAvaliacoes(
    supabase,
    atletas.map((a) => a.id),
  );

  const lista = somenteAvaliados ? atletas.filter((a) => resumoAvaliacoes.has(a.id)) : atletas;

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo">
        <div className="fc-container">
          <div className="fc-cabecalho-pagina">
            <p className="fc-rotulo-secao fc-etiqueta-rotulo">Navegação pública</p>
            <h1 className="fc-titulo">Atletas</h1>
            <p className="fc-subtitulo">
              Perfis com autorização vigente, do jeito que qualquer visitante enxerga. Dá para
              filtrar por categoria, posição e estado — não existe ranking, nota comparada nem
              posição em lista: essa comparação entre crianças o Futsal College não faz.
            </p>
          </div>

          <details className="fc-filtros-disclosure" open={filtrosAtivos > 0 || undefined}>
            <summary className="fc-filtros-disclosure__resumo">
              Filtros
              {filtrosAtivos > 0 && (
                <span className="fc-filtros-disclosure__contagem">· {filtrosAtivos} ativo{filtrosAtivos > 1 ? "s" : ""}</span>
              )}
            </summary>

            <Cartao className="fc-atletas-filtros-cartao">
            <form method="GET" className="fc-atletas-filtros">
              <Campo id="busca" rotulo="Buscar por apelido" className="fc-atletas-filtro">
                {(campo) => (
                  <input
                    {...campo}
                    name="busca"
                    defaultValue={filtros.busca}
                    placeholder="ex.: Manu"
                    maxLength={40}
                  />
                )}
              </Campo>

              <Campo id="categoria" rotulo="Categoria" className="fc-atletas-filtro">
                {(campo) => (
                  <Selecao {...campo} name="categoria" defaultValue={filtros.categoria}>
                    <option value="">Todas</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Selecao>
                )}
              </Campo>

              <Campo id="posicao" rotulo="Posição" className="fc-atletas-filtro">
                {(campo) => (
                  <Selecao {...campo} name="posicao" defaultValue={filtros.posicao}>
                    <option value="">Todas</option>
                    {POSICOES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Selecao>
                )}
              </Campo>

              <Campo id="uf" rotulo="Estado" className="fc-atletas-filtro">
                {(campo) => (
                  <Selecao {...campo} name="uf" defaultValue={filtros.uf}>
                    <option value="">Todos</option>
                    {UFS.map(([sigla, nome]) => (
                      <option key={sigla} value={sigla}>
                        {nome}
                      </option>
                    ))}
                  </Selecao>
                )}
              </Campo>

              <Campo id="ordenar" rotulo="Ordenar por" className="fc-atletas-filtro">
                {(campo) => (
                  <Selecao {...campo} name="ordenar" defaultValue={filtros.ordenar}>
                    <option value="recentes">Mais recentes</option>
                    <option value="apelido">Apelido (A-Z)</option>
                  </Selecao>
                )}
              </Campo>

              <label className="fc-checkbox-linha fc-atletas-filtro-checkbox">
                <input type="checkbox" name="avaliados" value="1" defaultChecked={somenteAvaliados} />
                Só com avaliação publicada
              </label>

              <div className="fc-atletas-filtro-acoes">
                <button type="submit" className="fc-botao fc-botao--primario">
                  Filtrar
                </button>
                <Link href="/atletas" className="fc-botao fc-botao--secundario">
                  Limpar filtros
                </Link>
              </div>
            </form>
            </Cartao>
          </details>

          <div className="fc-espaco" />

          {lista.length === 0 ? (
            <Cartao>
              <p className="fc-estado-vazio">
                Nenhum atleta encontrado com esses filtros. Tente afrouxar algum deles — categoria
                e estado costumam ser os mais restritivos.
              </p>
            </Cartao>
          ) : (
            <ul className="fc-lista fc-grade-cartoes">
              {lista.map((a) => (
                <li key={a.id}>
                  <CartaoAtleta atleta={a} avaliacao={resumoAvaliacoes.get(a.id) ?? null} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
