import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@revela10/db";
import Link from "next/link";
import { fontesFc } from "@/ui/fontes";

import { CabecalhoPublicoAuto, Cartao, CartaoAtleta, CartaoEscolinha, Quadra } from "@/ui";
import "@/ui/estilos.css";
import { buscarCapasAtletas, buscarContagemMidias, urlPublicaMidia } from "@/lib/midias";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Revela 10 — a base jogando, em vídeo",
  description:
    "Futsal e fut7, da Sub-7 à Sub-20, em todo o Brasil. Cada atleta com perfil próprio: vídeo, foto, posição e escolinha, com autorização do responsável. Sem ranking e sem dado que localize a criança.",
  openGraph: {
    title: "Revela 10 — a base jogando, em vídeo",
    description:
      "Cada atleta de base com o perfil dele: vídeo, foto e ficha, publicados com autorização do responsável.",
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

/** Iniciais do nome para o avatar redondo dos fundadores (ex.: "Flávio Barbosa" → "FB"). */
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
 * servidor evita que a vitrine sempre abra com os mesmos primeiros.
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

type EscolinhaCartao = {
  id: string;
  nome: string;
  cidade: string;
  estado_uf: string;
  credenciada: boolean;
  foto_storage_path: string | null;
};

async function buscarEscolinhasDestaque(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("escolinhas")
    .select("id, nome, cidade, estado_uf, credenciada, foto_storage_path")
    .order("credenciada", { ascending: false })
    .order("nome", { ascending: true })
    .limit(6);

  return (data ?? []) as EscolinhaCartao[];
}

/**
 * Quantos atletas ativos, e dentre eles quantos avaliados, para cada uma
 * das escolinhas em destaque — mesma régua de `/escolinhas`, só que restrita
 * às que aparecem aqui (evita puxar a tabela de atletas inteira pra home).
 * Não é ranking: os cartões não ordenam por esses números.
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
 * Linha do Flávio em `profissionais` (slug `flavio`, migration 0010 +
 * seed). A seção "Quem está por trás" é escrita à mão (os dois fundadores
 * e o papel de cada um não são dado de banco), mas a foto e o link para a
 * trajetória completa vêm daqui — `null` quando a linha some, e a seção
 * cai para as iniciais e para texto sem link, em vez de inventar.
 */
async function buscarProfissionalFlavio(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("profissionais")
    .select("slug, foto_storage_path")
    .eq("slug", "flavio")
    .eq("ativo", true)
    .maybeSingle();

  return data;
}

async function buscarNumeros(supabase: SupabaseClient<Database>) {
  const [atletas, escolinhas, videos] = await Promise.all([
    supabase.from("atletas").select("id", { count: "exact", head: true }).eq("estado", "ativo"),
    supabase.from("escolinhas").select("id", { count: "exact", head: true }),
    supabase.from("atleta_midias").select("id", { count: "exact", head: true }).eq("tipo", "video"),
  ]);

  return {
    atletas: atletas.count ?? 0,
    escolinhas: escolinhas.count ?? 0,
    videos: videos.count ?? 0,
  };
}

const PILLS_CATEGORIA = ["Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17", "Sub-20"] as const;

/** Quantos cartões em cada faixa da home. Para ver todos, `/atletas`. */
const MOSAICO_HERO = 3;
const DESTAQUE = 8;
const RECENTES = 6;

const PASSOS = [
  {
    numero: "01",
    titulo: "Cadastra e autoriza",
    texto: "O responsável cria o perfil e assina o termo de consentimento. Sem essa autorização, nada fica público.",
  },
  {
    numero: "02",
    titulo: "Publica vídeo e foto",
    texto: "O que o atleta joga, em vídeo. É o que um clube quer ver antes de qualquer outra coisa.",
  },
  {
    numero: "03",
    titulo: "O perfil cresce com ele",
    texto: "Posição, físico, escolinha e mídia nova entram no mesmo perfil, temporada após temporada.",
  },
] as const;

/**
 * Os dois sócios, escritos à mão: papel e descrição vêm do brief
 * (REVELA10-HOME-001, item 6), sem credencial além do que está escrito
 * ali. Foto só quando existe no banco (Flávio, `profissionais`); sem foto,
 * iniciais — nunca retrato inventado.
 */
const FUNDADORES = [
  {
    chave: "flavio",
    nome: "Flávio Barbosa",
    papel: "Esporte e metodologia",
    texto:
      "Ex-atleta de futsal, atualmente técnico das seleções de base do Sesc Ceará. Responsável pelo conhecimento esportivo e pela metodologia de avaliação.",
  },
  {
    chave: "thiago",
    nome: "Thiago Tavares",
    papel: "Produto e tecnologia",
    texto:
      "Desenvolvedor responsável pela concepção técnica, arquitetura, desenvolvimento e experiência do produto.",
  },
] as const;

export default async function Home() {
  const supabase = clienteAnonimo();

  const [pool, escolinhasDestaque, numeros, flavio] = await Promise.all([
    buscarPoolDestaque(supabase),
    buscarEscolinhasDestaque(supabase),
    buscarNumeros(supabase),
    buscarProfissionalFlavio(supabase),
  ]);

  // Contagem de mídia do pool inteiro (uma consulta) antes de escolher quem
  // vai para o hero: o mosaico do hero é de atleta COM vídeo — é um filtro
  // de conteúdo ("mostre vídeo"), não uma preferência entre crianças; dentro
  // dele a ordem continua aleatória.
  const contagensMidia = await buscarContagemMidias(
    supabase,
    pool.map((a) => a.id),
  );
  const embaralhado = embaralhar(pool);
  const mosaico = embaralhado
    .filter((a) => (contagensMidia.get(a.id)?.videos ?? 0) > 0)
    .slice(0, MOSAICO_HERO);
  const idsMosaico = new Set(mosaico.map((a) => a.id));
  const destaque = embaralhado.filter((a) => !idsMosaico.has(a.id)).slice(0, DESTAQUE);
  // `buscarPoolDestaque` já vem ordenado por `criado_em` decrescente, então
  // os primeiros do pool são os perfis mais novos — não precisa de consulta
  // própria para a faixa "perfis novos".
  const recentes = pool.slice(0, RECENTES);
  const idsAtletasCartoes = [
    ...new Set([...mosaico, ...destaque, ...recentes].map((a) => a.id)),
  ];
  const [contagensEscolinhas, capasAtletas] = await Promise.all([
    buscarContagensEscolinhas(
      supabase,
      escolinhasDestaque.map((e) => e.id),
    ),
    buscarCapasAtletas(supabase, idsAtletasCartoes),
  ]);

  const cartao = (a: AtletaCartao) => (
    <CartaoAtleta
      key={a.id}
      atleta={{ ...a, capaUrl: capasAtletas.get(a.id) ?? null }}
      midia={contagensMidia.get(a.id) ?? null}
    />
  );

  const fotoFlavio = flavio ? urlPublicaMidia(supabase, flavio.foto_storage_path) : null;

  return (
    <div className={`fc fc-pagina ${fontesFc}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo fc-corpo--home">
        {/* ============================ HERO ============================ */}
        {/* A quadra: fundo azul emendado no cabeçalho, marcação amarela em
            escala por trás, título em display. Em tela larga, a metade
            direita da primeira dobra é o produto em si — três figurinhas de
            atleta com vídeo publicado, dados reais, o mesmo cartão da
            vitrine. No celular o mosaico some: a grade de destaque começa
            logo abaixo do placar, não faz sentido repetir. */}
        <section className="fc-home-hero">
          <Quadra />

          <div className="fc-container fc-home-hero__conteudo">
            <div className="fc-home-hero__texto">
              <h1 className="fc-home-h1">A base jogando, em vídeo.</h1>
              <p className="fc-home-lead">
                Futsal e fut7, da Sub-7 à Sub-20, em todo o Brasil. Cada atleta com perfil
                próprio: vídeo, foto, posição e escolinha, publicado com autorização do
                responsável.
              </p>

              <form action="/atletas" method="GET" className="fc-vitrine-busca" role="search">
                <input
                  type="search"
                  name="busca"
                  maxLength={40}
                  placeholder="Buscar atleta por apelido"
                  className="fc-input"
                  aria-label="Buscar atleta por apelido"
                />
                <button type="submit" className="fc-botao fc-botao--primario">
                  Buscar
                </button>
              </form>

              <nav className="fc-vitrine-pills" aria-label="Atletas por categoria">
                {PILLS_CATEGORIA.map((c) => (
                  <Link key={c} href={`/atletas?categoria=${encodeURIComponent(c)}`} className="fc-pill">
                    {c}
                  </Link>
                ))}
                <Link href="/atletas" className="fc-pill fc-pill--forte">
                  Todos os atletas
                </Link>
              </nav>
            </div>

            {mosaico.length > 0 && (
              <div className="fc-home-hero__mosaico" aria-label="Atletas com vídeo publicado">
                {mosaico.map(cartao)}
              </div>
            )}
          </div>
        </section>

        {/* =========================== PLACAR =========================== */}
        {/* A marcação amarela atravessando a página, com os números da
            plataforma como placar de ginásio. Vídeos primeiro: é o que o
            pivô pôs na frente. */}
        <section className="fc-home-placar" aria-label="Números da plataforma">
          <dl className="fc-container fc-home-placar__lista">
            <div className="fc-home-placar__item">
              <dd className="fc-home-placar__valor">{numeros.videos}</dd>
              <dt className="fc-home-placar__rotulo">vídeos publicados</dt>
            </div>
            <div className="fc-home-placar__item">
              <dd className="fc-home-placar__valor">{numeros.atletas}</dd>
              <dt className="fc-home-placar__rotulo">atletas com perfil ativo</dt>
            </div>
            <div className="fc-home-placar__item">
              <dd className="fc-home-placar__valor">{numeros.escolinhas}</dd>
              <dt className="fc-home-placar__rotulo">escolinhas parceiras</dt>
            </div>
          </dl>
        </section>

        {/* ====================== ATLETAS EM DESTAQUE ===================== */}
        {/* Oito cartões, não doze: a home é a amostra, a vitrine inteira é
            `/atletas`. O botão de "ver todos" fecha a seção também, porque
            depois de oito figurinhas é lá embaixo que o olho está. */}
        <section className="fc-home-secao" aria-labelledby="destaque-titulo">
          <div className="fc-container">
            <div className="fc-vitrine-secao-cabecalho">
              <div>
                <h2 id="destaque-titulo" className="fc-titulo fc-titulo--secao">
                  Atletas em destaque
                </h2>
                <p className="fc-subtitulo">
                  Uma amostra dos perfis ativos, em ordem aleatória. Não existe ranking, nota
                  comparada nem posição em lista.
                </p>
              </div>
            </div>

            {destaque.length === 0 ? (
              <Cartao>
                <p className="fc-estado-vazio">Nenhum atleta ativo ainda.</p>
              </Cartao>
            ) : (
              <>
                <div className="fc-cartoes-atletas">{destaque.map(cartao)}</div>
                <p className="fc-home-secao__rodape">
                  <Link href="/atletas" className="fc-botao fc-botao--primario">
                    Ver todos os {numeros.atletas} atletas
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>

        {/* ========================= PERFIS NOVOS ========================= */}
        {/* Mesma figurinha, outro formato de seção: esteira horizontal com
            rolagem, cartões menores, sobre a banda. É o que diferencia
            "acabou de entrar" de "destaque" sem inventar um segundo cartão. */}
        {recentes.length > 0 && (
          <section className="fc-home-secao fc-home-secao--banda" aria-labelledby="novos-titulo">
            <div className="fc-container">
              <div className="fc-vitrine-secao-cabecalho">
                <div>
                  <h2 id="novos-titulo" className="fc-titulo fc-titulo--secao">
                    Perfis novos
                  </h2>
                  <p className="fc-subtitulo">
                    Os últimos atletas que entraram, do mais novo ao mais antigo.
                  </p>
                </div>
                <Link href="/atletas" className="fc-botao fc-botao--secundario">
                  Ver todos
                </Link>
              </div>
            </div>

            <div className="fc-esteira">
              <div className="fc-container fc-esteira__trilho">{recentes.map(cartao)}</div>
            </div>
          </section>
        )}

        {/* ============================ ESCOLINHAS ========================= */}
        <section id="escolinhas" className="fc-home-secao" aria-labelledby="escolinhas-titulo">
          <div className="fc-container">
            <div className="fc-vitrine-secao-cabecalho">
              <div>
                <h2 id="escolinhas-titulo" className="fc-titulo fc-titulo--secao">
                  De onde vêm os atletas
                </h2>
                <p className="fc-subtitulo">
                  Escolinhas e CTs parceiros, em todo o Brasil. O selo de credenciada indica
                  escolinha verificada pelo Revela 10.
                </p>
              </div>
              <Link href="/escolinhas" className="fc-botao fc-botao--secundario">
                Ver todas
              </Link>
            </div>

            {escolinhasDestaque.length === 0 ? (
              <Cartao>
                <p className="fc-estado-vazio">Nenhuma escolinha cadastrada ainda.</p>
              </Cartao>
            ) : (
              <div className="fc-cartoes-escolinhas">
                {escolinhasDestaque.map((e) => (
                  <CartaoEscolinha
                    key={e.id}
                    escolinha={{ ...e, fotoUrl: urlPublicaMidia(supabase, e.foto_storage_path) }}
                    ativos={contagensEscolinhas.ativos.get(e.id) ?? 0}
                    avaliados={contagensEscolinhas.avaliados.get(e.id) ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================== COMO FUNCIONA + PARA QUEM É =================== */}
        {/* Uma seção escura só: os três passos e, logo abaixo, para quem a
            plataforma é (escolinhas, clubes e olheiros). Antes eram duas
            seções — escura e clara — dizendo coisas vizinhas. */}
        <section id="como-funciona" className="fc-home-secao fc-home-secao--quadra" aria-labelledby="como-titulo">
          <div className="fc-container">
            <div className="fc-home-secao__cabecalho">
              <h2 id="como-titulo" className="fc-titulo fc-titulo--secao">
                Como funciona
              </h2>
              <p className="fc-subtitulo">Do cadastro ao perfil no ar, em três passos.</p>
            </div>

            <ol className="fc-home-passos">
              {PASSOS.map((passo) => (
                <li key={passo.numero} className="fc-home-passo">
                  <span className="fc-home-passo__numero" aria-hidden="true">
                    {passo.numero}
                  </span>
                  <h3>{passo.titulo}</h3>
                  <p>{passo.texto}</p>
                </li>
              ))}
            </ol>

            <div id="clubes" className="fc-home-publico">
              <div className="fc-home-publico__item">
                <h3>Para escolinhas</h3>
                <p>
                  O treinador cadastra a turma e acompanha quantos responsáveis já assinaram a
                  autorização. Cada aluno ganha o próprio perfil, com vídeo e foto.
                </p>
                <Link href="/escolinhas" className="fc-botao fc-botao--secundario">
                  Escolinhas parceiras
                </Link>
              </div>

              <div className="fc-home-publico__item">
                <h3>Para clubes e olheiros</h3>
                <p>
                  Busca por categoria, posição, pé dominante e estado, com o vídeo no próprio
                  perfil. A identificação da criança fica sempre atrás de verificação própria,
                  separada do acesso público.
                </p>
                <Link href="/atletas" className="fc-botao fc-botao--secundario">
                  Buscar atletas
                </Link>
              </div>
            </div>

            {/* A seção "A avaliação" (rubrica, quatro eixos, laudo imutável)
                saiu daqui. A avaliação técnica continua existindo e continua
                pública na ficha de quem tem uma, mas deixou de ser o que a
                home vende: vira produto de uma fase seguinte. Quando voltar,
                volta como oferta paga, não como promessa da porta de entrada. */}
          </div>
        </section>

        {/* ========================== FUNDADORES =========================== */}
        <section id="flavio" className="fc-home-secao fc-home-secao--banda" aria-labelledby="fundadores-titulo">
          <div className="fc-container">
            <div className="fc-home-secao__cabecalho">
              <h2 id="fundadores-titulo" className="fc-titulo fc-titulo--secao">
                Quem está por trás
              </h2>
              <p className="fc-subtitulo">
                Um técnico de base e um desenvolvedor. Quem conhece a quadra decide o que vale
                mostrar; quem faz o produto decide como.
              </p>
            </div>

            <div className="fc-home-fundadores">
              {FUNDADORES.map((f) => {
                const foto = f.chave === "flavio" ? fotoFlavio : null;
                const trajetoria = f.chave === "flavio" && flavio ? `/profissional/${flavio.slug}` : null;
                return (
                  <Cartao key={f.chave} className="fc-home-fundador">
                    <span className="fc-home-avatar fc-home-avatar--grande">
                      {foto ? (
                        // eslint-disable-next-line @next/next/no-img-element -- bucket público, URL varia por ambiente.
                        <img src={foto} alt="" />
                      ) : (
                        <span aria-hidden="true">{iniciais(f.nome)}</span>
                      )}
                    </span>
                    <div className="fc-home-fundador__texto">
                      <p className="fc-home-fundador__nome">{f.nome}</p>
                      <p className="fc-home-fundador__papel">{f.papel}</p>
                      <p className="fc-home-fundador__bio">{f.texto}</p>
                      {trajetoria && (
                        <Link href={trajetoria} className="fc-home-fundador__link">
                          Conhecer a trajetória completa
                        </Link>
                      )}
                    </div>
                  </Cartao>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================== PRIVACIDADE ========================= */}
        {/* Três colunas com régua colorida no topo em vez de três cartões:
            é a quarta grade da página, e cartão de novo seria repetir o
            formato das figurinhas para um conteúdo que é lista. */}
        <section id="privacidade" className="fc-home-secao" aria-labelledby="privacidade-titulo">
          <div className="fc-container">
            <div className="fc-home-secao__cabecalho">
              <h2 id="privacidade-titulo" className="fc-titulo fc-titulo--secao">
                O que é público, o que é restrito, o que nunca aparece
              </h2>
            </div>

            <div className="fc-home-privacidade">
              <div className="fc-home-privacidade__coluna" data-nivel="publico">
                <h3 className="fc-home-privacidade__titulo">Público</h3>
                <ul className="fc-home-privacidade__lista">
                  <li>Apelido esportivo</li>
                  <li>Categoria (ex.: Sub-13)</li>
                  <li>Posição, pé dominante e físico</li>
                  <li>Avaliação técnica, quando existe, e quem assinou</li>
                  <li>Clube ou escolinha e estado</li>
                </ul>
              </div>

              <div className="fc-home-privacidade__coluna" data-nivel="restrito">
                <h3 className="fc-home-privacidade__titulo">Só clube verificado</h3>
                <ul className="fc-home-privacidade__lista">
                  <li>Nome completo</li>
                  <li>Data de nascimento</li>
                  <li>Cidade</li>
                  <li>Contato do responsável</li>
                </ul>
              </div>

              <div className="fc-home-privacidade__coluna" data-nivel="nunca">
                <h3 className="fc-home-privacidade__titulo">Nunca aparece</h3>
                <ul className="fc-home-privacidade__lista">
                  <li>Bairro, endereço ou escola</li>
                  <li>Local e horário de treino</li>
                  <li>Avaliação física, postural e de saúde: só a família e o profissional têm acesso</li>
                </ul>
              </div>
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
