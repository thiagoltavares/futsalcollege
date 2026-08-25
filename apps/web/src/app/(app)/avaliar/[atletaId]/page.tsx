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
      <div className="fc-container fc-container--perfil">
        <Cartao>
          <p className="fc-estado-vazio">
            Nenhuma rubrica ativa no momento. Não é possível avaliar sem uma rubrica publicada.
          </p>
        </Cartao>
      </div>
    );
  }

  // O avaliador é escolhido entre os profissionais cadastrados — nunca mais
  // texto livre (ver AGENTS/brief da rodada): só assim o laudo nasce com
  // `profissional_id` preenchido e o nome vira link na ficha do atleta.
  // Só profissional `ativo` entra na lista: um profissional desativado não
  // deve ganhar novo laudo, mesmo que a página antiga dele continue no ar.
  const { data: profissionais } = await supabase
    .from("profissionais")
    .select("id, nome, credencial")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (!profissionais || profissionais.length === 0) {
    return (
      <div className="fc-container fc-container--perfil">
        <Cartao>
          <p className="fc-estado-vazio">
            Nenhum profissional cadastrado no momento. Não é possível avaliar sem escolher quem
            assina o laudo — peça para um profissional ser cadastrado antes de continuar.
          </p>
        </Cartao>
      </div>
    );
  }

  // Se a conta logada tem uma página de profissional vinculada
  // (`profissionais.user_id`), pré-seleciona ela — poupa um clique de quem
  // está logado como o próprio profissional. Sem vínculo, a tela não chuta
  // nada: quem avalia escolhe explicitamente da lista.
  const { data: profissionalVinculado } = await supabase
    .from("profissionais")
    .select("id")
    .eq("user_id", sessao.user.id)
    .eq("ativo", true)
    .maybeSingle();

  const grupos = agruparPorEixo(rubrica.itens as never);

  return (
    <div className="fc-container fc-container--perfil">
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
          profissionais={profissionais}
          profissionalIdInicial={profissionalVinculado?.id ?? ""}
        />
      </Cartao>
    </div>
  );
}
