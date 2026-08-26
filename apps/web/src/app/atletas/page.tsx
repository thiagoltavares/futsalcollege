import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import { CATEGORIAS, GENEROS, POSICOES } from "@futsalcollege/core";
import Link from "next/link";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto, Campo, Cartao, CartaoAtleta, Selecao } from "@/ui";
import "@/ui/estilos.css";
import { buscarResumoAvaliacoes } from "@/lib/avaliacoes";
import { buscarCapasAtletas } from "@/lib/midias";

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

// 50 perfis hoje, tendência de crescer (ver AGENTS/brief da rodada) — a
// grade agora pagina em vez de despejar tudo numa lista só. `TAMANHO_PAGINA`
// é quantos cartões cabem numa página; `MAX_CANDIDATOS` é até quantas linhas
// a consulta busca no banco antes de paginar em memória — grande o
// suficiente para o filtro "Só com avaliação publicada" (aplicado depois da
// consulta, não pelo banco) continuar correto sem uma segunda query por
// página. Se o catálogo crescer muito além disso, valeria mover a paginação
// para o banco (`.range()`) — fora do escopo razoável desta rodada.
const TAMANHO_PAGINA = 24;
const MAX_CANDIDATOS = 480;

function hrefComPagina(
  filtros: { categoria: string; posicao: string; genero: string; uf: string; busca: string; ordenar: string },
  somenteAvaliados: boolean,
  pagina: number,
): string {
  const params = new URLSearchParams();
  if (filtros.busca) params.set("busca", filtros.busca);
  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.posicao) params.set("posicao", filtros.posicao);
  if (filtros.genero) params.set("genero", filtros.genero);
  if (filtros.uf) params.set("uf", filtros.uf);
  if (filtros.ordenar === "apelido") params.set("ordenar", filtros.ordenar);
  if (somenteAvaliados) params.set("avaliados", "1");
  if (pagina > 1) params.set("pagina", String(pagina));
  const consulta = params.toString();
  return consulta ? `/atletas?${consulta}` : "/atletas";
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
  filtros: { categoria: string; posicao: string; genero: string; uf: string; busca: string; ordenar: string },
) {
  let consulta = supabase
    .from("atletas")
    .select(
      "id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, criado_em, escolinha:escolinhas(nome, credenciada)",
    )
    .eq("estado", "ativo");

  if (filtros.categoria) consulta = consulta.eq("categoria", filtros.categoria);
  if (filtros.posicao) consulta = consulta.eq("posicao", filtros.posicao);
  if (filtros.genero) consulta = consulta.eq("genero", filtros.genero);
  if (filtros.uf) consulta = consulta.eq("estado_uf", filtros.uf);
  if (filtros.busca) consulta = consulta.ilike("apelido", `%${filtros.busca}%`);

  // Regra de produto: nunca ordenar por nota de avaliação, posição em lista
  // nem qualquer coisa que compare atletas entre si. Só "mais recente" ou
  // apelido — as duas únicas opções que o seletor de ordenação oferece.
  consulta =
    filtros.ordenar === "apelido"
      ? consulta.order("apelido", { ascending: true })
      : consulta.order("criado_em", { ascending: false });

  const { data } = await consulta.limit(MAX_CANDIDATOS);
  return data ?? [];
}

export default async function Atletas({ searchParams }: PageProps<"/atletas">) {
  const parametros = await searchParams;

  const filtros = {
    categoria: primeiroValor(parametros.categoria),
    posicao: primeiroValor(parametros.posicao),
    genero: primeiroValor(parametros.genero),
    uf: primeiroValor(parametros.uf),
    busca: primeiroValor(parametros.busca).trim(),
    ordenar: primeiroValor(parametros.ordenar) === "apelido" ? "apelido" : "recentes",
  };
  const somenteAvaliados = primeiroValor(parametros.avaliados) === "1";
  const filtrosAtivos = [
    filtros.categoria,
    filtros.posicao,
    filtros.genero,
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

  const listaFiltrada = somenteAvaliados ? atletas.filter((a) => resumoAvaliacoes.has(a.id)) : atletas;

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / TAMANHO_PAGINA));
  const paginaPedida = Number(primeiroValor(parametros.pagina)) || 1;
  const pagina = Math.min(Math.max(1, paginaPedida), totalPaginas);
  const inicio = (pagina - 1) * TAMANHO_PAGINA;
  const lista = listaFiltrada.slice(inicio, inicio + TAMANHO_PAGINA);

  // Só os 24 cartões desta página, não os até 480 candidatos — mesma
  // exceção de escopo de `buscarResumoAvaliacoes` acima não se aplica aqui
  // porque a foto nunca decide filtro/ordenação, só é exibida.
  const capasAtletas = await buscarCapasAtletas(
    supabase,
    lista.map((a) => a.id),
  );

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

              <Campo id="genero" rotulo="Gênero" className="fc-atletas-filtro">
                {(campo) => (
                  <Selecao {...campo} name="genero" defaultValue={filtros.genero}>
                    <option value="">Todos</option>
                    {GENEROS.map((g) => (
                      <option key={g} value={g}>
                        {g}
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
                  <CartaoAtleta
                    atleta={{ ...a, capaUrl: capasAtletas.get(a.id) ?? null }}
                    avaliacao={resumoAvaliacoes.get(a.id) ?? null}
                  />
                </li>
              ))}
            </ul>
          )}

          {totalPaginas > 1 && (
            <nav className="fc-paginacao" aria-label="Páginas de atletas">
              {pagina > 1 ? (
                <Link href={hrefComPagina(filtros, somenteAvaliados, pagina - 1)} className="fc-botao fc-botao--secundario">
                  ← Anterior
                </Link>
              ) : (
                <span className="fc-botao fc-botao--secundario fc-botao--desabilitado" aria-hidden="true">
                  ← Anterior
                </span>
              )}

              <span className="fc-paginacao__marcador">
                Página {pagina} de {totalPaginas}
              </span>

              {pagina < totalPaginas ? (
                <Link href={hrefComPagina(filtros, somenteAvaliados, pagina + 1)} className="fc-botao fc-botao--secundario">
                  Próxima →
                </Link>
              ) : (
                <span className="fc-botao fc-botao--secundario fc-botao--desabilitado" aria-hidden="true">
                  Próxima →
                </span>
              )}
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}
