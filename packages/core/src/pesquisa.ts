import { z } from "zod";
import { CATEGORIAS } from "./esquemas";

/**
 * Pesquisa de pré-lançamento (home, migration 0017): as perguntas, os
 * valores fechados e o esquema de validação, num lugar só, para a tela
 * (rótulos) e a Server Action (validação) nunca divergirem da tabela (os
 * CHECKs da migration listam exatamente estes valores).
 *
 * Público primeiro: famílias do Sesc, muitas de baixa renda, no celular.
 * Para o responsável, toda pergunta é de tocar numa opção, com palavras do
 * dia a dia — nada de texto livre (pedido do Flávio, 03/11: "objetivo e de
 * fácil acesso"). As perguntas são sobre o que a família já fez, não sobre
 * o que faria; a exceção é quem deixaria ver o vídeo, que é a decisão em
 * aberto do produto — e numa escolha só, para a pessoa precisar preferir.
 * Nada aqui pede dado do filho além de categoria e UF.
 */

/** Quem está respondendo. Decide quais blocos o formulário mostra. */
export const PESQUISA_PERFIL = {
  responsavel: "Pai, mãe ou responsável",
  escolinha: "Treinador ou escolinha",
  clube_olheiro: "Clube ou olheiro",
  outro: "Outro",
} as const;

export const PESQUISA_ENVIOU_VIDEO = {
  nunca: "Não, nunca mandei",
  whatsapp: "Sim, pelo WhatsApp",
  instagram: "Sim, pelo Instagram",
  youtube: "Sim, pelo YouTube",
  pessoalmente: "Sim, mostrei no celular",
  outro: "Sim, de outro jeito",
} as const;

export const PESQUISA_RESULTADO_ENVIO = {
  chamaram_teste: "Chamaram ele para um teste",
  responderam_sem_retorno: "Responderam, mas não deu em nada",
  ninguem_respondeu: "Ninguém respondeu",
} as const;

export const PESQUISA_TEM_VIDEO = {
  celular: "Sim, no meu celular",
  redes: "Sim, no Instagram, Facebook ou YouTube",
  nao_tem: "Não tenho",
} as const;

export const PESQUISA_GASTO_MENSAL = {
  nada: "Não gasto",
  ate_50: "Até R$ 50 por mês",
  "50_150": "De R$ 50 a R$ 150 por mês",
  "150_300": "De R$ 150 a R$ 300 por mês",
  mais_300: "Mais de R$ 300 por mês",
  prefiro_nao_dizer: "Prefiro não dizer",
} as const;

export const PESQUISA_PUBLICA_VIDEO = {
  aberto: "Sim, para todo mundo ver",
  conhecidos: "Sim, só para conhecidos",
  nao_publica: "Não posto",
} as const;

export const PESQUISA_QUEM_VE_VIDEO = {
  qualquer_pessoa: "Qualquer pessoa",
  clubes_verificados: "Só clubes e olheiros conferidos pelo Revela 10",
  nao_publicaria: "Ninguém, não colocaria vídeo dele",
} as const;

export const PESQUISA_PREOCUPACAO = {
  expor_demais: "Expor demais o meu filho",
  mal_intencionados: "Gente mal-intencionada",
  golpe: "Golpe ou promessa falsa",
  custo: "Ter que pagar",
  nada: "Nada me preocupa",
} as const;

export const PESQUISA_BENEFICIO = {
  divulgar_videos: "Mostrar os vídeos dele",
  ser_encontrado: "Ser visto por clubes e olheiros",
  convites_peneiras: "Receber convite para peneira",
  historico_organizado: "Guardar a história dele no esporte",
  oportunidades_fora: "Saber de oportunidades em outras cidades",
  seguranca_orientacao: "Ter orientação e segurança",
} as const;

/**
 * O contato de novidades: WhatsApp (10 a 13 dígitos, com ou sem DDI,
 * pontuação livre) ou e-mail. Exportado para a tela validar igual ao
 * servidor.
 */
/**
 * Telefone no formato de exibição brasileiro: `(85) 99659-5034` (celular,
 * 11 dígitos) ou `(85) 3456-7890` (fixo, 10 dígitos). Aceita o que a pessoa
 * digitou — com ou sem DDI 55, espaços, parênteses, pontos e traços. E-mail
 * e o que não tiver cara de telefone voltam como vieram, aparados.
 */
export function formatarContato(valor: string): string {
  const v = valor.trim();
  if (v.includes("@")) return v.toLowerCase();
  let digitos = v.replace(/\D/g, "");
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return v;
}

/**
 * Máscara do campo de contato enquanto a pessoa digita: se só há número
 * (e pontuação de telefone), monta `(85) 99659-5034` aos poucos; se aparece
 * letra ou `@`, é e-mail e o texto passa como está. DDI 55 digitado na
 * frente é descartado, porque o número é sempre brasileiro.
 */
export function mascaraContato(valor: string): string {
  if (/[a-z@]/i.test(valor)) return valor;
  let digitos = valor.replace(/\D/g, "");
  if (digitos.length > 11 && digitos.startsWith("55")) digitos = digitos.slice(2);
  digitos = digitos.slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  // Celular começa com 9 e divide 5-4; fixo (2 a 5) divide 4-4.
  const corte = resto.startsWith("9") ? 5 : 4;
  if (resto.length <= corte) return `(${ddd}) ${resto}`;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export function contatoValido(valor: string): boolean {
  const v = valor.trim();
  if (v.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const digitos = v.replace(/\D/g, "");
  return /^[\d\s()+.-]+$/.test(v) && digitos.length >= 10 && digitos.length <= 13;
}

type Chaves<T> = readonly [keyof T & string, ...(keyof T & string)[]];
const chaves = <T extends Record<string, string>>(obj: T) => Object.keys(obj) as unknown as Chaves<T>;

/** Texto livre: apara, vazio vira `null`, teto igual ao CHECK da tabela. */
const livre = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `No máximo ${max} caracteres.`)
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .optional();

const escolhaOpcional = <T extends Record<string, string>>(obj: T) =>
  z
    .enum(chaves(obj))
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const escolha = <T extends Record<string, string>>(obj: T, mensagem: string) =>
  z.enum(chaves(obj), { message: mensagem });

export const esquemaPesquisa = z
  .object({
  perfil: escolha(PESQUISA_PERFIL, "Diga quem está respondendo."),
  origem: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(40)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),
  categoria_filho: z
    .enum(CATEGORIAS)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),
  estado_uf: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),

  // responsável
  enviou_video: z.array(z.enum(chaves(PESQUISA_ENVIOU_VIDEO))),
  resultado_envio: escolhaOpcional(PESQUISA_RESULTADO_ENVIO),
  tem_video: escolhaOpcional(PESQUISA_TEM_VIDEO),
  gasto_mensal: escolhaOpcional(PESQUISA_GASTO_MENSAL),
  publica_video: escolhaOpcional(PESQUISA_PUBLICA_VIDEO),
  quem_ve_video: escolhaOpcional(PESQUISA_QUEM_VE_VIDEO),
  preocupacao: escolhaOpcional(PESQUISA_PREOCUPACAO),
  beneficio: escolhaOpcional(PESQUISA_BENEFICIO),

  // escolinha, clube, olheiro
  organizacao: livre(120),
  como_hoje: livre(500),
  pedido: livre(500),

  aceita_contato: z.boolean(),
  contato: livre(120),
  })
  .superRefine((d, ctx) => {
    // O bloco sobre o filho só é exigido de quem é responsável; escolinha e
    // clube respondem o bloco curto (mesma regra do CHECK
    // `pesquisa_responsavel_completo` da migration).
    if (d.perfil === "responsavel") {
      const falta = (mensagem: string) => ctx.addIssue({ code: "custom", message: mensagem });
      if (d.enviou_video.length === 0) falta("Diga se já mandou vídeo dele.");
      if (!d.publica_video) falta("Diga se posta vídeo dele.");
      if (!d.quem_ve_video) falta("Diga quem você deixaria ver o vídeo.");
    }
    // Contato para novidades (último passo), só com o "Sim" marcado.
    if (d.aceita_contato && !d.contato) {
      ctx.addIssue({ code: "custom", message: "Deixe o seu WhatsApp ou e-mail, ou escolha Agora não." });
    } else if (d.aceita_contato && d.contato && !contatoValido(d.contato)) {
      ctx.addIssue({
        code: "custom",
        message: "Confira o número com DDD, ou o e-mail.",
      });
    }
  });

export type RespostaPesquisa = z.infer<typeof esquemaPesquisa>;
