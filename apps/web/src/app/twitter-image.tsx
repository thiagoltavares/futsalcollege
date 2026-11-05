import { ImageResponse } from "next/og";
import { CartaoCompartilhar, fontesDaArte } from "./_compartilhar/arte";

// Mesma arte do Open Graph (ver `opengraph-image.tsx`), para o cartão
// grande do X/Twitter.
export const alt = "Revela 10 — a base vai ser vista. Futsal e fut7 de base, em vídeo.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagem() {
  return new ImageResponse(<CartaoCompartilhar />, { ...size, fonts: await fontesDaArte() });
}
