import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * A arte que aparece quando alguém compartilha o link (WhatsApp, iMessage,
 * redes) e o ícone de app. Gerada por `ImageResponse` (`next/og`) nos
 * arquivos `opengraph-image.tsx`, `twitter-image.tsx` e `apple-icon.tsx`
 * da raiz de `app/`.
 *
 * As fontes vêm em TTF de `assets/fontes/`: o motor de imagem (Satori) não
 * lê woff2, que é o formato do site. São as mesmas famílias da marca —
 * Saira Extra Condensed para o display, Atkinson Hyperlegible Next para o
 * texto.
 */

export const COR = {
  quadra: "#10355f",
  amarelo: "#ffd23f",
  giz: "#ffffff",
  giz2: "rgba(255,255,255,0.8)",
  risco: "rgba(255,210,63,0.34)",
} as const;

export async function fontesDaArte() {
  const ler = (arquivo: string) => readFile(join(process.cwd(), "assets/fontes", arquivo));
  const [display, corpo, corpoForte] = await Promise.all([
    ler("saira-extra-condensed-800.ttf"),
    ler("atkinson-hyperlegible-next-400.ttf"),
    ler("atkinson-hyperlegible-next-700.ttf"),
  ]);
  return [
    { name: "Saira", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Atkinson", data: corpo, weight: 400 as const, style: "normal" as const },
    { name: "Atkinson", data: corpoForte, weight: 700 as const, style: "normal" as const },
  ];
}

/**
 * A marcação da quadra (mesma geometria de `ui/Quadra.tsx`, 40 × 20 m a 30
 * px por metro) como SVG em data URI, porque o motor de imagem desenha SVG
 * de `<img>` mas não componente React com `<svg>` filho de várias formas.
 */
export function quadraDataUri(cor: string = COR.risco) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><g fill="none" stroke="${cor}" stroke-width="4" stroke-linecap="round"><rect x="0" y="0" width="1200" height="600" stroke-width="6"/><line x1="600" y1="0" x2="600" y2="600"/><circle cx="600" cy="300" r="90"/><path d="M0 75 A180 180 0 0 1 180 255 L180 345 A180 180 0 0 1 0 525"/><path d="M1200 75 A180 180 0 0 0 1020 255 L1020 345 A180 180 0 0 0 1200 525"/><path d="M0 24 A24 24 0 0 0 24 0"/><path d="M1176 0 A24 24 0 0 0 1200 24"/><path d="M0 576 A24 24 0 0 1 24 600"/><path d="M1176 600 A24 24 0 0 1 1200 576"/></g><g fill="${cor}"><circle cx="600" cy="300" r="5"/><circle cx="180" cy="300" r="5"/><circle cx="1020" cy="300" r="5"/></g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** A marca, "REVELA" com o selo amarelo do "10". */
export function Marca({ tamanho }: { tamanho: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: tamanho * 0.28 }}>
      <span
        style={{
          fontFamily: "Saira",
          fontWeight: 800,
          fontSize: tamanho,
          letterSpacing: tamanho * 0.03,
          color: COR.giz,
          lineHeight: 1,
        }}
      >
        REVELA
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${tamanho * 0.08}px ${tamanho * 0.22}px ${tamanho * 0.02}px`,
          borderRadius: tamanho * 0.1,
          background: COR.amarelo,
          color: COR.quadra,
          fontFamily: "Saira",
          fontWeight: 800,
          fontSize: tamanho,
          lineHeight: 1,
        }}
      >
        10
      </span>
    </div>
  );
}

/**
 * O cartão de compartilhamento: o hero da home em 1200 × 630. Quadra ao
 * fundo, o "10" da camisa em traço amarelo cortado na direita, a marca, o
 * título e uma linha de contexto. Linha amarela embaixo, como no site.
 */
export function CartaoCompartilhar() {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        background: COR.quadra,
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse só entende <img>. */}
      <img
        src={quadraDataUri()}
        width={1680}
        height={840}
        style={{ position: "absolute", left: -140, top: -105 }}
        alt=""
      />

      <span
        style={{
          position: "absolute",
          right: -70,
          top: -40,
          fontFamily: "Saira",
          fontWeight: 800,
          fontSize: 760,
          lineHeight: 1,
          // Cor do fundo, não "transparent": o motor de imagem descarta
          // texto transparente. O efeito é o mesmo do hero, traço amarelo,
          // e o miolo ainda esconde as linhas da quadra.
          color: COR.quadra,
          WebkitTextStroke: `8px ${COR.amarelo}`,
        }}
      >
        10
      </span>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 72px",
          width: "100%",
          height: "100%",
        }}
      >
        <Marca tamanho={46} />

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Saira",
              fontWeight: 800,
              fontSize: 118,
              lineHeight: 0.88,
              color: COR.giz,
            }}
          >
            <span>A BASE VAI</span>
            <span>ENTRAR EM</span>
            <span>QUADRA.</span>
          </div>
          <span
            style={{
              fontFamily: "Atkinson",
              fontWeight: 400,
              fontSize: 32,
              lineHeight: 1.35,
              color: COR.giz2,
              maxWidth: 620,
            }}
          >
            Futsal e fut7 de base, em vídeo. Em breve, para todo o Brasil.
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 10,
          background: COR.amarelo,
        }}
      />
    </div>
  );
}

/** O ícone de app: o selo amarelo do "10" sobre a quadra. */
export function Icone({ tamanho }: { tamanho: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: COR.quadra,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: tamanho * 0.62,
          height: tamanho * 0.5,
          paddingTop: tamanho * 0.03,
          borderRadius: tamanho * 0.07,
          background: COR.amarelo,
          color: COR.quadra,
          fontFamily: "Saira",
          fontWeight: 800,
          fontSize: tamanho * 0.46,
          lineHeight: 1,
        }}
      >
        10
      </div>
    </div>
  );
}
