"use client";

import { useEffect } from "react";

/**
 * Marca no sumário a seção em que o scroll está.
 *
 * A decisão de qual seção está ativa é simples: o último título que passou
 * pela "linha de leitura", a um quinto da altura da janela. Isso funciona bem
 * com seções de alturas muito diferentes — algumas aqui ocupam três telas,
 * outras meia — onde depender só do IntersectionObserver deixaria nenhuma ou
 * duas ativas ao mesmo tempo.
 *
 * O que é redundante de propósito é o *gatilho*. A mesma função é chamada por
 * scroll na window, scroll capturado no document (para quando quem rola é um
 * container externo, e não a janela) e IntersectionObserver. Basta um dos três
 * funcionar. Ambientes de visualização embarcada às vezes não entregam nenhum
 * evento de scroll à window, e o sumário congelaria na primeira seção.
 */
export default function Scrollspy() {
  useEffect(() => {
    const titulos = [...document.querySelectorAll<HTMLElement>(".plan-doc h2")];
    if (!titulos.length) return;

    const links = new Map<string, HTMLAnchorElement[]>();
    document
      .querySelectorAll<HTMLAnchorElement>(".plan-toc a[href^='#']")
      .forEach((a) => {
        const id = decodeURIComponent(a.hash.slice(1));
        links.set(id, [...(links.get(id) ?? []), a]);
      });

    let atual = "";
    let agendado = false;

    const atualizar = () => {
      agendado = false;

      const linha = window.innerHeight * 0.25;
      let id = titulos[0].id;

      for (const t of titulos) {
        if (t.getBoundingClientRect().top <= linha) id = t.id;
        else break;
      }

      // No fim da página a última seção é sempre a ativa; sem isto, seções
      // curtas no rodapé nunca chegam a cruzar a linha.
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
        id = titulos[titulos.length - 1].id;
      }

      if (id === atual) return;
      links.get(atual)?.forEach((a) => a.removeAttribute("data-ativo"));
      links.get(id)?.forEach((a) => a.setAttribute("data-ativo", "true"));
      atual = id;
    };

    // O agendamento passa por requestAnimationFrame para não recalcular a cada
    // evento de scroll. Mas rAF fica congelado enquanto a aba está oculta, e
    // sem o timer de segurança a flag ficaria presa em `true` para sempre —
    // o sumário morreria de vez, mesmo depois de a aba voltar.
    const agendar = () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(atualizar);
      setTimeout(() => {
        if (agendado) atualizar();
      }, 100);
    };

    atualizar();

    window.addEventListener("scroll", agendar, { passive: true });
    document.addEventListener("scroll", agendar, { passive: true, capture: true });
    window.addEventListener("resize", agendar);

    const observador = new IntersectionObserver(agendar, {
      rootMargin: "0px 0px -70% 0px",
      threshold: [0, 1],
    });
    titulos.forEach((t) => observador.observe(t));

    // Último recurso. Há ambientes de visualização embarcada que não entregam
    // scroll nem IntersectionObserver — e é justamente por eles que este
    // documento costuma ser lido. Uma verificação a cada 250ms, só com a aba
    // visível, custa nada perto de o sumário simplesmente não funcionar.
    const relogio = setInterval(() => {
      if (document.visibilityState === "visible") agendar();
    }, 250);

    return () => {
      window.removeEventListener("scroll", agendar);
      document.removeEventListener("scroll", agendar, { capture: true });
      window.removeEventListener("resize", agendar);
      observador.disconnect();
      clearInterval(relogio);
    };
  }, []);

  return null;
}
