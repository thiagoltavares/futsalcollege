import type { ReactNode } from "react";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";
import "@/ui/estilos.css";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CabecalhoGrupoApp } from "./CabecalhoGrupoApp";

// Fontes carregadas só neste grupo de rotas (entrar, painel, cadastro,
// consentimento) — mesmo padrão de /profissional/[slug] e /plan, que também
// carregam suas próprias fontes por rota em vez de mexer no layout raiz.
const display = Big_Shoulders({
  variable: "--font-fc-display",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-fc-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const corpo = Barlow({
  variable: "--font-fc-corpo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoGrupoApp autenticado={Boolean(sessao.user)} />

      <div className="fc-corpo">{children}</div>
    </div>
  );
}
