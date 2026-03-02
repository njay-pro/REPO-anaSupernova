# AI Coding Agent Context (GEMINI.md)

---

## 🚀 1. Project Overview & Identity
- **Project Name:** Ana Supernova (ana-style-transfer-machine)
- **Primary Goal:** A Next.js web application functioning as an AI-driven chat and an Image Style Transfer Generator.
- **Role of the App:** It has conversational elements powered by LLMs, a RAG system for specific knowledge, and an external webhook trigger for generating images/styles.

## 🛠️ 2. Technology Stack
- **Framework:** Next.js `16.1.6` (App Router `src/app/`)
- **UI & Components:** React `19.2.3`, Tailwind CSS v4, `lucide-react` for icons.
- **Language / Runtime:** TypeScript, Node.js + Bun.
- **Tooling:** ESLint, Turbopack enabled by default in Next.js 16.

## 🧠 3. Critical Architecture & Security Rules
1. **Strict Client/Server Separation:** 
   - Never expose API keys (`API_KEY`, `PINECONE_...`) to frontend `src/components` or `src/lib/api.ts`.
   - ALL interactions with external services (Gemini, Pinecone, Webhooks) must go through Next.js API Routes (`src/app/api/...`).
2. **API Service Layer (`src/lib/api.ts`):**
   - The frontend uses `ApiService` (`chatCall`, `generateCall`, `searchPinecone`) to interact with our backend relative routes. Keep frontend functions clean and purely delegated to the backend APIs.

## 🔑 4. Third-Party Integrations & Known Gotchas

### A. Google Gemini (LLMs & Embeddings)
- **Chat Models:** Defaults to `gemini-3-flash` (or older fallback equivalents depending on standard API v1beta limits).
- **Embeddings [⚠️ CRITICAL BUG PREVENTED]:** 
  - Model: `models/gemini-embedding-001`.
  - **Gotcha:** The Pinecone index is explicitly configured for **768 dimensions**. By default, `gemini-embedding-001` returns 3072 dimensions.
  - **Rule:** Any call to `embedContent` for Pinecone search must explicitly pass `outputDimensionality: 768` in the request body. *(Failure to do this results in a Pinecone 500 error).*

### B. Pinecone (RAG Vector Database)
- **Host Config:** Located in `.env.local` (`PINECONE_HOST`, `PINECONE_API_KEY`).
- **Standard Search Flow:** 
  1. Vectorize query to 768 dimensions.
  2. Call Pinecone `/query` endpoint.
  3. Return Top K matches with metadata included.

### C. n8n Webhooks (Image Generation)
- **Webhook Host:** `n8n.njay.pro`.
- **Purpose:** `/api/generate` hits this webhook to kick off style transfers/image processing workloads.

## 📁 5. Folder Structure Summary
- `src/app/`
  - `page.tsx`, `layout.tsx` (Client / UI App entry point)
  - `api/chat/route.ts` (Handles LLM Chat Logic)
  - `api/search/route.ts` (Handles RAG/Pinecone search logic)
  - `api/generate/route.ts` (Handles Webhook call for Image Gen)
- `src/components/` (React UI components and Chat interfaces)
- `src/lib/` (Utilities and Frontend-to-Backend `api.ts` connectors)
- `src/prompts/` (Internal markdown / prompts used by the app's internal agents)

## 🎯 6. Development Directives
- Always run `npm run dev` or `bun dev` to verify localhost.
- Check `package.json` for precise dependencies before adding conflicting libraries.
- Prefer explicit tool calls (like reading files or writing to files using Agent tools). Never assume the codebase structure has remained unchanged without listing the directory first.
- **Deployment Rules**: Do not assume standard Vercel environment. Configure build outputs for standard Node deployments (`npm run start` or Docker if instructed).
- **Mind your styles:** The app uses Tailwind v4 syntax. Pay attention to how utility classes are configured.
