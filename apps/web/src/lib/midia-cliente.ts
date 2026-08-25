import {
  TAMANHO_MAX_FOTO_BYTES,
  TAMANHO_MAX_VIDEO_BYTES,
  TIPOS_FOTO_PERMITIDOS,
  TIPOS_VIDEO_PERMITIDOS,
} from "@futsalcollege/core";

/**
 * Compressão/redimensionamento de foto e extração de quadro de capa de
 * vídeo, direto no navegador, antes do upload — ver AGENTS/brief da rodada
 * ("Upload de vídeo sem compressão"). Roda só no cliente (usa `Image`,
 * `<canvas>`, `<video>`); nunca é chamado de um Server Component ou Server
 * Action.
 *
 * Qualquer falha aqui devolve o arquivo original em vez de derrubar o
 * envio: compressão é uma otimização, não uma trava — se o navegador não
 * souber decodificar o formato (ex.: HEIC fora do Safari), a Server Action
 * (`enviarMidia`) continua validando e aceitando o arquivo original do
 * jeito que já fazia antes desta rodada.
 */

const LADO_MAX_FOTO = 2000; // px — maior lado, depois de redimensionar
const QUALIDADE_JPEG = 0.85;

// Reexportados com nome mais curto — mesma constante de `@futsalcollege/core`
// que a Server Action (`enviarMidia`) usa para validar de verdade; aqui só
// avisamos cedo, antes do upload.
export const TAMANHO_MAX_FOTO = TAMANHO_MAX_FOTO_BYTES;
export const TAMANHO_MAX_VIDEO = TAMANHO_MAX_VIDEO_BYTES;

export function ehTipoFoto(tipo: string): boolean {
  return (TIPOS_FOTO_PERMITIDOS as readonly string[]).includes(tipo);
}

export function ehTipoVideo(tipo: string): boolean {
  return (TIPOS_VIDEO_PERMITIDOS as readonly string[]).includes(tipo);
}

function trocarExtensao(nome: string, novaExtensao: string): string {
  const semExtensao = nome.replace(/\.[^./\\]+$/, "");
  return `${semExtensao || "arquivo"}.${novaExtensao}`;
}

/**
 * Redimensiona (maior lado até `LADO_MAX_FOTO`) e recomprime uma foto para
 * JPEG de qualidade ~85% — o caso comum de "pai fotografou com o celular"
 * (4000px+, vários MB) cai bem abaixo do limite de 8 MB sem perda visível
 * na tela. Se o resultado comprimido não ficar menor que o original (foto
 * já pequena, ou algum navegador que recomprime mal), devolve o original —
 * comprimir nunca deve deixar o arquivo maior.
 */
export async function comprimirImagem(arquivo: File): Promise<File> {
  try {
    // `imageOrientation: "from-image"` aplica a rotação do EXIF na hora de
    // decodificar — sem isto, foto tirada com celular na vertical sairia
    // deitada depois de passar pelo canvas (o canvas não lê EXIF sozinho).
    const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });

    const maiorLado = Math.max(bitmap.width, bitmap.height);
    const escala = maiorLado > LADO_MAX_FOTO ? LADO_MAX_FOTO / maiorLado : 1;
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const contexto = canvas.getContext("2d");
    if (!contexto) return arquivo;

    contexto.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolver) =>
      canvas.toBlob(resolver, "image/jpeg", QUALIDADE_JPEG),
    );
    if (!blob || blob.size >= arquivo.size) return arquivo;

    return new File([blob], trocarExtensao(arquivo.name, "jpg"), { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}

/**
 * Carrega um vídeo fora da tela, pula para um instante logo no começo (não
 * o quadro 0 cru — muitos vídeos abrem em preto ou com um frame de
 * transição) e captura esse quadro como JPEG. Vira a foto de capa
 * automática quando o responsável envia um vídeo antes de qualquer foto
 * (ver `enviarMidia`/`FormularioEnvioMidia`) — sem isto, o perfil ficava
 * sem avatar até alguém lembrar de subir uma foto à parte.
 *
 * Devolve `null` (nunca lança) quando o navegador não consegue decodificar
 * o vídeo — a Server Action segue o envio normalmente, só sem o quadro de
 * capa extra.
 */
export async function extrairQuadroDeVideo(arquivo: File): Promise<File | null> {
  const url = URL.createObjectURL(arquivo);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;

    await new Promise<void>((resolver, rejeitar) => {
      const tempo = setTimeout(() => rejeitar(new Error("tempo esgotado")), 8000);
      video.addEventListener(
        "loadedmetadata",
        () => {
          clearTimeout(tempo);
          resolver();
        },
        { once: true },
      );
      video.addEventListener(
        "error",
        () => {
          clearTimeout(tempo);
          rejeitar(new Error("erro ao carregar vídeo"));
        },
        { once: true },
      );
    });

    const instante = Math.min(0.3, (video.duration || 0) / 2);
    await new Promise<void>((resolver, rejeitar) => {
      const tempo = setTimeout(() => rejeitar(new Error("tempo esgotado")), 8000);
      video.addEventListener(
        "seeked",
        () => {
          clearTimeout(tempo);
          resolver();
        },
        { once: true },
      );
      video.currentTime = instante;
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const contexto = canvas.getContext("2d");
    if (!contexto || canvas.width === 0 || canvas.height === 0) return null;

    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((resolver) =>
      canvas.toBlob(resolver, "image/jpeg", QUALIDADE_JPEG),
    );
    if (!blob) return null;

    return new File([blob], trocarExtensao(arquivo.name, "capa.jpg"), { type: "image/jpeg" });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
