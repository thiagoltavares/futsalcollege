"use client";

import { useState } from "react";
import Link from "next/link";
import { Cartao } from "@/ui";

export type MarcoPublico = {
  id: string;
  ano: string;
  datado: boolean;
  clube: string | null;
  titulos: string[];
  titulo: string;
  descricao: string;
  fase: "atleta" | "tecnico";
  destaque: boolean;
};

export type ConquistaPublica = {
  id: string;
  valor: string;
  unidade: string;
  rotulo: string;
  nota: string | null;
};

export type AtletaAvaliadoPublico = {
  id: string;
  apelido: string;
  categoria: string;
  publicadoEm: string;
};

export type PerfilProfissionalProps = {
  profissional: {
    nome: string;
    credencial: string | null;
    localidade: string | null;
    bio: string | null;
    ativo: boolean;
    desde: string | null;
    citacaoTexto: string | null;
    citacaoFonte: string | null;
  };
  stats: { laudos: number; marcos: number };
  conquistas: ConquistaPublica[];
  marcos: MarcoPublico[];
  atletasAvaliados: AtletaAvaliadoPublico[];
};

type Aba = "geral" | "trajetoria" | "atletas";

const ROTULO_FASE: Record<MarcoPublico["fase"], string> = {
  atleta: "Como atleta",
  tecnico: "Carreira profissional",
};

/** Duas primeiras iniciais do nome — mesmo raciocínio do avatar do atleta
 * (que cai para a primeira letra do apelido quando não há foto): aqui nunca
 * há foto nenhuma, então a inicial é sempre o que aparece no avatar. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

/**
 * Perfil público do profissional — cabeçalho de perfil, abas e trajetória,
 * no mesmo espírito social de `PerfilFicha` (perfil do atleta). Todo o dado
 * já chega pronto do servidor (`page.tsx`); este componente só decide o que
 * mostrar e quando.
 */
export function PerfilProfissional({
  profissional,
  stats,
  conquistas,
  marcos,
  atletasAvaliados,
}: PerfilProfissionalProps) {
  const abasDisponiveis: Aba[] = [
    "geral",
    ...(marcos.length > 0 ? (["trajetoria"] as const) : []),
    "atletas",
  ];
  const [aba, setAba] = useState<Aba>("geral");

  const rotuloAba: Record<Aba, string> = {
    geral: "Visão geral",
    trajetoria: "Trajetória",
    atletas: `Atletas avaliados${atletasAvaliados.length > 0 ? ` (${atletasAvaliados.length})` : ""}`,
  };

  return (
    <>
      <section className="fc-perfil-header fc-perfil-header--capa">
        <div className="fc-perfil-header__topo">
          <span className="fc-perfil-avatar" aria-hidden="true">
            <span>{iniciais(profissional.nome)}</span>
          </span>

          <dl className="fc-perfil-stats">
            <div>
              <dt>Laudos</dt>
              <dd>{stats.laudos}</dd>
            </div>
            <div>
              <dt>Atua desde</dt>
              <dd className="fc-perfil-stats__texto">{profissional.desde ?? "—"}</dd>
            </div>
            {conquistas.length > 0 && (
              <div>
                <dt>Conquistas</dt>
                <dd>{conquistas.length}</dd>
              </div>
            )}
          </dl>
        </div>

        <h1 className="fc-perfil-nome">{profissional.nome}</h1>

        <div className="fc-perfil-tags">
          {profissional.credencial && <span className="fc-ficha-tag">{profissional.credencial}</span>}
          {profissional.localidade && <span className="fc-ficha-tag">{profissional.localidade}</span>}
          {!profissional.ativo && <span className="fc-ficha-tag">Não avalia mais na plataforma</span>}
        </div>
      </section>

      <nav className="fc-abas" aria-label="Seções do perfil">
        {abasDisponiveis.map((chave) => (
          <button
            key={chave}
            type="button"
            className="fc-aba-botao"
            data-ativo={aba === chave || undefined}
            aria-current={aba === chave ? "page" : undefined}
            onClick={() => setAba(chave)}
          >
            {rotuloAba[chave]}
          </button>
        ))}
      </nav>

      <div className="fc-aba-painel" key={aba}>
        {aba === "geral" && (
          <VisaoGeral
            profissional={profissional}
            conquistas={conquistas}
            atletasAvaliados={atletasAvaliados}
            temTrajetoria={marcos.length > 0}
            onIrPara={setAba}
          />
        )}
        {aba === "trajetoria" && <Trajetoria marcos={marcos} />}
        {aba === "atletas" && <ListaAtletasAvaliados atletas={atletasAvaliados} />}
      </div>
    </>
  );
}

function VisaoGeral({
  profissional,
  conquistas,
  atletasAvaliados,
  temTrajetoria,
  onIrPara,
}: {
  profissional: PerfilProfissionalProps["profissional"];
  conquistas: ConquistaPublica[];
  atletasAvaliados: AtletaAvaliadoPublico[];
  temTrajetoria: boolean;
  onIrPara: (aba: Aba) => void;
}) {
  return (
    <div className="fc-visao-geral">
      {profissional.bio && <p className="fc-subtitulo fc-subtitulo--livre">{profissional.bio}</p>}

      {conquistas.length > 0 && (
        <section className="fc-visao-geral__secao">
          <div className="fc-visao-geral__cabecalho">
            <p className="fc-rotulo-secao fc-etiqueta-rotulo">Conquistas</p>
            {temTrajetoria && (
              <button type="button" className="fc-link-botao" onClick={() => onIrPara("trajetoria")}>
                Ver trajetória completa
              </button>
            )}
          </div>
          <div className="fc-conquistas">
            {conquistas.map((c) => (
              <div key={c.id} className="fc-conquista">
                <div className="fc-conquista__numero">
                  <span className="fc-conquista__valor">{c.valor}</span>
                  <span className="fc-conquista__unidade">{c.unidade}</span>
                </div>
                <p className="fc-conquista__rotulo">{c.rotulo}</p>
                {c.nota && <p className="fc-conquista__nota">{c.nota}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {profissional.citacaoTexto && (
        <figure className="fc-citacao">
          <blockquote className="fc-citacao__texto">&ldquo;{profissional.citacaoTexto}&rdquo;</blockquote>
          {profissional.citacaoFonte && <figcaption className="fc-citacao__fonte">{profissional.citacaoFonte}</figcaption>}
        </figure>
      )}

      <section className="fc-visao-geral__secao">
        <div className="fc-visao-geral__cabecalho">
          <p className="fc-rotulo-secao fc-etiqueta-rotulo">Trabalho publicado</p>
          {atletasAvaliados.length > 0 && (
            <button type="button" className="fc-link-botao" onClick={() => onIrPara("atletas")}>
              Ver todos ({atletasAvaliados.length})
            </button>
          )}
        </div>
        {atletasAvaliados.length === 0 ? (
          <p className="fc-estado-vazio">Ainda sem avaliação publicada.</p>
        ) : (
          <ul className="fc-lista fc-grade-cartoes">
            {atletasAvaliados.slice(0, 4).map((a) => (
              <li key={a.id}>
                <CartaoAtletaAvaliado atleta={a} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Trajetoria({ marcos }: { marcos: MarcoPublico[] }) {
  let faseAnterior: MarcoPublico["fase"] | null = null;

  return (
    <ol className="fc-trajetoria">
      {marcos.map((m) => {
        const abreFase = m.fase !== faseAnterior;
        faseAnterior = m.fase;

        return (
          <li key={m.id}>
            {abreFase && <p className="fc-trajetoria__fase">{ROTULO_FASE[m.fase]}</p>}
            <div className="fc-trajetoria__marco" data-destaque={m.destaque || undefined}>
              <div className="fc-trajetoria__cabeca">
                <span className="fc-trajetoria__ano">{m.ano}</span>
                {m.clube && <span className="fc-trajetoria__clube">{m.clube}</span>}
              </div>

              {m.titulos.length > 0 && (
                <div className="fc-trajetoria__chips">
                  {m.titulos.map((t) => (
                    <span
                      key={t}
                      className={m.destaque ? "fc-trajetoria__chip fc-trajetoria__chip--forte" : "fc-trajetoria__chip"}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <h3 className="fc-trajetoria__titulo">{m.titulo}</h3>
              <p className="fc-trajetoria__texto">{m.descricao}</p>

              {!m.datado && <p className="fc-trajetoria__nao-datado">Ano a confirmar.</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CartaoAtletaAvaliado({ atleta }: { atleta: AtletaAvaliadoPublico }) {
  return (
    <Link href={`/atleta/${atleta.id}`} className="fc-atletas-item-link">
      <Cartao className="fc-item-atleta">
        <div className="fc-item-atleta__info">
          <span className="fc-item-atleta__nome">{atleta.apelido}</span>
          <span className="fc-item-atleta__meta">
            {atleta.categoria} · avaliado em {new Date(atleta.publicadoEm).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </Cartao>
    </Link>
  );
}

function ListaAtletasAvaliados({ atletas }: { atletas: AtletaAvaliadoPublico[] }) {
  if (atletas.length === 0) {
    return <p className="fc-estado-vazio">Ainda sem avaliação publicada.</p>;
  }

  return (
    <ul className="fc-lista fc-grade-cartoes">
      {atletas.map((a) => (
        <li key={a.id}>
          <CartaoAtletaAvaliado atleta={a} />
        </li>
      ))}
    </ul>
  );
}
