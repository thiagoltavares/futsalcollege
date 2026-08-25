import { agruparPorEixo, EIXOS, ROTULO_EIXO } from "@futsalcollege/core";
import { notFound, redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { Cartao } from "@/ui";
import { FormularioAvaliacao } from "./Formulario";

export default async function Avaliar({ params }: PageProps<"/avaliar/[atletaId]">) {
  const { atletaId } = await params;

  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  // Qualquer usuário autenticado avalia nesta rodada (sem credenciamento —
  // fora de escopo). A RLS de `atletas` só deixa este select alcançar um
  // atleta ativo (leitura pública) ou um atleta do próprio responsável; um
  // atleta de outra família ainda em rascunho não aparece aqui, e a tela
  // devolve 404 em vez de vazar que o id existe.
  const { data: atleta } = await supabase
    .from("atletas")
    .select("id, apelido, categoria, estado")
    .eq("id", atletaId)
    .maybeSingle();

  if (!atleta) notFound();

  const { data: rubrica } = await supabase
    .from("rubricas")
    .select("versao, itens")
    .eq("ativa", true)
    .maybeSingle();

  if (!rubrica) {
    return (
      <div className="fc-container fc-container--estreito">
        <Cartao>
          <p className="fc-estado-vazio">
            Nenhuma rubrica ativa no momento. Não é possível avaliar sem uma rubrica publicada.
          </p>
        </Cartao>
      </div>
    );
  }

  const { data: perfil } = await supabase
    .from("responsaveis")
    .select("nome")
    .eq("id", sessao.user.id)
    .maybeSingle();

  const grupos = agruparPorEixo(rubrica.itens as never);

  return (
    <div className="fc-container fc-container--estreito">
      <div className="fc-cabecalho-pagina">
        <p className="fc-rotulo-secao fc-etiqueta-rotulo">Avaliação técnica</p>
        <div className="fc-item-atleta__linha" style={{ marginTop: "0.35rem" }}>
          <span className="fc-avatar-mini" aria-hidden="true">
            {atleta.apelido.slice(0, 1).toUpperCase()}
          </span>
          <h1 className="fc-titulo" style={{ marginBottom: 0 }}>
            {atleta.apelido} · {atleta.categoria}
          </h1>
        </div>
        <p className="fc-subtitulo">
          <span className="fc-etiqueta fc-etiqueta--neutro">Rubrica {rubrica.versao}</span>
          <br />
          A nota compara o atleta com o critério da categoria — nunca com outro atleta. Depois de
          publicado, o laudo não pode mais ser editado.
        </p>
      </div>

      <Cartao>
        <FormularioAvaliacao
          atletaId={atleta.id}
          rubricaVersao={rubrica.versao}
          grupos={EIXOS.map((eixo) => ({ eixo, rotulo: ROTULO_EIXO[eixo], itens: grupos[eixo] }))}
          nomeInicial={perfil?.nome ?? ""}
        />
      </Cartao>
    </div>
  );
}
