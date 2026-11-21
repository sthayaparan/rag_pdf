# rag_pdf

A chat web app that answers questions from the PDF documents in `knowledgebase/`, citing the pages it used.

Next.js frontend, FastAPI backend with a LangChain agent, Chroma vector store, OpenAI embeddings and an OpenRouter chat model.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) and Node.js 20+
- A `.env` file in the project root:

```
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...
CHAT_MODEL=openai/gpt-5-mini   # optional
```

## Run

Start the backend, then the frontend. Windows:

```
powershell -File scripts/start-backend.ps1
powershell -File scripts/start-frontend.ps1
```

Linux:

```
scripts/start-backend.sh
scripts/start-frontend.sh
```

Open http://localhost:3000. The first backend start embeds the PDFs, which takes several minutes. Logs are written to `scripts/`.

To stop, run `stop-frontend` and `stop-backend` (`.ps1` or `.sh`) in `scripts/`.

## Knowledge base

Add PDFs anywhere under `knowledgebase/`, then rebuild the vector store:

```
cd backend
uv run python -m app.ingest
```

## Tests

```
cd backend && uv run pytest
cd frontend && npm test
cd frontend && npm run test:e2e   # needs the servers running
```
