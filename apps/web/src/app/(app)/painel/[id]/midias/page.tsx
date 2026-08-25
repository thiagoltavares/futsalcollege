import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Botao, Cartao } from "@/ui";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { apagarMidia, atualizarLegenda, definirCapa, moverMidia } from "./acoes";
import { FormularioEnvioMidia } from "./Formulario";

const ROTULO_TIPO: Record<string, string> = { foto: "Foto", video: "Vídeo" };

export default async function GerenciarMidias({ params }: PageProps<"/painel/[id]/midias">) {
  const { id } = await params;

  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) redirect("/entrar");

  // Mesmo padrão de `/painel/[id]/consentimento`: a política
  // `midias_do_responsavel` já restringe ao dono, mas filtrar por
  // responsavel_id aqui devolve um 404 legível em vez de renderizar em
  // cima de "nenhuma linha".
  const { data: atleta } = await supabase
    .from("atletas")
    .select("id, apelido")
    .eq("id", id)
    .eq("responsavel_id", sessao.user.id)
    .maybeSingle();

  if (!atleta) notFound();

  const { data: midias } = await supabase
    .from("atleta_midias")
    .select("id, tipo, storage_path, legenda, ordem, capa")
    .eq("atleta_id", id)
    .order("ordem", { ascending: true });

  const lista = midias ?? [];
  const urlPublica = (caminho: string) => supabase.storage.from("midias").getPublicUrl(caminho).data.publicUrl;

  return (
    <div className="fc-container fc-container--perfil">
      <div className="fc-cabecalho-pagina">
        <p className="fc-rotulo-secao fc-etiqueta-rotulo">Mídia do atleta</p>
        <h1 className="fc-titulo">{atleta.apelido}</h1>
        <p className="fc-subtitulo">
          Fotos e vídeos entram na ficha pública assim que enviados. Escolha uma capa, escreva
          legenda, reordene ou apague quando quiser.
        </p>
      </div>

      <Cartao>
        <FormularioEnvioMidia atletaId={id} />
      </Cartao>

      <div className="fc-espaco" />

      {lista.length === 0 ? (
        <Cartao>
          <p className="fc-estado-vazio">Nenhuma mídia enviada ainda.</p>
        </Cartao>
      ) : (
        <ul className="fc-gestao-midias">
          {lista.map((m, indice) => (
            <li key={m.id}>
              <Cartao className="fc-gestao-midia">
                <div className="fc-gestao-midia__preview">
                  {m.tipo === "foto" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- bucket público, URL varia por ambiente; ver decisão em next.config.ts/estilos.css.
                    <img src={urlPublica(m.storage_path)} alt="" loading="lazy" />
                  ) : (
                    <video src={urlPublica(m.storage_path)} muted playsInline preload="metadata" />
                  )}
                  <span className="fc-etiqueta fc-etiqueta--neutro fc-gestao-midia__tipo">
                    {ROTULO_TIPO[m.tipo] ?? m.tipo}
                  </span>
                  {m.capa && (
                    <span className="fc-etiqueta fc-etiqueta--sucesso fc-gestao-midia__selo">Capa</span>
                  )}
                </div>

                <div className="fc-gestao-midia__corpo">
                  <form
                    action={atualizarLegenda.bind(null, id, m.id)}
                    className="fc-gestao-midia__legenda"
                  >
                    <textarea
                      name="legenda"
                      defaultValue={m.legenda ?? ""}
                      maxLength={280}
                      rows={2}
                      placeholder="Sem legenda — nunca escola, local/horário de treino ou telefone."
                      className="fc-input"
                    />
                    <button type="submit" className="fc-botao fc-botao--secundario">
                      Salvar legenda
                    </button>
                  </form>

                  <div className="fc-gestao-midia__acoes">
                    <form action={moverMidia.bind(null, id, m.id, "cima")}>
                      <button
                        type="submit"
                        className="fc-botao fc-botao--secundario"
                        disabled={indice === 0}
                        aria-label="Mover para cima"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={moverMidia.bind(null, id, m.id, "baixo")}>
                      <button
                        type="submit"
                        className="fc-botao fc-botao--secundario"
                        disabled={indice === lista.length - 1}
                        aria-label="Mover para baixo"
                      >
                        ↓
                      </button>
                    </form>
                    {m.tipo === "foto" && !m.capa && (
                      <form action={definirCapa.bind(null, id, m.id)}>
                        <button type="submit" className="fc-botao fc-botao--secundario">
                          Definir como capa
                        </button>
                      </form>
                    )}
                    <form action={apagarMidia.bind(null, id, m.id)}>
                      <Botao type="submit" variante="perigo">
                        Apagar
                      </Botao>
                    </form>
                  </div>
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}

      <div className="fc-espaco" />
      <Link href="/painel" className="fc-botao fc-botao--secundario">
        Voltar ao painel
      </Link>
    </div>
  );
}
