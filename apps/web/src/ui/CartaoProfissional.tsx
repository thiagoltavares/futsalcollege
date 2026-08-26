import Link from "next/link";
import { Cartao } from "./Cartao";
import { anoDeData } from "./formato";

export type ProfissionalResumoCartao = {
  id: string;
  slug: string;
  nome: string;
  credencial: string | null;
  cidade: string | null;
  estado_uf: string | null;
  atua_desde: string;
  /**
   * URL pública já resolvida do avatar (`profissionais.foto_storage_path`,
   * migration 0013) — `undefined`/`null` quando o profissional não tem
   * avatar; o cartão cai para o grafismo de marca (inicial do nome) nesse
   * caso, mesmo raciocínio de `AtletaResumoCartao.capaUrl`.
   */
  fotoUrl?: string | null;
};

export type CartaoProfissionalProps = {
  profissional: ProfissionalResumoCartao;
  /** Quantos laudos publicados este profissional assinou. */
  laudos: number;
};

/**
 * Cartão de profissional, usado por `/profissionais` — mesma disciplina de
 * FAIXAS FIXAS do cartão de atleta e do cartão de escolinha (ver
 * `CartaoAtleta.tsx` para o diagnóstico completo do problema que essa
 * estrutura resolve): sempre nesta ordem, sempre com a mesma altura por
 * faixa, para a faixa N de um cartão alinhar com a faixa N do vizinho na
 * grade — inclusive quando a credencial de um profissional é bem mais
 * longa que a do vizinho ("Educação Física — UFC · técnica de categorias
 * de base" ao lado de "Técnico · Futsal Sesc Ceará").
 *
 *   1. identidade  — avatar (`profissionais.foto_storage_path`, migration
 *      0013); sem avatar, o grafismo de marca (inicial do nome), nunca um
 *      espaço vazio.
 *   2. nome         — uma linha, corte por reticências.
 *   3. credencial   — até duas linhas, corte por reticências; texto neutro
 *      quando não informada, para a faixa nunca sumir e deslocar as de
 *      baixo (mesma régua da faixa de físico/clube do cartão de atleta).
 *   4. cidade e UF  — uma linha; texto neutro quando não informada.
 *   5. números      — quantos laudos assinados e desde quando.
 *
 * Sem faixa de selos por ora: nenhum profissional carrega selo hoje (não
 * existe coluna equivalente à `escolinhas.credenciada`) — quando isso
 * mudar, a faixa entra no mesmo padrão do cartão de atleta/escolinha,
 * sempre em linha própria, nunca ao lado do nome.
 */
export function CartaoProfissional({ profissional, laudos }: CartaoProfissionalProps) {
  const inicial = profissional.nome.trim().charAt(0).toUpperCase() || "?";
  const localidade = [profissional.cidade, profissional.estado_uf].filter(Boolean).join(" · ");
  const desde = anoDeData(profissional.atua_desde);

  return (
    <Link href={`/profissional/${profissional.slug}`} className="fc-atletas-item-link">
      <Cartao className="fc-cartao-profissional">
        <div className="fc-cartao-profissional__midia">
          {profissional.fotoUrl ? (
            <img src={profissional.fotoUrl} alt="" loading="lazy" />
          ) : (
            <span className="fc-cartao-profissional__midia-inicial" aria-hidden="true">
              {inicial}
            </span>
          )}
        </div>

        <div className="fc-cartao-profissional__corpo">
          <span className="fc-cartao-profissional__nome">{profissional.nome}</span>
          <span
            className="fc-cartao-profissional__credencial"
            data-vazio={!profissional.credencial || undefined}
          >
            {profissional.credencial || "Credencial não informada"}
          </span>
          <span className="fc-cartao-profissional__cidade" data-vazio={!localidade || undefined}>
            {localidade || "Cidade não informada"}
          </span>
          <span className="fc-cartao-profissional__meta">
            {laudos} {laudos === 1 ? "laudo assinado" : "laudos assinados"}
            {desde ? ` · desde ${desde}` : ""}
          </span>
        </div>
      </Cartao>
    </Link>
  );
}
