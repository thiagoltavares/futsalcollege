/**
 * Formatação de números para leitura em português.
 *
 * O peso vem do banco como `numeric(5,2)` e chega cru — "72.29". Exibir assim
 * mostra uma precisão que ninguém mediu e ainda usa ponto decimal, que não é
 * como se escreve número no Brasil.
 */

const UMA_CASA = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** "72.29" vira "72,3 kg". Devolve null quando não há peso registrado. */
export function formatarPeso(kg: number | string | null | undefined): string | null {
  if (kg === null || kg === undefined || kg === "") return null;

  const numero = Number(kg);
  if (!Number.isFinite(numero) || numero <= 0) return null;

  return `${UMA_CASA.format(numero)} kg`;
}

/** Altura é inteiro em centímetros; só acrescenta a unidade. */
export function formatarAltura(cm: number | null | undefined): string | null {
  if (!cm || !Number.isFinite(cm)) return null;
  return `${cm} cm`;
}

/** Linha de físico pronta: "172 cm · 64,5 kg", omitindo o que faltar. */
export function linhaFisico(
  cm: number | null | undefined,
  kg: number | string | null | undefined,
): string | null {
  const partes = [formatarAltura(cm), formatarPeso(kg)].filter(Boolean);
  return partes.length ? partes.join(" · ") : null;
}
