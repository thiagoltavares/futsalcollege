import { agruparPorEixo, EIXOS, ROTULO_EIXO } from "@revela10/core";
import { notFound, redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { Cartao } from "@/ui";
import { FormularioAvaliacao } from "./Formulario";

export default async function Avaliar({ params }: PageProps<"/avaliar/[atletaId]">) {
  const { atletaId } = await params;

  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  // Quem avalia é o profissional credenciado vinculado a ESTA conta, e ele
  // assina em nome próprio. Antes desta rodada qualquer conta autenticada
  // avaliava e ainda escolhia, num campo de seleção, qual profissional
  // apareceria assinando — dava para publicar laudo com o nome de qualquer
  // avaliador da plataforma. A regra real mora na RLS (migration 0016);
  // esta consulta existe para a tela explicar o bloqueio em vez de deixar o
  // banco recusar o envio no fim do formulário.
  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id, nome, credencial")
    .eq("user_id", sessao.user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (!profissional || !profissional.credencial) {
    return (
      <div className="fc-container fc-container--perfil">
        <Cartao>
          <p className="fc-estado-vazio">
            Esta conta não está credenciada para avaliar. Só um profissional ativo, com registro
            no conselho cadastrado na plataforma, pode assinar um laudo — e cada um assina em
            nome próprio.
          </p>
        </Cartao>
      </div>
    );
  }

  // A RLS de `atletas` só deixa este select alcançar um atleta ativo
  // (leitura pública) ou um atleta do próprio responsável; um atleta de
  // outra família ainda em rascunho não aparece aqui, e a tela devolve 404
  // em vez de vazar que o id existe.
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
          assinante={{ nome: profissional.nome, credencial: profissional.credencial }}
        />
      </Cartao>
    </div>
  );
}
