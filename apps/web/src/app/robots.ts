import type { MetadataRoute } from "next";
import { siteAberto } from "@/lib/preLancamento";

/**
 * Pré-lançamento: só a home é indexável (o resto nem abre para visitante,
 * ver `src/proxy.ts`). Aberto: tudo, menos as áreas logadas.
 */
export default function robots(): MetadataRoute.Robots {
  if (!siteAberto()) {
    return { rules: { userAgent: "*", allow: "/$", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel", "/entrar", "/avaliar", "/auth", "/api", "/plan"],
    },
  };
}
