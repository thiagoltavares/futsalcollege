import type { Metadata } from "next";
import Link from "next/link";
import { Barlow, Big_Shoulders, Instrument_Serif } from "next/font/google";

import { CabecalhoPublico, Cartao } from "@/ui";
import "@/ui/estilos.css";

// Fontes carregadas só nesta rota, mesmo padrão de /profissional/flavio,
// /plan e do grupo (app): cada rota pública traz as fontes que usa em vez
// de inflar o layout raiz, que é compartilhado por todas as rotas.
const display = Big_Shoulders({
  variable: "--font-fc-display",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-fc-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const corpo = Barlow({
  variable: "--font-fc-corpo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Futsal College — reconhecimento do futsal de base",
  description:
    "Cada atleta de 7 a 20 anos ganha uma ficha esportiva verificável, com avaliação técnica assinada por profissional credenciado.",
  openGraph: {
    title: "Futsal College — reconhecimento do futsal de base",
    description:
      "O trabalho do seu filho, registrado por quem entende de futsal: avaliação técnica assinada, física medida com protocolo, evolução no tempo.",
    locale: "pt_BR",
    type: "website",
  },
};

const EIXOS = [
  {
    nome: "Técnico",
    texto: "Domínio de bola, passe, finalização, 1x1.",
  },
  {
    nome: "Físico",
    texto: "Velocidade, resistência, coordenação — medidos com protocolo e instrumento, não a olho.",
  },
  {
    nome: "Tático",
    texto: "Leitura de jogo, posicionamento, decisão sob pressão.",
  },
  {
    nome: "Comportamental",
    texto: "Liderança, disciplina, reação ao erro, relação com o time.",
  },
] as const;

const PASSOS = [
  {
    numero: "01",
    titulo: "Cadastra e autoriza",
    texto:
      "Você cria o perfil do seu filho e assina o termo de consentimento. Sem essa autorização, nada fica público.",
  },
  {
    numero: "02",
    titulo: "Avaliação técnica assinada",
    texto:
      "Um profissional credenciado aplica a rubrica e assina o laudo — presencial ou por análise de vídeo.",
  },
  {
    numero: "03",
    titulo: "Ficha que acompanha a evolução",
    texto:
      "O perfil cresce junto com o atleta: cada nova avaliação entra no histórico, ao lado das anteriores.",
  },
] as const;

export default function Home() {
  return (
    <div className={`fc fc-pagina ${display.variable} ${serif.variable} ${corpo.variable}`}>
      <CabecalhoPublico />

      <main className="fc-corpo">
        {/* ============================ HERO ============================ */}
        <section className="fc-container fc-home-hero">
          <p className="fc-rotulo-secao fc-etiqueta-rotulo fc-home-eyebrow">Futsal College</p>
          <h1 className="fc-home-h1">
            O trabalho do seu filho, registrado por quem entende de futsal.
          </h1>
          <p className="fc-home-lead">
            Da Sub-7 à Sub-20, cada atleta ganha uma ficha esportiva verificável: avaliação
            técnica assinada por profissional credenciado, física medida com protocolo, e um
            registro que acompanha a evolução dele ao longo do tempo.
          </p>
          <div className="fc-home-acoes">
            <Link href="/entrar" className="fc-botao fc-botao--primario">
              Criar perfil do atleta
            </Link>
            <Link href="/atletas" className="fc-botao fc-botao--secundario">
              Ver atletas cadastrados
            </Link>
            <span className="fc-campo__ajuda">
              Leva poucos minutos. Nada fica público antes da sua autorização.
            </span>
          </div>
        </section>

        {/* ======================= COMO FUNCIONA ======================= */}
        <section id="como-funciona" className="fc-home-secao">
          <div className="fc-container">
            <div className="fc-home-secao__cabecalho">
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">Como funciona</p>
              <h2 className="fc-titulo">Três passos, do cadastro à ficha pronta</h2>
            </div>

            <div className="fc-home-passos">
              {PASSOS.map((passo) => (
                <div key={passo.numero} className="fc-home-passo">
                  <span className="fc-home-passo__numero">{passo.numero}</span>
                  <h3>{passo.titulo}</h3>
                  <p>{passo.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================== AVALIAÇÃO ========================= */}
        <section id="avaliacao" className="fc-home-secao">
          <div className="fc-container">
            <div className="fc-home-secao__cabecalho">
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">A avaliação</p>
              <h2 className="fc-titulo">Avaliação técnica assinada por quem entende</h2>
              <p className="fc-subtitulo">
                Não é opinião solta. É um método com rubrica própria, que todo avaliador
                credenciado segue — para que a ficha de um atleta signifique a mesma coisa que a
                de outro.
              </p>
            </div>

            <div className="fc-home-eixos">
              {EIXOS.map((eixo) => (
                <div key={eixo.nome} className="fc-home-eixo">
                  <p className="fc-home-eixo__rotulo">{eixo.nome}</p>
                  <p>{eixo.texto}</p>
                </div>
              ))}
            </div>

            <Cartao className="fc-home-eixo-nota">
              <p className="fc-subtitulo fc-subtitulo--livre">
                Cada item da rubrica carrega uma âncora descritiva, não só uma nota — o laudo
                registra avaliador e credencial, contexto da avaliação e a versão da rubrica
                usada. Publicado, ele não se edita: uma correção gera uma nova versão, com a
                anterior visível. É esse rigor que dá peso ao selo.
              </p>
            </Cartao>
          </div>
        </section>

        {/* ================= ESCOLINHAS E CLUBES/OLHEIROS ================ */}
        <section className="fc-home-secao">
          <div className="fc-container fc-home-duplo">
            <div id="escolinhas">
              <Cartao>
                <p className="fc-rotulo-secao fc-etiqueta-rotulo">Para escolinhas</p>
                <h3 className="fc-titulo fc-titulo--card">Cadastre a turma, acompanhe os alunos</h3>
                <p className="fc-subtitulo fc-subtitulo--livre">
                  O treinador cadastra a turma e acompanha quantos responsáveis já assinaram a
                  autorização. Cada aluno ganha o registro do próprio trabalho — um argumento de
                  matrícula que fica de pé sozinho.
                </p>
              </Cartao>
            </div>

            <div id="clubes">
              <Cartao>
                <p className="fc-rotulo-secao fc-etiqueta-rotulo">Para clubes e olheiros</p>
                <h3 className="fc-titulo fc-titulo--card">Entrada separada, busca por dado verificado</h3>
                <p className="fc-subtitulo fc-subtitulo--livre">
                  Clubes e olheiros usam a plataforma para buscar atletas por categoria, posição,
                  estatística oficial e avaliação técnica assinada. Identificação da criança e
                  vídeo ficam sempre atrás de verificação própria, separada do acesso público.
                </p>
              </Cartao>
            </div>
          </div>
        </section>

        {/* ============================ AUTORIDADE ======================== */}
        <section id="flavio" className="fc-home-secao">
          <div className="fc-container">
            <p className="fc-rotulo-secao fc-etiqueta-rotulo">Quem assina</p>
            <h2 className="fc-titulo">A avaliação tem nome e trajetória</h2>

            <Cartao className="fc-home-autoridade fc-home-eixo-nota">
              <div className="fc-home-autoridade__cabeca">
                <span className="fc-home-avatar" aria-hidden="true">
                  FB
                </span>
                <div>
                  <p className="fc-home-autoridade__nome">Flávio Barbosa</p>
                  <p className="fc-campo__ajuda">
                    Técnico das seleções de base (Sub-15, Sub-17 e Sub-20) do Futsal Sesc Ceará
                  </p>
                </div>
              </div>

              <div>
                <p className="fc-subtitulo fc-subtitulo--livre">
                  Vinte anos de futsal cearense — de artilheiro do Horizonte no Campeonato
                  Cearense de 2010 a técnico campeão invicto da Taça Liga Ceará 2023, eleito o
                  melhor técnico do torneio. É essa experiência que forma o método por trás de
                  cada laudo assinado na plataforma.
                </p>
                <Link href="/profissional/flavio" className="fc-botao fc-botao--secundario">
                  Conhecer a trajetória completa
                </Link>
              </div>
            </Cartao>
          </div>
        </section>

        {/* =========================== PRIVACIDADE ========================= */}
        <section id="privacidade" className="fc-home-secao">
          <div className="fc-container">
            <div className="fc-home-secao__cabecalho">
              <p className="fc-rotulo-secao fc-etiqueta-rotulo">Privacidade</p>
              <h2 className="fc-titulo">
                O que é público, o que é restrito, o que nunca aparece
              </h2>
              <p className="fc-subtitulo">
                Isso não é letra miúda — é a regra que decide o que fica visível sobre o seu
                filho, campo por campo.
              </p>
            </div>

            <div className="fc-home-privacidade">
              <Cartao>
                <span className="fc-etiqueta fc-etiqueta--sucesso fc-home-privacidade__titulo">
                  Público
                </span>
                <ul className="fc-home-privacidade__lista">
                  <li>Apelido esportivo</li>
                  <li>Categoria (ex.: Sub-13)</li>
                  <li>Posição, pé dominante e físico</li>
                  <li>Estatísticas oficiais de competição</li>
                  <li>Avaliação técnica e quem assinou</li>
                  <li>Clube atual e estado</li>
                </ul>
              </Cartao>

              <Cartao>
                <span className="fc-etiqueta fc-etiqueta--alerta fc-home-privacidade__titulo">
                  Só clube verificado
                </span>
                <ul className="fc-home-privacidade__lista">
                  <li>Nome completo</li>
                  <li>Data de nascimento</li>
                  <li>Cidade</li>
                  <li>Vídeos</li>
                  <li>Contato do responsável</li>
                </ul>
              </Cartao>

              <Cartao>
                <span className="fc-etiqueta fc-etiqueta--perigo fc-home-privacidade__titulo">
                  Nunca aparece
                </span>
                <ul className="fc-home-privacidade__lista">
                  <li>Bairro, endereço ou escola</li>
                  <li>Local e horário de treino</li>
                  <li>
                    Avaliação física, postural e de saúde — nem para clube verificado; só a
                    família e o profissional têm acesso
                  </li>
                </ul>
              </Cartao>
            </div>

            <p className="fc-home-privacidade__nota">
              Consentimento revogado tira o perfil do ar na hora: a ficha para de responder, sai
              da busca, e nenhum vídeo continua acessível.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
