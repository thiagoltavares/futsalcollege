// Popula o bucket `midias` e as tabelas `atleta_midias`/`atleta_destaques`
// com massa de dados de verdade — arquivos reais no storage, não só linhas
// no banco. `supabase db reset` só sabe rodar SQL (`seed.sql`); não existe
// jeito de fazer upload de bytes para o Storage a partir de uma migration
// ou de um `insert`. Este script é o complemento que falta: roda DEPOIS de
// `db:reset` + `db:tipos`, usando a Admin API (service role, bypassa RLS)
// para gerar e enviar fotos (SVG) e vídeos (MP4, via ffmpeg) para cada
// atleta ativo do seed.
//
// Sem isto, a ficha nova (grade de mídia, destaques, avatar) fica com cara
// de "quebrada" — que é exatamente o que a Tarefa pede para evitar, já que
// é com o seed que o produto vai ser avaliado.
//
// Uso: node packages/db/scripts/seed-midias.ts (a partir da raiz do repo,
// ou de dentro de packages/db — o caminho do script já resolve os módulos
// certos). Precisa do Supabase local rodando (`pnpm --filter @futsalcollege/db db:start`)
// e do ffmpeg instalado (só para os vídeos; sem ele, o script segue e gera
// só fotos, avisando no console).

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const URL_PROJETO = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54521";
const CHAVE_SECRETA = process.env.SUPABASE_SECRET_KEY;
if (!CHAVE_SECRETA) {
  throw new Error(
    "SUPABASE_SECRET_KEY não definida. Este script escreve no Storage e precisa " +
      "da chave secreta do projeto — exporte a variável antes de rodar. Não existe " +
      "valor padrão de propósito: a chave embutida no código vazava para o Git.",
  );
}

const supabase = createClient(URL_PROJETO, CHAVE_SECRETA, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// PRNG determinístico (mulberry32) — mesmo raciocínio do `setseed()` no
// seed.sql: massa "aleatória" reproduzível entre rodadas, para dar para
// comparar screenshot com screenshot.
function criarSorteio(semente: number) {
  let estado = semente >>> 0;
  return function sortear() {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const sortear = criarSorteio(20260825);
const inteiroEntre = (min: number, max: number) => min + Math.floor(sortear() * (max - min + 1));
const escolher = <T,>(lista: readonly T[]): T => lista[Math.floor(sortear() * lista.length)]!;

const PALETA: readonly [string, string][] = [
  ["#0b0d0e", "#2a2f33"],
  ["#c62f0d", "#ff3b14"],
  ["#14171a", "#3d4753"],
  ["#7a1c0a", "#ff3b14"],
  ["#0b3d3a", "#1f7a4d"],
  ["#141a2e", "#33507a"],
];

function gerarSvgFoto(opts: { numero: number; categoria: string; indiceCor: number }): string {
  const [c1, c2] = PALETA[opts.indiceCor % PALETA.length]!;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#g)"/>
  <g opacity="0.10" stroke="#f4f0e8" stroke-width="36">
    <line x1="-120" y1="720" x2="720" y2="-120"/>
    <line x1="140" y1="1020" x2="1020" y2="140"/>
  </g>
  <g opacity="0.16" fill="#f4f0e8">
    <circle cx="450" cy="320" r="115"/>
    <path d="M255 770 Q450 510 645 770 Z"/>
  </g>
  <text x="450" y="565" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-weight="900" font-size="410" fill="#f4f0e8" fill-opacity="0.96">${opts.numero}</text>
  <text x="56" y="826" font-family="Arial, sans-serif" font-weight="700" font-size="38" letter-spacing="3" fill="#f4f0e8" fill-opacity="0.55">${opts.categoria.toUpperCase()}</text>
</svg>`;
}

const LEGENDAS: (string | null)[] = [
  "Treino pesado, sorriso leve 😄",
  "Bora, time! 🔥",
  "Evoluindo a cada semana",
  "Gol de placa ⚽",
  "Orgulho demais desse guerreiro",
  "Suando a camisa",
  "Mais um treino, mais um passo",
  "Foco total antes do jogo",
  "Comemoração com a galera 🏆",
  "Aquecendo para o próximo desafio",
  "Bola rolando é o que importa",
  null,
  null,
  null,
];

const TITULOS_DESTAQUE = [
  "Campeão",
  "Gol de placa",
  "Evolução",
  "MVP da rodada",
  "1º título",
  "Artilheiro",
  "Estreia",
  "Seleção da categoria",
  "Superação",
  "Confraternização",
];

function ffmpegDisponivel(): boolean {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Gera N clipes curtos verticais (padrão de teste + tom, cor variada por clipe) via ffmpeg. */
function gerarClipes(pastaTmp: string, quantidade: number): Buffer[] {
  const clipes: Buffer[] = [];
  for (let i = 0; i < quantidade; i++) {
    const destino = join(pastaTmp, `clipe-${i}.mp4`);
    const matiz = Math.round((360 / quantidade) * i);
    const frequencia = 180 + i * 24;
    execFileSync("ffmpeg", [
      "-y",
      "-f", "lavfi", "-i", `testsrc2=size=480x854:rate=24:duration=3`,
      "-f", "lavfi", "-i", `sine=frequency=${frequencia}:duration=3`,
      "-vf", `hue=h=${matiz}:s=1.4`,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "30",
      "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart",
      destino,
    ], { stdio: "ignore" });
    clipes.push(readFileSync(destino));
  }
  return clipes;
}

async function main() {
  console.log(`Conectando em ${URL_PROJETO}...`);

  const { count: jaExistem } = await supabase
    .from("atleta_midias")
    .select("id", { count: "exact", head: true });

  if (jaExistem && jaExistem > 0) {
    console.log(
      `atleta_midias já tem ${jaExistem} linha(s) — rode "supabase db reset" antes deste script para evitar duplicar mídia.`,
    );
    process.exit(1);
  }

  const { data: atletas, error: erroAtletas } = await supabase
    .from("atletas")
    .select("id, apelido, categoria")
    .eq("estado", "ativo");

  if (erroAtletas || !atletas) {
    console.error("Não consegui listar atletas ativos:", erroAtletas);
    process.exit(1);
  }
  console.log(`${atletas.length} atletas ativos encontrados.`);

  const temFfmpeg = ffmpegDisponivel();
  let clipes: Buffer[] = [];
  let pastaTmp: string | null = null;
  if (temFfmpeg) {
    pastaTmp = mkdtempSync(join(tmpdir(), "fc-midias-"));
    console.log("Gerando clipes de vídeo com ffmpeg...");
    clipes = gerarClipes(pastaTmp, 10);
    console.log(`${clipes.length} clipe(s) gerado(s).`);
  } else {
    console.warn("ffmpeg não encontrado no PATH — pulando geração de vídeo, só fotos serão enviadas.");
  }

  let totalFotos = 0;
  let totalVideos = 0;
  let totalDestaques = 0;

  for (const [indiceAtleta, atleta] of atletas.entries()) {
    const numeroCamisa = inteiroEntre(1, 99);
    const qtdFotos = inteiroEntre(3, 7);
    const midiasInseridas: { id: string; tipo: "foto" | "video" }[] = [];

    for (let i = 0; i < qtdFotos; i++) {
      const svg = gerarSvgFoto({
        numero: numeroCamisa,
        categoria: atleta.categoria,
        indiceCor: indiceAtleta + i,
      });
      const caminho = `seed/${atleta.id}/${crypto.randomUUID()}.svg`;

      const { error: erroEnvio } = await supabase.storage
        .from("midias")
        .upload(caminho, new Blob([svg], { type: "image/svg+xml" }), {
          contentType: "image/svg+xml",
          upsert: false,
        });
      if (erroEnvio) {
        console.error(`Falha ao enviar foto de ${atleta.apelido}:`, erroEnvio.message);
        continue;
      }

      const legenda = escolher(LEGENDAS);
      const { data: linha, error: erroLinha } = await supabase
        .from("atleta_midias")
        .insert({
          atleta_id: atleta.id,
          tipo: "foto",
          storage_path: caminho,
          legenda,
          ordem: i,
          capa: i === 0,
        })
        .select("id")
        .single();

      if (erroLinha || !linha) {
        console.error(`Falha ao registrar foto de ${atleta.apelido}:`, erroLinha?.message);
        continue;
      }
      midiasInseridas.push({ id: linha.id, tipo: "foto" });
      totalFotos++;
    }

    // ~45% dos atletas ganham 1 vídeo; um subconjunto menor ganha 2.
    if (temFfmpeg && sortear() < 0.45) {
      const qtdVideos = sortear() < 0.2 ? 2 : 1;
      for (let v = 0; v < qtdVideos; v++) {
        const clipe = escolher(clipes);
        const caminho = `seed/${atleta.id}/${crypto.randomUUID()}.mp4`;

        const { error: erroEnvio } = await supabase.storage
          .from("midias")
          .upload(caminho, new Blob([new Uint8Array(clipe)], { type: "video/mp4" }), {
            contentType: "video/mp4",
            upsert: false,
          });
        if (erroEnvio) {
          console.error(`Falha ao enviar vídeo de ${atleta.apelido}:`, erroEnvio.message);
          continue;
        }

        const legenda = escolher(LEGENDAS);
        const { data: linha, error: erroLinha } = await supabase
          .from("atleta_midias")
          .insert({
            atleta_id: atleta.id,
            tipo: "video",
            storage_path: caminho,
            legenda,
            ordem: qtdFotos + v,
            capa: false,
          })
          .select("id")
          .single();

        if (erroLinha || !linha) {
          console.error(`Falha ao registrar vídeo de ${atleta.apelido}:`, erroLinha?.message);
          continue;
        }
        midiasInseridas.push({ id: linha.id, tipo: "video" });
        totalVideos++;
      }
    }

    // ~70% dos atletas ganham 2-4 destaques, cada um com uma das próprias
    // fotos como capa (quando existe alguma).
    if (sortear() < 0.7) {
      const fotos = midiasInseridas.filter((m) => m.tipo === "foto");
      const qtdDestaques = inteiroEntre(2, Math.min(4, Math.max(2, fotos.length || 2)));
      const titulosEscolhidos = new Set<string>();
      while (titulosEscolhidos.size < qtdDestaques && titulosEscolhidos.size < TITULOS_DESTAQUE.length) {
        titulosEscolhidos.add(escolher(TITULOS_DESTAQUE));
      }

      let ordem = 0;
      for (const titulo of titulosEscolhidos) {
        const midiaCapa = fotos.length > 0 ? escolher(fotos) : null;
        const { error: erroDestaque } = await supabase.from("atleta_destaques").insert({
          atleta_id: atleta.id,
          titulo,
          midia_id: midiaCapa?.id ?? null,
          ordem: ordem++,
        });
        if (erroDestaque) {
          console.error(`Falha ao registrar destaque de ${atleta.apelido}:`, erroDestaque.message);
          continue;
        }
        totalDestaques++;
      }
    }

    if ((indiceAtleta + 1) % 10 === 0 || indiceAtleta === atletas.length - 1) {
      console.log(`  ${indiceAtleta + 1}/${atletas.length} atletas processados...`);
    }
  }

  if (pastaTmp) rmSync(pastaTmp, { recursive: true, force: true });

  console.log(
    `Pronto: ${totalFotos} foto(s), ${totalVideos} vídeo(s) e ${totalDestaques} destaque(s) distribuídos entre ${atletas.length} atletas ativos.`,
  );
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
