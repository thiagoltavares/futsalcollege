"use client";

import { useEffect } from "react";

/**
 * Observa tudo que tiver [data-reveal] dentro da rota e marca .is-in
 * quando entra na viewport. Um observer só pra página inteira —
 * mais barato que um hook por bloco.
 */
export default function Reveal() {
  useEffect(() => {
    const alvos = document.querySelectorAll<HTMLElement>("[data-reveal]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      alvos.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("is-in");
          io.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    alvos.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
