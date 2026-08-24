import type { Database } from "@futsalcollege/db";
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
 * cada página, que já chama `getUser()` e redireciona quando necessário.
 */
export async function atualizarSessao(requisicao: NextRequest) {
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
  await supabase.auth.getClaims();

  return resposta;
}
