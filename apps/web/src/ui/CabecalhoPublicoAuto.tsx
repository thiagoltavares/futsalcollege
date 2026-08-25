"use client";

import { useEffect, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { CabecalhoPublico, type CabecalhoPublicoProps } from "./CabecalhoPublico";

/**
 * `CabecalhoPublico` para as rotas públicas cacheadas (home, /atletas,
 * /atleta/[id], /escolinhas, /escolinha/[id]): elas usam cliente anônimo e
 * `revalidate` no servidor, então não podem chamar `cookies()` para saber
 * se há sessão sem perder esse cache (ver `CabecalhoPublicoProps.autenticado`).
 *
 * A troca acontece no cliente em vez disso: renderiza a variante visitante
 * primeiro — é o HTML que o cache serve e o que aparece para quem não tem
 * JavaScript — e, depois de hidratar, consulta a sessão no navegador via
 * Supabase (que já fica em dia a cada requisição pelo Proxy, ver
 * `lib/supabase/proxy.ts`) para trocar para a nav autenticada quando houver
 * uma. `onAuthStateChange` também cobre login/logout que aconteçam com a
 * página já aberta (outra aba, ou o botão Sair deste próprio cabeçalho).
 *
 * Não reserva espaço para a troca de propósito: os dois estados da nav são
 * uma única linha de mesma altura (só o conteúdo horizontal muda — "Entrar"
 * vira "Painel"/"Sair"), então não há salto de layout vertical a esconder.
 */
export function CabecalhoPublicoAuto(props: Omit<CabecalhoPublicoProps, "autenticado">) {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    let ativo = true;
    const supabase = criarClienteNavegador();

    supabase.auth.getSession().then(({ data }) => {
      if (ativo) setAutenticado(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (ativo) setAutenticado(Boolean(sessao));
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  return <CabecalhoPublico {...props} autenticado={autenticado} />;
}
