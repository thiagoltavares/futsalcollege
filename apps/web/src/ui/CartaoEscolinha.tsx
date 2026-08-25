import Link from "next/link";
import { Cartao } from "./Cartao";

export type EscolinhaResumoCartao = {
  id: string;
  nome: string;
  cidade: string;
  estado_uf: string;
  credenciada: boolean;
};

export type CartaoEscolinhaProps = {
  escolinha: EscolinhaResumoCartao;
  /** Quantos atletas ATIVOS a escolinha tem — nunca conta rascunho/removido. */
  ativos: number;
  /** Dentre os ativos, quantos têm ao menos um laudo publicado. */
  avaliados: number;
};

/**
 * Cartão de escolinha compartilhado por `/escolinhas` e a home: nome,
 * cidade/UF, selo de credenciamento e a densidade nova — quantos atletas
 * ativos e quantos deles já têm avaliação publicada.
 */
export function CartaoEscolinha({ escolinha, ativos, avaliados }: CartaoEscolinhaProps) {
  return (
    <Link href={`/escolinha/${escolinha.id}`} className="fc-atletas-item-link">
      <Cartao className="fc-cartao-escolinha">
        <span className="fc-cartao-escolinha__nome">{escolinha.nome}</span>
        <span className="fc-cartao-escolinha__cidade">
          {escolinha.cidade} · {escolinha.estado_uf}
        </span>
        <span className="fc-cartao-escolinha__meta">
          {ativos} {ativos === 1 ? "atleta ativo" : "atletas ativos"}
          {avaliados > 0 ? ` · ${avaliados} ${avaliados === 1 ? "avaliado" : "avaliados"}` : ""}
        </span>
        {escolinha.credenciada && (
          <span className="fc-etiqueta fc-etiqueta--sucesso fc-cartao-escolinha__selo">
            Credenciada
          </span>
        )}
      </Cartao>
    </Link>
  );
}
