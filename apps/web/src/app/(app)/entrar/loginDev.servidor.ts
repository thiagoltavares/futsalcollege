import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * As duas travas do atalho de desenvolvimento (ver AGENTS/brief da rodada):
 * "porta dos fundos para dado de criança", então nenhuma delas basta
 * sozinha.
 *
 * 1. `process.env.NODE_ENV !== "production"` — escrito como comparação
 *    direta (não uma função importada de outro módulo) de propósito: o
 *    Next.js troca `process.env.NODE_ENV` por uma string literal em tempo de
 *    build, e o minificador de produção elimina como código morto qualquer
 *    ramo que dependa de `"production" !== "production"`. Este arquivo,
 *    porém, só é importado por componentes de servidor (a página `/entrar` e
 *    a Server Action de login) — nunca entra no bundle do navegador de
 *    qualquer forma, faça o build o que fizer com este `if`.
 * 2. `NEXT_PUBLIC_LOGIN_DEV === "1"` — segunda trava explícita, independente
 *    da primeira. Documentada (desligada por padrão) em
 *    `apps/web/.env.local.example`.
 *
 * Chamada tanto pela página (decide se busca a lista e desenha o seletor)
 * quanto pela Server Action (decide se aceita o login) — nunca confie só na
 * tela esconder o formulário.
 */
export function loginDevHabilitado(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_LOGIN_DEV === "1";
}

export type UsuarioLoginDev = {
  id: string;
  email: string;
  papel: string;
  rotulo: string;
};

/**
 * Papel aproximado do usuário, só para rotular o seletor — não é uma coluna
 * nem uma fonte de verdade de permissão. Conta quantos atletas apontam para
 * este responsável: zero filhos aqui, neste ambiente de teste, é sinal de
 * conta de avaliador (nenhum responsável do seed fica sem filho); o corte
 * entre "poucos" e "muitos" só existe para diferenciar
 * responsavel.dois/responsavel.solo (2-3 filhos) de responsavel.multiplos
 * (8 filhos) no seletor.
 */
function papelPorContagemDeFilhos(filhos: number): string {
  if (filhos === 0) return "Avaliador";
  if (filhos >= 5) return "Responsável — muitos filhos";
  return "Responsável — poucos filhos";
}

/**
 * Lista os usuários existentes no ambiente local (seed + qualquer conta
 * criada durante o próprio smoke test) para popular o seletor de login de
 * desenvolvimento. Usa a Admin API (chave secreta) porque `auth.users` não é
 * alcançável por RLS a partir de nenhum cliente comum.
 *
 * Chame só depois de `loginDevHabilitado()` ter devolvido `true` — esta
 * função não repete a checagem, para não esconder de quem lê o call site que
 * a trava já devia ter sido feita antes.
 */
export async function listarUsuariosLoginDev(): Promise<UsuarioLoginDev[]> {
  const admin = criarClienteAdmin();

  const { data: usuarios, error: erroUsuarios } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (erroUsuarios || !usuarios) return [];

  const ids = usuarios.users.map((u) => u.id);
  if (ids.length === 0) return [];

  const [{ data: atletas }, { data: responsaveis }] = await Promise.all([
    admin.from("atletas").select("responsavel_id").in("responsavel_id", ids),
    admin.from("responsaveis").select("id, nome").in("id", ids),
  ]);

  const filhosPorResponsavel = new Map<string, number>();
  for (const a of atletas ?? []) {
    filhosPorResponsavel.set(a.responsavel_id, (filhosPorResponsavel.get(a.responsavel_id) ?? 0) + 1);
  }

  const nomePorId = new Map((responsaveis ?? []).map((r) => [r.id, r.nome]));

  return usuarios.users
    .filter((u): u is typeof u & { email: string } => Boolean(u.email))
    .map((u) => {
      const filhos = filhosPorResponsavel.get(u.id) ?? 0;
      const papel = papelPorContagemDeFilhos(filhos);
      const nome = nomePorId.get(u.id);
      const identificacao = nome ? `${nome} (${u.email})` : u.email;

      return {
        id: u.id,
        email: u.email,
        papel,
        rotulo: `${identificacao} — ${papel}`,
      };
    })
    .sort((a, b) => a.papel.localeCompare(b.papel) || a.rotulo.localeCompare(b.rotulo));
}
