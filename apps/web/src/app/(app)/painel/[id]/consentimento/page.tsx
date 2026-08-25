import { notFound, redirect } from "next/navigation";
import { TERMO, VERSAO_TERMO } from "@/conteudo/termo-2026-08-v1";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { Cartao } from "@/ui";
import { FormularioConsentimento } from "./Formulario";

export default async function Consentimento({
  params,
}: PageProps<"/painel/[id]/consentimento">) {
  const { id } = await params;

  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  // A política `atletas_do_responsavel` já restringe a leitura ao dono, mas
  // filtramos por responsavel_id aqui também para devolver um 404 legível em
  // vez de deixar a tela renderizar em cima de "nenhuma linha".
  const { data: atleta } = await supabase
    .from("atletas")
    .select("id, apelido")
    .eq("id", id)
    .eq("responsavel_id", sessao.user.id)
    .maybeSingle();

  if (!atleta) notFound();

  const { data: responsavel } = await supabase
    .from("responsaveis")
    .select("nome")
    .eq("id", sessao.user.id)
    .maybeSingle();

  return (
    <div className="fc-container fc-container--estreito">
      <div className="fc-cabecalho-pagina">
        <p className="fc-rotulo-secao fc-etiqueta-rotulo">Autorização do responsável</p>
        <h1 className="fc-titulo">{atleta.apelido}</h1>
        <p className="fc-subtitulo">Versão {VERSAO_TERMO} do termo de consentimento.</p>
      </div>

      <div className="fc-termo fc-serif">{TERMO}</div>

      <div className="fc-espaco" aria-hidden="true" />

      <Cartao>
        <FormularioConsentimento atletaId={id} nomeInicial={responsavel?.nome ?? ""} />
      </Cartao>
    </div>
  );
}
