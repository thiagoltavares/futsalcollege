"use client";

import {
  CATEGORIAS,
  PESQUISA_BENEFICIO,
  PESQUISA_ENVIOU_VIDEO,
  PESQUISA_GASTO_MENSAL,
  PESQUISA_PERFIL,
  PESQUISA_PREOCUPACAO,
  PESQUISA_PUBLICA_VIDEO,
  PESQUISA_QUEM_VE_VIDEO,
  PESQUISA_RESULTADO_ENVIO,
  PESQUISA_TEM_VIDEO,
  contatoValido,
} from "@revela10/core";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { enviarPesquisa } from "./acoes";
import { Aviso, Botao, Campo, Seletor, type OpcaoSeletor } from "@/ui";

type Perfil = keyof typeof PESQUISA_PERFIL;

/** Estados por sigla, com o nome por extenso para leitor de tela e para o campo. */
const UFS: OpcaoSeletor[] = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
].map(([valor, nome]) => ({ valor, rotulo: valor, nomeAcessivel: nome }));

const CATEGORIAS_OPCOES: OpcaoSeletor[] = CATEGORIAS.map((c) => ({ valor: c, rotulo: c }));

/**
 * Opções em linhas inteiras de tocar, alvo grande. `onEscolher` existe
 * para os passos de resposta única avançarem sozinhos: um toque, próxima
 * pergunta.
 */
function Opcoes({
  nome,
  opcoes,
  tipo = "radio",
  colunas,
  onEscolher,
}: {
  nome: string;
  opcoes: Record<string, string>;
  tipo?: "radio" | "checkbox";
  colunas?: 2 | 3;
  onEscolher?: (valor: string, form: HTMLFormElement | null) => void;
}) {
  return (
    <div className="fc-pre-opcoes" data-colunas={colunas}>
      {Object.entries(opcoes).map(([valor, rotulo]) => (
        <label key={valor} className="fc-pre-opcao">
          <input
            type={tipo}
            name={nome}
            value={valor}
            onChange={onEscolher ? (evento) => onEscolher(valor, evento.currentTarget.form) : undefined}
          />
          <span>{rotulo}</span>
        </label>
      ))}
    </div>
  );
}

function SelecaoUf({ nome }: { nome: string }) {
  return <Seletor nome={nome} rotulo="Estado" opcoes={UFS} colunas={5} opcional />;
}

type Passo = {
  chave: string;
  titulo: string;
  ajuda?: string;
  corpo: ReactNode;
  /** Mensagem que impede avançar, ou `null` quando o passo está bom. */
  validar?: (dados: FormData) => string | null;
};

/** Um passo de resposta única: tocar já avança. */
function passoDeToque(
  chave: string,
  titulo: string,
  nome: string,
  opcoes: Record<string, string>,
  avancar: (valor: string, form: HTMLFormElement | null) => void,
  obrigatorio?: boolean,
  ajuda?: string,
): Passo {
  return {
    chave,
    titulo,
    ajuda,
    corpo: <Opcoes nome={nome} opcoes={opcoes} onEscolher={avancar} />,
    validar: obrigatorio ? (dados) => (dados.get(nome) ? null : "Escolha uma opção.") : undefined,
  };
}

/**
 * Passo final, comum a todos os perfis: aceita receber novidades? Sim /
 * Agora não; o campo de contato só aparece no Sim (por CSS, ver
 * `.fc-pre-novidades__email`). WhatsApp ou e-mail, no mesmo campo: WhatsApp
 * é o que todo mundo tem. O contato é do adulto e só é gravado com o Sim.
 */
function passoNovidades(): Passo {
  return {
    chave: "novidades",
    titulo: "Quer receber novidades do Revela 10?",
    ajuda: "Quando abrir e quando tiver coisa nova. Dá para sair quando quiser.",
    corpo: (
      <>
        <div className="fc-pre-opcoes" data-colunas={2}>
          <label className="fc-pre-opcao">
            <input type="radio" name="aceita_contato" value="on" />
            <span>Sim, quero</span>
          </label>
          <label className="fc-pre-opcao">
            <input type="radio" name="aceita_contato" value="nao" />
            <span>Agora não</span>
          </label>
        </div>
        <div className="fc-pre-novidades__email">
          <Campo
            id="contato"
            rotulo="Seu WhatsApp ou e-mail"
            ajuda="O seu, com DDD. Nada do seu filho entra aqui."
          >
            {(campo) => (
              <input {...campo} name="contato" maxLength={120} autoComplete="tel" placeholder="(85) 9 9999-9999" />
            )}
          </Campo>
        </div>
      </>
    ),
    validar: (dados) => {
      const resposta = dados.get("aceita_contato");
      if (!resposta) return "Escolha Sim ou Agora não.";
      if (resposta !== "on") return null;
      const contato = String(dados.get("contato") ?? "").trim();
      if (!contato) return "Deixe o seu WhatsApp ou e-mail, ou escolha Agora não.";
      if (!contatoValido(contato)) return "Confira o número com DDD, ou o e-mail.";
      return null;
    },
  };
}

/**
 * Trilha do responsável: só tocar. Palavras do dia a dia, frases curtas,
 * nenhum campo de texto (pedido do Flávio para as famílias do Sesc).
 * `soNunca`: quem nunca mandou vídeo pula "E deu em alguma coisa?".
 */
function passosResponsavel(
  avancar: (valor: string, form: HTMLFormElement | null) => void,
  soNunca: boolean,
): Passo[] {
  return [
    {
      chave: "filho",
      titulo: "Sobre seu filho ou filha",
      ajuda: "Pode pular se preferir.",
      corpo: (
        <div className="fc-pre-duplo">
          <Seletor
            nome="categoria_filho"
            rotulo="Categoria"
            opcoes={CATEGORIAS_OPCOES}
            colunas={4}
            opcional
          />
          <SelecaoUf nome="estado_uf" />
        </div>
      ),
    },
    {
      chave: "enviou",
      titulo: "Você já mandou vídeo dele para algum time, treinador ou peneira?",
      ajuda: "Pode marcar mais de uma.",
      corpo: <Opcoes nome="enviou_video" opcoes={PESQUISA_ENVIOU_VIDEO} tipo="checkbox" />,
      validar: (dados) =>
        dados.getAll("enviou_video").length === 0 ? "Marque uma opção." : null,
    },
    ...(soNunca
      ? []
      : [
          passoDeToque(
            "resultado",
            "E deu em alguma coisa?",
            "resultado_envio",
            PESQUISA_RESULTADO_ENVIO,
            avancar,
          ),
        ]),
    passoDeToque("tem-video", "Você tem vídeos dele jogando?", "tem_video", PESQUISA_TEM_VIDEO, avancar),
    passoDeToque(
      "gasto",
      "Além do treino, quanto você gasta com o futebol dele?",
      "gasto_mensal",
      PESQUISA_GASTO_MENSAL,
      avancar,
      false,
      "Peneira, viagem, chuteira, uniforme.",
    ),
    passoDeToque(
      "publica",
      "Você posta vídeo dele na internet?",
      "publica_video",
      PESQUISA_PUBLICA_VIDEO,
      avancar,
      true,
    ),
    passoDeToque(
      "quem-ve-video",
      "Se seu filho tivesse um perfil com vídeo, quem você deixaria ver?",
      "quem_ve_video",
      PESQUISA_QUEM_VE_VIDEO,
      avancar,
      true,
    ),
    passoDeToque(
      "preocupacao",
      "O que mais te preocupa em mostrar seu filho na internet?",
      "preocupacao",
      PESQUISA_PREOCUPACAO,
      avancar,
    ),
    passoDeToque(
      "beneficio",
      "O que mais ajudaria seu filho?",
      "beneficio",
      PESQUISA_BENEFICIO,
      avancar,
    ),
    passoNovidades(),
  ];
}

/**
 * Trilha de escolinha, clube, olheiro e outros: curta, com texto livre —
 * esse público escreve, e o que ele conta em frase vale mais que uma
 * opção. A UF tem nome próprio no HTML (`estado_uf_org`) e a Server Action
 * a traduz.
 */
function passosOrganizacao(): Passo[] {
  return [
    {
      chave: "organizacao",
      titulo: "De onde você fala?",
      ajuda: "Os dois são opcionais.",
      corpo: (
        <div className="fc-pre-duplo">
          <Campo id="organizacao" rotulo="Nome da escolinha, clube ou projeto" opcional>
            {(campo) => <input {...campo} name="organizacao" maxLength={120} />}
          </Campo>
          <SelecaoUf nome="estado_uf_org" />
        </div>
      ),
    },
    {
      chave: "como-hoje",
      titulo: "Hoje, como vocês descobrem ou mostram atleta de base?",
      corpo: (
        <Campo id="como_hoje" rotulo="Resposta livre" opcional>
          {(campo) => <textarea {...campo} name="como_hoje" rows={4} maxLength={500} />}
        </Campo>
      ),
    },
    {
      chave: "precisaria",
      titulo: "O que precisaria existir para isso ficar mais fácil?",
      corpo: (
        <Campo id="pedido" rotulo="Resposta livre" opcional>
          {(campo) => <textarea {...campo} name="pedido" rows={4} maxLength={500} />}
        </Campo>
      ),
    },
    passoNovidades(),
  ];
}

function Obrigado({ origem }: { origem: string | null }) {
  // Só renderiza no navegador, depois do envio (no servidor o estado é
  // sempre `null`), então `window` existe aqui.
  const link =
    typeof window === "undefined" ? "" : `${window.location.origin}/${origem ? `?de=${origem}` : ""}`;
  const texto = `Estão montando o Revela 10, um lugar para mostrar o futsal e o fut7 de base em vídeo, e querem ouvir as famílias antes de abrir. Leva 2 minutos, é só tocar nas respostas: ${link}`;

  return (
    <div className="fc-pre-obrigado" role="status">
      <span className="fc-pre-passo__numero" aria-hidden="true">
        10
      </span>
      <p className="fc-pre-obrigado__titulo">Resposta recebida.</p>
      <p className="fc-pre-obrigado__texto">
        Obrigado. Sua resposta ajuda a decidir o que vem primeiro. Conhece mais alguém da base? Manda
        o link.
      </p>
      {link && (
        <a
          className="fc-botao fc-botao--primario"
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Mandar no WhatsApp
        </a>
      )}
    </div>
  );
}

/**
 * A pesquisa, um passo por tela. O primeiro passo é quem está respondendo;
 * ele decide a trilha e avança sozinho ao escolher. Nos passos de resposta
 * única, tocar também avança — o mesmo caminho do botão Continuar
 * (`requestSubmit` no formulário), então a validação é a mesma.
 *
 * Todos os passos da trilha ficam montados (os de fora só com `hidden`),
 * para o `FormData` do envio final ter as respostas de todos. A trilha do
 * outro perfil NÃO é montada: quem troca de perfil no meio perde o que
 * respondeu na trilha anterior, em vez de enviar respostas escondidas.
 *
 * Envio por `onSubmit` + `startTransition`, e não por `action={...}`: o
 * React 19 limpa o formulário depois de uma action, inclusive quando ela
 * volta com erro.
 */
export function Pesquisa({
  origem,
  ativa,
  onSair,
}: {
  origem: string | null;
  ativa: boolean;
  onSair: () => void;
}) {
  const [estado, enviar, pendente] = useActionState(enviarPesquisa, null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [soNunca, setSoNunca] = useState(false);
  const [atual, setAtual] = useState(0);
  const [direcao, setDirecao] = useState<"avancar" | "voltar">("avancar");
  const [erroPasso, setErroPasso] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Um respiro para a marcação aparecer antes de trocar de tela; depois,
  // o mesmo caminho do botão Continuar. O formulário vem do próprio campo
  // tocado (`input.form`), não da ref, porque esta função é entregue aos
  // passos durante a renderização.
  const avancarSozinho = (_valor: string, form: HTMLFormElement | null) => {
    window.setTimeout(() => form?.requestSubmit(), 260);
  };

  const passoPerfil: Passo = {
    chave: "perfil",
    titulo: "Quem está respondendo?",
    ajuda: "Leva 2 minutos. É só tocar nas respostas.",
    corpo: (
      <Opcoes
        nome="perfil"
        opcoes={PESQUISA_PERFIL}
        colunas={2}
        onEscolher={(valor, form) => {
          setPerfil(valor as Perfil);
          avancarSozinho(valor, form);
        }}
      />
    ),
    validar: (dados) => (dados.get("perfil") ? null : "Escolha uma opção para continuar."),
  };

  const trilha =
    perfil === null
      ? []
      : perfil === "responsavel"
        ? passosResponsavel(avancarSozinho, soNunca)
        : passosOrganizacao();
  const passos = [passoPerfil, ...trilha];
  const ultimo = perfil !== null && atual === passos.length - 1;

  // Foco no enunciado a cada troca de passo (e ao entrar na pesquisa),
  // para o leitor de tela anunciar a pergunta nova e o teclado seguir dali.
  useEffect(() => {
    if (!ativa) return;
    formRef.current
      ?.querySelector<HTMLElement>(`[data-passo="${atual}"] .fc-pre-passo__titulo`)
      ?.focus({ preventScroll: true });
  }, [atual, ativa]);

  if (estado && "ok" in estado) return <Obrigado origem={origem} />;

  function avancar() {
    const form = formRef.current;
    if (!form) return;
    const dados = new FormData(form);
    const erro = passos[atual]?.validar?.(dados) ?? null;
    if (erro) {
      setErroPasso(erro);
      return;
    }
    setErroPasso(null);
    if (ultimo) {
      startTransition(() => enviar(dados));
      return;
    }
    setDirecao("avancar");
    setAtual((a) => Math.min(a + 1, passos.length - 1));
  }

  function voltar() {
    setErroPasso(null);
    if (atual === 0) {
      onSair();
      return;
    }
    setDirecao("voltar");
    setAtual((a) => a - 1);
  }

  // Antes de escolher o perfil a trilha ainda não existe, então não há total.
  const total = perfil === null ? null : passos.length;
  const progresso = total === null ? 0.04 : (atual + 1) / total;

  return (
    <form
      ref={formRef}
      className="fc-pre-form"
      data-direcao={direcao}
      noValidate
      onChange={(evento) => {
        // Mexeu em qualquer resposta, some o aviso do passo.
        if (erroPasso) setErroPasso(null);
        const alvo = evento.target;
        if (alvo instanceof HTMLInputElement && alvo.name === "enviou_video" && formRef.current) {
          const marcados = new FormData(formRef.current).getAll("enviou_video");
          setSoNunca(marcados.length === 1 && marcados[0] === "nunca");
        }
      }}
      onSubmit={(evento) => {
        evento.preventDefault();
        avancar();
      }}
    >
      {origem && <input type="hidden" name="origem" value={origem} />}
      {/* Campo-isca para robô: fora da tela e fora do leitor de tela. */}
      <div className="fc-pre-isca" aria-hidden="true">
        <label>
          Site <input type="text" name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="fc-pre-form__topo">
        <div
          className="fc-pre-progresso"
          role="progressbar"
          aria-label="Progresso da pesquisa"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progresso * 100)}
        >
          <span style={{ transform: `scaleX(${progresso})` }} />
        </div>
        <p className="fc-pre-form__contagem">
          {total === null ? "Pesquisa Revela 10" : `${atual + 1} de ${total}`}
        </p>
      </div>

      <div className="fc-pre-form__corpo">
        {passos.map((passo, indice) => {
          const tituloId = `passo-${passo.chave}-titulo`;
          return (
            <div
              key={passo.chave}
              className="fc-pre-passo"
              data-passo={indice}
              hidden={indice !== atual}
              role="group"
              aria-labelledby={tituloId}
            >
              <span className="fc-pre-passo__numero" aria-hidden="true">
                {indice + 1}
              </span>
              <h2 id={tituloId} className="fc-pre-passo__titulo" tabIndex={-1}>
                {passo.titulo}
              </h2>
              {passo.ajuda && <p className="fc-pre-passo__ajuda">{passo.ajuda}</p>}
              <div className="fc-pre-passo__corpo">{passo.corpo}</div>
            </div>
          );
        })}

        {erroPasso && (
          <p className="fc-pre-passo__erro" role="alert">
            {erroPasso}
          </p>
        )}
        {estado && "erro" in estado && <Aviso tipo="erro">{estado.erro}</Aviso>}
      </div>

      <div className="fc-pre-form__base">
        <button type="button" className="fc-botao fc-botao--secundario" onClick={voltar}>
          Voltar
        </button>
        <Botao type="submit" carregando={pendente}>
          {ultimo ? "Enviar" : "Continuar"}
        </Botao>
      </div>
    </form>
  );
}
