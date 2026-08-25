import type { Metadata } from "next";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@futsalcollege/db";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublicoAuto } from "@/ui";
import "@/ui/estilos.css";
import { anoDeData } from "@/ui/formato";
import { PerfilProfissional } from "./PerfilProfissional";

export const revalidate = 60;

// Rota única para qualquer profissional, inclusive Flávio Barbosa
// (`/profissional/flavio`): a landing especial que existia antes desta
// rodada foi removida — trajetória, conquistas e citação dele agora são
// dado (migration 0012 + seed), consumido pelo mesmo template que qualquer
// outro profissional usa. Ver relatório desta tarefa.
const display = Big_Shoulders({
  variable: "--font-fc-display",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-fc-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const corpo = Barlow({
  variable: "--font-fc-corpo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

function clienteAnonimo() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

/**
 * Não filtra por `ativo`: um profissional que saiu da plataforma continua
 * com página alcançável (laudo antigo que ele assinou continua linkando
 * pra cá) — só some da listagem em `/profissionais`. `cache()` faz
 * `generateMetadata` e o componente da página reaproveitarem a mesma
 * consulta.
 */
const buscarProfissional = cache(async function buscarProfissional(
  supabase: SupabaseClient<Database>,
  slug: string,
) {
  const { data } = await supabase
    .from("profissionais")
    .select(
      "id, nome, slug, credencial, cidade, estado_uf, bio, ativo, atua_desde, citacao_texto, citacao_fonte",
    )
    .eq("slug", slug)
    .maybeSingle();

  return data;
});

/**
 * Trajetória (linha do tempo) do profissional, já ordenada — migration
 * 0012, tabela `profissional_marcos`. Leitura pública (mesma régua de
 * `profissionais`): carreira de um adulto que assina laudo não tem nada da
 * régua de "criança não é vitrine".
 */
async function buscarMarcos(supabase: SupabaseClient<Database>, profissionalId: string) {
  const { data } = await supabase
    .from("profissional_marcos")
    .select("id, ano, datado, clube, titulos, titulo, descricao, fase, destaque, ordem")
    .eq("profissional_id", profissionalId)
    .order("ordem", { ascending: true });

  return data ?? [];
}

/** Grade de conquistas (números em destaque) — migration 0012, tabela `profissional_conquistas`. */
async function buscarConquistas(supabase: SupabaseClient<Database>, profissionalId: string) {
  const { data } = await supabase
    .from("profissional_conquistas")
    .select("id, valor, unidade, rotulo, nota, ordem")
    .eq("profissional_id", profissionalId)
    .order("ordem", { ascending: true });

  return data ?? [];
}

/**
 * Laudos publicados assinados por este profissional, do mais novo ao mais
 * antigo. A política `laudos_leitura_publica` (migration 0008) já restringe
 * a leitura anônima a laudo publicado de atleta ATIVO — é a mesma régua que
 * garante "só os ativos" na lista de atletas avaliados desta página, sem
 * filtro extra aqui. Colunas escritas à mão, e nenhuma delas é nota: esta
 * consulta não devolve nem ordena por avaliação, só existência e data.
 */
async function buscarLaudosDoProfissional(
  supabase: SupabaseClient<Database>,
  profissionalId: string,
) {
  const { data } = await supabase
    .from("laudos")
    .select("id, publicado_em, atleta:atletas(id, apelido, categoria)")
    .eq("profissional_id", profissionalId)
    .not("publicado_em", "is", null)
    .order("publicado_em", { ascending: false });

  return data ?? [];
}

export async function generateMetadata({
  params,
}: PageProps<"/profissional/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profissional = await buscarProfissional(clienteAnonimo(), slug);

  if (!profissional) return { title: "Profissional não encontrado" };

  const titulo = `${profissional.nome} — Futsal College`;
  const descricao =
    profissional.credencial ??
    "Profissional credenciado a assinar avaliações técnicas no Futsal College.";

  return {
    title: titulo,
    description: descricao,
    openGraph: { title: titulo, description: descricao, type: "profile", locale: "pt_BR" },
  };
}

export default async function ProfissionalDetalhe({
  params,
}: PageProps<"/profissional/[slug]">) {
  const { slug } = await params;
  const supabase = clienteAnonimo();
  const profissional = await buscarProfissional(supabase, slug);

  if (!profissional) notFound();

  const [laudos, marcos, conquistas] = await Promise.all([
    buscarLaudosDoProfissional(supabase, profissional.id),
    buscarMarcos(supabase, profissional.id),
    buscarConquistas(supabase, profissional.id),
  ]);

  // Lista de atletas avaliados, sem repetir: um profissional pode ter mais
  // de um laudo no mesmo atleta (evolução) — a página mostra o atleta uma
  // vez só, com a data do laudo mais recente (a consulta acima já vem
  // ordenada do mais novo pro mais antigo).
  const atletasVistos = new Set<string>();
  const atletasAvaliados: { id: string; apelido: string; categoria: string; publicadoEm: string }[] =
    [];
  for (const l of laudos) {
    const atleta = l.atleta as unknown as { id: string; apelido: string; categoria: string } | null;
    if (!atleta || atletasVistos.has(atleta.id)) continue;
    atletasVistos.add(atleta.id);
    atletasAvaliados.push({ ...atleta, publicadoEm: l.publicado_em! });
  }

  const localidade = [profissional.cidade, profissional.estado_uf].filter(Boolean).join(" · ");

  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublicoAuto />

      <main className="fc-corpo fc-corpo--perfil">
        <div className="fc-container fc-container--estreito">
          <PerfilProfissional
            profissional={{
              nome: profissional.nome,
              credencial: profissional.credencial,
              localidade: localidade || null,
              bio: profissional.bio,
              ativo: profissional.ativo,
              desde: anoDeData(profissional.atua_desde),
              citacaoTexto: profissional.citacao_texto,
              citacaoFonte: profissional.citacao_fonte,
            }}
            stats={{ laudos: laudos.length, marcos: marcos.length }}
            conquistas={conquistas.map((c) => ({
              id: c.id,
              valor: c.valor,
              unidade: c.unidade,
              rotulo: c.rotulo,
              nota: c.nota,
            }))}
            marcos={marcos.map((m) => ({
              id: m.id,
              ano: m.ano,
              datado: m.datado,
              clube: m.clube,
              titulos: m.titulos ?? [],
              titulo: m.titulo,
              descricao: m.descricao,
              fase: m.fase as "atleta" | "tecnico",
              destaque: m.destaque,
            }))}
            atletasAvaliados={atletasAvaliados}
          />

          <p className="fc-ficha-rodape">
            Página pública do profissional no Futsal College. Só atletas com perfil ativo e
            avaliação publicada aparecem aqui.
          </p>
        </div>
      </main>
    </div>
  );
}
