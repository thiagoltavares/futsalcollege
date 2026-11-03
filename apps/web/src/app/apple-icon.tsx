import { ImageResponse } from "next/og";
import { Icone, fontesDaArte } from "./_compartilhar/arte";

// Ícone de app (tela inicial do iPhone e preview de link em alguns apps):
// o selo amarelo do "10" sobre a quadra.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function IconeApple() {
  return new ImageResponse(<Icone tamanho={180} />, { ...size, fonts: await fontesDaArte() });
}
