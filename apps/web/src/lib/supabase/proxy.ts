import type { Database } from "@revela10/db";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova o token de sessão do responsável a cada requisição.
 *
 * Server Component não consegue escrever cookie (ver `servidor.ts`), então é
 * o Proxy quem grava o token renovado: na requisição, para os Server
 * Components lidos na mesma passada, e na resposta, para o navegador. Sem
 * isso, a sessão expira em silêncio quando o token de acesso vence.
 *
 * Escopo mínimo, de propósito: só renovação de sessão. Proteção de rota,
 * autorização e redirecionamento por permissão continuam responsabilidade de
 * cada página, que já chama `getUser()` e redireciona quando necessário. A
 * exceção é a trava de pré-lançamento (`src/proxy.ts`), que precisa saber
 * QUEM está logado — por isso esta função devolve o e-mail das claims junto
 * com a resposta, em vez de consultar a sessão uma segunda vez.
 */
export async function atualizarSessao(
  requisicao: NextRequest,
): Promise<{ resposta: NextResponse; email: string | null }> {
  let resposta = NextResponse.next({ request: requisicao });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => requisicao.cookies.getAll(),
        setAll: (lista, headers) => {
          lista.forEach(({ name, value }) => requisicao.cookies.set(name, value));
          resposta = NextResponse.next({ request: requisicao });
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
          Object.entries(headers).forEach(([chave, valor]) => resposta.headers.set(chave, valor));
        },
      },
    },
  );

  // Não rode código entre createServerClient e getClaims(): um refresh que
  // termine depois da resposta já montada se perde, e a próxima requisição
  // tenta renovar de novo.
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  return { resposta, email };
}
