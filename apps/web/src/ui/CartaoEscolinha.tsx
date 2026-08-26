import Link from "next/link";
import { Cartao } from "./Cartao";

export type EscolinhaResumoCartao = {
  id: string;
  nome: string;
  cidade: string;
  estado_uf: string;
  credenciada: boolean;
  /**
   * URL pública já resolvida do avatar (`escolinhas.foto_storage_path`,
   * migration 0013) — `undefined`/`null` quando a escolinha não tem
   * avatar; o cartão cai para o grafismo de marca (inicial do nome) nesse
   * caso, mesmo raciocínio de `AtletaResumoCartao.capaUrl`.
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
 * Cartão de escolinha compartilhado por `/escolinhas` e a home — mesma
 * disciplina de FAIXAS FIXAS do cartão de atleta (ver `CartaoAtleta.tsx`
 * para o diagnóstico completo do problema que essa estrutura resolve):
 * sempre nesta ordem, sempre com a mesma altura por faixa, para a faixa N
 * de um cartão alinhar com a faixa N do vizinho na grade.
 *
 *   1. identidade — avatar (`escolinhas.foto_storage_path`, migration
 *      0013); sem avatar, o grafismo de marca (inicial do nome), nunca um
 *      espaço vazio.
 *   2. nome         — uma linha, corte por reticências.
 *   3. cidade e UF  — uma linha, corte por reticências.
 *   4. números      — atletas ativos e, dentre eles, quantos avaliados.
 *   5. selos        — linha própria, sempre presente: o selo de
 *      credenciada vive aqui, nunca ao lado do nome (faixa 2).
 */
export function CartaoEscolinha({ escolinha, ativos, avaliados }: CartaoEscolinhaProps) {
  const inicial = escolinha.nome.trim().charAt(0).toUpperCase() || "?";

  return (
    <Link href={`/escolinha/${escolinha.id}`} className="fc-atletas-item-link">
      <Cartao className="fc-cartao-escolinha">
        <div className="fc-cartao-escolinha__midia">
          {escolinha.fotoUrl ? (
            <img src={escolinha.fotoUrl} alt="" loading="lazy" />
          ) : (
            <span className="fc-cartao-escolinha__midia-inicial" aria-hidden="true">
              {inicial}
            </span>
          )}
        </div>

        <div className="fc-cartao-escolinha__corpo">
          <span className="fc-cartao-escolinha__nome">{escolinha.nome}</span>
          <span className="fc-cartao-escolinha__cidade">
            {escolinha.cidade} · {escolinha.estado_uf}
          </span>
          <span className="fc-cartao-escolinha__meta">
            {ativos} {ativos === 1 ? "atleta ativo" : "atletas ativos"}
            {avaliados > 0 ? ` · ${avaliados} ${avaliados === 1 ? "avaliado" : "avaliados"}` : ""}
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
