# hoop-insights Monorepo

## Structure

```
hoop-insights/
├── web/       ← Next.js 15 Coach's Dashboard (App Router, TailwindCSS, Video RAG pipeline)
└── mobile/    ← Expo / React Native companion app
```

## Workspaces

| Workspace | Package name | Run dev |
|---|---|---|
| `web/` | `@hoop-insights/web` | `npm run web:dev` |
| `mobile/` | `@hoop-insights/mobile` | `npm run mobile:start` |

Run `npm install` at the repo root to install all workspace dependencies.

## Web workspace

Full architecture is in `web/CLAUDE.md`.
- Next.js 15 App Router only
- TailwindCSS
- FFmpeg frame extraction via `fluent-ffmpeg`
- Vercel AI SDK → Claude 3.5 Sonnet (vision) + OpenAI embeddings
- Pinecone vector DB for the basketball Knowledge Base

## Mobile workspace

Expo + React Native (TypeScript). Companion app to the web dashboard —
shares play analysis results and drill recommendations with coaches on the go.

## Coding rules (both workspaces)

- All secrets in `.env.local` at the workspace level; never committed
- Dark-mode aesthetic throughout
- TypeScript strict mode in both workspaces
