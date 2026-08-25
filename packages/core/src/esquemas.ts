import { z } from "zod";

export const CATEGORIAS = [
  "Sub-7", "Sub-8", "Sub-9", "Sub-10", "Sub-11", "Sub-12", "Sub-13",
  "Sub-14", "Sub-15", "Sub-16", "Sub-17", "Sub-18", "Sub-19", "Sub-20",
] as const;

export const POSICOES = ["Goleiro", "Fixo", "Ala", "Pivô"] as const;

export const esquemaAtleta = z.object({
  apelido: z.string().min(1, "Informe como ele é chamado").max(40),
  categoria: z.enum(CATEGORIAS),
  posicao: z.enum(POSICOES).optional(),
  pe_dominante: z.enum(["Direito", "Esquerdo", "Ambos"]).optional(),
  altura_cm: z.number().int().min(90).max(220).optional(),
  peso_kg: z.number().min(15).max(150).optional(),
  clube_atual: z.string().max(80).optional(),
  estado_uf: z.string().length(2).optional(),

  nome_completo: z.string().min(5, "Informe o nome completo").max(120),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD"),
  cidade: z.string().max(80).optional(),
  contato_responsavel: z.string().max(60).optional(),
});

export type DadosAtleta = z.infer<typeof esquemaAtleta>;
