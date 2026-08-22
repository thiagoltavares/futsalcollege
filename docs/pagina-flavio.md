# Página /profissional/flavio

Landing de apresentação profissional do Flávio Barbosa. Next.js 16 (App Router,
Turbopack) + Tailwind 4 + React 19.

## Arquivos

Tudo que a página precisa mora dentro da própria pasta da rota — é uma unidade
fechada, feita pra ser levantada inteira pro monorepo:

```
src/app/profissional/flavio/
├── page.tsx      Server Component. Fontes, metadata e todas as seções.
├── data.ts       Conteúdo. Fonte da verdade — só fato verificado entra aqui.
├── flavio.css    Estilo local, todo escopado sob .flv (não vaza pro app).
└── Reveal.tsx    Client Component. Um IntersectionObserver pra [data-reveal].
```

## Levar pro monorepo

1. Copiar a pasta `profissional/flavio` inteira pra dentro do `app/` do destino.
2. Garantir Tailwind 4 no app de destino (`@import "tailwindcss"` no CSS global).
   O `flavio.css` usa só CSS puro; as utilities vêm do Tailwind do host.
3. Fontes vêm por `next/font/google` dentro do `page.tsx` — nada a configurar.
4. Nenhuma dependência externa. Sem client-side JS além do `Reveal.tsx`.

## Design

Editorial esportivo em tinta escura: `Big Shoulders` condensada nos títulos,
`Instrument Serif` itálica nas citações, `Barlow` no corpo. Acento único
(`--gol: #ff3b14`) sobre osso/tinta, marcações de quadra em SVG no hero, grão
por cima de tudo. Um painel invertido (osso) separa "Em quadra" de "Na beira".

Respeita `prefers-reduced-motion`: todas as animações e reveals desligam.

## Conteúdo

Não adicionar fato em `data.ts` sem fonte primária. O registro de verificação e
a lista de pendências estão em [flavio-barbosa-bio.md](./flavio-barbosa-bio.md).

Placeholders a trocar antes de publicar:
- `mailto:contato@example.com` no rodapé
- link do Instagram no rodapé
