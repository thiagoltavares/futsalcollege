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

/**
 * As visões distintas da app. Uma conta pertence a exatamente uma, e é isso
 * — não a quantidade de contas — que o seletor precisa cobrir.
 *
 * `sem_persona` não é uma visão do produto: é o resto. Cai aqui quem foi
 * criado pelo signup durante um smoke test e ainda não cadastrou atleta
 * nenhum. Existe para que essa conta continue alcançável pelo atalho (era
 * o comportamento antigo, quando a lista mostrava o banco inteiro), sem
 * poluir: num seed recém-aplicado este grupo vem vazio e nem é desenhado.
 */
export type Persona = "responsavel" | "avaliador" | "olheiro" | "sem_persona";

export type UsuarioLoginDev = {
  id: string;
  email: string;
  persona: Persona;
  /** Nome quando existe, e-mail quando não — já com o detalhe que distingue. */
  rotulo: string;
};

/** Quantas contas de cada persona o seletor mostra. */
const POR_PERSONA = 2;

export const ROTULO_PERSONA: Record<Persona, string> = {
  responsavel: "Responsável",
  avaliador: "Avaliador",
  olheiro: "Olheiro verificado",
  sem_persona: "Sem persona (criadas fora do seed)",
};

/** Ordem em que os grupos aparecem no seletor. */
export const ORDEM_PERSONAS: Persona[] = [
  "responsavel",
  "avaliador",
  "olheiro",
  "sem_persona",
];

type Conta = {
  id: string;
  email: string;
  criadoEm: number;
  persona: Persona;
  nome: string | null;
  credencial: string | null;
  /** Atletas para responsável, laudos para avaliador; 0 nas demais personas. */
  peso: number;
};

/**
 * O papel que autoriza o olheiro mora em `app_metadata` do JWT — é o que a
 * policy `identificacao_olheiro_verificado` (migration 0002) lê. Aqui a
 * leitura é do lado do admin, sobre o usuário, mas a chave é a mesma:
 * `raw_app_meta_data` no banco vira `app_metadata` no token.
 */
function ehOlheiro(appMetadata: Record<string, unknown> | undefined): boolean {
  return appMetadata?.papel === "olheiro_verificado";
}

/**
 * Persona a partir do dado que já existe, sem adivinhação: linha em
 * `profissionais` é avaliador (é ela que habilita assinar laudo em
 * `/avaliar/[atletaId]`), papel no `app_metadata` é olheiro, atleta próprio
 * é responsável. O resto não é visão nenhuma.
 *
 * A ordem importa: profissional vem antes de responsável porque um avaliador
 * que por acaso também seja pai de atleta cadastrado continua sendo a conta
 * de avaliador do seletor — é para essa visão que ela serve.
 */
function classificar(
  ehProfissional: boolean,
  appMetadata: Record<string, unknown> | undefined,
  quantidadeAtletas: number,
): Persona {
  if (ehProfissional) return "avaliador";
  if (ehOlheiro(appMetadata)) return "olheiro";
  if (quantidadeAtletas > 0) return "responsavel";
  return "sem_persona";
}

/**
 * O detalhe que vai depois do nome. Não é enfeite: é o que diferencia as
 * duas contas do mesmo grupo e diz, antes do clique, o que se vai encontrar
 * do outro lado.
 */
function detalhe(conta: Conta): string {
  switch (conta.persona) {
    case "responsavel":
      return conta.peso === 1 ? "1 atleta" : `${conta.peso} atletas`;
    case "avaliador": {
      const laudos = conta.peso === 1 ? "1 laudo" : `${conta.peso} laudos`;
      return conta.credencial ? `${conta.credencial} · ${laudos}` : laudos;
    }
    case "olheiro":
      return "vê identificação de atleta ativo";
    case "sem_persona":
      return "sem atleta, sem laudo";
  }
}

/**
 * Escolhe as duas contas que melhor cobrem a persona.
 *
 * Para responsável e avaliador, `peso` (atletas e laudos) ordena o grupo e
 * tomamos os extremos — a conta mais cheia e a mais vazia. Duas contas do
 * meio da lista mostrariam a mesma tela duas vezes; os extremos mostram o
 * painel lotado e o painel quase vazio, que é onde layout costuma quebrar.
 *
 * Nas demais personas o peso é sempre 0, então o critério vira o desempate:
 * conta mais recente primeiro em `sem_persona` (é a que o smoke test acabou
 * de criar), alfabético no resto.
 */
function escolherDuas(contas: Conta[]): Conta[] {
  if (contas.length <= POR_PERSONA) return contas;

  if (!contas.some((c) => c.peso > 0)) {
    const maisRecentePrimeiro = contas[0].persona === "sem_persona";
    const ordenadas = [...contas].sort((a, b) =>
      maisRecentePrimeiro ? b.criadoEm - a.criadoEm : a.email.localeCompare(b.email),
    );
    return ordenadas.slice(0, POR_PERSONA);
  }

  const ordenadas = [...contas].sort(
    (a, b) => b.peso - a.peso || a.email.localeCompare(b.email),
  );
  return [ordenadas[0], ordenadas[ordenadas.length - 1]];
}

/**
 * Popula o seletor de login de desenvolvimento com, no máximo, duas contas
 * por persona.
 *
 * Antes isto devolvia o banco inteiro (`perPage: 200`) e o seletor ficava
 * com 27 linhas — 23 responsáveis que abrem exatamente a mesma tela, quatro
 * avaliadores idem, e nenhum olheiro, que é a visão em que um erro de RLS
 * vaza identificação de criança. Contagem alta, cobertura baixa. Agora a
 * lista é curta e cobre todas as visões que existem.
 *
 * A busca continua lendo o banco todo: a Admin API é o único caminho até
 * `auth.users` (nenhum cliente com RLS alcança essa tabela), e o corte por
 * persona depende de contar atletas e laudos de todas as contas antes de
 * saber quais são os extremos. O que encurtou foi o que sai daqui.
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

  const [{ data: atletas }, { data: responsaveis }, { data: profissionais }, { data: laudos }] =
    await Promise.all([
      admin.from("atletas").select("responsavel_id").in("responsavel_id", ids),
      admin.from("responsaveis").select("id, nome").in("id", ids),
      admin.from("profissionais").select("user_id, credencial").in("user_id", ids),
      admin.from("laudos").select("avaliador_id").in("avaliador_id", ids),
    ]);

  const atletasPorResponsavel = new Map<string, number>();
  for (const a of atletas ?? []) {
    atletasPorResponsavel.set(
      a.responsavel_id,
      (atletasPorResponsavel.get(a.responsavel_id) ?? 0) + 1,
    );
  }

  const laudosPorAvaliador = new Map<string, number>();
  for (const l of laudos ?? []) {
    laudosPorAvaliador.set(l.avaliador_id, (laudosPorAvaliador.get(l.avaliador_id) ?? 0) + 1);
  }

  const nomePorId = new Map((responsaveis ?? []).map((r) => [r.id, r.nome]));

  const credencialPorId = new Map(
    (profissionais ?? [])
      .filter((p): p is typeof p & { user_id: string } => Boolean(p.user_id))
      .map((p) => [p.user_id, p.credencial]),
  );

  const contas: Conta[] = usuarios.users
    .filter((u): u is typeof u & { email: string } => Boolean(u.email))
    .map((u) => {
      const ehProfissional = credencialPorId.has(u.id);
      const quantidadeAtletas = atletasPorResponsavel.get(u.id) ?? 0;
      const persona = classificar(
        ehProfissional,
        u.app_metadata as Record<string, unknown> | undefined,
        quantidadeAtletas,
      );

      return {
        id: u.id,
        email: u.email,
        criadoEm: Date.parse(u.created_at),
        persona,
        nome: nomePorId.get(u.id) ?? null,
        credencial: credencialPorId.get(u.id) ?? null,
        peso:
          persona === "avaliador"
            ? (laudosPorAvaliador.get(u.id) ?? 0)
            : persona === "responsavel"
              ? quantidadeAtletas
              : 0,
      };
    });

  return ORDEM_PERSONAS.flatMap((persona) =>
    escolherDuas(contas.filter((c) => c.persona === persona)).map((c) => ({
      id: c.id,
      email: c.email,
      persona: c.persona,
      rotulo: `${c.nome ? `${c.nome} (${c.email})` : c.email} — ${detalhe(c)}`,
    })),
  );
}
