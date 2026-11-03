import { ImageResponse } from "next/og";
import { CartaoCompartilhar, fontesDaArte } from "./_compartilhar/arte";

// A imagem que aparece no WhatsApp, iMessage e redes quando alguém manda o
// link. Sem ela, o preview caía no ícone padrão do Next (o triângulo).
export const alt = "Revela 10 — a base vai entrar em quadra. Futsal e fut7 de base, em vídeo.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagem() {
  return new ImageResponse(<CartaoCompartilhar />, { ...size, fonts: await fontesDaArte() });
}
