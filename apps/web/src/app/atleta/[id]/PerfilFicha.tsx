"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  EIXOS,
  ROTULO_CONTEXTO,
  ROTULO_EIXO,
  type ContextoAvaliacao,
  type Eixo,
  type ItemRubrica,
} from "@futsalcollege/core";

export type MidiaPublica = {
  id: string;
  tipo: "foto" | "video";
  url: string;
  legenda: string | null;
  capa: boolean;
};

export type DestaquePublico = {
  id: string;
  titulo: string;
  midiaUrl: string | null;
  midiaTipo: "foto" | "video" | null;
};

export type LaudoResumo = {
  id: string;
  publicadoEm: string;
  contexto: ContextoAvaliacao;
  avaliadorNome: string;
  profissional: { slug: string; nome: string } | null;
  texto: string | null;
  porEixo: Record<Eixo, number | null>;
  media: number;
};

export type LaudoDetalhado = LaudoResumo & {
  rubricaVersao: string;
  grupos: Record<Eixo, ItemRubrica[]>;
  notas: Record<string, number>;
};

type Aba = "geral" | "videos" | "fotos" | "avaliacoes";

const ROTULO_ABA: Record<Aba, string> = {
  geral: "Visão geral",
  videos: "Vídeos",
  fotos: "Fotos",
  avaliacoes: "Avaliações",
};

// Rótulo curto só para caber ao lado do radar — a lista de itens por eixo
// logo abaixo do gráfico usa `ROTULO_EIXO` (nome completo) normalmente.
const ROTULO_EIXO_RADAR: Record<Eixo, string> = {
  tecnico: "Técnico",
  fisico: "Físico",
  tatico: "Tático",
  comportamental: "Comport.",
};

type ItemLightbox = {
  url: string;
  tipo: "foto" | "video";
  legenda: string | null;
};

export type PerfilFichaProps = {
  atleta: {
    apelido: string;
    categoria: string;
    posicao: string | null;
    peDominante: string | null;
    fisico: string | null;
    estadoUf: string | null;
    escolinhaNome: string | null;
    escolinhaId: string | null;
    escolinhaCredenciada: boolean;
    avatarUrl: string | null;
  };
  stats: { avaliacoes: number; temporadas: number };
  destaques: DestaquePublico[];
  midias: MidiaPublica[];
  laudoAtual: LaudoDetalhado | null;
  historico: LaudoResumo[];
};

/**
 * Ficha pública do atleta — cabeçalho de perfil, destaques (stories fixos),
 * abas navegáveis sem recarregar a página e a mídia/avaliação em si. Todo o
 * dado já chega pronto do servidor (`page.tsx`); este componente só decide o
 * que mostrar e quando, sem nenhuma consulta própria — a régua de
 * visibilidade (só atleta `ativo`, colunas de mão) já foi aplicada antes de
 * chegar aqui.
 */
export function PerfilFicha({ atleta, stats, destaques, midias, laudoAtual, historico }: PerfilFichaProps) {
  const [aba, setAba] = useState<Aba>("geral");
  const [lightbox, setLightbox] = useState<ItemLightbox | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (lightbox && !dialog.open) dialog.showModal();
    if (!lightbox && dialog.open) dialog.close();
  }, [lightbox]);

  const fotos = midias.filter((m) => m.tipo === "foto");
  const videos = midias.filter((m) => m.tipo === "video");

  return (
    <>
      <CabecalhoPerfil atleta={atleta} stats={stats} />

      {destaques.length > 0 && (
        <div className="fc-destaques" role="list" aria-label="Destaques">
          {destaques.map((d) => (
            <button
              key={d.id}
              type="button"
              className="fc-destaque"
              role="listitem"
              onClick={() =>
                d.midiaUrl &&
                setLightbox({ url: d.midiaUrl, tipo: d.midiaTipo ?? "foto", legenda: d.titulo })
              }
            >
              <span className="fc-destaque__circulo">
                {d.midiaUrl ? (
                  <img src={d.midiaUrl} alt="" />
                ) : (
                  <span className="fc-destaque__sem-midia" aria-hidden="true">
                    ★
                  </span>
                )}
              </span>
              <span className="fc-destaque__titulo">{d.titulo}</span>
            </button>
          ))}
        </div>
      )}

      <nav className="fc-abas" aria-label="Seções do perfil">
        {(Object.keys(ROTULO_ABA) as Aba[]).map((chave) => (
          <button
            key={chave}
            type="button"
            className="fc-aba-botao"
            data-ativo={aba === chave || undefined}
            aria-current={aba === chave ? "page" : undefined}
            onClick={() => setAba(chave)}
          >
            {ROTULO_ABA[chave]}
          </button>
        ))}
      </nav>

      <div className="fc-aba-painel" key={aba}>
        {aba === "geral" && (
          <VisaoGeral
            atleta={atleta}
            fotos={fotos}
            laudoAtual={laudoAtual}
            totalFotos={fotos.length}
            totalVideos={videos.length}
            onAbrirMidia={(m) => setLightbox({ url: m.url, tipo: m.tipo, legenda: m.legenda })}
            onIrPara={setAba}
          />
        )}
        {aba === "videos" && (
          <GradeMidia
            itens={videos}
            vazio="Ainda sem vídeo publicado aqui."
            onAbrir={(m) => setLightbox({ url: m.url, tipo: m.tipo, legenda: m.legenda })}
          />
        )}
        {aba === "fotos" && (
          <GradeMidia
            itens={fotos}
            vazio="Ainda sem foto publicada aqui."
            onAbrir={(m) => setLightbox({ url: m.url, tipo: m.tipo, legenda: m.legenda })}
          />
        )}
        {aba === "avaliacoes" && <AbaAvaliacoes atleta={atleta} laudoAtual={laudoAtual} historico={historico} />}
      </div>

      <dialog ref={dialogRef} className="fc-lightbox" onClose={() => setLightbox(null)}>
        {lightbox && (
          <div className="fc-lightbox__conteudo">
            <button
              type="button"
              className="fc-lightbox__fechar"
              onClick={() => setLightbox(null)}
              aria-label="Fechar"
            >
              ×
            </button>
            {lightbox.tipo === "foto" ? (
              // eslint-disable-next-line @next/next/no-img-element -- bucket público, URL varia por ambiente (local/produção).
              <img src={lightbox.url} alt="" />
            ) : (
              <video src={lightbox.url} controls autoPlay playsInline />
            )}
            {lightbox.legenda && <p className="fc-lightbox__legenda">{lightbox.legenda}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}

function CabecalhoPerfil({
  atleta,
  stats,
}: {
  atleta: PerfilFichaProps["atleta"];
  stats: PerfilFichaProps["stats"];
}) {
  return (
    <section className="fc-perfil-header">
      <div className="fc-perfil-header__topo">
        <span className="fc-perfil-avatar">
          {atleta.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- bucket público, URL varia por ambiente.
            <img src={atleta.avatarUrl} alt="" />
          ) : (
            <span aria-hidden="true">{atleta.apelido.slice(0, 1).toUpperCase()}</span>
          )}
        </span>

        <dl className="fc-perfil-stats">
          <div>
            <dt>Avaliações</dt>
            <dd>{stats.avaliacoes}</dd>
          </div>
          <div>
            <dt>Temporadas</dt>
            <dd>{stats.temporadas}</dd>
          </div>
          <div>
            <dt>Escolinha</dt>
            <dd className="fc-perfil-stats__texto">{atleta.escolinhaNome ?? "Independente"}</dd>
          </div>
        </dl>
      </div>

      <h1 className="fc-perfil-nome">{atleta.apelido}</h1>

      <div className="fc-perfil-tags">
        <span className="fc-ficha-tag">{atleta.categoria}</span>
        {atleta.posicao && <span className="fc-ficha-tag">{atleta.posicao}</span>}
        {atleta.estadoUf && <span className="fc-ficha-tag">{atleta.estadoUf}</span>}
        {atleta.escolinhaCredenciada && (
          <span className="fc-ficha-tag fc-ficha-tag--selo">✓ Escolinha credenciada</span>
        )}
      </div>
    </section>
  );
}

function VisaoGeral({
  atleta,
  fotos,
  laudoAtual,
  totalFotos,
  totalVideos,
  onAbrirMidia,
  onIrPara,
}: {
  atleta: PerfilFichaProps["atleta"];
  fotos: MidiaPublica[];
  laudoAtual: LaudoDetalhado | null;
  totalFotos: number;
  totalVideos: number;
  onAbrirMidia: (m: MidiaPublica) => void;
  onIrPara: (aba: Aba) => void;
}) {
  const sobre = [
    atleta.posicao && { rotulo: "Posição", valor: atleta.posicao },
    atleta.peDominante && { rotulo: "Pé dominante", valor: atleta.peDominante },
    atleta.fisico && { rotulo: "Físico", valor: atleta.fisico },
    atleta.escolinhaNome && { rotulo: "Escolinha", valor: atleta.escolinhaNome },
    atleta.estadoUf && { rotulo: "Estado", valor: atleta.estadoUf },
  ].filter(Boolean) as { rotulo: string; valor: string }[];

  return (
    <div className="fc-visao-geral">
      {sobre.length > 0 && (
        <dl className="fc-ficha-grid fc-visao-geral__sobre">
          {sobre.map((item) => (
            <div key={item.rotulo} className="fc-ficha-item">
              <dt>{item.rotulo}</dt>
              <dd>{item.valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {totalFotos > 0 && (
        <section className="fc-visao-geral__secao">
          <div className="fc-visao-geral__cabecalho">
            <p className="fc-rotulo-secao fc-etiqueta-rotulo">Fotos recentes</p>
            <button type="button" className="fc-link-botao" onClick={() => onIrPara("fotos")}>
              Ver todas ({totalFotos})
            </button>
          </div>
          <GradeMidia itens={fotos.slice(0, 6)} onAbrir={onAbrirMidia} compacta />
        </section>
      )}

      {totalVideos > 0 && (
        <section className="fc-visao-geral__secao">
          <button type="button" className="fc-link-botao" onClick={() => onIrPara("videos")}>
            Ver vídeos ({totalVideos})
          </button>
        </section>
      )}

      <section className="fc-visao-geral__secao">
        <div className="fc-visao-geral__cabecalho">
          <p className="fc-rotulo-secao fc-etiqueta-rotulo">Avaliação técnica</p>
          {laudoAtual && (
            <button type="button" className="fc-link-botao" onClick={() => onIrPara("avaliacoes")}>
              Ver completa
            </button>
          )}
        </div>
        {laudoAtual ? (
          <div className="fc-visao-geral__radar">
            <RadarAvaliacao porEixo={laudoAtual.porEixo} />
          </div>
        ) : (
          <p className="fc-estado-vazio">Ainda sem avaliação técnica publicada.</p>
        )}
      </section>
    </div>
  );
}

function GradeMidia({
  itens,
  onAbrir,
  vazio,
  compacta,
}: {
  itens: MidiaPublica[];
  onAbrir: (m: MidiaPublica) => void;
  vazio?: string;
  compacta?: boolean;
}) {
  if (itens.length === 0) {
    return vazio ? <p className="fc-estado-vazio">{vazio}</p> : null;
  }

  return (
    <div className={compacta ? "fc-grade-midia fc-grade-midia--compacta" : "fc-grade-midia"}>
      {itens.map((m) => (
        <button key={m.id} type="button" className="fc-midia-tile" onClick={() => onAbrir(m)}>
          {m.tipo === "foto" ? (
            // eslint-disable-next-line @next/next/no-img-element -- bucket público, URL varia por ambiente.
            <img src={m.url} alt="" loading="lazy" />
          ) : (
            <>
              <video src={m.url} muted playsInline preload="metadata" />
              <span className="fc-midia-tile__play" aria-hidden="true">
                ▶
              </span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function AbaAvaliacoes({
  atleta,
  laudoAtual,
  historico,
}: {
  atleta: PerfilFichaProps["atleta"];
  laudoAtual: LaudoDetalhado | null;
  historico: LaudoResumo[];
}) {
  if (!laudoAtual) {
    return <p className="fc-estado-vazio">Ainda sem avaliação técnica publicada.</p>;
  }

  return (
    <div className="fc-laudo fc-laudo--aba">
      <div className="fc-laudo__cabecalho">
        <div>
          <p className="fc-etiqueta-rotulo fc-ficha-eyebrow">Avaliação técnica</p>
          <h2 className="fc-titulo fc-titulo--card">Notas por eixo</h2>
        </div>
        <p className="fc-laudo__meta">
          Assinado por{" "}
          {laudoAtual.profissional ? (
            <Link href={`/profissional/${laudoAtual.profissional.slug}`}>{laudoAtual.avaliadorNome}</Link>
          ) : (
            laudoAtual.avaliadorNome
          )}{" "}
          · {ROTULO_CONTEXTO[laudoAtual.contexto]} · rubrica {laudoAtual.rubricaVersao}
          <br />
          Publicado em {new Date(laudoAtual.publicadoEm).toLocaleDateString("pt-BR")}
        </p>
      </div>

      <RadarAvaliacao porEixo={laudoAtual.porEixo} tamanho="grande" />

      <div className="fc-laudo-eixos">
        {EIXOS.filter((eixo) => laudoAtual.grupos[eixo].length > 0).map((eixo) => (
          <div key={eixo}>
            <p className="fc-laudo-eixo__rotulo">{ROTULO_EIXO[eixo]}</p>
            {laudoAtual.grupos[eixo].map((item) => {
              const nota = laudoAtual.notas[item.chave];
              return (
                <div key={item.chave} className="fc-laudo-item">
                  <div className="fc-laudo-item__topo">
                    <span className="fc-laudo-item__rotulo">{item.rotulo}</span>
                    <span className="fc-laudo-item__nota">{nota ?? "—"}</span>
                  </div>
                  <div className="fc-laudo-item__barra-fundo">
                    <div
                      className="fc-laudo-item__barra-preenchido"
                      style={{ width: `${((nota ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                  <p className="fc-laudo-item__ancora">
                    {nota ? item.ancoras[String(nota) as "1"] : "não avaliado"}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {laudoAtual.texto && <p className="fc-laudo__texto">{laudoAtual.texto}</p>}

      {historico.length > 1 && (
        <div className="fc-evolucao-bloco">
          <p className="fc-etiqueta-rotulo fc-ficha-eyebrow">Evolução</p>
          <EvolucaoSparkline pontos={historico} />
          <ul className="fc-evolucao-lista">
            {[...historico].reverse().map((laudo) => (
              <li key={laudo.id} className="fc-evolucao-item">
                <span className="fc-evolucao-item__data">
                  {new Date(laudo.publicadoEm).toLocaleDateString("pt-BR")}
                </span>
                <span className="fc-evolucao-item__meta">
                  {ROTULO_CONTEXTO[laudo.contexto]} · {laudo.avaliadorNome} · média{" "}
                  {laudo.media.toFixed(1)}
                </span>
                <a
                  href={`/api/laudo/${laudo.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fc-link-botao"
                >
                  PDF
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="fc-laudo__rodape">
        A avaliação compara {atleta.apelido} com o critério da categoria {atleta.categoria} — nunca
        com outro atleta.
      </p>

      <div className="fc-laudo__acoes">
        <a
          href={`/api/laudo/${laudoAtual.id}/pdf`}
          className="fc-botao fc-botao--secundario"
          target="_blank"
          rel="noopener noreferrer"
        >
          Baixar PDF da avaliação
        </a>
      </div>
    </div>
  );
}

function RadarAvaliacao({
  porEixo,
  tamanho = "normal",
}: {
  porEixo: Record<Eixo, number | null>;
  tamanho?: "normal" | "grande";
}) {
  const eixosComNota = EIXOS.filter((eixo) => porEixo[eixo] != null);
  if (eixosComNota.length < 3) return null;

  const n = eixosComNota.length;
  const raio = 78;
  const centroX = 150;
  const centroY = 128;
  const larguraCaixa = 300;
  const alturaCaixa = 256;

  function ponto(indice: number, escala: number) {
    const angulo = (Math.PI * 2 * indice) / n - Math.PI / 2;
    return {
      x: centroX + Math.cos(angulo) * raio * escala,
      y: centroY + Math.sin(angulo) * raio * escala,
      angulo,
    };
  }

  const pontosArea = eixosComNota.map((eixo, i) => ponto(i, porEixo[eixo]! / 5));
  const pontosBorda = eixosComNota.map((_, i) => ponto(i, 1));
  const grades = [0.25, 0.5, 0.75, 1].map((escala) =>
    eixosComNota.map((_, i) => ponto(i, escala)).map((p) => `${p.x},${p.y}`).join(" "),
  );

  return (
    <svg
      viewBox={`0 0 ${larguraCaixa} ${alturaCaixa}`}
      className={tamanho === "grande" ? "fc-radar fc-radar--grande" : "fc-radar"}
      role="img"
      aria-label="Gráfico radar da avaliação técnica por eixo"
    >
      {grades.map((pontos, i) => (
        <polygon key={i} points={pontos} className="fc-radar__grade" />
      ))}
      {pontosBorda.map((p, i) => (
        <line key={i} x1={centroX} y1={centroY} x2={p.x} y2={p.y} className="fc-radar__eixo" />
      ))}
      <polygon points={pontosArea.map((p) => `${p.x},${p.y}`).join(" ")} className="fc-radar__area" />
      {pontosArea.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} className="fc-radar__ponto" />
      ))}
      {pontosBorda.map((p, i) => {
        // Rótulo cresce PARA FORA do centro (nunca centrado sobre o ponto):
        // no polo esquerdo/direito isso usa a margem disponível até a borda
        // da caixa em vez de precisar do dobro dela para os dois lados do
        // texto — é o que evita "Comportamental" cortado na borda do SVG.
        const cosseno = Math.cos(p.angulo);
        const ancora = cosseno > 0.35 ? "start" : cosseno < -0.35 ? "end" : "middle";
        const deslocamento = ancora === "middle" ? 0 : ancora === "start" ? 8 : -8;
        const rx = centroX + Math.cos(p.angulo) * (raio + 14) + deslocamento;
        const ry = centroY + Math.sin(p.angulo) * (raio + 14);
        return (
          <text key={i} x={rx} y={ry} textAnchor={ancora} dominantBaseline="middle" className="fc-radar__rotulo">
            {ROTULO_EIXO_RADAR[eixosComNota[i]!]}
          </text>
        );
      })}
    </svg>
  );
}

function EvolucaoSparkline({ pontos }: { pontos: LaudoResumo[] }) {
  const largura = 300;
  const altura = 72;
  const pad = 10;
  const min = 1;
  const max = 5;

  const coords = pontos.map((p, i) => {
    const x = pontos.length > 1 ? pad + (i * (largura - pad * 2)) / (pontos.length - 1) : largura / 2;
    const y = altura - pad - ((p.media - min) / (max - min)) * (altura - pad * 2);
    return { x, y };
  });

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      className="fc-evolucao"
      role="img"
      aria-label="Evolução da média das avaliações ao longo do tempo"
    >
      <polyline points={coords.map((c) => `${c.x},${c.y}`).join(" ")} className="fc-evolucao__linha" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3.5} className="fc-evolucao__ponto" />
      ))}
    </svg>
  );
}
