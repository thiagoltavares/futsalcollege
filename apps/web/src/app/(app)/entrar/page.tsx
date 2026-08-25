import { Aviso, Cartao } from "@/ui";
import { FormularioEntrar } from "./FormularioEntrar";
import { SeletorLoginDev } from "./SeletorLoginDev";
import { listarUsuariosLoginDev, loginDevHabilitado } from "./loginDev.servidor";

const MENSAGEM_ERRO: Record<string, string> = {
  "sem-codigo": "Link incompleto. Peça um novo link de acesso.",
  "link-invalido": "Esse link não é mais válido. Peça um novo link de acesso.",
  "login-dev-desligado": "O atalho de desenvolvimento está desligado neste ambiente.",
  "login-dev-invalido": "Escolha um usuário da lista para entrar.",
  "login-dev-falhou": "Não consegui entrar com esse usuário. Tente de novo.",
};

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { erro } = await searchParams;
  const mensagemErro = typeof erro === "string" ? MENSAGEM_ERRO[erro] : undefined;

  // A checagem mora no servidor: só quando ela devolve `true` é que a lista
  // de usuários (que exige a chave secreta) chega a ser buscada. Em
  // produção — ou com NEXT_PUBLIC_LOGIN_DEV desligado — `usuariosDev` fica
  // `null` e `SeletorLoginDev` nunca é desenhado.
  const usuariosDev = loginDevHabilitado() ? await listarUsuariosLoginDev() : null;

  return (
    <div className="fc-container fc-container--estreito">
      <div className="fc-cabecalho-pagina">
        <p className="fc-rotulo-secao fc-etiqueta-rotulo">Acesso do responsável</p>
        <h1 className="fc-titulo">Entrar</h1>
        <p className="fc-subtitulo">
          Enviamos um link de acesso para o seu e-mail. Sem senha para lembrar.
        </p>
      </div>

      <Cartao>
        <FormularioEntrar />
      </Cartao>

      {mensagemErro && (
        <Aviso tipo="erro" className="fc-espaco-topo">
          {mensagemErro}
        </Aviso>
      )}

      {usuariosDev && (
        <>
          <div className="fc-espaco" />
          <SeletorLoginDev usuarios={usuariosDev} />
        </>
      )}
    </div>
  );
}
