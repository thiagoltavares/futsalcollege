/**
 * Ciclo de vida do perfil do atleta.
 *
 * O treinador pode cadastrar uma turma inteira de uma vez: os perfis nascem em
 * `aguardando_consentimento` e ficam invisíveis até o responsável assinar.
 * Consentimento revogado derruba para `suspenso`; `removido` é terminal.
 */

export const ESTADOS_PERFIL = [
  "rascunho",
  "aguardando_consentimento",
  "ativo",
  "suspenso",
  "removido",
] as const;

export type EstadoPerfil = (typeof ESTADOS_PERFIL)[number];

const TRANSICOES: Record<EstadoPerfil, readonly EstadoPerfil[]> = {
  rascunho: ["aguardando_consentimento", "removido"],
  aguardando_consentimento: ["ativo", "removido"],
  ativo: ["suspenso", "removido"],
  suspenso: ["ativo", "removido"],
  removido: [],
};

export function podeTransicionar(de: EstadoPerfil, para: EstadoPerfil): boolean {
  return TRANSICOES[de].includes(para);
}

/** Só `ativo` aparece em página, busca, feed ou qualquer outro lugar. */
export function perfilRenderiza(estado: EstadoPerfil): boolean {
  return estado === "ativo";
}
