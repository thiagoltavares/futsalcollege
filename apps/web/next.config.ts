import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O termo de consentimento aceita documento de identidade até 8 MB, e
      // o envio de mídia do atleta (painel/[id]/midias/acoes.ts) aceita
      // vídeo até 40 MB — o padrão do Next para o corpo de uma Server
      // Action é 1 MB — sem este ajuste, qualquer upload acima disso nunca
      // chega às nossas checagens de tamanho: o framework já rejeita a
      // requisição antes, com um erro 413 cru, em vez da mensagem
      // específica de cada action. A folga acima do maior limite (40 MB de
      // vídeo) garante que é sempre a nossa mensagem que aparece para um
      // arquivo grande demais — nunca o 413 cru do framework — mesmo com o
      // overhead do multipart/form-data (boundaries, cabeçalhos de campo)
      // somado ao arquivo em si.
      bodySizeLimit: "48mb",
    },
  },
};

export default nextConfig;
