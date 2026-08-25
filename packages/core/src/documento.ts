export const TIPOS_DOCUMENTO_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

export type TipoDocumentoPermitido = (typeof TIPOS_DOCUMENTO_PERMITIDOS)[number];

/**
 * Agrupa variações de `type` que o navegador manda para o mesmo formato
 * real (ex.: Safari manda "image/heif" para HEIC em alguns casos; alguns
 * navegadores antigos mandam "image/jpg" em vez de "image/jpeg"), sem abrir
 * mão de comparar cada uma delas contra a assinatura real dos bytes.
 */
const FAMILIA_POR_TIPO_DECLARADO: Record<string, TipoDocumentoPermitido> = {
  "application/pdf": "application/pdf",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "image/heic": "image/heic",
  "image/heif": "image/heic",
};

const MARCAS_HEIC = ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"];

function bytesComecamCom(cabecalho: Uint8Array, assinatura: number[], deslocamento = 0): boolean {
  if (cabecalho.length < deslocamento + assinatura.length) return false;
  return assinatura.every((byte, i) => cabecalho[deslocamento + i] === byte);
}

/**
 * Identifica o tipo real de um arquivo pelos primeiros bytes (a
 * "assinatura"/"magic number"), sem olhar para nenhum `type` declarado.
 * `null` quando os bytes não batem com nenhum formato conhecido aqui.
 *
 * Exportada separada de `validarDocumento` porque a checagem por bytes é a
 * parte que de fato importa para a segurança (o `type` de um `FormData` é
 * informado pelo navegador a partir da extensão do arquivo e é trivialmente
 * falsificável — basta renomear um executável para `.pdf`).
 */
export function detectarTipoPelaAssinatura(cabecalho: Uint8Array): TipoDocumentoPermitido | null {
  if (bytesComecamCom(cabecalho, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (bytesComecamCom(cabecalho, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (bytesComecamCom(cabecalho, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    bytesComecamCom(cabecalho, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
    bytesComecamCom(cabecalho, [0x57, 0x45, 0x42, 0x50], 8) // "WEBP"
  ) {
    return "image/webp";
  }
  if (bytesComecamCom(cabecalho, [0x66, 0x74, 0x79, 0x70], 4)) {
    // Contêiner ISO base media (mesma família de .mp4/.mov): "ftyp" no
    // deslocamento 4, seguido da marca de 4 letras do formato específico.
    const marca = String.fromCharCode(
      cabecalho[8] ?? 0,
      cabecalho[9] ?? 0,
      cabecalho[10] ?? 0,
      cabecalho[11] ?? 0,
    );
    if (MARCAS_HEIC.includes(marca)) return "image/heic";
  }
  return null;
}

export type ResultadoValidacaoDocumento =
  | { valido: true; tipo: TipoDocumentoPermitido }
  | { valido: false; motivo: string };

const MOTIVO_TIPO_NAO_PERMITIDO = "Envie o documento como imagem (JPEG, PNG, WebP ou HEIC) ou PDF.";
const MOTIVO_CONTEUDO_NAO_CONFERE =
  "O conteúdo do arquivo não corresponde a uma imagem ou PDF válido. Verifique se o arquivo não foi renomeado ou está corrompido.";

/**
 * Documento de identidade do responsável: prova jurídica de quem consentiu.
 * Exige que o `type` declarado pelo cliente E a assinatura dos bytes batam
 * com o MESMO formato permitido — um dos dois sozinho não basta. Só o
 * `type` é falsificável (o problema que esta função existe para resolver).
 * Só os bytes, sem exigir que o `type` declarado seja coerente, aceitaria
 * um arquivo com extensão/`type` enganosos mesmo quando os bytes batem por
 * acaso com outro formato permitido — exigir os dois alinhados é mais
 * estrito sem custar nada em uso legítimo.
 */
export function validarDocumento(
  tipoDeclarado: string,
  cabecalho: Uint8Array,
): ResultadoValidacaoDocumento {
  const tipoDeclaradoNormalizado = FAMILIA_POR_TIPO_DECLARADO[tipoDeclarado];
  if (!tipoDeclaradoNormalizado) {
    return { valido: false, motivo: MOTIVO_TIPO_NAO_PERMITIDO };
  }

  const tipoReal = detectarTipoPelaAssinatura(cabecalho);
  if (!tipoReal || tipoReal !== tipoDeclaradoNormalizado) {
    return { valido: false, motivo: MOTIVO_CONTEUDO_NAO_CONFERE };
  }

  return { valido: true, tipo: tipoReal };
}
