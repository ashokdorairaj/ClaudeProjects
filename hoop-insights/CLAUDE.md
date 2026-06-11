# hoop-insights

## Project Overview

hoop-insights is a Next.js 15 basketball video analysis application. Coaches and analysts upload game footage; the platform extracts key frames using FFmpeg, sends those frames to a Claude vision model for tactical recognition, and cross-references detected plays against a Pinecone vector database of known basketball schemes — delivering structured, searchable tactical reports for every game uploaded.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 — **App Router only** (no Pages Router) |
| Styling | TailwindCSS |
| Video processing | FFmpeg — frame extraction from uploaded game footage |
| AI / Vision | Vercel AI SDK → **Claude 3.5 Sonnet** (vision model) |
| Vector database | **Pinecone** — stores and retrieves basketball play/drill embeddings |

---

## Directory Conventions

```
hoop-insights/
├── app/
│   ├── api/                  ← ALL API routes live here (Next.js Route Handlers)
│   │   ├── upload/route.ts
│   │   ├── analyze/route.ts
│   │   └── knowledge/
│   │       ├── ingest/route.ts
│   │       └── search/route.ts
│   ├── (routes)/             ← UI pages
│   │   ├── page.tsx          ← Home / upload screen
│   │   ├── analysis/[id]/page.tsx
│   │   └── knowledge/page.tsx
│   └── layout.tsx
├── components/               ← Reusable React components
├── lib/                      ← Server-side utilities
│   ├── ffmpeg.ts             ← FFmpeg frame-extraction helpers
│   ├── pinecone.ts           ← Pinecone client + upsert/query helpers
│   └── ai.ts                 ← Vercel AI SDK wrappers (vision calls)
└── public/
```

---

## Data Flow

```
1. Upload     → POST /api/upload        — video stored, job queued
2. Extract    → lib/ffmpeg.ts           — FFmpeg pulls N frames as base64 images
3. Analyze    → POST /api/analyze       — frames sent to Claude 3.5 Sonnet via Vercel AI SDK
4. Match      → GET  /api/knowledge/search — detected plays queried against Pinecone
5. Report     → client                  — structured tactical report returned to UI
```

---

## API Route Map

| Method | Route | Responsibility |
|---|---|---|
| `POST` | `/app/api/upload` | Receives video file, stores it, triggers FFmpeg frame extraction |
| `POST` | `/app/api/analyze` | Sends extracted frames to Claude 3.5 Sonnet; returns play annotations |
| `POST` | `/app/api/knowledge/ingest` | Embeds basketball play/drill descriptions and upserts vectors into Pinecone |
| `GET`  | `/app/api/knowledge/search` | Queries Pinecone for plays similar to detected patterns |

### Knowledge Base — example entries
The Pinecone index stores embeddings for plays and defensive schemes including (but not limited to):
- Pick-and-roll (ball-handler, screener, coverage options)
- Zone defenses (2-3, 3-2, 1-3-1)
- Motion offense sets
- Horns sets
- Press-break sequences

---

## Coding Rules

- **Dark-mode aesthetic** — Tailwind dark backgrounds, cards with `rounded-xl`, clean padding (`p-5`/`p-6`), subtle borders
- **App Router only** — no `pages/` directory, no `getServerSideProps`, no class components
- **Route Handlers** — all backend logic in `/app/api/*/route.ts`; export named HTTP method functions (`GET`, `POST`, etc.)
- **Environment variables** — all secrets (`ANTHROPIC_API_KEY`, `PINECONE_API_KEY`, etc.) in `.env.local`; never committed
- **lib/ is server-only** — no `"use client"` in `lib/`; keep FFmpeg, Pinecone, and AI SDK calls strictly server-side
