import { describe, expect, it } from "vitest";
import { detectarTipoPelaAssinatura, validarDocumento } from "./documento";

/**
 * O documento de identidade do responsável é prova jurídica do
 * consentimento — a review pediu para não confiar só no `type` declarado
 * pelo navegador (falsificável) e checar também a assinatura dos primeiros
 * bytes. Estes testes cobrem os dois lados da checagem, não uma amostra:
 * cada formato permitido tem que ser reconhecido pelos bytes, e um `type`
 * declarado que não bate com o conteúdo real (o ataque central do achado —
 * extensão/`type` de PDF, bytes de executável) tem que ser recusado.
 */

function bytes(...valores: number[]): Uint8Array {
  return new Uint8Array(valores);
}

function ascii(texto: string): number[] {
  return Array.from(texto).map((c) => c.charCodeAt(0));
}

const CABECALHOS = {
  pdf: bytes(...ascii("%PDF-1.7"), 0x0a, 0x00, 0x00, 0x00),
  jpeg: bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46),
  png: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d),
  webp: bytes(...ascii("RIFF"), 0x24, 0x00, 0x00, 0x00, ...ascii("WEBP"), ...ascii("VP8 ")),
  heic: bytes(0x00, 0x00, 0x00, 0x18, ...ascii("ftyp"), ...ascii("heic"), 0x00, 0x00, 0x00, 0x00),
  heifMif1: bytes(0x00, 0x00, 0x00, 0x18, ...ascii("ftyp"), ...ascii("mif1"), 0x00, 0x00, 0x00, 0x00),
  // "MZ" — cabeçalho de um executável PE do Windows (o ataque do achado:
  // renomear para .pdf e declarar type application/pdf).
  executavelRenomeado: bytes(0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00),
  // ELF do Linux, outro executável comum.
  elf: bytes(0x7f, ...ascii("ELF"), 0x02, 0x01, 0x01, 0x00),
  vazio: bytes(),
  textoQualquer: bytes(...ascii("oi, tudo bem?")),
} as const;

describe("detectarTipoPelaAssinatura — reconhece cada formato permitido pelos bytes", () => {
  it("PDF: '%PDF-'", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.pdf)).toBe("application/pdf");
  });

  it("JPEG: FF D8 FF", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.jpeg)).toBe("image/jpeg");
  });

  it("PNG: 89 50 4E 47 0D 0A 1A 0A", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.png)).toBe("image/png");
  });

  it("WebP: RIFF....WEBP", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.webp)).toBe("image/webp");
  });

  it("HEIC: ftyp + marca 'heic'", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.heic)).toBe("image/heic");
  });

  it("HEIF/HEIC: ftyp + marca 'mif1' também conta como heic", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.heifMif1)).toBe("image/heic");
  });
});

describe("detectarTipoPelaAssinatura — recusa o que não é nenhum formato permitido", () => {
  it("executável Windows (MZ) não é reconhecido como nenhum formato", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.executavelRenomeado)).toBeNull();
  });

  it("executável ELF não é reconhecido como nenhum formato", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.elf)).toBeNull();
  });

  it("texto qualquer não é reconhecido como nenhum formato", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.textoQualquer)).toBeNull();
  });

  it("cabeçalho vazio não é reconhecido como nenhum formato", () => {
    expect(detectarTipoPelaAssinatura(CABECALHOS.vazio)).toBeNull();
  });

  it("RIFF sem WEBP (outro contêiner RIFF, ex. WAV) não é webp", () => {
    const riffWav = bytes(...ascii("RIFF"), 0x24, 0x00, 0x00, 0x00, ...ascii("WAVE"));
    expect(detectarTipoPelaAssinatura(riffWav)).toBeNull();
  });

  it("ftyp com marca desconhecida não é heic", () => {
    const ftypDesconhecido = bytes(0x00, 0x00, 0x00, 0x18, ...ascii("ftyp"), ...ascii("xxxx"));
    expect(detectarTipoPelaAssinatura(ftypDesconhecido)).toBeNull();
  });
});

describe("validarDocumento — o ataque central do achado: type declarado mentindo sobre o conteúdo", () => {
  it("type 'application/pdf' com bytes de executável (MZ) é recusado", () => {
    const r = validarDocumento("application/pdf", CABECALHOS.executavelRenomeado);
    expect(r.valido).toBe(false);
  });

  it("type 'image/png' com bytes de executável (MZ) é recusado", () => {
    const r = validarDocumento("image/png", CABECALHOS.executavelRenomeado);
    expect(r.valido).toBe(false);
  });

  it("type 'application/pdf' com bytes de JPEG de verdade é recusado (type não bate com o conteúdo real)", () => {
    const r = validarDocumento("application/pdf", CABECALHOS.jpeg);
    expect(r.valido).toBe(false);
  });
});

describe("validarDocumento — aceita quando type declarado e bytes concordam, para cada formato permitido", () => {
  it.each([
    ["application/pdf", CABECALHOS.pdf, "application/pdf"],
    ["image/jpeg", CABECALHOS.jpeg, "image/jpeg"],
    ["image/png", CABECALHOS.png, "image/png"],
    ["image/webp", CABECALHOS.webp, "image/webp"],
    ["image/heic", CABECALHOS.heic, "image/heic"],
  ] as const)("%s", (tipoDeclarado, cabecalho, tipoEsperado) => {
    const r = validarDocumento(tipoDeclarado, cabecalho);
    expect(r.valido).toBe(true);
    if (r.valido) expect(r.tipo).toBe(tipoEsperado);
  });
});

describe("validarDocumento — recusa type declarado fora da lista permitida, mesmo com bytes válidos de outro formato", () => {
  it.each([
    "application/x-msdownload",
    "text/plain",
    "application/zip",
    "video/mp4",
    "",
  ])("type '%s' é recusado", (tipoDeclarado) => {
    const r = validarDocumento(tipoDeclarado, CABECALHOS.pdf);
    expect(r.valido).toBe(false);
  });
});

describe("validarDocumento — variações conhecidas de type do navegador para o mesmo formato real", () => {
  it("'image/jpg' (não padrão, mas usado por navegadores antigos) é tratado como jpeg", () => {
    const r = validarDocumento("image/jpg", CABECALHOS.jpeg);
    expect(r.valido).toBe(true);
  });

  it("'image/heif' com bytes heic é aceito (mesma família)", () => {
    const r = validarDocumento("image/heif", CABECALHOS.heic);
    expect(r.valido).toBe(true);
  });
});
