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

/**
 * "2018-03-01" vira "há 8 anos" (ou "há 1 ano", "há menos de 1 ano") — usado
 * na página do profissional (`atua_desde`), nunca em dado de atleta.
 */
export function formatarTempoDesde(dataIso: string | null | undefined): string | null {
  if (!dataIso) return null;
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return null;

  const anos = Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  if (anos <= 0) return "há menos de 1 ano";
  return `há ${anos} ${anos === 1 ? "ano" : "anos"}`;
}

/**
 * Ano de uma coluna `date` (formato "AAAA-MM-DD", sem hora) — pega os 4
 * primeiros caracteres da string em vez de `new Date(str).getFullYear()`.
 * `new Date("2006-01-01")` é meia-noite UTC; num fuso atrás de UTC (Brasil,
 * por exemplo) `getFullYear()` local devolve 2005 — um dia 1º de janeiro
 * "voltando" pro ano anterior. Extrair o ano direto da string evita
 * qualquer conversão de fuso.
 */
export function anoDeData(dataIso: string | null | undefined): string | null {
  if (!dataIso || dataIso.length < 4) return null;
  return dataIso.slice(0, 4);
}
