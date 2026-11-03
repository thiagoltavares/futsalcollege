import { NextResponse, type NextRequest } from "next/server";
import { ehEquipe, rotaPublicaNoPreLancamento, siteAberto } from "@/lib/preLancamento";
import { atualizarSessao } from "@/lib/supabase/proxy";

export async function proxy(requisicao: NextRequest) {
  const { resposta, email } = await atualizarSessao(requisicao);

  // Pré-lançamento (ver `lib/preLancamento.ts`): fora da home e do login,
  // só a equipe passa. Quem não passa volta para a home — não um 404, que
  // diria que a página não existe, nem um 401, que pediria um login que a
  // pessoa não tem.
  if (
    !siteAberto() &&
    !rotaPublicaNoPreLancamento(requisicao.nextUrl.pathname) &&
    !ehEquipe(email)
  ) {
    const destino = requisicao.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    const redirecionamento = NextResponse.redirect(destino);
    // Preserva o cookie de sessão que `atualizarSessao` possa ter renovado.
    resposta.cookies.getAll().forEach((cookie) => redirecionamento.cookies.set(cookie));
    return redirecionamento;
  }

  return resposta;
}

export const config = {
  matcher: [
    // Roda em tudo, exceto assets estáticos e arquivos de imagem — não há
    // motivo para renovar sessão nessas requisições.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
