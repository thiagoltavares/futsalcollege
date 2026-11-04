import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ehEquipe } from "@/lib/preLancamento";

/**
 * A conta logada, se for da equipe (`EQUIPE_EMAILS`); `null` caso
 * contrário. É a checagem que toda tela e ação da equipe faz no servidor
 * antes de usar a chave de serviço — a trava do Proxy já barra a rota, e
 * isto repete a regra onde o dado é lido de fato.
 */
export async function usuarioDaEquipe() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  const usuario = data.user;
  return usuario && ehEquipe(usuario.email) ? usuario : null;
}
