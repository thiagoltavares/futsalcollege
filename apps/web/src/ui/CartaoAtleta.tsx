import Link from "next/link";
import { Cartao } from "./Cartao";
import { linhaFisico } from "./formato";

export type AtletaResumoCartao = {
  id: string;
  apelido: string;
  categoria: string;
  posicao: string | null;
  pe_dominante: string | null;
  altura_cm: number | null;
  peso_kg: number | string | null;
  clube_atual?: string | null;
  estado_uf: string | null;
  escolinha?: { nome: string; credenciada: boolean } | null;
};

export type AvaliacaoResumoCartao = {
  quantidade: number;
  ultimaEm: string;
  avaliadorNome: string;
};

export type CartaoAtletaProps = {
  atleta: AtletaResumoCartao;
  avaliacao?: AvaliacaoResumoCartao | null;
  /**
   * Omite clube/escolinha da linha de meta — usado em `/escolinha/[id]`,
   * onde a escolinha já é o contexto da página inteira (repetir o nome dela
   * em cada cartão da própria página seria ruído).
   */
  ocultarClube?: boolean;
};

/**
 * Cartão de atleta compartilhado por `/atletas`, `/escolinha/[id]` e a
 * home — as três listagens públicas de atleta usam o mesmo formato denso:
 * nome, categoria, meta física/posição/clube, selo de avaliação e um
 * resumo de "quantas avaliações, quando foi a última, quem assinou".
 *
 * O nome de quem assinou aparece como texto simples, nunca como link: o
 * cartão inteiro já é um `<Link>` para a ficha do atleta (mais abaixo), e
 * HTML não aceita `<a>` dentro de `<a>`. O link para a página do
 * profissional mora só na ficha pública (`/atleta/[id]`), fora deste
 * cartão — ver AGENTS/brief da rodada.
 */
export function CartaoAtleta({ atleta, avaliacao, ocultarClube }: CartaoAtletaProps) {
  const fisico = linhaFisico(atleta.altura_cm, atleta.peso_kg) ?? "";
  const clubeOuEscolinha = ocultarClube ? null : (atleta.escolinha?.nome ?? atleta.clube_atual);
  const meta = [atleta.posicao, atleta.pe_dominante, fisico || null, clubeOuEscolinha, atleta.estado_uf]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/atleta/${atleta.id}`} className="fc-atletas-item-link">
      <Cartao className="fc-cartao-atleta">
        <div className="fc-cartao-atleta__topo">
          <span className="fc-cartao-atleta__nome">{atleta.apelido}</span>
          {atleta.escolinha?.credenciada && (
            <span
              className="fc-etiqueta fc-etiqueta--sucesso fc-cartao-atleta__selo"
              title="Escolinha credenciada"
            >
              Escolinha credenciada
            </span>
          )}
        </div>
        <span className="fc-cartao-atleta__categoria">{atleta.categoria}</span>
        {meta && <span className="fc-cartao-atleta__meta">{meta}</span>}

        {avaliacao && (
          <>
            <span className="fc-etiqueta fc-etiqueta--sucesso fc-cartao-atleta__avaliacao">
              Avaliação publicada
            </span>
            <span className="fc-cartao-atleta__avaliacoes">
              {avaliacao.quantidade} {avaliacao.quantidade === 1 ? "avaliação" : "avaliações"} ·
              última em {new Date(avaliacao.ultimaEm).toLocaleDateString("pt-BR")}
              <br />
              assinado por {avaliacao.avaliadorNome}
            </span>
          </>
        )}
      </Cartao>
    </Link>
  );
}
