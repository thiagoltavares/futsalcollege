/**
 * Os dois sócios, escritos à mão — usados pela home de pré-lançamento e
 * pela vitrine. Flávio: papel e descrição do brief REVELA10-HOME-001
 * (item 6). Thiago: trajetória resumida do perfil público do LinkedIn
 * (linkedin.com/in/thiagoltavares), nada além do que está escrito lá.
 * Sem foto inventada: quem renderiza usa a foto do banco quando existe, e
 * as iniciais quando não.
 */
export const FUNDADORES = [
  {
    chave: "flavio",
    nome: "Flávio Barbosa",
    papel: "Esporte e metodologia",
    texto:
      "Ex-atleta de futsal, atualmente técnico das seleções de base do Sesc Ceará. Responsável pelo conhecimento esportivo e pela metodologia de avaliação.",
    link: null,
  },
  {
    chave: "thiago",
    nome: "Thiago Tavares",
    papel: "Produto e tecnologia",
    texto:
      "Mais de vinte anos em tecnologia. Hoje é engenheiro frontend na Deel, plataforma global de RH e folha de pagamento, onde ajudou a construir um produto do zero até mais de 120 países; antes, liderou um time de frontend de oito pessoas entre Lisboa e Dubai. No Revela 10, responde pela concepção técnica, arquitetura, desenvolvimento e experiência do produto.",
    link: { href: "https://www.linkedin.com/in/thiagoltavares/", rotulo: "Ver perfil no LinkedIn" },
  },
] as const;

/** Iniciais para o avatar sem foto ("Flávio Barbosa" → "FB"). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}
