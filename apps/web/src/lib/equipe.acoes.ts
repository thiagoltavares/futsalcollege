"use server";

import { usuarioDaEquipe } from "@/lib/equipe";

/**
 * Para o cabeçalho das rotas públicas cacheadas (`CabecalhoPublicoAuto`),
 * que descobre a sessão no navegador e não enxerga `EQUIPE_EMAILS` (variável
 * só do servidor): diz se a conta logada é da equipe, para mostrar o item
 * "Questionário" no menu.
 */
export async function souDaEquipe(): Promise<boolean> {
  return (await usuarioDaEquipe()) !== null;
}
