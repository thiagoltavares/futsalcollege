import type { ReactNode } from "react";
import { fontesFc } from "@/ui/fontes";
import "@/ui/estilos.css";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehEquipe } from "@/lib/preLancamento";
import { CabecalhoGrupoApp } from "./CabecalhoGrupoApp";

export default async function LayoutApp({ children }: { children: ReactNode }) {
  // O cabeçalho aqui precisa saber se há sessão para escolher a nav certa
  // (visitante, terminando em "Entrar", ou logada, com Painel e Sair) — ao
  // contrário das rotas públicas fora deste grupo, nenhuma página daqui
  // depende de cache por `revalidate`, então chamar `cookies()` (dentro de
  // `criarClienteServidor`) não tem custo de tornar nada dinâmico que já
  // não fosse.
  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();

  return (
    <div className={`fc fc-pagina ${fontesFc}`}>
      <CabecalhoGrupoApp
        autenticado={Boolean(sessao.user)}
        equipe={Boolean(sessao.user) && ehEquipe(sessao.user?.email)}
      />

      <div className="fc-corpo">{children}</div>
    </div>
  );
}
