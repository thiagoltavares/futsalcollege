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
  /**
   * URL pública já resolvida da foto de capa (`atleta_midias`, migration
   * 0011) — `undefined`/`null` quando o atleta não tem mídia; o cartão cai
   * para o grafismo de marca nesse caso. Quem monta esta lista resolve o
   * `storage_path` para URL (ver `lib/midias.ts`), o cartão nunca fala com
   * o storage diretamente.
   */
  capaUrl?: string | null;
};

export type MidiaResumoCartao = {
  fotos: number;
  videos: number;
};

export type AvaliacaoResumoCartao = {
  quantidade: number;
  ultimaEm: string;
  avaliadorNome: string;
};

export type CartaoAtletaProps = {
  atleta: AtletaResumoCartao;
  /**
   * Quantas fotos e vídeos o atleta tem. É o que a última faixa mostra nas
   * listagens públicas (home, `/atletas`, `/escolinha/[id]`), onde o
   * produto é o cardápio de atletas.
   */
  midia?: MidiaResumoCartao | null;
  /**
   * Só passado onde a avaliação É o assunto da página — hoje, a aba
   * "Atletas avaliados" de `/profissional/[slug]`. Nas demais listagens
   * fica de fora de propósito: avaliação virou produto premium de uma fase
   * seguinte, e um atleta sem laudo é o caso normal, não o incompleto.
   */
  avaliacao?: AvaliacaoResumoCartao | null;
  /**
   * Omite clube/escolinha da faixa de físico — usado em `/escolinha/[id]`,
   * onde a escolinha já é o contexto da página inteira (repetir o nome dela
   * em cada cartão da própria página seria ruído).
   */
  ocultarClube?: boolean;
};

/**
 * Cartão de atleta compartilhado por `/atletas`, `/escolinha/[id]`, a home
 * e a aba "Atletas avaliados" de `/profissional/[slug]` — as quatro
 * listagens públicas de atleta usam o mesmo cartão.
 *
 * Estrutura de FAIXAS FIXAS, sempre nesta ordem, sempre com a mesma altura
 * por faixa (via `line-clamp`/`min-height` em `estilos.css`) — é o que faz
 * a faixa N de um cartão alinhar com a faixa N do vizinho na grade, tenha
 * ou não mídia/escolinha/avaliação:
 *
 *   1. mídia       — foto de capa, proporção fixa; sem foto, grafismo de
 *                     marca (inicial do apelido), nunca um espaço vazio.
 *   2. apelido      — uma linha, corte por reticências.
 *   3. categoria e posição — uma linha.
 *   4. físico, clube ou escolinha — até duas linhas, corte, altura
 *                     reservada mesmo com texto mais curto.
 *   5. selos        — linha própria, sempre presente, alinhada à esquerda:
 *                     escolinha credenciada e avaliação publicada vivem
 *                     aqui, nunca ao lado do apelido (faixa 2).
 *   6. metadado — quantos vídeos e fotos o atleta tem. Onde a avaliação é
 *                     o assunto da página (`/profissional/[slug]`), esta
 *                     faixa mostra o laudo no lugar: quantas, quando, quem
 *                     assinou. Nunca vazia, nos dois casos.
 *
 * O nome de quem assinou aparece como texto simples, nunca como link: o
 * cartão inteiro já é um `<Link>` para a ficha do atleta, e HTML não aceita
 * `<a>` dentro de `<a>`. O link para a página do profissional mora só na
 * ficha pública (`/atleta/[id]`), fora deste cartão — ver AGENTS/brief.
 */
/**
 * Texto da última faixa nas listagens públicas. Sem mídia nenhuma o texto é
 * um convite, não um defeito: o atleta acabou de entrar, e a plataforma é
 * de quem vai publicar vídeo, não de quem já tem.
 */
function resumoMidia(midia: MidiaResumoCartao | null | undefined): string {
  const videos = midia?.videos ?? 0;
  const fotos = midia?.fotos ?? 0;
  if (videos === 0 && fotos === 0) return "Perfil novo, ainda sem vídeo";

  const partes: string[] = [];
  if (videos > 0) partes.push(videos === 1 ? "1 vídeo" : `${videos} vídeos`);
  if (fotos > 0) partes.push(fotos === 1 ? "1 foto" : `${fotos} fotos`);
  return partes.join(" · ");
}

export function CartaoAtleta({ atleta, midia, avaliacao, ocultarClube }: CartaoAtletaProps) {
  const fisico = linhaFisico(atleta.altura_cm, atleta.peso_kg);
  const clubeOuEscolinha = ocultarClube ? null : (atleta.escolinha?.nome ?? atleta.clube_atual);
  const categoriaLinha = [atleta.categoria, atleta.posicao].filter(Boolean).join(" · ");
  const fisicoLinha = [atleta.pe_dominante, fisico, clubeOuEscolinha, atleta.estado_uf]
    .filter(Boolean)
    .join(" · ");
  const inicial = atleta.apelido.trim().charAt(0).toUpperCase() || "?";

  return (
    <Link href={`/atleta/${atleta.id}`} className="fc-atletas-item-link">
      <Cartao className="fc-cartao-atleta">
        <div className="fc-cartao-atleta__midia">
          {atleta.capaUrl ? (
            <img src={atleta.capaUrl} alt="" loading="lazy" />
          ) : (
            <span className="fc-cartao-atleta__midia-inicial" aria-hidden="true">
              {inicial}
            </span>
          )}
        </div>

        <div className="fc-cartao-atleta__corpo">
          <span className="fc-cartao-atleta__nome">{atleta.apelido}</span>
          <span className="fc-cartao-atleta__categoria">{categoriaLinha}</span>
          <span className="fc-cartao-atleta__fisico">{fisicoLinha}</span>

          <div className="fc-cartao-atleta__selos">
            {atleta.escolinha?.credenciada && (
              <span
                className="fc-etiqueta fc-etiqueta--sucesso"
                title="Escolinha credenciada"
              >
                Escolinha credenciada
              </span>
            )}
            {avaliacao && <span className="fc-etiqueta fc-etiqueta--sucesso">Avaliação publicada</span>}
          </div>

          <span className="fc-cartao-atleta__avaliacao-meta">
            {avaliacao ? (
              <>
                {avaliacao.quantidade} {avaliacao.quantidade === 1 ? "avaliação" : "avaliações"} ·
                última em {new Date(avaliacao.ultimaEm).toLocaleDateString("pt-BR")}
                <br />
                assinado por {avaliacao.avaliadorNome}
              </>
            ) : (
              resumoMidia(midia)
            )}
          </span>
        </div>
      </Cartao>
    </Link>
  );
}
