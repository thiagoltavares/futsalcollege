import type { Metadata } from "next";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import Reveal from "./Reveal";
import "./flavio.css";
import {
  citacoes,
  emQuadra,
  hoje,
  linhaDoTempo,
  marquee,
  naBeira,
  numeros,
  perfil,
} from "./data";

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
  title: "Flávio Barbosa — futsal cearense",
  description:
    "Vinte anos de futsal cearense. Campeão e artilheiro em quadra, hoje técnico das seleções de base do Futsal Sesc Ceará.",
  openGraph: {
    title: "Flávio Barbosa — futsal cearense",
    description:
      "De artilheiro do Horizonte a melhor técnico da Taça Liga Ceará. Vinte anos de quadra.",
    locale: "pt_BR",
    type: "profile",
  },
};

/* ---------------------------------------------------------------- */

function Quadra() {
  return (
    <svg
      className="flv-court"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g
        transform="rotate(-7 600 400)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <rect x="60" y="60" width="1080" height="680" />
        <line x1="600" y1="60" x2="600" y2="740" />
        <circle cx="600" cy="400" r="112" />
        <circle cx="600" cy="400" r="3.5" fill="currentColor" stroke="none" />
        <path d="M60 250 A 170 170 0 0 1 60 550" />
        <path d="M1140 250 A 170 170 0 0 0 1140 550" />
        <line x1="230" y1="392" x2="230" y2="408" />
        <line x1="970" y1="392" x2="970" y2="408" />
      </g>
    </svg>
  );
}

function Rotulo({ n, texto }: { n: string; texto: string }) {
  return (
    <div className="flex items-baseline gap-3 text-[var(--gol)]">
      <span className="flv-mono-label">{n}</span>
      <span className="h-px w-8 bg-[var(--gol)]/50" />
      <span className="flv-mono-label text-[var(--bone-45)]">{texto}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export default function FlavioPage() {
  return (
    <main
      className={`flv ${display.variable} ${serif.variable} ${body.variable}`}
    >
      <div className="flv-grain" aria-hidden="true" />
      <Reveal />

      {/* ============================ HERO ============================ */}

      <header className="flv-hero flex min-h-svh flex-col justify-between px-[var(--shell)] pt-8 pb-6">
        <Quadra />
        <span className="flv-hero-ghost flv-display" aria-hidden="true">
          Quadra
        </span>

        <div className="relative z-10 flex items-center justify-between gap-6 border-b border-[var(--court)] pb-5">
          <span className="flv-mono-label text-[var(--bone-45)]">
            {perfil.local}
          </span>
          <span className="flv-mono-label text-[var(--bone-45)]">
            {perfil.periodo}
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-x-10 gap-y-12 py-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p
              className="flv-rise flv-mono-label mb-7 text-[var(--gol)]"
              style={{ "--d": "120ms" } as React.CSSProperties}
            >
              Ex-atleta · Técnico · Formador
            </p>

            <h1 className="flv-display text-[clamp(4.25rem,15vw,13rem)]">
              <span
                className="flv-rise block"
                style={{ "--d": "220ms" } as React.CSSProperties}
              >
                {perfil.primeiroNome}
              </span>
              <span
                className="flv-rise flv-outline-gol block"
                style={{ "--d": "330ms" } as React.CSSProperties}
              >
                {perfil.sobrenome}
              </span>
            </h1>

            <div
              className="flv-wipe mt-9 h-px w-full bg-[var(--court-strong)]"
              style={{ "--d": "620ms" } as React.CSSProperties}
            />

            <p
              className="flv-rise flv-serif mt-7 max-w-2xl text-[clamp(1.3rem,2.4vw,1.9rem)] leading-[1.35] text-[var(--bone-70)] italic"
              style={{ "--d": "700ms" } as React.CSSProperties}
            >
              {perfil.tagline}
            </p>
          </div>

          <div
            className="flv-rise lg:col-span-4 lg:pb-4"
            style={{ "--d": "820ms" } as React.CSSProperties}
          >
            <dl className="grid gap-6 border-l border-[var(--court)] pl-6">
              <div>
                <dt className="flv-mono-label text-[var(--bone-45)]">Hoje</dt>
                <dd className="mt-2 text-lg leading-snug">{perfil.cargo}</dd>
              </div>
              <div>
                <dt className="flv-mono-label text-[var(--bone-45)]">
                  Categorias
                </dt>
                <dd className="mt-2 text-lg leading-snug">
                  {perfil.categorias}
                </dd>
              </div>
              <div>
                <dt className="flv-mono-label text-[var(--bone-45)]">
                  Posição em quadra
                </dt>
                <dd className="mt-2 text-lg leading-snug">Fixo · Ala</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-6">
          <span className="flv-mono-label text-[var(--bone-25)]">
            Role para ver a linha do tempo
          </span>
          <svg
            className="flv-bounce h-6 w-6 text-[var(--gol)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M12 4v16m0 0-6-6m6 6 6-6" />
          </svg>
        </div>
      </header>

      {/* =========================== MARQUEE =========================== */}

      <div className="flv-marquee flv-display text-[clamp(1.5rem,3.4vw,2.75rem)]">
        {[0, 1].map((copia) => (
          <div key={copia} className="flv-marquee-track" aria-hidden={copia === 1}>
            {marquee.map((item) => (
              <span key={item} className="flex items-center gap-10">
                {item}
                <span className="text-[clamp(1rem,2vw,1.5rem)] opacity-60">
                  ✦
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* ============================ SOBRE ============================ */}

      <section className="px-[var(--shell)] py-[clamp(5rem,11vw,10rem)]">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-12">
              <Rotulo n="01" texto="Sobre" />
              <p className="flv-display mt-6 text-[clamp(2.5rem,4.5vw,4rem)] text-[var(--bone-25)]">
                Quem
                <br />
                é ele
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 lg:col-start-5">
            <div
              data-reveal
              className="flv-serif text-[clamp(1.5rem,2.9vw,2.4rem)] leading-[1.28]"
            >
              Flávio Barbosa construiu a carreira inteira dentro do futsal do
              Ceará — e nunca saiu da quadra, só mudou de lado da linha.
            </div>

            <div
              data-reveal
              style={{ "--d": "120ms" } as React.CSSProperties}
              className="mt-10 grid gap-7 text-[1.0625rem] leading-[1.72] text-[var(--bone-70)] sm:grid-cols-2"
            >
              <p>
                Começou cedo, jogando de fixo e de ala. Apareceu no cenário
                estadual em 2006, no elenco do Afagu/Russas que decidiu o
                Campeonato Cearense contra o Ceará. Em 2009 já era tratado pela
                imprensa esportiva local como um dos destaques do Sumov.
              </p>
              <p>
                O melhor momento como atleta veio pelo Horizonte, em 2010:
                terminou a campanha do Cearense como principal artilheiro do
                time, com 10 gols, e foi campeão estadual. Quase dez anos
                depois, em 2019, ainda estava em quadra — no elenco do Sport
                Club Eusébio campeão da Copa Estado do Ceará.
              </p>
              <p className="sm:col-span-2">
                A passagem para a comissão técnica não mudou a lógica do
                trabalho. Hoje comanda as seleções Sub-15, Sub-17 e Sub-20 do
                Futsal Sesc Ceará. Em 2023, o grupo que ele começou a montar em
                2021 venceu a Taça Liga Ceará sem perder um jogo — e ele foi
                eleito o melhor técnico do torneio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================== NÚMEROS =========================== */}

      <section className="border-y border-[var(--court)] bg-[var(--ink-2)] px-[var(--shell)] py-[clamp(4rem,8vw,7rem)]">
        <Rotulo n="02" texto="Em números" />
        <div className="mt-10 grid gap-px bg-[var(--court)] sm:grid-cols-2 lg:grid-cols-4">
          {numeros.map((n, i) => (
            <div
              key={n.label}
              data-reveal
              style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
              className="flv-stat bg-[var(--ink-2)]"
            >
              <div className="flex items-baseline gap-2">
                <span className="flv-display text-[clamp(3.5rem,7vw,5.5rem)] text-[var(--bone)]">
                  {n.valor}
                </span>
                <span className="flv-mono-label text-[var(--gol)]">
                  {n.unidade}
                </span>
              </div>
              <p className="mt-3 text-lg leading-snug">{n.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--bone-45)]">
                {n.nota}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================= LINHA DO TEMPO ======================= */}

      <section className="px-[var(--shell)] py-[clamp(5rem,11vw,10rem)]">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-12">
              <Rotulo n="03" texto="Trajetória" />
              <p className="flv-display mt-6 text-[clamp(2.5rem,4.5vw,4rem)] text-[var(--bone-25)]">
                2006
                <br />→ hoje
              </p>
            </div>
          </div>

          <ol className="relative lg:col-span-8 lg:col-start-5">
            <span className="flv-rail" aria-hidden="true" />
            {linhaDoTempo.map((e, i) => {
              const abreAtoTecnico =
                e.fase === "tecnico" && linhaDoTempo[i - 1]?.fase === "quadra";

              return (
                <li
                  key={e.ano}
                  data-reveal
                  data-destaque={e.destaque ? "true" : "false"}
                  style={{ "--d": `${Math.min(i, 6) * 55}ms` } as React.CSSProperties}
                  className="flv-item group relative pb-14 pl-8 last:pb-0 sm:pl-12"
                >
                  {abreAtoTecnico && (
                    <p className="flv-ato flv-mono-label">Na beira da quadra</p>
                  )}

                  <span className="flv-node" aria-hidden="true" />

                  <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                    <span className="flv-year flv-display flv-outline text-[clamp(3rem,6.5vw,5rem)]">
                      {e.ano}
                    </span>
                    <span className="flv-mono-label text-[var(--bone-45)]">
                      {e.clube}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {e.titulos.map((t) => (
                      <span
                        key={t}
                        className={`flv-mono-label border px-2.5 py-1 ${
                          e.destaque
                            ? "flv-chip-forte"
                            : "border-[var(--court)] text-[var(--bone-45)]"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <h3 className="mt-5 text-[clamp(1.35rem,2.4vw,1.85rem)] leading-tight font-semibold">
                    {e.titulo}
                  </h3>
                  <p className="mt-3 max-w-2xl text-[1.0625rem] leading-[1.7] text-[var(--bone-70)]">
                    {e.texto}
                  </p>

                  {!e.datado && (
                    <p className="mt-3 text-sm text-[var(--bone-25)]">
                      Ano a confirmar.
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ============================ CITAÇÃO =========================== */}

      <section className="relative overflow-hidden border-y border-[var(--court)] px-[var(--shell)] py-[clamp(5rem,10vw,9rem)]">
        <span
          className="flv-serif pointer-events-none absolute -top-16 left-2 text-[22rem] leading-none text-[var(--gol)]/12 select-none"
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <figure data-reveal className="relative mx-auto max-w-4xl">
          <blockquote className="flv-serif text-[clamp(1.8rem,4.2vw,3.4rem)] leading-[1.2] italic">
            {citacoes.titulo2010.texto}
          </blockquote>
          <figcaption className="flv-mono-label mt-8 flex items-center gap-4 text-[var(--bone-45)]">
            <span className="h-px w-10 bg-[var(--gol)]" />
            {citacoes.titulo2010.fonte}
          </figcaption>
        </figure>
      </section>

      {/* ======================= EM QUADRA / NA BEIRA ==================== */}

      <section className="grid lg:grid-cols-2">
        <div className="px-[var(--shell)] py-[clamp(4rem,8vw,7rem)]">
          <div data-reveal>
            <Rotulo n="04" texto={emQuadra.periodo} />
            <h2 className="flv-display mt-6 text-[clamp(3rem,6vw,5rem)]">
              {emQuadra.rotulo}
            </h2>
            <p className="flv-mono-label mt-3 text-[var(--gol)]">
              {emQuadra.posicao}
            </p>
            <p className="mt-9 max-w-md text-[1.0625rem] leading-[1.72] text-[var(--bone-70)]">
              {emQuadra.resumo}
            </p>
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
              {emQuadra.destaques.map((d) => (
                <div key={d.label}>
                  <dt className="flv-display text-[clamp(2.5rem,4.5vw,3.5rem)]">
                    {d.valor}
                  </dt>
                  <dd className="flv-mono-label mt-1 text-[var(--bone-45)]">
                    {d.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flv-invert px-[var(--shell)] py-[clamp(4rem,8vw,7rem)]">
          <div data-reveal>
            <div className="flex items-baseline gap-3 text-[var(--gol)]">
              <span className="flv-mono-label">05</span>
              <span className="h-px w-8 bg-[var(--gol)]/50" />
              <span className="flv-mono-label text-[var(--ink)]/45">
                {naBeira.periodo}
              </span>
            </div>
            <h2 className="flv-display mt-6 text-[clamp(3rem,6vw,5rem)]">
              {naBeira.rotulo}
            </h2>
            <p className="flv-mono-label mt-3 text-[var(--gol)]">
              {naBeira.posicao}
            </p>
            <p className="mt-9 max-w-md text-[1.0625rem] leading-[1.72] text-[var(--ink)]/72">
              {naBeira.resumo}
            </p>
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
              {naBeira.destaques.map((d) => (
                <div key={d.label}>
                  <dt className="flv-display text-[clamp(2.5rem,4.5vw,3.5rem)]">
                    {d.valor}
                  </dt>
                  <dd className="flv-mono-label mt-1 text-[var(--ink)]/45">
                    {d.label}
                  </dd>
                </div>
              ))}
            </dl>

            <blockquote className="flv-serif mt-12 border-l-2 border-[var(--gol)] pl-6 text-[clamp(1.15rem,1.9vw,1.5rem)] leading-snug italic">
              {citacoes.grupo2021.texto}
              <span className="flv-mono-label mt-4 block text-[var(--ink)]/45 not-italic">
                {citacoes.grupo2021.fonte}
              </span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ============================= HOJE ============================= */}

      <section className="relative overflow-hidden bg-[var(--ink-2)] px-[var(--shell)] py-[clamp(5rem,10vw,9rem)]">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Rotulo n="06" texto="Onde ele está" />
            <h2
              data-reveal
              className="flv-display mt-6 text-[clamp(2.75rem,6vw,4.75rem)]"
            >
              Futsal Sesc
              <br />
              <span className="flv-outline-gol">Ceará</span>
            </h2>
            <p
              data-reveal
              style={{ "--d": "100ms" } as React.CSSProperties}
              className="mt-8 max-w-lg text-[1.0625rem] leading-[1.72] text-[var(--bone-70)]"
            >
              {hoje.texto}
            </p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <div
              data-reveal
              className="border border-[var(--court)] bg-[var(--ink)] p-[clamp(1.5rem,3vw,2.5rem)]"
            >
              <p className="flv-mono-label text-[var(--bone-45)]">Base</p>
              <p className="mt-3 text-[clamp(1.35rem,2.4vw,1.75rem)] leading-snug">
                {hoje.local}
              </p>
              <p className="mt-2 text-sm text-[var(--bone-45)]">
                {hoje.endereco}
              </p>

              <div className="my-8 h-px bg-[var(--court)]" />

              <p className="flv-mono-label text-[var(--bone-45)]">Categorias</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {hoje.categorias.map((c) => (
                  <span
                    key={c}
                    className="flv-display border border-[var(--court)] px-4 py-2 text-2xl"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="my-8 h-px bg-[var(--court)]" />

              <p className="flv-mono-label text-[var(--bone-45)]">Comissão</p>
              <ul className="mt-4 grid gap-3">
                {hoje.comissao.map((p) => (
                  <li
                    key={p.nome}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--court)] pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-lg">{p.nome}</span>
                    <span className="flv-mono-label text-[var(--bone-45)]">
                      {p.papel}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ RODAPÉ ============================ */}

      <footer className="relative overflow-hidden border-t border-[var(--court)] px-[var(--shell)] pt-[clamp(4rem,8vw,7rem)] pb-10">
        <p className="flv-mono-label text-[var(--gol)]">Contato</p>
        <p className="mt-6 max-w-xl text-[clamp(1.25rem,2.4vw,1.75rem)] leading-snug text-[var(--bone-70)]">
          Para conversas sobre projeto, formação de base, palestra ou comissão
          técnica.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="mailto:contato@example.com"
            className="flv-mono-label border border-[var(--bone-25)] px-6 py-4 transition-colors hover:border-[var(--gol)] hover:text-[var(--gol)]"
          >
            E-mail
          </a>
          <a
            href="https://instagram.com/"
            rel="noreferrer noopener"
            target="_blank"
            className="flv-mono-label border border-[var(--bone-25)] px-6 py-4 transition-colors hover:border-[var(--gol)] hover:text-[var(--gol)]"
          >
            Instagram
          </a>
        </div>

        <p
          className="flv-display mt-[clamp(3rem,8vw,6rem)] text-[clamp(3.5rem,17vw,15rem)] leading-[0.8] text-[var(--bone)]/8"
          aria-hidden="true"
        >
          {perfil.nome}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--court)] pt-6">
          <span className="flv-mono-label text-[var(--bone-25)]">
            {perfil.local}
          </span>
          <span className="text-xs text-[var(--bone-25)]">
            Conquistas e datas conferidas em fontes públicas primárias.
          </span>
        </div>
      </footer>
    </main>
  );
}
