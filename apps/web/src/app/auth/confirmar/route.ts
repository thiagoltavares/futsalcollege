import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { destinoAposLogin } from "@/lib/preLancamento";

export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  const codigo = url.searchParams.get("code");

  if (!codigo) {
    return NextResponse.redirect(new URL("/entrar?erro=sem-codigo", url.origin));
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error) {
    return NextResponse.redirect(new URL("/entrar?erro=link-invalido", url.origin));
  }

  // Equipe cai no Questionário; os demais, no painel do responsável.
  return NextResponse.redirect(new URL(destinoAposLogin(data.user?.email), url.origin));
}
