import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PESQUISA_BENEFICIO,
  PESQUISA_ENVIOU_VIDEO,
  PESQUISA_GASTO_MENSAL,
  PESQUISA_NIVEL,
  PESQUISA_PERFIL,
  PESQUISA_PREOCUPACAO,
  PESQUISA_PUBLICA_VIDEO,
  PESQUISA_QUEM_VE_VIDEO,
  PESQUISA_RESULTADO_ENVIO,
  PESQUISA_TEM_VIDEO,
  formatarContato,
} from "@revela10/core";
import { usuarioDaEquipe } from "@/lib/equipe";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { Aviso, Botao, Cartao } from "@/ui";
import { marcarTodasVistas, marcarVista } from "./acoes";
import { BotaoAtualizar } from "./BotaoAtualizar";

export const metadata: Metadata = {
  title: "Questionário — Revela 10",
  robots: { index: false, follow: false },
};

/**
 * As respostas da pesquisa de pré-lançamento (migration 0017), para a
 * equipe. Só quem está em `EQUIPE_EMAILS` chega aqui: a trava do Proxy já
 * barra a rota, e a página confere de novo antes de ler com a chave de
 * serviço (a tabela não tem leitura pela API pública, de propósito).
 *
 * É a página para onde o login da equipe leva (`destinoAposLogin`).
 */

type Linha = {
  id: string;
  criado_em: string;
  perfil: string;
  origem: string | null;
  estado_uf: string | null;
  categoria_filho: string | null;
  nivel_filho: string | null;
  enviou_video: string[];
  resultado_envio: string | null;
  tem_video: string | null;
  gasto_mensal: string | null;
  publica_video: string | null;
  quem_ve_video: string | null;
  preocupacao: string | null;
  beneficio: string | null;
  organizacao: string | null;
  como_hoje: string | null;
  pedido: string | null;
  aceita_contato: boolean;
  contato: string | null;
};

const rotulo = (mapa: Record<string, string>, valor: string | null) =>
  valor ? (mapa[valor] ?? valor) : null;

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Link para falar com quem deixou contato: WhatsApp para número, e-mail para e-mail. */
function linkDoContato(contato: string): string {
  if (contato.includes("@")) return `mailto:${contato}`;
  const digitos = contato.replace(/\D/g, "");
  const comPais = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comPais}`;
}

/** Perguntas e respostas de uma linha, na ordem da pesquisa, só as respondidas. */
function respostas(r: Linha): [string, string][] {
  const pares: [string, string | null][] =
    r.perfil === "responsavel"
      ? [
          ["Escolinha ou rendimento", rotulo(PESQUISA_NIVEL, r.nivel_filho)],
          ["Categoria", r.categoria_filho],
          ["Estado", r.estado_uf],
          [
            "Já mandou vídeo",
            r.enviou_video.length
              ? r.enviou_video.map((v) => rotulo(PESQUISA_ENVIOU_VIDEO, v)).join("; ")
              : null,
          ],
          ["Deu em alguma coisa", rotulo(PESQUISA_RESULTADO_ENVIO, r.resultado_envio)],
          ["Tem vídeos dele", rotulo(PESQUISA_TEM_VIDEO, r.tem_video)],
          ["Gasta por mês", rotulo(PESQUISA_GASTO_MENSAL, r.gasto_mensal)],
          ["Posta vídeo dele", rotulo(PESQUISA_PUBLICA_VIDEO, r.publica_video)],
          ["Deixaria ver o vídeo", rotulo(PESQUISA_QUEM_VE_VIDEO, r.quem_ve_video)],
          ["Preocupação", rotulo(PESQUISA_PREOCUPACAO, r.preocupacao)],
          ["O que mais ajudaria", rotulo(PESQUISA_BENEFICIO, r.beneficio)],
        ]
      : [
          ["Organização", r.organizacao],
          ["Estado", r.estado_uf],
          ["Como mostra ou descobre hoje", r.como_hoje],
          ["O que precisaria existir", r.pedido],
        ];
  return pares.filter((p): p is [string, string] => Boolean(p[1]));
}

export default async function Questionario({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await usuarioDaEquipe();
  if (!usuario) redirect("/painel");

  // Padrão é "Não vistas": é o que a equipe vem ver. "Todas" serve para
  // rever uma resposta que já foi marcada.
  const { ver } = await searchParams;
  const soNovas = ver !== "todas";

  const admin = criarClienteAdmin();
  const [{ data, error }, { data: lidas, error: erroLidas }] = await Promise.all([
    admin
      .from("pesquisa_responsaveis")
      .select(
        "id, criado_em, perfil, origem, estado_uf, categoria_filho, nivel_filho, enviou_video, resultado_envio, tem_video, gasto_mensal, publica_video, quem_ve_video, preocupacao, beneficio, organizacao, como_hoje, pedido, aceita_contato, contato",
      )
      .order("criado_em", { ascending: false }),
    // "Visto" é de cada um (migration 0019): só as leituras de quem está logado.
    admin.from("pesquisa_leituras").select("resposta_id").eq("user_id", usuario.id),
  ]);

  // Falha de leitura não pode virar "nenhuma resposta": avisa na tela.
  const falha = error ?? erroLidas;
  if (falha) console.error("questionario: leitura falhou", falha.message);
  const todas = (data ?? []) as Linha[];
  const vistas = new Set((lidas ?? []).map((l) => l.resposta_id));
  const novas = todas.filter((r) => !vistas.has(r.id));
  const lista = soNovas ? novas : todas;
  const contagem = {
    responsaveis: todas.filter((r) => r.perfil === "responsavel").length,
    organizacoes: todas.filter((r) => r.perfil !== "responsavel").length,
    comContato: todas.filter((r) => r.contato).length,
  };

  return (
    <div className="fc-container">
      <div className="fc-cabecalho-pagina fc-quest-cabecalho">
        <div>
          <h1 className="fc-titulo">Questionário</h1>
          <p className="fc-subtitulo">
            As respostas da pesquisa da home, da mais nova para a mais antiga. O que você marca
            como visto vale só para você.
          </p>
        </div>
        <div className="fc-quest-cabecalho__acoes">
          <BotaoAtualizar />
          {novas.length > 0 && (
            <form action={marcarTodasVistas}>
              <Botao type="submit" variante="secundario">
                Marcar todas como vistas
              </Botao>
            </form>
          )}
        </div>
      </div>

      <dl className="fc-quest-placar">
        <div>
          <dt>Respostas</dt>
          <dd>{todas.length}</dd>
        </div>
        <div>
          <dt>Não vistas por você</dt>
          <dd>{novas.length}</dd>
        </div>
        <div>
          <dt>Pais e mães</dt>
          <dd>{contagem.responsaveis}</dd>
        </div>
        <div>
          <dt>Escolinhas, clubes e outros</dt>
          <dd>{contagem.organizacoes}</dd>
        </div>
        <div>
          <dt>Deixaram contato</dt>
          <dd>{contagem.comContato}</dd>
        </div>
      </dl>

      <nav className="fc-quest-filtro" aria-label="Filtrar respostas">
        <Link href="/questionario" aria-current={soNovas ? "page" : undefined}>
          Não vistas ({novas.length})
        </Link>
        <Link href="/questionario?ver=todas" aria-current={soNovas ? undefined : "page"}>
          Todas ({todas.length})
        </Link>
      </nav>

      {falha ? (
        <Aviso tipo="erro">
          Não consegui carregar as respostas agora. Tente Atualizar; se continuar, o erro foi:{" "}
          {falha.message}
        </Aviso>
      ) : lista.length === 0 ? (
        <Cartao>
          <p className="fc-estado-vazio">
            {soNovas
              ? todas.length > 0
                ? "Nenhuma resposta nova. Tudo visto; as anteriores estão em Todas."
                : "Ainda não chegou nenhuma resposta."
              : "Ainda não chegou nenhuma resposta."}
          </p>
        </Cartao>
      ) : (
        <ul className="fc-quest-lista">
          {lista.map((r) => {
            const vista = vistas.has(r.id);
            return (
              <li key={r.id}>
                <Cartao className="fc-quest-resposta" data-vista={vista ? "" : undefined}>
                  <div className="fc-quest-resposta__topo">
                    <div className="fc-quest-resposta__quem">
                      <span className="fc-quest-resposta__perfil">
                        {rotulo(PESQUISA_PERFIL, r.perfil)}
                      </span>
                      <span className="fc-quest-resposta__meta">
                        {quando(r.criado_em)}
                        {r.origem ? `, pelo link ?de=${r.origem}` : ""}
                      </span>
                    </div>
                    <span
                      className={`fc-etiqueta ${vista ? "fc-etiqueta--neutro" : "fc-etiqueta--alerta"}`}
                    >
                      {vista ? "Vista" : "Nova"}
                    </span>
                  </div>

                  <dl className="fc-quest-respostas">
                    {respostas(r).map(([pergunta, resposta]) => (
                      <div key={pergunta}>
                        <dt>{pergunta}</dt>
                        <dd>{resposta}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="fc-quest-resposta__base">
                    {r.contato ? (
                      <a
                        className="fc-quest-resposta__contato"
                        href={linkDoContato(r.contato)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {r.contato.includes("@") ? "E-mail" : "WhatsApp"}:{" "}
                        {formatarContato(r.contato)}
                      </a>
                    ) : (
                      <span className="fc-quest-resposta__meta">Não quis receber novidades</span>
                    )}
                    <form action={marcarVista.bind(null, r.id, !vista)}>
                      <Botao type="submit" variante={vista ? "secundario" : "primario"}>
                        {vista ? "Marcar como não vista" : "Marcar como vista"}
                      </Botao>
                    </form>
                  </div>
                </Cartao>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
