import type { Metadata } from "next";
import "@/ui/estilos.css";
import { siteAberto } from "@/lib/preLancamento";
import { PreLancamento } from "./_pre-lancamento/PreLancamento";
import { Vitrine, metadataVitrine } from "./vitrine/Vitrine";

/**
 * `/`: a página de "em breve" com a pesquisa enquanto o site está fechado
 * (padrão, ver `lib/preLancamento.ts`), a vitrine quando `REVELA_ABERTO=1`.
 * A vitrine também mora em `/vitrine`, que é por onde a equipe a vê durante
 * o pré-lançamento.
 */

const metadataPreLancamento: Metadata = {
  title: "Revela 10 — a base vai entrar em quadra",
  description:
    "A vitrine em vídeo do futsal e do fut7 de base, da Sub-7 à Sub-20, em todo o Brasil. Em construção: responda a pesquisa e ajude a decidir o que vem primeiro.",
  openGraph: {
    title: "Revela 10 — a base vai entrar em quadra",
    description:
      "A vitrine em vídeo do futsal e do fut7 de base. Em construção: três minutos de pesquisa para quem vive a base.",
    locale: "pt_BR",
    type: "website",
  },
};

export function generateMetadata(): Metadata {
  return siteAberto() ? metadataVitrine : metadataPreLancamento;
}

/** `?de=sesc` marca de onde veio o link; só slug curto, o resto é ignorado. */
function origemValida(valor: string | string[] | undefined): string | null {
  if (typeof valor !== "string") return null;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(valor) && valor.length <= 40 ? valor : null;
}

export default async function Inicio({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (siteAberto()) return <Vitrine />;

  const { de } = await searchParams;
  return <PreLancamento origem={origemValida(de)} />;
}
