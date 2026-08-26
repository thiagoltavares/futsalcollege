import { criarClienteAdmin } from "@/lib/supabase/admin";

/**
 * Trava do atalho de demonstração.
 *
 * Este atalho loga como qualquer responsável SEM SENHA. Enquanto ligado, é
 * porta aberta para tudo que um responsável enxerga — inclusive
 * `atleta_identificacao` e `atleta_saude`, que a RLS esconde do público.
 *
 * Decisão do dono do produto (fase de testes, base sintética, avaliação com
 * o sócio): fica ligado também em produção, comandado por uma única
 * variável. Era `NODE_ENV !== "production" && NEXT_PUBLIC_LOGIN_DEV === "1"`;
 * a checagem de ambiente saiu, a variável ficou.
 *
 * PARA FECHAR: remova `NEXT_PUBLIC_LOGIN_DEV` do ambiente (na Vercel:
 * Project Settings → Environment Variables). Sem ela o atalho some, e não há
 * mais nada a desfazer em código.
 *
 * ANTES DE ENTRAR QUALQUER CRIANÇA REAL: além de remover a variável, troque
 * a senha compartilhada do seed (`senha-de-teste-123`, versionada no
 * repositório) e reveja se as contas do seed devem continuar existindo.
 *
 * Chamada tanto pela página (decide se desenha o seletor) quanto pela Server
 * Action (decide se aceita o login) — nunca confie só na tela esconder.
 */
export function loginDevHabilitado(): boolean {
  return process.env.NEXT_PUBLIC_LOGIN_DEV === "1";
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
