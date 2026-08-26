// Popula o bucket `midias` e as tabelas `atleta_midias`/`atleta_destaques`
// com massa de dados de verdade — arquivos reais no storage, não só linhas
// no banco. `supabase db reset` só sabe rodar SQL (`seed.sql`); não existe
// jeito de fazer upload de bytes para o Storage a partir de uma migration
// ou de um `insert`. Este script é o complemento que falta: roda DEPOIS de
// `db:reset` + `db:tipos`, usando a Admin API (service role, bypassa RLS)
// para gerar e enviar avatares (DiceBear, ver abaixo) e vídeos (MP4, via
// ffmpeg) para cada atleta ativo do seed, e avatares para escolinha e
// profissional.
//
// Sem isto, a ficha nova (grade de mídia, destaques, avatar) fica com cara
// de "quebrada" — que é exatamente o que a Tarefa pede para evitar, já que
// é com o seed que o produto vai ser avaliado.
//
// "Fotos" de atleta/escolinha/profissional são avatares ilustrados do
// DiceBear (api.dicebear.com, grátis, sem chave, determinístico por
// semente — mesmo id sempre gera o mesmo avatar). Perfis são de crianças:
// só estilos ilustrados (nunca fotorrealista) entram na lista permitida
// (ver `ESTILOS_ATLETA`/`ESTILOS_PROFISSIONAL`/`ESTILO_ESCOLINHA` abaixo).
// Rede fora do ar (ou instável) não pode quebrar o seed nem deixar a
// produção dependendo do DiceBear em runtime: o avatar é baixado AGORA e
// sobe para o Supabase Storage, igual às outras mídias; se o DiceBear
// falhar, cai para o grafismo SVG geométrico de sempre, avisando no
// console (ver `baixarAvatarDicebear`).
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

/** Grafismo de reserva para escolinha/profissional: mesma ideia do
 * `gerarSvgFoto` acima (gradiente de marca), mas com a inicial do nome no
 * lugar do número de camisa — não existe "categoria" nem "número" para
 * essas duas entidades. Só entra em jogo se o DiceBear falhar (ver
 * `baixarAvatarDicebear`); o cartão/ficha já sabe cair para a inicial
 * sozinho quando não há imagem nenhuma, então mesmo este SVG é uma reserva
 * "a mais", não o único plano B.
 */
function gerarSvgInicial(nome: string, indiceCor: number): string {
  const [c1, c2] = PALETA[indiceCor % PALETA.length]!;
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#g)"/>
  <text x="450" y="565" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-weight="900" font-size="410" fill="#f4f0e8" fill-opacity="0.96">${inicial}</text>
</svg>`;
}

// ---------------------------------------------------------------------
// Avatares ilustrados (DiceBear) — substitui o grafismo SVG geométrico
// como "foto" principal de atleta, escolinha e profissional. Perfis são de
// crianças: só estilos ilustrados, nunca fotorrealista (nenhum estilo do
// DiceBear é fotorrealista, mas restringimos ainda mais à lista abaixo).
// Estilo do atleta é sempre diferente do de escolinha/profissional, para
// as três entidades não se confundirem visualmente na mesma grade.
const DICEBEAR_BASE = "https://api.dicebear.com/9.x";
const DICEBEAR_TIMEOUT_MS = 8_000;

const ESTILOS_ATLETA = ["adventurer", "big-smile", "micah", "notionists"] as const;
const ESTILOS_PROFISSIONAL = ["avataaars", "personas"] as const;
const ESTILO_ESCOLINHA = "shapes";

// Fundo em gradiente sorteado (pelo hash da semente, não pelo `sortear()`
// global) dentro da paleta da marca — tinta, osso e os dois tons do
// acento "gol". Repetido para não estourar o clamp de cores válidas do
// DiceBear (hex sem "#").
const CORES_MARCA = [
  "0b0d0e",
  "141a2e",
  "2a2f33",
  "c62f0d",
  "ff3b14",
  "0b3d3a",
  "1f7a4d",
  "f4f0e8",
  "ffd6c9",
] as const;

/** Hash determinístico de string → inteiro positivo (FNV-1a). Usado para
 * escolher estilo/variação a partir do id do atleta/escolinha/profissional
 * — nunca do `sortear()` compartilhado, para não deslocar a sequência de
 * números de camisa, legendas e destaques que o resto do script já sorteia
 * (isso quebraria a reprodutibilidade dos campos que já existiam antes
 * desta mudança). */
function hashTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function escolherPorHash<T>(lista: readonly T[], semente: string): T {
  return lista[hashTexto(semente) % lista.length]!;
}

let falhasConsecutivasDicebear = 0;
let dicebearDesativado = false;
let totalAvataresDicebear = 0;
let totalAvataresReserva = 0;

/**
 * Busca um avatar PNG no DiceBear (determinístico por `semente`: a mesma
 * semente sempre gera a mesma imagem, entre execuções e entre máquinas —
 * é a API que garante isso, não o seed). `null` em qualquer falha (rede,
 * timeout, HTTP não-2xx) — quem chama cai para `gerarSvgFoto`/
 * `gerarSvgInicial` nesse caso e o seed segue normalmente.
 *
 * Depois de 3 falhas seguidas, desiste de tentar o DiceBear pelo resto da
 * execução (rede fora do ar não deveria custar um timeout de 8s por foto
 * pelo resto do seed) — um aviso único no console explica a decisão.
 */
async function baixarAvatarDicebear(
  estilo: string,
  semente: string,
  paramsExtra?: Record<string, string>,
): Promise<Buffer | null> {
  if (dicebearDesativado) return null;

  const url = new URL(`${DICEBEAR_BASE}/${estilo}/png`);
  url.searchParams.set("seed", semente);
  url.searchParams.set("size", "512");
  url.searchParams.set("backgroundColor", CORES_MARCA.join(","));
  url.searchParams.set("backgroundType", "gradientLinear");
  for (const [chave, valor] of Object.entries(paramsExtra ?? {})) {
    url.searchParams.set(chave, valor);
  }

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), DICEBEAR_TIMEOUT_MS);
  try {
    const resposta = await fetch(url, { signal: controlador.signal });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const bytes = Buffer.from(await resposta.arrayBuffer());
    falhasConsecutivasDicebear = 0;
    totalAvataresDicebear++;
    return bytes;
  } catch (erro) {
    falhasConsecutivasDicebear++;
    totalAvataresReserva++;
    const motivo = erro instanceof Error ? erro.message : String(erro);
    console.warn(`DiceBear falhou para "${semente}" (${motivo}) — usando o grafismo SVG de reserva.`);
    if (falhasConsecutivasDicebear >= 3 && !dicebearDesativado) {
      dicebearDesativado = true;
      console.warn(
        "DiceBear com 3 falhas seguidas — parando de tentar pelo resto deste seed; " +
          "todo o resto usa só o grafismo SVG de reserva.",
      );
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

type ArquivoGerado = { bytes: Buffer | string; contentType: string; extensao: string };

/** `Buffer` não é aceito direto como `BlobPart` pelo TS estrito (mesmo
 * motivo pelo qual o upload de vídeo, mais abaixo, já envolve o clipe em
 * `new Uint8Array(...)`) — normaliza aqui uma vez para os três lugares que
 * sobem `ArquivoGerado` para o Storage. */
function paraBlob(arquivo: ArquivoGerado): Blob {
  const corpo = typeof arquivo.bytes === "string" ? arquivo.bytes : new Uint8Array(arquivo.bytes);
  return new Blob([corpo], { type: arquivo.contentType });
}

/** "Foto" de atleta: avatar DiceBear se der certo, SVG geométrico se não
 * der. Estilo é o mesmo para todas as fotos de um atleta (escolhido pelo
 * hash do id dele) — a semente varia por foto (`atletaId:indice`) só para
 * a galeria não repetir a mesma imagem em todo item. */
async function gerarFotoAtleta(opts: {
  atletaId: string;
  indiceFoto: number;
  numeroCamisa: number;
  categoria: string;
  indiceCorReserva: number;
}): Promise<ArquivoGerado> {
  const estilo = escolherPorHash(ESTILOS_ATLETA, opts.atletaId);
  const avatar = await baixarAvatarDicebear(estilo, `${opts.atletaId}:${opts.indiceFoto}`);
  if (avatar) return { bytes: avatar, contentType: "image/png", extensao: "png" };
  return {
    bytes: gerarSvgFoto({
      numero: opts.numeroCamisa,
      categoria: opts.categoria,
      indiceCor: opts.indiceCorReserva,
    }),
    contentType: "image/svg+xml",
    extensao: "svg",
  };
}

/** Avatar de profissional: estilo "gente" (avataaars/personas), diferente
 * do conjunto usado para atleta — perfil de adulto, não de criança, mas
 * ainda assim ilustrado, para manter a mesma linguagem visual da vitrine. */
async function gerarAvatarProfissional(opts: {
  id: string;
  nome: string;
  indiceCorReserva: number;
}): Promise<ArquivoGerado> {
  const estilo = escolherPorHash(ESTILOS_PROFISSIONAL, opts.id);
  const avatar = await baixarAvatarDicebear(estilo, `profissional:${opts.id}`);
  if (avatar) return { bytes: avatar, contentType: "image/png", extensao: "png" };
  return {
    bytes: gerarSvgInicial(opts.nome, opts.indiceCorReserva),
    contentType: "image/svg+xml",
    extensao: "svg",
  };
}

/** Avatar de escolinha: estilo "shapes" (formas abstratas, sem rosto) —
 * lê como marca/emblema de instituição, nunca como retrato de uma pessoa.
 * As cores das formas em si (`shape1Color`/`shape2Color`/`shape3Color`,
 * parâmetros próprios do estilo `shapes`) também são fixadas na paleta da
 * marca — sem isso o DiceBear usa a paleta azul/verde padrão dele, fora da
 * identidade visual do produto. */
async function gerarAvatarEscolinha(opts: {
  id: string;
  nome: string;
  indiceCorReserva: number;
}): Promise<ArquivoGerado> {
  const avatar = await baixarAvatarDicebear(ESTILO_ESCOLINHA, `escolinha:${opts.id}`, {
    shape1Color: "c62f0d,ff3b14",
    shape2Color: "f4f0e8,ffd6c9",
    shape3Color: "141a2e,0b0d0e,2a2f33",
  });
  if (avatar) return { bytes: avatar, contentType: "image/png", extensao: "png" };
  return {
    bytes: gerarSvgInicial(opts.nome, opts.indiceCorReserva),
    contentType: "image/svg+xml",
    extensao: "svg",
  };
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
      const foto = await gerarFotoAtleta({
        atletaId: atleta.id,
        indiceFoto: i,
        numeroCamisa,
        categoria: atleta.categoria,
        indiceCorReserva: indiceAtleta + i,
      });
      const caminho = `seed/${atleta.id}/${crypto.randomUUID()}.${foto.extensao}`;

      const { error: erroEnvio } = await supabase.storage
        .from("midias")
        .upload(caminho, paraBlob(foto), {
          contentType: foto.contentType,
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

  // Avatar de escolinha e de profissional — mesma ideia da foto de capa do
  // atleta, mas uma imagem só por linha (migration 0013, coluna
  // `foto_storage_path`), sem tabela de galeria própria: nem escolinha nem
  // profissional têm mídia hoje, então esses cartões e fichas caíam sempre
  // na inicial. Roda depois do laço de atletas — não depende dele, e o
  // guard de `atleta_midias` já garante que este bloco só executa uma vez
  // por reset (a mesma proteção contra duplicar upload em reexecução).
  const { data: escolinhas, error: erroEscolinhas } = await supabase
    .from("escolinhas")
    .select("id, nome")
    .order("nome");
  if (erroEscolinhas || !escolinhas) {
    console.error("Não consegui listar escolinhas:", erroEscolinhas);
  } else {
    console.log(`Gerando avatar de ${escolinhas.length} escolinha(s)...`);
    for (const [indice, escolinha] of escolinhas.entries()) {
      const avatar = await gerarAvatarEscolinha({
        id: escolinha.id,
        nome: escolinha.nome,
        indiceCorReserva: indice,
      });
      const caminho = `seed/escolinhas/${escolinha.id}.${avatar.extensao}`;
      const { error: erroEnvio } = await supabase.storage
        .from("midias")
        .upload(caminho, paraBlob(avatar), {
          contentType: avatar.contentType,
          upsert: true,
        });
      if (erroEnvio) {
        console.error(`Falha ao enviar avatar de ${escolinha.nome}:`, erroEnvio.message);
        continue;
      }
      const { error: erroUpdate } = await supabase
        .from("escolinhas")
        .update({ foto_storage_path: caminho })
        .eq("id", escolinha.id);
      if (erroUpdate) {
        console.error(`Falha ao gravar avatar de ${escolinha.nome}:`, erroUpdate.message);
      }
    }
  }

  const { data: profissionais, error: erroProfissionais } = await supabase
    .from("profissionais")
    .select("id, nome")
    .order("nome");
  if (erroProfissionais || !profissionais) {
    console.error("Não consegui listar profissionais:", erroProfissionais);
  } else {
    console.log(`Gerando avatar de ${profissionais.length} profissional(is)...`);
    for (const [indice, profissional] of profissionais.entries()) {
      const avatar = await gerarAvatarProfissional({
        id: profissional.id,
        nome: profissional.nome,
        indiceCorReserva: indice,
      });
      const caminho = `seed/profissionais/${profissional.id}.${avatar.extensao}`;
      const { error: erroEnvio } = await supabase.storage
        .from("midias")
        .upload(caminho, paraBlob(avatar), {
          contentType: avatar.contentType,
          upsert: true,
        });
      if (erroEnvio) {
        console.error(`Falha ao enviar avatar de ${profissional.nome}:`, erroEnvio.message);
        continue;
      }
      const { error: erroUpdate } = await supabase
        .from("profissionais")
        .update({ foto_storage_path: caminho })
        .eq("id", profissional.id);
      if (erroUpdate) {
        console.error(`Falha ao gravar avatar de ${profissional.nome}:`, erroUpdate.message);
      }
    }
  }

  console.log(
    `Pronto: ${totalFotos} foto(s), ${totalVideos} vídeo(s) e ${totalDestaques} destaque(s) distribuídos entre ${atletas.length} atletas ativos.`,
  );
  console.log(
    `Avatares: ${totalAvataresDicebear} via DiceBear, ${totalAvataresReserva} no grafismo SVG de reserva` +
      (dicebearDesativado ? " (DiceBear foi desativado no meio da execução — ver avisos acima)." : "."),
  );
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
