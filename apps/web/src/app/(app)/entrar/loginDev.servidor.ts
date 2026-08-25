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
  rotulo: string;
  quantidadeAtletas: number;
};

/**
 * Rótulo do seletor: nome (ou e-mail, se o responsável ainda não tiver linha
 * em `responsaveis`) seguido da contagem de atletas — é essa contagem, não
 * um papel adivinhado, que diz se este usuário é útil para testar o painel.
 *
 * Zero atletas costumava virar "avaliador" só por exclusão (nenhum
 * responsável do seed fica sem filho) — uma heurística que quebra assim que
 * existe qualquer conta de zero atletas que não seja de profissional. Agora
 * que `profissionais.user_id` liga a conta de login à página pública (ver
 * migration 0010), o rótulo usa esse dado real em vez de adivinhar: mostra
 * a credencial de verdade quando a conta é de um profissional, e um rótulo
 * neutro ("sem atleta") quando não há nenhum vínculo a mostrar.
 */
function rotuloUsuarioLoginDev(
  identificacao: string,
  quantidadeAtletas: number,
  profissional: { credencial: string | null } | null,
): string {
  if (quantidadeAtletas > 0) {
    const sufixo = quantidadeAtletas === 1 ? "1 atleta" : `${quantidadeAtletas} atletas`;
    return `${identificacao} — ${sufixo}`;
  }
  if (profissional) {
    return `${identificacao} — profissional${profissional.credencial ? ` (${profissional.credencial})` : ""}`;
  }
  return `${identificacao} — sem atleta`;
}

/**
 * Lista os usuários existentes no ambiente local (seed + qualquer conta
 * criada durante o próprio smoke test) para popular o seletor de login de
 * desenvolvimento. Usa a Admin API (chave secreta) porque `auth.users` não é
 * alcançável por RLS a partir de nenhum cliente comum.
 *
 * Ordenada por quantidade de atletas, do maior para o menor: quem serve pra
 * testar o painel (responsável com filhos) aparece primeiro, e os
 * avaliadores sem atleta nenhum — que antes vinham no topo só porque
 * "Avaliador" vem antes de "Responsável" no alfabeto — ficam por último,
 * claramente identificados no próprio rótulo. `SeletorLoginDev` usa
 * `quantidadeAtletas` para agrupar a lista em dois `<optgroup>`.
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

  const [{ data: atletas }, { data: responsaveis }, { data: profissionais }] = await Promise.all([
    admin.from("atletas").select("responsavel_id").in("responsavel_id", ids),
    admin.from("responsaveis").select("id, nome").in("id", ids),
    admin.from("profissionais").select("user_id, credencial").in("user_id", ids),
  ]);

  const filhosPorResponsavel = new Map<string, number>();
  for (const a of atletas ?? []) {
    filhosPorResponsavel.set(a.responsavel_id, (filhosPorResponsavel.get(a.responsavel_id) ?? 0) + 1);
  }

  const nomePorId = new Map((responsaveis ?? []).map((r) => [r.id, r.nome]));

  const profissionalPorId = new Map(
    (profissionais ?? [])
      .filter((p): p is typeof p & { user_id: string } => Boolean(p.user_id))
      .map((p) => [p.user_id, { credencial: p.credencial }]),
  );

  return usuarios.users
    .filter((u): u is typeof u & { email: string } => Boolean(u.email))
    .map((u) => {
      const quantidadeAtletas = filhosPorResponsavel.get(u.id) ?? 0;
      const nome = nomePorId.get(u.id);
      const identificacao = nome ? `${nome} (${u.email})` : u.email;

      return {
        id: u.id,
        email: u.email,
        quantidadeAtletas,
        rotulo: rotuloUsuarioLoginDev(identificacao, quantidadeAtletas, profissionalPorId.get(u.id) ?? null),
      };
    })
    .sort(
      (a, b) => b.quantidadeAtletas - a.quantidadeAtletas || a.rotulo.localeCompare(b.rotulo),
    );
}
