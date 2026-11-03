import Link from "next/link";
import { fontesFc } from "@/ui/fontes";
import { Palco } from "./Palco";
import "./pre-lancamento.css";

/**
 * A home enquanto o Revela 10 não abre: uma tela só, com o hero e a
 * pesquisa em passos (ver `Palco.tsx`). Nenhuma consulta ao banco para
 * montar a página — nada de atleta, nem fictício, aparece aqui; o banco só
 * entra no envio da pesquisa.
 *
 * O momento visual é o hero: a marcação amarela da quadra se desenha sobre
 * o azul e o "10" da camisa é pintado em traço por cima. O segundo
 * movimento é a resposta ao clique: o hero vai para a esquerda e a
 * pesquisa entra. Os dois somem com `prefers-reduced-motion`.
 */
export function PreLancamento({ origem }: { origem: string | null }) {
  return (
    <div className={`fc fc-pre ${fontesFc}`}>
      <header className="fc-pre-topo">
        <div className="fc-container fc-pre-topo__conteudo">
          <span className="fc-marca">
            <span className="fc-marca-nome">
              Revela <em>10</em>
            </span>
          </span>
          <Link href="/entrar" className="fc-pre-topo__entrar">
            Entrar
          </Link>
        </div>
      </header>

      <main>
        <Palco origem={origem} />
      </main>
    </div>
  );
}
