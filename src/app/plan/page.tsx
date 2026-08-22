import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "./plan.css";

const display = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const body = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pre-PRD — Banco de talentos",
  description:
    "A ideia destrinchada até o ponto em que dá pra discordar dela com precisão. Rascunho para leitura e anotação.",
  robots: { index: false, follow: false },
};

/** Acentos fora, espaços viram hífen — para os âncoras do sumário. */
function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Texto puro de um nó do React, para gerar o id do heading. */
function texto(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(texto).join("");
  if (node && typeof node === "object" && "props" in node) {
    return texto((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

export default async function PlanPage() {
  const arquivo = path.join(process.cwd(), "docs", "pre-prd.md");
  const bruto = await readFile(arquivo, "utf8");

  // O cabeçalho do .md é renderizado à mão abaixo; o resto vem do arquivo.
  const corpo = bruto.slice(bruto.indexOf("\n---\n") + 5);

  const secoes = [...bruto.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

  return (
    <main className={`plan ${display.variable} ${serif.variable} ${body.variable}`}>
      <div className="px-[var(--shell)] py-[clamp(3rem,7vw,6rem)]">
        <header className="border-b border-[var(--court-strong)] pb-10">
          <p className="plan-label text-[var(--gol)]">
            Rascunho · não é especificação final
          </p>
          <h1 className="plan-display mt-6 text-[clamp(2.75rem,9vw,7rem)]">
            Pre-PRD
            <br />
            <span className="text-[var(--bone-25)]">Banco de talentos</span>
          </h1>
          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
            {[
              ["Para", "Flávio Barbosa"],
              ["De", "Thiago"],
              ["Data", "22 de agosto de 2026"],
            ].map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt className="plan-label text-[var(--bone-45)]">{rotulo}</dt>
                <dd className="mt-1.5">{valor}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <nav
            aria-label="Sumário"
            className="lg:col-span-3 lg:order-2 lg:sticky lg:top-10 lg:self-start"
          >
            <p className="plan-label mb-5 text-[var(--gol)]">Sumário</p>
            <div className="plan-toc">
              {secoes.map((s) => (
                <a key={s} href={`#${slug(s)}`}>
                  {s}
                </a>
              ))}
            </div>
          </nav>

          <article className="plan-doc lg:col-span-8 lg:order-1">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 id={slug(texto(children))}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 id={slug(texto(children))}>{children}</h3>
                ),
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
