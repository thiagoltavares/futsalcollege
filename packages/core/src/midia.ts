import { z } from "zod";

/**
 * Validação de mídia do atleta (foto/vídeo) pela assinatura real dos bytes —
 * mesmo raciocínio e mesmo padrão de `documento.ts`: o `type` de um
 * `FormData` é informado pelo navegador a partir da extensão do arquivo e é
 * falsificável, então a checagem que importa é a dos primeiros bytes, nunca
 * só o `type` declarado.
 */

// Fonte única dos limites de tamanho de mídia — servidor (`enviarMidia`,
// que valida de verdade) e cliente (`lib/midia-cliente.ts`, que comprime
// e avisa antes do upload) importam daqui, em vez de cada um repetir o
// mesmo número em arquivos diferentes.
export const TAMANHO_MAX_FOTO_BYTES = 8 * 1024 * 1024; // 8 MB
export const TAMANHO_MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB

export const TIPOS_FOTO_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const TIPOS_VIDEO_PERMITIDOS = ["video/mp4", "video/quicktime", "video/webm"] as const;

export type TipoFotoPermitido = (typeof TIPOS_FOTO_PERMITIDOS)[number];
export type TipoVideoPermitido = (typeof TIPOS_VIDEO_PERMITIDOS)[number];
export type TipoMidiaPermitido = TipoFotoPermitido | TipoVideoPermitido;

const FAMILIA_POR_TIPO_DECLARADO: Record<string, TipoMidiaPermitido> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "image/heic": "image/heic",
  "image/heif": "image/heic",
  "video/mp4": "video/mp4",
  "video/quicktime": "video/quicktime",
  "video/webm": "video/webm",
};

const MARCAS_HEIC = ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"];
const MARCAS_MOV = ["qt  "];

function bytesComecamCom(cabecalho: Uint8Array, assinatura: number[], deslocamento = 0): boolean {
  if (cabecalho.length < deslocamento + assinatura.length) return false;
  return assinatura.every((byte, i) => cabecalho[deslocamento + i] === byte);
}

/**
 * Identifica o tipo real de foto/vídeo pelos primeiros bytes, sem olhar
 * para nenhum `type` declarado. `null` quando os bytes não batem com nenhum
 * formato conhecido aqui.
 */
export function detectarTipoMidiaPelaAssinatura(cabecalho: Uint8Array): TipoMidiaPermitido | null {
  if (bytesComecamCom(cabecalho, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (bytesComecamCom(cabecalho, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    bytesComecamCom(cabecalho, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
    bytesComecamCom(cabecalho, [0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
  ) {
    return "image/webp";
  }

  if (bytesComecamCom(cabecalho, [0x66, 0x74, 0x79, 0x70], 4)) {
    // Contêiner ISO base media: "ftyp" no deslocamento 4, seguido da marca
    // de 4 letras do formato específico. HEIC, MOV e MP4 compartilham este
    // mesmo contêiner — só a marca distingue.
    const marca = String.fromCharCode(
      cabecalho[8] ?? 0,
      cabecalho[9] ?? 0,
      cabecalho[10] ?? 0,
      cabecalho[11] ?? 0,
    );
    if (MARCAS_HEIC.includes(marca)) return "image/heic";
    if (MARCAS_MOV.includes(marca)) return "video/quicktime";
    return "video/mp4";
  }

  // EBML (Matroska/WebM): 1A 45 DF A3.
  if (bytesComecamCom(cabecalho, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";

  return null;
}

export type ResultadoValidacaoMidia =
  | { valido: true; tipo: TipoMidiaPermitido; categoria: "foto" | "video" }
  | { valido: false; motivo: string };

const MOTIVO_TIPO_NAO_PERMITIDO =
  "Envie uma foto (JPEG, PNG, WebP ou HEIC) ou um vídeo (MP4, MOV ou WebM).";
const MOTIVO_CONTEUDO_NAO_CONFERE =
  "O conteúdo do arquivo não corresponde ao formato esperado. Verifique se ele não foi renomeado ou está corrompido.";

/**
 * Exige que o `type` declarado pelo cliente E a assinatura dos bytes batam
 * com o MESMO formato permitido — mesmo raciocínio de `validarDocumento`
 * em `documento.ts`.
 */
export function validarMidia(
  tipoDeclarado: string,
  cabecalho: Uint8Array,
): ResultadoValidacaoMidia {
  const tipoDeclaradoNormalizado = FAMILIA_POR_TIPO_DECLARADO[tipoDeclarado];
  if (!tipoDeclaradoNormalizado) {
    return { valido: false, motivo: MOTIVO_TIPO_NAO_PERMITIDO };
  }

  const tipoReal = detectarTipoMidiaPelaAssinatura(cabecalho);
  if (!tipoReal || tipoReal !== tipoDeclaradoNormalizado) {
    return { valido: false, motivo: MOTIVO_CONTEUDO_NAO_CONFERE };
  }

  const categoria: "foto" | "video" = (TIPOS_FOTO_PERMITIDOS as readonly string[]).includes(tipoReal)
    ? "foto"
    : "video";

  return { valido: true, tipo: tipoReal, categoria };
}

/**
 * Legenda de mídia: texto livre do responsável, só limitado por tamanho —
 * o rótulo do campo no formulário (não este esquema) é quem avisa para não
 * escrever escola, local/horário de treino ou telefone ali. Ver
 * `EnvioMidia`/`GaleriaMidia` no app e o comentário no topo da migration
 * 0011.
 */
export const esquemaLegendaMidia = z
  .string()
  .max(280, "A legenda pode ter no máximo 280 caracteres.")
  .optional();
