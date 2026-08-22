/**
 * Fonte da verdade da página /profissional/flavio.
 *
 * Dois tiers de evidência, e os dois valem:
 *
 *   1. DECLARADO PELO FLÁVIO — o palmarès veio dele direto. É o titular falando da
 *      própria carreira: a fonte de maior autoridade que existe sobre isso.
 *   2. CORROBORADO PUBLICAMENTE — 2006, 2009, 2010, 2013, 2019 e 2023 também
 *      aparecem em imprensa ou fonte institucional. Reforço, não requisito.
 *
 * Não inventar fato que não esteja num dos dois tiers.
 * Ver docs/flavio-barbosa-bio.md para as bios e a copy derivadas daqui.
 */

export const perfil = {
  nome: "Flávio Barbosa",
  primeiroNome: "Flávio",
  sobrenome: "Barbosa",
  local: "Fortaleza — Ceará",
  cargo: "Técnico · Futsal Sesc Ceará",
  categorias: "Sub-15 · Sub-17 · Sub-20",
  tagline: "Treze títulos em quadra. Um mundial na beira dela.",
  periodo: "2006 — hoje",
} as const;

export const marquee = [
  "Campeão mundial Sub-13",
  "13 títulos como atleta",
  "5× campeão cearense",
  "3× campeão do Nordeste",
  "Melhor técnico 2023",
] as const;

export const numeros = [
  {
    valor: "13",
    unidade: "títulos",
    label: "como atleta",
    nota: "Dez temporadas campeão, de 2006 a 2019, por sete clubes diferentes.",
  },
  {
    valor: "05",
    unidade: "estaduais",
    label: "campeão cearense adulto",
    nota: "2006, 2007, 2008, 2010 e 2012 — por quatro clubes.",
  },
  {
    valor: "03",
    unidade: "nordestes",
    label: "campeão regional",
    nota: "2006 e 2007, e mais um em 2011 pelo Horizonte.",
  },
  {
    valor: "01",
    unidade: "mundial",
    label: "como técnico",
    nota: "Campeão mundial de futebol de salão Sub-13, à frente da equipe.",
  },
] as const;

export type Fase = "quadra" | "tecnico";

export type Marco = {
  /** Slot grande da timeline: o ano, ou a categoria quando o ano ainda não veio. */
  ano: string;
  /** false quando o slot acima não é uma data — muda o texto de apoio. */
  datado: boolean;
  clube: string;
  titulos: readonly string[];
  titulo: string;
  texto: string;
  fase: Fase;
  destaque?: boolean;
};

export const linhaDoTempo: readonly Marco[] = [
  {
    ano: "2006",
    datado: true,
    clube: "Afagu / Russas",
    titulos: ["Cearense adulto", "Nordeste"],
    titulo: "Estreia ganhando dois",
    texto:
      "A primeira temporada de destaque já termina com duas taças: o Campeonato Cearense adulto e o título do Nordeste. Aos vinte e poucos anos, decidindo estadual contra o Ceará.",
    fase: "quadra",
  },
  {
    ano: "2007",
    datado: true,
    clube: "Granja Futsal",
    titulos: ["Cearense", "Nordeste"],
    titulo: "A dobradinha, de novo",
    texto:
      "Muda de clube e repete a dupla conquista — cearense e Nordeste em temporadas seguidas.",
    fase: "quadra",
  },
  {
    ano: "2008",
    datado: true,
    clube: "Fortaleza Futsal",
    titulos: ["Cearense adulto"],
    titulo: "Tri seguido no estadual",
    texto:
      "Terceiro Campeonato Cearense adulto em três anos, com a terceira camisa diferente.",
    fase: "quadra",
  },
  {
    ano: "2009",
    datado: true,
    clube: "Sumov",
    titulos: ["Metropolitano"],
    titulo: "Destaque do elenco",
    texto:
      "Campeão metropolitano. A imprensa esportiva local já o tratava como um dos nomes do time.",
    fase: "quadra",
  },
  {
    ano: "2010",
    datado: true,
    clube: "Horizonte",
    titulos: ["Cearense adulto"],
    titulo: "Artilheiro e campeão",
    texto:
      "Termina a campanha do Cearense como principal artilheiro do time, com 10 gols, e levanta a taça — o bicampeonato do Horizonte.",
    fase: "quadra",
    destaque: true,
  },
  {
    ano: "2011",
    datado: true,
    clube: "Horizonte",
    titulos: ["Metropolitano adulto", "Nordeste"],
    titulo: "Mais duas pelo Horizonte",
    texto:
      "Segunda temporada no clube, mais duas taças: o metropolitano adulto e o terceiro título do Nordeste da carreira.",
    fase: "quadra",
  },
  {
    ano: "2012",
    datado: true,
    clube: "Maracanaú",
    titulos: ["Cearense"],
    titulo: "Quinto estadual",
    texto: "Mais um Campeonato Cearense, agora pelo Maracanaú.",
    fase: "quadra",
  },
  {
    ano: "2013",
    datado: true,
    clube: "Maranguape",
    titulos: ["Copa TV Verdes Mares"],
    titulo: "A primeira Copa TV",
    texto:
      "Campeão da edição de estreia da Copa TV Verdes Mares, torneio transmitido ao vivo pela emissora.",
    fase: "quadra",
  },
  {
    ano: "2015",
    datado: true,
    clube: "Granja Futsal",
    titulos: ["Copa TV Verdes Mares"],
    titulo: "De volta à Granja, campeão",
    texto: "Segunda Copa TV Verdes Mares da carreira, oito anos após o primeiro título pelo clube.",
    fase: "quadra",
  },
  {
    ano: "2019",
    datado: true,
    clube: "Eusébio Futsal",
    titulos: ["Copa do Estado"],
    titulo: "Treze anos depois, ainda ganhando",
    texto:
      "Listado como fixo/ala no elenco campeão da Copa Estado do Ceará — treze anos depois do primeiro título, e ainda decidindo jogo.",
    fase: "quadra",
    destaque: true,
  },
  {
    ano: "2023",
    datado: true,
    clube: "Sesc · Sub-20",
    titulos: ["Liga Ceará", "Melhor técnico"],
    titulo: "Campeão invicto, do outro lado da linha",
    texto:
      "O grupo que começou a montar em 2021 vence a Taça Liga Ceará sem perder um jogo. Ele é eleito o melhor técnico da competição.",
    fase: "tecnico",
  },
  {
    ano: "Sub-20",
    datado: false,
    clube: "Campeonato Cearense",
    titulos: ["Vice-campeão"],
    titulo: "Vice no estadual de base",
    texto: "Vice-campeão cearense Sub-20 à frente da equipe.",
    fase: "tecnico",
  },
  {
    ano: "Mundial",
    datado: false,
    clube: "Futebol de salão · Sub-13",
    titulos: ["Campeão mundial"],
    titulo: "Campeão mundial como técnico",
    texto:
      "Título mundial de futebol de salão na categoria Sub-13, como técnico principal da equipe. A conquista mais alta da carreira — dentro ou fora da quadra.",
    fase: "tecnico",
    destaque: true,
  },
];

export const emQuadra = {
  rotulo: "Em quadra",
  periodo: "2006 — 2019",
  posicao: "Fixo · Ala",
  resumo:
    "Quatorze anos de futsal adulto no Ceará, por sete clubes, com título em dez temporadas diferentes. Artilheiro do Horizonte na campanha do estadual de 2010.",
  destaques: [
    { valor: "13", label: "títulos" },
    { valor: "07", label: "clubes" },
    { valor: "10", label: "temporadas campeão" },
  ],
} as const;

export const naBeira = {
  rotulo: "Na beira",
  periodo: "Hoje",
  posicao: "Técnico · Formador",
  resumo:
    "Comanda as seleções Sub-15, Sub-17 e Sub-20 do Futsal Sesc Ceará. Campeão mundial de futebol de salão Sub-13 e campeão invicto da Liga Ceará Sub-20, eleito melhor técnico do torneio.",
  destaques: [
    { valor: "01", label: "mundial" },
    { valor: "03", label: "categorias" },
    { valor: "01", label: "prêmio de melhor técnico" },
  ],
} as const;

export const citacoes = {
  titulo2010: {
    texto:
      "Fizemos um trabalho sério e centrado em tudo o que o treinador orientou. Foi um esforço de vários meses, coroado com este título.",
    fonte: "Após a final do Campeonato Cearense de 2010",
  },
  grupo2021: {
    texto:
      "Esse título foi importante, porque é o primeiro desse grupo que foi formado em 2021. Um trabalho de dois anos jogando juntos.",
    fonte: "Sobre a conquista da Taça Liga Ceará Sub-20, 2023",
  },
} as const;

export const hoje = {
  local: "Ginásio do Sesc Fortaleza",
  endereco: "Rua Clarindo de Queiroz, 1740 — Centro, Fortaleza/CE",
  categorias: ["Sub-15", "Sub-17", "Sub-20"],
  comissao: [
    { nome: "Flávio Barbosa", papel: "Técnico" },
    { nome: "Junior Piu", papel: "Comissão técnica" },
    { nome: "Mauro Lima", papel: "Comissão técnica" },
    { nome: "Walfrido Júnior", papel: "Auxiliar e preparador físico" },
  ],
  texto:
    "O trabalho hoje é de formação: seleções de base do Sesc Ceará, três categorias, treino técnico e tático no ginásio do Centro de Fortaleza. Junior Piu, que dividiu quadra com ele no elenco campeão do Eusébio em 2019, hoje divide a comissão.",
} as const;
