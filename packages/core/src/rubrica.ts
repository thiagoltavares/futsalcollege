import { z } from "zod";

/**
 * A rubrica é o ativo da empresa: é ela que faz dois avaliadores diferentes
 * chegarem perto no mesmo atleta. Cada item exige âncora descritiva — nota
 * solta não é rubrica, é opinião.
 *
 * Versionada porque o método vai evoluir, e o laudo grava em qual versão foi
 * feito: sem isso o histórico de um atleta ao longo de anos fica incomparável.
 */

export const EIXOS = ["tecnico", "fisico", "tatico", "comportamental"] as const;
export type Eixo = (typeof EIXOS)[number];

export const ROTULO_EIXO: Record<Eixo, string> = {
  tecnico: "Técnico",
  fisico: "Físico",
  tatico: "Tático",
  comportamental: "Comportamental",
};

export const esquemaItemRubrica = z.object({
  eixo: z.enum(EIXOS),
  chave: z.string().regex(/^[a-z0-9_]+$/),
  rotulo: z.string().min(3),
  ancoras: z
    .object({
      "1": z.string().min(3),
      "2": z.string().min(3),
      "3": z.string().min(3),
      "4": z.string().min(3),
      "5": z.string().min(3),
    })
    .strict(),
});

export const esquemaRubrica = z.object({
  versao: z.string().min(1),
  itens: z.array(esquemaItemRubrica).min(1),
});

export type ItemRubrica = z.infer<typeof esquemaItemRubrica>;
export type Rubrica = z.infer<typeof esquemaRubrica>;

/** Valida um objeto cru (por exemplo, `itens` vindo do banco) contra o esquema da rubrica. */
export function validarRubrica(dados: unknown): Rubrica {
  return esquemaRubrica.parse(dados);
}

/** Agrupa os itens de uma rubrica pelos quatro eixos, na ordem de `EIXOS`. */
export function agruparPorEixo(itens: ItemRubrica[]): Record<Eixo, ItemRubrica[]> {
  const grupos = Object.fromEntries(
    EIXOS.map((eixo) => [eixo, [] as ItemRubrica[]]),
  ) as Record<Eixo, ItemRubrica[]>;
  for (const item of itens) {
    grupos[item.eixo].push(item);
  }
  return grupos;
}

export const CONTEXTOS_AVALIACAO = ["presencial", "analise_video"] as const;
export type ContextoAvaliacao = (typeof CONTEXTOS_AVALIACAO)[number];

export const ROTULO_CONTEXTO: Record<ContextoAvaliacao, string> = {
  presencial: "Presencial",
  analise_video: "Análise de vídeo",
};

/** Notas de um laudo: chave do item da rubrica → nota de 1 a 5. */
export const esquemaNotas = z.record(z.string(), z.number().int().min(1).max(5));

export const esquemaLaudo = z.object({
  contexto: z.enum(CONTEXTOS_AVALIACAO),
  avaliador_nome: z.string().min(3, "Informe o nome de quem está avaliando").max(120),
  texto: z.string().max(4000).optional(),
  notas: esquemaNotas,
});

export type DadosLaudo = z.infer<typeof esquemaLaudo>;
