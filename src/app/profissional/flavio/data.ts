/**
 * Fonte da verdade da página /profissional/flavio.
 *
 * Todo dado aqui foi verificado em fonte primária (checagem 22/08/2026).
 * Ver docs/flavio-barbosa-bio.md para o registro de verificação e as pendências.
 * NÃO adicionar fato sem fonte — a página inteira se apoia nisso.
 */

export const perfil = {
  nome: "Flávio Barbosa",
  primeiroNome: "Flávio",
  sobrenome: "Barbosa",
  local: "Fortaleza — Ceará",
  cargo: "Técnico · Futsal Sesc Ceará",
  categorias: "Sub-15 · Sub-17 · Sub-20",
  tagline: "Vinte anos de futsal cearense — de artilheiro a formador.",
  periodo: "2006 — hoje",
} as const;

export const marquee = [
  "Campeão cearense 2010",
  "Artilheiro · 10 gols",
  "Copa Estado do Ceará 2019",
  "Melhor técnico 2023",
  "Campeão invicto Sub-20",
] as const;

export const numeros = [
  {
    valor: "20",
    unidade: "anos",
    label: "de futsal cearense",
    nota: "Primeira final estadual em 2006. Ainda em quadra em 2019.",
  },
  {
    valor: "10",
    unidade: "gols",
    label: "artilheiro do Horizonte",
    nota: "Principal artilheiro do time na campanha do título de 2010.",
  },
  {
    valor: "02",
    unidade: "títulos",
    label: "como atleta",
    nota: "Cearense 2010 (Horizonte) e Copa Estado 2019 (Eusébio).",
  },
  {
    valor: "01",
    unidade: "prêmio",
    label: "melhor técnico",
    nota: "Taça Liga Ceará Sub-20 de 2023, com campanha invicta.",
  },
] as const;

export const linhaDoTempo = [
  {
    ano: "2006",
    clube: "Afagu / Russas",
    titulo: "A primeira decisão",
    texto:
      "Relacionado no elenco do Afagu/Russas para a final do Campeonato Cearense contra o Ceará. Tinha vinte e poucos anos e já estava numa decisão estadual.",
    tag: "Vice",
  },
  {
    ano: "2009",
    clube: "Sumov A.C.",
    titulo: "Nome conhecido da quadra",
    texto:
      "A imprensa esportiva local já o tratava como um dos destaques do elenco do Sumov no Campeonato Cearense.",
    tag: "Destaque",
  },
  {
    ano: "2010",
    clube: "Horizonte",
    titulo: "Artilheiro e campeão",
    texto:
      "Terminou a campanha do Cearense como principal artilheiro do time, com 10 gols, e levantou a taça — o bicampeonato do Horizonte.",
    tag: "Campeão",
    destaque: true,
  },
  {
    ano: "2019",
    clube: "Sport Club Eusébio",
    titulo: "Ainda em quadra",
    texto:
      "Nove anos depois, listado como fixo/ala no elenco campeão da Copa Estado do Ceará.",
    tag: "Campeão",
  },
  {
    ano: "2021",
    clube: "Sesc Ceará",
    titulo: "Começa a montar o grupo",
    texto:
      "Assume a formação de um grupo de base no Sesc — o mesmo que ergueria a taça dois anos depois.",
    tag: "Base",
  },
  {
    ano: "2023",
    clube: "Sesc Sub-20",
    titulo: "Campeão invicto, melhor técnico",
    texto:
      "O Sub-20 vence a Taça Liga Ceará sem perder um jogo. Flávio é eleito o melhor técnico da competição.",
    tag: "Campeão",
    destaque: true,
  },
] as const;

export const emQuadra = {
  rotulo: "Em quadra",
  periodo: "2006 — 2019",
  posicao: "Fixo · Ala",
  itens: [
    "Campeão Cearense de Futsal — Horizonte, 2010",
    "Principal artilheiro do Horizonte na campanha, 10 gols",
    "Campeão da Copa Estado do Ceará — Sport Club Eusébio, 2019",
    "Finalista do Campeonato Cearense — Afagu/Russas, 2006",
    "Destaque do Sumov no Campeonato Cearense, 2009",
  ],
} as const;

export const naBeira = {
  rotulo: "Na beira",
  periodo: "2021 — hoje",
  posicao: "Técnico · Formador",
  itens: [
    "Técnico das seleções Sub-15, Sub-17 e Sub-20 do Futsal Sesc Ceará",
    "Campeão invicto da Taça Liga Ceará Sub-20, 2023",
    "Melhor técnico da Taça Liga Ceará Sub-20, 2023",
    "Trabalho de base no Ginásio do Sesc Fortaleza",
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
