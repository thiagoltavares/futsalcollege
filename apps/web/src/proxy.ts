import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";

export async function proxy(requisicao: NextRequest) {
  return await atualizarSessao(requisicao);
}

export const config = {
  matcher: [
    // Roda em tudo, exceto assets estáticos e arquivos de imagem — não há
    // motivo para renovar sessão nessas requisições.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
