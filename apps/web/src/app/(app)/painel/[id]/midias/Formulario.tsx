"use client";

import { useActionState, useState, type FormEvent } from "react";
import { Aviso, Botao, Campo, EnvioArquivo } from "@/ui";
import { enviarMidia } from "./acoes";
import {
  comprimirImagem,
  ehTipoFoto,
  ehTipoVideo,
  extrairQuadroDeVideo,
  TAMANHO_MAX_FOTO,
  TAMANHO_MAX_VIDEO,
} from "@/lib/midia-cliente";

function mb(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

export function FormularioEnvioMidia({ atletaId }: { atletaId: string }) {
  const acao = enviarMidia.bind(null, atletaId);
  const [estado, disparar, pendente] = useActionState(acao, null);
  const [preparando, setPreparando] = useState(false);
  const [erroCliente, setErroCliente] = useState<string | null>(null);

  // Compressão de foto e extração do quadro de capa do vídeo acontecem
  // aqui, no navegador, antes do envio (ver AGENTS/brief da rodada e
  // `lib/midia-cliente.ts`) — o `action={disparar}` do form continua ali
  // embaixo como caminho de reforço (progressive enhancement): sem
  // JavaScript, o navegador envia o arquivo original direto pela Server
  // Action, do jeito que já funcionava antes desta rodada.
  async function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroCliente(null);

    const formulario = new FormData(evento.currentTarget);
    const arquivo = formulario.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      setErroCliente("Escolha uma foto ou um vídeo.");
      return;
    }

    setPreparando(true);
    try {
      if (ehTipoFoto(arquivo.type)) {
        const comprimido = await comprimirImagem(arquivo);
        if (comprimido.size > TAMANHO_MAX_FOTO) {
          setErroCliente(
            `Essa foto ainda ficou com ${mb(comprimido.size)} MB depois de comprimida — o limite é ${mb(TAMANHO_MAX_FOTO)} MB. Tente uma foto com menos detalhe ou tirada com resolução menor.`,
          );
          return;
        }
        formulario.set("arquivo", comprimido);
      } else if (ehTipoVideo(arquivo.type)) {
        if (arquivo.size > TAMANHO_MAX_VIDEO) {
          setErroCliente(
            `Esse vídeo tem ${mb(arquivo.size)} MB — o limite é ${mb(TAMANHO_MAX_VIDEO)} MB. Grave em qualidade menor, corte um trecho mais curto, ou comprima antes de enviar (o próprio app de câmera ou um editor de vídeo do celular fazem isso).`,
          );
          return;
        }
        const quadroCapa = await extrairQuadroDeVideo(arquivo);
        if (quadroCapa) formulario.set("capa_extraida", quadroCapa);
      }

      disparar(formulario);
    } finally {
      setPreparando(false);
    }
  }

  return (
    <form action={disparar} onSubmit={aoSubmeter} className="fc-form">
      <Campo
        id="arquivo"
        rotulo="Foto ou vídeo"
        ajuda="JPEG, PNG, WEBP, HEIC, MP4, MOV ou WEBM. Foto grande é redimensionada automaticamente antes de enviar."
      >
        {({ id, "aria-describedby": descritoPor }) => (
          <EnvioArquivo
            id={id}
            aria-describedby={descritoPor}
            name="arquivo"
            accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
            required
          />
        )}
      </Campo>

      <Campo
        id="legenda"
        rotulo="Legenda"
        opcional
        ajuda="Texto livre, até 280 caracteres. Nunca escreva escola, local ou horário de treino, nem telefone — isso não aparece em lugar nenhum público."
      >
        {(campo) => <textarea {...campo} name="legenda" maxLength={280} rows={2} />}
      </Campo>

      <Botao type="submit" carregando={pendente || preparando}>
        {preparando ? "Preparando arquivo…" : "Enviar"}
      </Botao>

      {(erroCliente ?? estado?.erro) && <Aviso tipo="erro">{erroCliente ?? estado?.erro}</Aviso>}
    </form>
  );
}
