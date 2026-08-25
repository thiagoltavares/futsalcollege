import { notFound, redirect } from "next/navigation";
import { TERMO, VERSAO_TERMO } from "@/conteudo/termo-2026-08-v1";
import { criarClienteServidor } from "@/lib/supabase/servidor";
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
    <main>
      <h1>Autorização do responsável</h1>
      <p>
        Atleta: {atleta.apelido} · Versão {VERSAO_TERMO}
      </p>

      <pre>{TERMO}</pre>

      <FormularioConsentimento atletaId={id} nomeInicial={responsavel?.nome ?? ""} />
    </main>
  );
}
