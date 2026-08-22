# futsalcollege

Projeto de futsal. Next.js 16 (App Router) + React 19 + Tailwind CSS 4.

## Rodar

```bash
npm install
npm run dev
```

http://localhost:3000 — a raiz redireciona para `/profissional/flavio`.

## Rotas

| Rota | O quê |
|---|---|
| `/profissional/flavio` | Landing de apresentação profissional do Flávio Barbosa |

## Estrutura

```
src/app/
├── layout.tsx
├── page.tsx                     redirect → /profissional/flavio
└── profissional/flavio/         rota autocontida, pronta pra ir pro monorepo
    ├── page.tsx
    ├── data.ts
    ├── flavio.css
    └── Reveal.tsx

docs/
├── flavio-barbosa-bio.md        bio, copy e registro de verificação das fontes
└── pagina-flavio.md             notas de design e migração da página
```

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run lint` | eslint |

## Conteúdo

Os dados da página do Flávio ficam em `src/app/profissional/flavio/data.ts`.
Não adicionar fato sem fonte primária — o registro de verificação e as
pendências em aberto estão em [docs/flavio-barbosa-bio.md](docs/flavio-barbosa-bio.md).
