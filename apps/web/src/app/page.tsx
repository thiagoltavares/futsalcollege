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
    "Um lugar para mostrar o futsal e o fut7 de base em vídeo, em todo o Brasil. Em construção: responda a pesquisa, leva 2 minutos.",
  openGraph: {
    title: "Revela 10 — a base vai entrar em quadra",
    description: "Futsal e fut7 de base, em vídeo. Responda a pesquisa: leva 2 minutos, é só tocar.",
    url: "/",
    siteName: "Revela 10",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revela 10 — a base vai entrar em quadra",
    description: "Futsal e fut7 de base, em vídeo. Responda a pesquisa: leva 2 minutos, é só tocar.",
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
