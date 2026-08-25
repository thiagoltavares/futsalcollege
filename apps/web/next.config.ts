import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O termo de consentimento aceita documento de identidade até 8 MB
      // (checado em acoes.ts). O padrão do Next para o corpo de uma Server
      // Action é 1 MB — sem este ajuste, qualquer upload acima de 1 MB
      // nunca chega ao nosso `documento.size > 8 * 1024 * 1024`: o
      // framework já rejeita a requisição antes, com um erro 413 cru, em
      // vez da mensagem "O arquivo precisa ter menos de 8 MB.". A folga
      // generosa acima de 8 MB garante que é sempre a nossa mensagem que
      // aparece para um arquivo grande demais — nunca o 413 cru do
      // framework — mesmo com o overhead do multipart/form-data
      // (boundaries, cabeçalhos de campo) somado ao arquivo em si.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
