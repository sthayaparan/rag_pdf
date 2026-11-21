import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request

from app.ingest import build_vector_store, get_vector_store
from app.rag import ChatAnswer, ChatRequest, ask, create_chat_model, create_rag_agent

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    store = get_vector_store()
    build_vector_store(store)
    app.state.agent = create_rag_agent(create_chat_model(), store)
    yield


app = FastAPI(title="PDF Knowledge Base Chat", lifespan=lifespan)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
def chat(body: ChatRequest, request: Request) -> ChatAnswer:
    return ask(request.app.state.agent, body.session_id, body.message)
