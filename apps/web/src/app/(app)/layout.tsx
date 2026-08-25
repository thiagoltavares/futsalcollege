import type { ReactNode } from "react";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";
import "@/ui/estilos.css";

// Fontes carregadas só neste grupo de rotas (entrar, painel, cadastro,
// consentimento) — mesmo padrão de /profissional/flavio e /plan, que também
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

export default function LayoutApp({ children }: { children: ReactNode }) {
  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <header className="fc-cabecalho">
        <div className="fc-cabecalho-conteudo">
          <span className="fc-marca">
            <span className="fc-marca-nome">
              Futsal <em>College</em>
            </span>
          </span>
        </div>
      </header>

      <div className="fc-corpo">{children}</div>
    </div>
  );
}
