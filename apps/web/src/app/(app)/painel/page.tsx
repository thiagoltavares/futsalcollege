import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// A Tarefa 11 cria @futsalcollege/api com listarAtletasDoResponsavel; até lá,
// a consulta fica inline aqui (decisão do coordenador da Tarefa 9, já que o
// pacote ainda não existe).

const ROTULO_ESTADO: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_consentimento: "Falta a autorização",
  ativo: "No ar",
  suspenso: "Suspenso",
  removido: "Removido",
};

export default async function Painel() {
  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  // A tabela `atletas` tem uma política de leitura pública para
  // estado = 'ativo' (a ficha esportiva é pública). Sem o filtro por
  // responsavel_id, esta consulta devolveria também os atletas ATIVOS de
  // QUALQUER outro responsável — o RLS deixaria passar, mas "Seus atletas"
  // não pode misturar filho de outra família com o próprio.
  const { data: atletas } = await supabase
    .from("atletas")
    .select("id, apelido, categoria, estado")
    .eq("responsavel_id", sessao.user.id)
    .order("criado_em", { ascending: false });

  return (
    <main>
      <h1>Seus atletas</h1>
      <Link href="/painel/novo">Cadastrar atleta</Link>

      {!atletas || atletas.length === 0 ? (
        <p>Nenhum atleta cadastrado ainda.</p>
      ) : (
        <ul>
          {atletas.map((a) => (
            <li key={a.id}>
              <span>
                {a.apelido} · {a.categoria}
              </span>
              <span>{ROTULO_ESTADO[a.estado] ?? a.estado}</span>
              {a.estado === "aguardando_consentimento" && (
                <Link href={`/painel/${a.id}/consentimento`}>Assinar autorização</Link>
              )}
              {a.estado === "ativo" && <Link href={`/atleta/${a.id}`}>Ver ficha pública</Link>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
