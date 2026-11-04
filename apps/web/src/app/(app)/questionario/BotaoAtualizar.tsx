"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Botao } from "@/ui";

/**
 * Busca as respostas de novo sem recarregar a página: `router.refresh()`
 * refaz a renderização do servidor e mantém filtro e rolagem.
 */
export function BotaoAtualizar() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  return (
    <Botao
      type="button"
      variante="secundario"
      carregando={pendente}
      onClick={() => iniciar(() => router.refresh())}
    >
      Atualizar
    </Botao>
  );
}
