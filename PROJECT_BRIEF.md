# Project brief: AI Captioner

Portfolio project for Italian CS / Computer Engineering master's applications (AI/ML track).
It must show real ML work (model comparison, evaluation metrics, embeddings), not just an LLM API call.

## Progress

- [ ] Phase 1 – Bug fixes and cleanup (fixes done; awaiting full Postman run with real .env)
- [ ] Phase 2 – Caption controls (tone / length, regenerate)
- [ ] Phase 3 – React frontend (`ai-captioner-frontend/`)
- [ ] Phase 4 – Semantic search with CLIP + Atlas Vector Search
- [ ] Phase 5 – Model benchmark: Gemini 2.5 Flash vs BLIP on COCO (`benchmark/`)
- [ ] Phase 6 – Docs and deployment (Render, Vercel, Atlas)

## Current backend (`ai-captioner-backend/`)

Node.js (ES modules), Express 5, MongoDB/Mongoose 8, JWT auth (bcryptjs), Multer (memory),
ImageKit for storage, Google Gemini 2.5 Flash (`@google/genai`) for captions.

Env vars: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `IMAGEKIT_PUBLIC_KEY`,
`IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`, `CORS_ORIGIN`, `PORT`. Never commit `.env`.

## Phase 1 – Known bugs and cleanup

- [x] `deletePost` uses `post.remove()` (removed in Mongoose 8) → `deleteOne()`
- [x] Hardcoded `image/jpeg` MIME in `ai.service.js` and `.jpg` extension in `imagekit.service.js`
- [x] Gemini failure saves "AI caption unavailable" as the caption → return a proper error
- [x] Multer has no limits → jpeg/png/webp only, ~5 MB cap
- [x] Register/login have no input validation (missing fields → 500)
- [x] `services/gemini.service.js` is a stale duplicate → delete
- [x] `utils/token.js` empty, `cookie-parser` unused → remove
- [x] Default CORS origin → `http://localhost:5173`
- [x] Add `.env.example`

## Phase 2 – Caption controls

`POST /api/posts` accepts optional `tone` (witty, formal, poetic, descriptive) and `length`
(short/medium/long), built into the Gemini prompt. Add an endpoint to regenerate a post's caption.

## Phase 3 – React frontend

`ai-captioner-frontend/`, React + Vite + Tailwind. Pages: register/login (store JWT), upload with
preview and tone/length controls, public feed, my posts with delete, search. Clean, responsive, polished.

## Phase 4 – Semantic search with CLIP

- CLIP image embedding on post creation via `@xenova/transformers` + `Xenova/clip-vit-base-patch32` (Node, no Python service)
- Store the vector on the Post document; MongoDB Atlas Vector Search index
- `GET /api/posts/search?q=` (text→image) and `GET /api/posts/:id/similar` (image→image)

## Phase 5 – Model benchmark (main ML deliverable)

In `benchmark/`, Colab-compatible notebook or script:
- Random subset of 100–200 COCO val2017 images (5 reference captions each), fixed seed
- Captions from Gemini 2.5 Flash (same neutral descriptive prompt) and BLIP (`Salesforce/blip-image-captioning-base`)
- Metrics: BLEU-4, METEOR, CIDEr (pycocoevalcap), reference-free CLIPScore (torchmetrics), average latency
- Output `benchmark/results.json`, a markdown table, and qualitative examples where the models disagree
- **Only real measured numbers. Never invent or estimate metrics.**

## Phase 6 – Docs and deployment

Root README: what it does, architecture diagram, tech stack, setup, API reference, benchmark table
with short analysis, screenshots, live demo link. Backend → Render, frontend → Vercel, DB → Atlas.

## Ground rules

- Match existing style: ES modules, controllers/services/routes, async/await with try/catch
- One phase at a time; test each (backend via Postman CLI, frontend locally)
- Small descriptive commit per logical change; don't push until approved
- Ask before creating accounts, using paid APIs, or deploying
- Explain ML concepts (CIDEr, BLEU, CLIPScore, embeddings, vector search) along the way

## Definition of done

- All bugs fixed, every endpoint tested
- Frontend works end-to-end: auth, upload, captions with tone, feed, delete, search
- Benchmark results from real runs, discussed in README
- Both apps deployed with working demo link
- Final: updated Europass project description (Title / Description / Link) and 2 resume bullets with real metrics
