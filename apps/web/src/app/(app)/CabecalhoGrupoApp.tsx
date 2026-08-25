"use client";

import { usePathname } from "next/navigation";
import { CabecalhoPublico } from "@/ui";

/**
 * `CabecalhoPublico` para o layout do grupo `(app)` — a única diferença
 * para o resto do produto é esconder o link "Entrar" quando a rota atual já
 * é `/entrar`: mostrar ali seria um link para a própria página em que o
 * visitante está. `autenticado` continua vindo do servidor (`layout.tsx`
 * já chama `cookies()` para todo o grupo); só o pathname precisa do
 * navegador, daqui vem o `"use client"`.
 */
export function CabecalhoGrupoApp({ autenticado }: { autenticado: boolean }) {
  const pathname = usePathname();
  return <CabecalhoPublico autenticado={autenticado} ocultarEntrar={pathname === "/entrar"} />;
}
