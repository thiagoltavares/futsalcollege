import Link from "next/link";
import { Cartao } from "./Cartao";
import { Quadra } from "./Quadra";

export type EscolinhaResumoCartao = {
  id: string;
  nome: string;
  cidade: string;
  estado_uf: string;
  credenciada: boolean;
  /**
   * URL pública já resolvida do escudo/avatar (`escolinhas.foto_storage_path`,
   * migration 0013) — `undefined`/`null` quando a escolinha não tem
   * imagem; o cartão cai para o grafismo de marca (iniciais do nome) nesse
   * caso, mesmo raciocínio de `AtletaResumoCartao.capaUrl`. Nunca inventa
   * logotipo: ou é a imagem que a escolinha subiu, ou são as iniciais.
   */
  fotoUrl?: string | null;
};

export type CartaoEscolinhaProps = {
  escolinha: EscolinhaResumoCartao;
  /** Quantos atletas ATIVOS a escolinha tem — nunca conta rascunho/removido. */
  ativos: number;
  /** Dentre os ativos, quantos têm ao menos um laudo publicado. */
  avaliados: number;
};

/**
 * Iniciais da instituição para o escudo sem imagem: as duas primeiras
 * palavras "fortes" do nome ("Academia Futsal Cariri" → "AF", "CT Sesc
 * Ceará Futsal" → "CS"). Partículas (de, do, da, e…) ficam de fora para a
 * sigla não virar "Ed" em "Escolinha do Sertão".
 */
const PARTICULAS = new Set(["de", "do", "da", "dos", "das", "e", "em", "na", "no"]);

function iniciaisInstituicao(nome: string): string {
  const palavras = nome
    .split(/[\s—–-]+/)
    .filter((p) => p && !PARTICULAS.has(p.toLowerCase()));
  const letras = palavras.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return letras.join("") || "?";
}

/**
 * Cartão de escolinha compartilhado por `/escolinhas` e a home. Não é a
 * figurinha do atleta: escolinha é instituição, e instituição se apresenta
 * por escudo e nome, não por retrato em 4:5. Por isso o cartão é
 * horizontal — escudo à esquerda, nome e dados à direita — e, em largura
 * apertada (coluna estreita de `/escolinhas` no celular), empilha o escudo
 * sobre o texto via container query (`.fc-atletas-item-link` é o
 * contêiner). Mesma disciplina de FAIXAS FIXAS do cartão de atleta (ver
 * `CartaoAtleta.tsx`): a faixa N de um cartão alinha com a faixa N do
 * vizinho.
 *
 *   1. escudo       — imagem da escolinha (`foto_storage_path`); sem
 *      imagem, as iniciais sobre um recorte da quadra. Formato de escudo
 *      (recorte em `clip-path`), a linguagem visual de clube.
 *   2. nome         — até duas linhas, altura reservada.
 *   3. cidade e UF  — uma linha. Cidade da ESCOLINHA, dado público de
 *      instituição — nunca de atleta.
 *   4. números      — atletas ativos e, dentre eles, quantos avaliados.
 *   5. selos        — linha própria, sempre presente: o selo de
 *      credenciada vive aqui, nunca ao lado do nome.
 */
export function CartaoEscolinha({ escolinha, ativos, avaliados }: CartaoEscolinhaProps) {
  const iniciais = iniciaisInstituicao(escolinha.nome);

  return (
    <Link href={`/escolinha/${escolinha.id}`} className="fc-atletas-item-link">
      <Cartao className="fc-cartao-escolinha">
        <span className="fc-cartao-escolinha__escudo">
          {escolinha.fotoUrl ? (
            <img src={escolinha.fotoUrl} alt="" loading="lazy" />
          ) : (
            <>
              <Quadra className="fc-quadra--recorte" />
              <b aria-hidden="true">{iniciais}</b>
            </>
          )}
        </span>

        <div className="fc-cartao-escolinha__corpo">
          <span className="fc-cartao-escolinha__nome">{escolinha.nome}</span>
          <span className="fc-cartao-escolinha__cidade">
            {escolinha.cidade}, {escolinha.estado_uf}
          </span>
          <span className="fc-cartao-escolinha__meta">
            {ativos} {ativos === 1 ? "atleta ativo" : "atletas ativos"}
            {avaliados > 0 ? `, ${avaliados} ${avaliados === 1 ? "avaliado" : "avaliados"}` : ""}
          </span>

          <div className="fc-cartao-escolinha__selos">
            {escolinha.credenciada && (
              <span className="fc-etiqueta fc-etiqueta--sucesso">Credenciada</span>
            )}
          </div>
        </div>
      </Cartao>
    </Link>
  );
}
