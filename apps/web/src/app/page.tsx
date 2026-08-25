import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import Link from "next/link";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto, Cartao, CartaoAtleta, CartaoEscolinha } from "@/ui";
import "@/ui/estilos.css";
import { linhaFisico } from "@/ui/formato";
import { buscarResumoAvaliacoes } from "@/lib/avaliacoes";

export const revalidate = 60;

// Fontes carregadas só nesta rota, mesmo padrão de /profissional/[slug],
// /plan e do grupo (app): cada rota pública traz as fontes que usa em vez
// de inflar o layout raiz, que é compartilhado por todas as rotas.
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
  title: "Futsal College — vitrine de atletas do futsal de base",
  description:
    "Cada atleta de 7 a 20 anos ganha uma ficha esportiva verificável, com avaliação técnica assinada por profissional credenciado. Navegue pelos perfis, sem ranking e sem dado que localize a criança.",
  openGraph: {
    title: "Futsal College — vitrine de atletas do futsal de base",
    description:
      "O trabalho de cada atleta, registrado por quem entende de futsal: avaliação técnica assinada, física medida com protocolo, evolução no tempo.",
    locale: "pt_BR",
    type: "website",
  },
};

/**
 * Cliente anônimo, mesmo padrão de `/atletas` e `/atleta/[id]`: a home
 * nunca depende de sessão, então a RLS é a única coisa decidindo o que sai
 * daqui.
 */
function clienteAnonimo() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

const COLUNAS_ATLETA_PUBLICO =
  "id, apelido, categoria, posicao, pe_dominante, altura_cm, peso_kg, clube_atual, estado_uf, criado_em, escolinha:escolinhas(nome, credenciada)";

type AtletaCartao = {
  id: string;
  apelido: string;
  categoria: string;
  posicao: string | null;
  pe_dominante: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  clube_atual: string | null;
  estado_uf: string | null;
  criado_em: string;
  escolinha: { nome: string; credenciada: boolean } | null;
};

/** Iniciais do nome para o avatar redondo da seção "Quem assina" (ex.: "Flávio Barbosa" → "FB"). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

/**
 * Embaralha em memória (Fisher-Yates) — não é ordenação por nota, atividade
 * nem qualquer critério que compare atletas entre si; é só a trava de
 * "nunca ranking" aplicada à vitrine (ver AGENTS/brief: "ordene por
 * recência, por atividade ou aleatoriamente").
 */
function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Pool dos atletas ativos mais recentes (colunas escritas à mão, nunca
 * `select("*")` — mesma lista pública de `/atletas`), embaralhado para a
 * grade de destaque. Buscar um pool maior que o exibido e embaralhar no
 * servidor evita que a vitrine sempre abra com os mesmos 12 primeiros.
 */
async function buscarPoolDestaque(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("atletas")
    .select(COLUNAS_ATLETA_PUBLICO)
    .eq("estado", "ativo")
    .order("criado_em", { ascending: false })
    .limit(60);

  return (data ?? []) as AtletaCartao[];
}

/**
 * Últimos laudos publicados (atleta, data e quem assinou — nunca a nota) e
 * os dados públicos dos atletas correspondentes. A política
 * `laudos_leitura_publica` (migration 0008) já restringe a leitura anônima
 * a laudo publicado de atleta ativo.
 */
async function buscarAvaliadosRecentemente(supabase: SupabaseClient<Database>) {
  const { data: laudos } = await supabase
    .from("laudos")
    .select("atleta_id, publicado_em, avaliador_nome")
    .not("publicado_em", "is", null)
    .order("publicado_em", { ascending: false })
    .limit(8);

  const lista = laudos ?? [];
  if (lista.length === 0) return [];

  const { data: atletas } = await supabase
    .from("atletas")
    .select(COLUNAS_ATLETA_PUBLICO)
    .in(
      "id",
      lista.map((l) => l.atleta_id),
    )
    .eq("estado", "ativo");

  const porId = new Map((atletas ?? []).map((a) => [a.id, a as AtletaCartao]));

  return lista
    .map((l) => {
      const atleta = porId.get(l.atleta_id);
      if (!atleta) return null;
      return { atleta, publicadoEm: l.publicado_em!, avaliadorNome: l.avaliador_nome };
    })
    .filter((item): item is { atleta: AtletaCartao; publicadoEm: string; avaliadorNome: string } =>
      Boolean(item),
    );
}

type EscolinhaCartao = {
  id: string;
  nome: string;
  cidade: string;
  estado_uf: string;
  credenciada: boolean;
};

async function buscarEscolinhasDestaque(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("escolinhas")
    .select("id, nome, cidade, estado_uf, credenciada")
    .order("credenciada", { ascending: false })
    .order("nome", { ascending: true })
    .limit(8);

  return (data ?? []) as EscolinhaCartao[];
}

/**
 * Quantos atletas ativos, e dentre eles quantos avaliados, para cada uma
 * das escolinhas em destaque — mesma régua de `/escolinhas`, só que restrita
 * às 8 que aparecem aqui (evita puxar a tabela de atletas inteira pra
 * home). Não é ranking: os cartões não ordenam por esses números.
 */
async function buscarContagensEscolinhas(
  supabase: SupabaseClient<Database>,
  escolinhaIds: string[],
) {
  if (escolinhaIds.length === 0) return { ativos: new Map<string, number>(), avaliados: new Map<string, number>() };

  const { data } = await supabase
    .from("atletas")
    .select("id, escolinha_id")
    .eq("estado", "ativo")
    .in("escolinha_id", escolinhaIds);

  const ativosList = data ?? [];
  const { data: laudos } = await supabase
    .from("laudos")
    .select("atleta_id")
    .in(
      "atleta_id",
      ativosList.map((a) => a.id),
    )
    .not("publicado_em", "is", null);
  const idsComLaudo = new Set((laudos ?? []).map((l) => l.atleta_id));

  const ativos = new Map<string, number>();
  const avaliados = new Map<string, number>();
  for (const a of ativosList) {
    if (!a.escolinha_id) continue;
    ativos.set(a.escolinha_id, (ativos.get(a.escolinha_id) ?? 0) + 1);
    if (idsComLaudo.has(a.id)) {
      avaliados.set(a.escolinha_id, (avaliados.get(a.escolinha_id) ?? 0) + 1);
    }
  }
  return { ativos, avaliados };
}

/**
 * Profissional em destaque na seção "Quem assina" — hoje sempre o Flávio
 * Barbosa (slug `flavio`), mas lido do banco em vez de escrito à mão no
 * componente: `profissionais.bio` é a mesma fonte que já alimenta
 * `/profissional/flavio` (migration 0010 + seed), então mudar o texto lá
 * atualiza a home junto, sem duplicar a informação em dois lugares. `null`
 * quando a linha some do banco — a seção inteira não renderiza nesse caso,
 * em vez de inventar um texto de substituição.
 */
async function buscarProfissionalDestaque(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("profissionais")
    .select("nome, slug, credencial, bio")
    .eq("slug", "flavio")
    .eq("ativo", true)
    .maybeSingle();

  return data;
}

async function buscarNumeros(supabase: SupabaseClient<Database>) {
  const [atletas, escolinhas, laudos] = await Promise.all([
    supabase.from("atletas").select("id", { count: "exact", head: true }).eq("estado", "ativo"),
    supabase.from("escolinhas").select("id", { count: "exact", head: true }),
    supabase.from("laudos").select("id", { count: "exact", head: true }).not("publicado_em", "is", null),
  ]);

  return {
    atletas: atletas.count ?? 0,
    escolinhas: escolinhas.count ?? 0,
    laudos: laudos.count ?? 0,
  };
}

const PILLS_CATEGORIA = ["Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17", "Sub-20"] as const;

const EIXOS = [
  { nome: "Técnico", texto: "Domínio de bola, passe, finalização, 1x1." },
  { nome: "Físico", texto: "Velocidade, resistência, coordenação — medidos com protocolo, não a olho." },
  { nome: "Tático", texto: "Leitura de jogo, posicionamento, decisão sob pressão." },
  { nome: "Comportamental", texto: "Liderança, disciplina, reação ao erro, relação com o time." },
] as const;

const PASSOS = [
  {
    numero: "01",
    titulo: "Cadastra e autoriza",
    texto: "O responsável cria o perfil e assina o termo de consentimento. Sem essa autorização, nada fica público.",
  },
  {
    numero: "02",
    titulo: "Avaliação técnica assinada",
    texto: "Um profissional credenciado aplica a rubrica e assina o laudo — presencial ou por análise de vídeo.",
  },
  {
    numero: "03",
    titulo: "Ficha que acompanha a evolução",
    texto: "Cada nova avaliação entra no histórico, ao lado das anteriores — o perfil cresce junto com o atleta.",
  },
] as const;

export default async function Home() {
  const supabase = clienteAnonimo();

  const [pool, avaliadosRecentemente, escolinhasDestaque, numeros, profissionalDestaque] =
    await Promise.all([
      buscarPoolDestaque(supabase),
      buscarAvaliadosRecentemente(supabase),
      buscarEscolinhasDestaque(supabase),
      buscarNumeros(supabase),
      buscarProfissionalDestaque(supabase),
    ]);

  const destaque = embaralhar(pool).slice(0, 12);
  const [resumoAvaliacoes, contagensEscolinhas] = await Promise.all([
    buscarResumoAvaliacoes(
      supabase,
      destaque.map((a) => a.id),
    ),
    buscarContagensEscolinhas(
      supabase,
      escolinhasDestaque.map((e) => e.id),
    ),
  ]);

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo">
        {/* ============================ HERO ============================ */}
        <section className="fc-container fc-home-hero">
          <p className="fc-rotulo-secao fc-etiqueta-rotulo fc-home-eyebrow">Futsal College</p>
          <h1 className="fc-home-h1">Atletas do futsal de base, com registro que ninguém contesta.</h1>
          <p className="fc-home-lead">
            Da Sub-7 à Sub-20, cada atleta ganha uma ficha esportiva verificável: avaliação
            técnica assinada por profissional credenciado, física medida com protocolo, e um
            registro que acompanha a evolução dele ao longo do tempo.
          </p>

          <form action="/atletas" method="GET" className="fc-vitrine-busca">
            <input
              type="text"
              name="busca"
              maxLength={40}
              placeholder="Buscar atleta por apelido…"
              className="fc-input"
              aria-label="Buscar atleta por apelido"
            />
            <button type="submit" className="fc-botao fc-botao--primario">
              Buscar
            </button>
          </form>

          <div className="fc-vitrine-pills">
            {PILLS_CATEGORIA.map((c) => (
              <Link key={c} href={`/atletas?categoria=${encodeURIComponent(c)}`} className="fc-pill">
                {c}
              </Link>
            ))}
            <Link href="/atletas" className="fc-pill fc-pill--forte">
              Ver todos os atletas →
            </Link>
          </div>
        </section>

        {/* =========================== NÚMEROS =========================== */}
        <section className="fc-container fc-vitrine-numeros">
          <div className="fc-vitrine-numero">
            <span className="fc-vitrine-numero__valor">{numeros.atletas}</span>
            <span className="fc-vitrine-numero__rotulo">atletas com perfil ativo</span>
          </div>
          <div className="fc-vitrine-numero">
            <span className="fc-vitrine-numero__valor">{numeros.escolinhas}</span>
            <span className="fc-vitrine-numero__rotulo">escolinhas parceiras</span>
          </div>
          <div className="fc-vitrine-numero">
            <span className="fc-vitrine-numero__valor">{numeros.laudos}</span>
            <span className="fc-vitrine-numero__rotulo">avaliações técnicas assinadas</span>
          </div>
        </section>

        {/* ====================== ATLETAS EM DESTAQUE ===================== */}
        <section className="fc-home-secao">
          <div className="fc-container">
            <div className="fc-vitrine-secao-cabecalho">
              <div>
                <p className="fc-rotulo-secao fc-etiqueta-rotulo">Vitrine</p>
                <h2 className="fc-titulo">Atletas em destaque</h2>
                <p className="fc-subtitulo">
                  Uma amostra dos perfis ativos, em ordem aleatória — não existe ranking, nota
                  comparada nem posição em lista.
                </p>
              </div>
              <Link href="/atletas" className="fc-botao fc-botao--secundario">
                Ver todos
              </Link>
            </div>

            {destaque.length === 0 ? (
              <Cartao>
                <p className="fc-estado-vazio">Nenhum atleta ativo ainda.</p>
              </Cartao>
            ) : (
              <div className="fc-cartoes-atletas">
                {destaque.map((a) => (
                  <CartaoAtleta key={a.id} atleta={a} avaliacao={resumoAvaliacoes.get(a.id) ?? null} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===================== AVALIADOS RECENTEMENTE ==================== */}
        {avaliadosRecentemente.length > 0 && (
          <section className="fc-home-secao">
            <div className="fc-container">
              <div className="fc-vitrine-secao-cabecalho">
                <div>
                  <p className="fc-rotulo-secao fc-etiqueta-rotulo">Acabou de sair</p>
                  <h2 className="fc-titulo">Avaliados recentemente</h2>
                  <p className="fc-subtitulo">Laudos publicados nos últimos dias, do mais novo ao mais antigo.</p>
                </div>
              </div>

              <div className="fc-cartoes-atletas">
                {avaliadosRecentemente.map(({ atleta, publicadoEm, avaliadorNome }) => {
                  const fisico = linhaFisico(atleta.altura_cm, atleta.peso_kg) ?? "";
                  const clubeOuEscolinha = atleta.escolinha?.nome ?? atleta.clube_atual;
                  const meta = [atleta.posicao, fisico || null, clubeOuEscolinha, atleta.estado_uf]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <Link
                      key={atleta.id}
                      href={`/atleta/${atleta.id}`}
                      className="fc-atletas-item-link"
                    >
                      <Cartao className="fc-cartao-atleta">
                        <div className="fc-cartao-atleta__topo">
                          <span className="fc-cartao-atleta__nome">{atleta.apelido}</span>
                        </div>
                        <span className="fc-cartao-atleta__categoria">{atleta.categoria}</span>
                        {meta && <span className="fc-cartao-atleta__meta">{meta}</span>}
                        <span className="fc-cartao-atleta__data">
                          Avaliado em {new Date(publicadoEm).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="fc-cartao-atleta__avaliacoes">
                          assinado por {avaliadorNome}
                        </span>
                      </Cartao>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ============================ ESCOLINHAS ========================= */}
        <section id="escolinhas" className="fc-home-secao">
          <div className="fc-container">
            <div className="fc-vitrine-secao-cabecalho">
              <div>
                <p className="fc-rotulo-secao fc-etiqueta-rotulo">Escolinhas parceiras</p>
                <h2 className="fc-titulo">De onde vêm os atletas</h2>
                <p className="fc-subtitulo">
                  Escolinhas e CTs de Fortaleza, região metropolitana e interior do Ceará. O selo
                  de credenciada indica escolinha auditada pelo método do Futsal College.
                </p>
              </div>
              <Link href="/escolinhas" className="fc-botao fc-botao--secundario">
                Ver todas
              </Link>
            </div>

            <div className="fc-cartoes-escolinhas">
              {escolinhasDestaque.map((e) => (
                <CartaoEscolinha
                  key={e.id}
                  escolinha={e}
                  ativos={contagensEscolinhas.ativos.get(e.id) ?? 0}
                  avaliados={contagensEscolinhas.avaliados.get(e.id) ?? 0}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ======================= COMO FUNCIONA + AVALIAÇÃO =============== */}
        <section id="como-funciona" className="fc-home-secao">
          <div className="fc-container">
            <div className="fc-home-secao__cabecalho">
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">Como funciona</p>
              <h2 className="fc-titulo">Do cadastro à ficha assinada</h2>
            </div>

            <div className="fc-home-passos">
              {PASSOS.map((passo) => (
                <div key={passo.numero} className="fc-home-passo">
                  <span className="fc-home-passo__numero">{passo.numero}</span>
                  <h3>{passo.titulo}</h3>
                  <p>{passo.texto}</p>
                </div>
              ))}
            </div>

            <div id="avaliacao" className="fc-espaco-topo">
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">A avaliação</p>
              <h2 className="fc-titulo">Um método, não uma opinião solta</h2>
              <p className="fc-subtitulo">
                Rubrica própria, que todo avaliador credenciado segue — para a ficha de um atleta
                significar a mesma coisa que a de outro. Publicado, o laudo não se edita: uma
                correção gera uma nova versão, com a anterior visível.
              </p>

              <div className="fc-home-eixos">
                {EIXOS.map((eixo) => (
                  <div key={eixo.nome} className="fc-home-eixo">
                    <p className="fc-home-eixo__rotulo">{eixo.nome}</p>
                    <p>{eixo.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= ESCOLINHAS E CLUBES/OLHEIROS (pitch) ========== */}
        <section className="fc-home-secao">
          <div className="fc-container fc-home-duplo">
            <Cartao>
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">Para escolinhas</p>
              <h3 className="fc-titulo fc-titulo--card">Cadastre a turma, acompanhe os alunos</h3>
              <p className="fc-subtitulo fc-subtitulo--livre">
                O treinador cadastra a turma e acompanha quantos responsáveis já assinaram a
                autorização. Cada aluno ganha o registro do próprio trabalho.
              </p>
            </Cartao>

            <div id="clubes">
              <Cartao>
                <p className="fc-rotulo-secao fc-etiqueta-rotulo">Para clubes e olheiros</p>
                <h3 className="fc-titulo fc-titulo--card">Entrada separada, busca por dado verificado</h3>
                <p className="fc-subtitulo fc-subtitulo--livre">
                  Clubes e olheiros usam a plataforma para buscar atletas por categoria, posição e
                  avaliação técnica assinada. Identificação da criança fica sempre atrás de
                  verificação própria, separada do acesso público.
                </p>
              </Cartao>
            </div>
          </div>
        </section>

        {/* ============================ AUTORIDADE ======================== */}
        {profissionalDestaque && (
          <section id="flavio" className="fc-home-secao">
            <div className="fc-container">
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">Quem assina</p>
              <h2 className="fc-titulo">A avaliação tem nome e trajetória</h2>

              <Cartao className="fc-home-autoridade fc-home-eixo-nota">
                <div className="fc-home-autoridade__cabeca">
                  <span className="fc-home-avatar" aria-hidden="true">
                    {iniciais(profissionalDestaque.nome)}
                  </span>
                  <div>
                    <p className="fc-home-autoridade__nome">{profissionalDestaque.nome}</p>
                    {profissionalDestaque.credencial && (
                      <p className="fc-campo__ajuda">{profissionalDestaque.credencial}</p>
                    )}
                  </div>
                </div>

                {profissionalDestaque.bio && (
                  <div>
                    <p className="fc-subtitulo fc-subtitulo--livre">{profissionalDestaque.bio}</p>
                    <Link
                      href={`/profissional/${profissionalDestaque.slug}`}
                      className="fc-botao fc-botao--secundario"
                    >
                      Conhecer a trajetória completa
                    </Link>
                  </div>
                )}
              </Cartao>
            </div>
          </section>
        )}

        {/* =========================== PRIVACIDADE ========================= */}
        <section id="privacidade" className="fc-home-secao">
          <div className="fc-container">
            <div className="fc-home-secao__cabecalho">
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">Privacidade</p>
              <h2 className="fc-titulo">O que é público, o que é restrito, o que nunca aparece</h2>
            </div>

            <div className="fc-home-privacidade">
              <Cartao>
                <span className="fc-etiqueta fc-etiqueta--sucesso fc-home-privacidade__titulo">Público</span>
                <ul className="fc-home-privacidade__lista">
                  <li>Apelido esportivo</li>
                  <li>Categoria (ex.: Sub-13)</li>
                  <li>Posição, pé dominante e físico</li>
                  <li>Avaliação técnica e quem assinou</li>
                  <li>Clube ou escolinha e estado</li>
                </ul>
              </Cartao>

              <Cartao>
                <span className="fc-etiqueta fc-etiqueta--alerta fc-home-privacidade__titulo">
                  Só clube verificado
                </span>
                <ul className="fc-home-privacidade__lista">
                  <li>Nome completo</li>
                  <li>Data de nascimento</li>
                  <li>Cidade</li>
                  <li>Contato do responsável</li>
                </ul>
              </Cartao>

              <Cartao>
                <span className="fc-etiqueta fc-etiqueta--perigo fc-home-privacidade__titulo">Nunca aparece</span>
                <ul className="fc-home-privacidade__lista">
                  <li>Bairro, endereço ou escola</li>
                  <li>Local e horário de treino</li>
                  <li>Avaliação física, postural e de saúde — só a família e o profissional têm acesso</li>
                </ul>
              </Cartao>
            </div>

            <p className="fc-home-privacidade__nota">
              Consentimento revogado tira o perfil do ar na hora: a ficha para de responder e sai
              da busca.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
