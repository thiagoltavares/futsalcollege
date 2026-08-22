import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { Barlow, Big_Shoulders, Source_Serif_4 } from "next/font/google";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import Scrollspy from "./Scrollspy";
import "./plan.css";

const display = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/* Serifada de texto: são quase nove mil palavras para ler de cabo a rabo. */
const texto = Source_Serif_4({
  variable: "--font-texto",
  subsets: ["latin"],
  display: "swap",
});

const ui = Barlow({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pre-PRD — Plataforma de reconhecimento",
  description:
    "A ideia destrinchada até o ponto em que dá pra discordar dela com precisão. Rascunho para leitura e anotação.",
  robots: { index: false, follow: false },
};

/** Acentos fora, espaços viram hífen — para as âncoras do sumário. */
function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Texto puro de um nó do React, para gerar o id do heading. */
function puro(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(puro).join("");
  if (node && typeof node === "object" && "props" in node) {
    return puro((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

function Sumario({ secoes }: { secoes: string[] }) {
  return (
    <div className="plan-toc">
      {secoes.map((s) => (
        <a key={s} href={`#${slug(s)}`}>
          <span>{s}</span>
        </a>
      ))}
    </div>
  );
}

export default async function PlanPage() {
  const arquivo = path.join(process.cwd(), "docs", "pre-prd.md");
  const bruto = await readFile(arquivo, "utf8");

  // O cabeçalho do .md é renderizado à mão abaixo; o resto vem do arquivo.
  const corpo = bruto.slice(bruto.indexOf("\n---\n") + 5);
  const secoes = [...bruto.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

  return (
    <main className={`plan ${display.variable} ${texto.variable} ${ui.variable}`}>
      <div className="plan-textura" aria-hidden="true" />
      <Scrollspy />

      <div className="plan-conteudo px-[var(--margem)] py-[clamp(2.5rem,6vw,5rem)]">
        {/*
          Três colunas nas telas largas: margem esquerda com o sumário,
          coluna de leitura no centro, margem direita vazia. É isso que
          centra opticamente o texto em vez de encostá-lo à esquerda.
        */}
        <div className="mx-auto grid w-full max-w-[110rem] gap-x-12 xl:grid-cols-[1fr_minmax(0,var(--medida))_1fr]">
          <header className="min-w-0 xl:col-start-2">
            <p className="plan-label text-[var(--gol)]">
              Rascunho · não é especificação final
            </p>
            <h1 className="plan-display mt-5 text-[clamp(1.75rem,8vw,4.75rem)]">
              Pre-PRD
              <br />
              <span className="text-[var(--tinta-40)]">Reconhecimento da base</span>
            </h1>
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--regua)] pt-6 font-[family-name:var(--font-ui)]">
              {[
                ["Para", "Flávio Barbosa"],
                ["De", "Thiago"],
                ["Data", "22 de agosto de 2026"],
              ].map(([rotulo, valor]) => (
                <div key={rotulo}>
                  <dt className="plan-label text-[var(--tinta-40)]">{rotulo}</dt>
                  <dd className="mt-1 text-[0.9375rem]">{valor}</dd>
                </div>
              ))}
            </dl>

            {/* Nas larguras em que não há margem sobrando, o sumário recolhe. */}
            <details className="plan-sumario-movel mt-10 xl:hidden">
              <summary>Sumário — {secoes.length} seções</summary>
              <Sumario secoes={secoes} />
            </details>
          </header>

          {/* Margem esquerda: sumário fixo, alinhado à direita, junto ao texto. */}
          <nav
            aria-label="Sumário"
            className="plan-margem hidden xl:col-start-1 xl:row-start-2 xl:block"
          >
            <div className="sticky top-10 ml-auto max-w-[15rem] pt-[4.5rem]">
              <p className="plan-label mb-4 text-[var(--gol)]">Sumário</p>
              <Sumario secoes={secoes} />
            </div>
          </nav>

          <article className="plan-doc xl:col-start-2 xl:row-start-2">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => <h2 id={slug(puro(children))}>{children}</h2>,
                h3: ({ children }) => <h3 id={slug(puro(children))}>{children}</h3>,
                table: ({ children }) => (
                  <div className="plan-tabela">
                    <table>{children}</table>
                  </div>
                ),
              }}
            >
              {corpo}
            </Markdown>
          </article>
        </div>
      </div>
    </main>
  );
}
