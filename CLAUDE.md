# CLAUDE.md

AI-powered React component generator. Users describe UI in chat; Claude generates JSX into a virtual filesystem; a live preview renders it in a sandboxed iframe via browser-native import maps and Tailwind CDN.

## Commands

```bash
npm run setup          # Install deps, generate Prisma client, run migrations
npm run dev            # Dev server (Next.js + Turbopack)
npm run dev:daemon     # Dev server in background (logs → logs.txt)
npm run build          # Production build
npm run lint           # ESLint
npm test               # Vitest (all tests)
npx vitest run <file>  # Single test file
npm run db:reset       # Reset SQLite database
```

## Tech Stack

Next.js 15 (App Router, Turbopack) · React 19 · Vercel AI SDK (`ai` + `@ai-sdk/anthropic`, model: `claude-haiku-4-5`) · Prisma (SQLite) · shadcn/ui (new-york) · Tailwind CSS v4 · Monaco Editor · react-resizable-panels · Vitest + Testing Library + jsdom

## Architecture

### Data Flow

1. **Chat** — `ChatProvider` → `POST /api/chat` → Claude via `streamText`. System prompt at `src/lib/prompts/generation.tsx` instructs JSX + Tailwind output, entry point `/App.jsx`.
2. **Tool Execution** — LLM calls `str_replace_editor` (create/view/replace/insert) and `file_manager` (rename/delete) against server-side `VirtualFileSystem`.
3. **Client Sync** — Tool calls echo to client via `onToolCall`. `FileSystemProvider` replays operations on its client-side VFS, triggering re-renders.
4. **Preview** — `PreviewFrame` transforms VFS files through `@babel/standalone` (JSX → ES modules), builds blob URL import maps, renders in sandboxed iframe. Third-party deps resolve via `esm.sh`; CSS injected as `<style>` tags.

### Key Abstractions

| Abstraction | Location | Purpose |
|---|---|---|
| `VirtualFileSystem` | `src/lib/file-system.ts` | In-memory file tree with serialize/deserialize. Used server-side (tools) and client-side (editor). Mutates internal state by design. |
| Context Providers | `src/lib/contexts/` | `FileSystemProvider` (VFS + React state + tool dispatch), `ChatProvider` (wraps `useChat`) |
| JSX Transformer | `src/lib/transform/jsx-transformer.ts` | Babel pipeline: import maps, `@/` alias support, missing-import placeholders, CSS collection |
| LLM Tools | `src/lib/tools/` | `str-replace.ts` (SWE-bench style editor), `file-manager.ts` (rename/delete) |

### Auth & Persistence

- JWT auth via `jose` — httpOnly cookies, 7-day expiry (`src/lib/auth.ts`)
- SQLite via Prisma — messages and VFS stored as JSON in `Project.messages` / `Project.data`
- Anonymous users work without auth (client-side `anon-work-tracker`); data migrates on sign-up
- Post-auth redirect: anon work → most recent project → new project

### Mock System

Without `ANTHROPIC_API_KEY`, `MockLanguageModel` (`src/lib/provider.ts`) returns canned counter/form/card responses. Uses `maxSteps: 4` (vs 40 in prod) to prevent repetition.

### Path Aliases

`@/*` → `./src/*` (tsconfig). The VFS also supports `@/` imports mapping to VFS root `/`.

## Gotchas

- `node-compat.cjs` is required via `NODE_OPTIONS` in all scripts — fixes Node 25+ SSR issues with global `localStorage`/`sessionStorage`
- `VirtualFileSystem` intentionally mutates internal state (exception to immutability rule)
- Prisma client outputs to `src/generated/prisma` (non-default location)

## Code Style

- Use comments sparingly. Only comment complex code.
