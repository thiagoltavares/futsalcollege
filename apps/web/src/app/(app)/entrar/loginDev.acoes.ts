"use server";

import { redirect } from "next/navigation";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { loginDevHabilitado } from "./loginDev.servidor";

/**
 * Cria sessão direta para um usuário do seed, sem passar pelo link mágico —
 * só existe para acelerar o smoke test manual. As mesmas duas travas de
 * `loginDevHabilitado()` são checadas aqui de novo, no servidor: a tela
 * esconder o seletor não é proteção, é só não incomodar quem não devia ver
 * o atalho. Se as travas estiverem desligadas, esta action recusa mesmo que
 * alguém submeta o formulário na mão (ex.: reabrindo um HTML salvo).
 *
 * Estratégia: gera um link mágico pela Admin API (nunca exposta ao
 * navegador) e resolve o `token_hash` dele com `verifyOtp` no cliente com
 * escrita de cookie (`criarClienteServidor`) — o mesmo par
 * generateLink/verifyOtp que o Supabase documenta para "admin cria sessão
 * por outro caminho que não o e-mail". Nenhuma senha, nenhuma chave secreta
 * chega ao navegador: só o cookie de sessão normal, do mesmo jeito que o
 * link mágico de verdade deixaria.
 */
export async function entrarComoDev(formulario: FormData) {
  if (!loginDevHabilitado()) {
    redirect("/entrar?erro=login-dev-desligado");
  }

  const usuarioId = formulario.get("usuario_id");
  if (typeof usuarioId !== "string" || usuarioId.length === 0) {
    redirect("/entrar?erro=login-dev-invalido");
  }

  const admin = criarClienteAdmin();

  const { data: usuario, error: erroUsuario } = await admin.auth.admin.getUserById(usuarioId);
  if (erroUsuario || !usuario.user) {
    redirect("/entrar?erro=login-dev-invalido");
  }

  const email = usuario.user.email;
  if (!email) {
    redirect("/entrar?erro=login-dev-invalido");
  }

  const { data: link, error: erroLink } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (erroLink || !link.properties) {
    redirect("/entrar?erro=login-dev-falhou");
  }

  const supabase = await criarClienteServidor();
  const { error: erroSessao } = await supabase.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });
  if (erroSessao) {
    redirect("/entrar?erro=login-dev-falhou");
  }

  redirect("/painel");
}
