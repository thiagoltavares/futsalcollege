import { z } from "zod";

export const CATEGORIAS = [
  "Sub-7", "Sub-8", "Sub-9", "Sub-10", "Sub-11", "Sub-12", "Sub-13",
  "Sub-14", "Sub-15", "Sub-16", "Sub-17", "Sub-18", "Sub-19", "Sub-20",
] as const;

export const POSICOES = ["Goleiro", "Fixo", "Ala", "Pivô"] as const;

// Não faz parte de `esquemaAtleta` (cadastro não coleta isto ainda, ver
// migration 0015) — só o valor de referência para o filtro de `/atletas`.
export const GENEROS = ["Masculino", "Feminino"] as const;

/**
 * Um `<select>` HTML nunca envia `undefined` — na opção padrão ("Não
 * informada", "Escolha depois" etc.) ele envia `value=""`. Todo `FormData`
 * de um formulário não controlado tem essa mesma característica para
 * qualquer campo opcional deixado em branco (select ou input de texto).
 *
 * Um campo `z.enum([...]).optional()` recusa `""` (não é um dos valores do
 * enum) com um erro cru do Zod, em inglês — travando o cadastro para quem
 * não preenche esse campo, mesmo ele sendo opcional por definição.
 *
 * `objetoComOpcionaisTolerantes` resolve isso uma vez, no nível do schema:
 * detecta automaticamente, campo a campo, quais aceitam ausência
 * (`campo.safeParse(undefined).success`) e, só para esses, troca `""` por
 * `undefined` antes da validação de verdade. Um campo obrigatório com `""`
 * continua sendo recusado normalmente. Qualquer campo opcional acrescentado
 * depois a um schema construído com esta função herda o comportamento
 * automaticamente — não é preciso lembrar de tratar caso a caso, nem no
 * schema nem em cada formulário que o consome.
 */
function objetoComOpcionaisTolerantes<Forma extends Record<string, z.ZodType>>(forma: Forma) {
  const camposOpcionais = Object.entries(forma)
    .filter(([, campo]) => campo.safeParse(undefined).success)
    .map(([chave]) => chave);

  return z.preprocess((valor) => {
    if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
      return valor;
    }
    const entrada = valor as Record<string, unknown>;
    const tratado: Record<string, unknown> = { ...entrada };
    for (const chave of camposOpcionais) {
      if (tratado[chave] === "") tratado[chave] = undefined;
    }
    return tratado;
  }, z.object(forma));
}

export const esquemaAtleta = objetoComOpcionaisTolerantes({
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
