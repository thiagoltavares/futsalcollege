import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { Botao, Cartao, Etiqueta } from "@/ui";
import { revogarConsentimento } from "./[id]/consentimento/acoes";

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

async function revogar(atletaId: string): Promise<void> {
  "use server";
  await revogarConsentimento(atletaId);
}

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

  // Laudo publicado mais recente de cada atleta ativo, só para montar o
  // link do PDF aqui no painel. A política `laudos_leitura_publica`
  // (migration 0008) já alcança essas linhas para qualquer usuário
  // autenticado — é a mesma regra que decide o que aparece na ficha
  // pública, não um acesso especial do painel.
  const idsAtivos = (atletas ?? []).filter((a) => a.estado === "ativo").map((a) => a.id);

  const laudoIdPorAtleta = new Map<string, string>();
  if (idsAtivos.length > 0) {
    const { data: laudos } = await supabase
      .from("laudos")
      .select("id, atleta_id, publicado_em")
      .in("atleta_id", idsAtivos)
      .not("publicado_em", "is", null)
      .order("publicado_em", { ascending: false });

    for (const laudo of laudos ?? []) {
      if (!laudoIdPorAtleta.has(laudo.atleta_id)) {
        laudoIdPorAtleta.set(laudo.atleta_id, laudo.id);
      }
    }
  }

  return (
    <div className="fc-container">
      <div className="fc-cabecalho-pagina">
        <p className="fc-rotulo-secao fc-etiqueta-rotulo">Painel do responsável</p>
        <div className="fc-item-atleta">
          <h1 className="fc-titulo">Seus atletas</h1>
          <Link href="/painel/novo" className="fc-botao fc-botao--primario">
            Cadastrar atleta
          </Link>
        </div>
      </div>

      {!atletas || atletas.length === 0 ? (
        <Cartao>
          <p className="fc-estado-vazio">
            Nenhum atleta cadastrado ainda. Comece pelo botão &ldquo;Cadastrar
            atleta&rdquo; acima.
          </p>
        </Cartao>
      ) : (
        <ul className="fc-lista">
          {atletas.map((a) => (
            <li key={a.id}>
              <Cartao className="fc-item-atleta">
                <div className="fc-item-atleta__info">
                  <span className="fc-item-atleta__nome">{a.apelido}</span>
                  <span className="fc-item-atleta__meta">{a.categoria}</span>
                </div>

                <div className="fc-item-atleta__acoes">
                  <Etiqueta estado={a.estado}>{ROTULO_ESTADO[a.estado] ?? a.estado}</Etiqueta>

                  {a.estado !== "removido" && (
                    <Link href={`/painel/${a.id}/midias`} className="fc-botao fc-botao--secundario">
                      Gerenciar mídia
                    </Link>
                  )}

                  {(a.estado === "aguardando_consentimento" || a.estado === "suspenso") && (
                    <Link
                      href={`/painel/${a.id}/consentimento`}
                      className="fc-botao fc-botao--secundario"
                    >
                      Assinar autorização
                    </Link>
                  )}
                  {a.estado === "ativo" && (
                    <>
                      <Link href={`/atleta/${a.id}`} className="fc-botao fc-botao--secundario">
                        Ver ficha pública
                      </Link>
                      <Link href={`/avaliar/${a.id}`} className="fc-botao fc-botao--secundario">
                        Avaliar
                      </Link>
                      {laudoIdPorAtleta.has(a.id) && (
                        <a
                          href={`/api/laudo/${laudoIdPorAtleta.get(a.id)}/pdf`}
                          className="fc-botao fc-botao--secundario"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          PDF da avaliação
                        </a>
                      )}
                      <form action={revogar.bind(null, a.id)}>
                        <Botao type="submit" variante="perigo">
                          Revogar autorização
                        </Botao>
                      </form>
                    </>
                  )}
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
