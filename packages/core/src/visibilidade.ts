/**
 * Política de visibilidade por campo.
 *
 * Fonte única da verdade sobre quem enxerga o quê. O banco impõe isto por RLS
 * e por separação de tabelas; este módulo existe para que a regra seja legível,
 * testável e reaproveitável pelo app mobile.
 *
 * Campos que localizam a criança — bairro, endereço, escola, local e horário de
 * treino — não aparecem aqui porque não existem no sistema. Não se vaza uma
 * coluna que nunca foi criada.
 */

export type Contexto = "publico" | "verificado" | "responsavel" | "profissional";

/** `saude` é mais restrito que `verificado`: olheiro nunca vê. */
export type Sensibilidade = "publico" | "identificacao" | "saude";

export const CAMPOS_ATLETA = {
  apelido: "publico",
  categoria: "publico",
  posicao: "publico",
  pe_dominante: "publico",
  altura: "publico",
  peso: "publico",
  clube_atual: "publico",
  estado: "publico",

  nome_completo: "identificacao",
  data_nascimento: "identificacao",
  cidade: "identificacao",
  contato_responsavel: "identificacao",

  avaliacao_postural: "saude",
  massa_magra: "saude",
  historico_lesao: "saude",
} as const satisfies Record<string, Sensibilidade>;

export type CampoAtleta = keyof typeof CAMPOS_ATLETA;

const ACESSO: Record<Sensibilidade, readonly Contexto[]> = {
  publico: ["publico", "verificado", "responsavel", "profissional"],
  identificacao: ["verificado", "responsavel", "profissional"],
  saude: ["responsavel", "profissional"],
};

export function campoVisivel(campo: string, contexto: Contexto): boolean {
  const sensibilidade = (CAMPOS_ATLETA as Record<string, Sensibilidade>)[campo];
  if (!sensibilidade) return false;
  return ACESSO[sensibilidade].includes(contexto);
}

export function camposVisiveis(contexto: Contexto): CampoAtleta[] {
  return (Object.keys(CAMPOS_ATLETA) as CampoAtleta[]).filter((c) =>
    campoVisivel(c, contexto),
  );
}
