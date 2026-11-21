from pathlib import Path

import pytest
from langchain_core.documents import Document
from langchain_core.embeddings import DeterministicFakeEmbedding
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import Field
from reportlab.pdfgen import canvas

from app.ingest import get_vector_store


class FakeToolModel(BaseChatModel):
    """Chat model returning scripted responses (including tool calls) and recording its inputs."""

    responses: list[AIMessage]
    received: list[list[BaseMessage]] = Field(default_factory=list)

    @property
    def _llm_type(self) -> str:
        return "fake-tool-model"

    def bind_tools(self, tools, **kwargs):
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs) -> ChatResult:
        self.received.append(list(messages))
        return ChatResult(generations=[ChatGeneration(message=self.responses.pop(0))])


def search_call(query: str, call_id: str) -> AIMessage:
    return AIMessage("", tool_calls=[{"name": "search_knowledgebase", "args": {"query": query}, "id": call_id}])


def final_answer(answer: str, call_id: str) -> AIMessage:
    return AIMessage("", tool_calls=[{"name": "AgentAnswer", "args": {"answer": answer}, "id": call_id}])


def write_pdf(path: Path, pages: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path))
    for text in pages:
        pdf.drawString(72, 720, text)
        pdf.showPage()
    pdf.save()


@pytest.fixture
def kb_dir(tmp_path: Path) -> Path:
    kb = tmp_path / "kb"
    write_pdf(kb / "top.pdf", ["Records are immutable reference types.", "Structs are value types."])
    write_pdf(kb / "nested" / "deeper" / "inner.pdf", ["Pattern matching uses the is keyword."])
    return kb


@pytest.fixture
def store(tmp_path: Path):
    return get_vector_store(DeterministicFakeEmbedding(size=32), tmp_path / "chroma")


@pytest.fixture
def populated_store(store):
    store.add_documents(
        [
            Document("Records are immutable reference types.", metadata={"source": "csharp.pdf", "page": 3}),
            Document("Structs are value types.", metadata={"source": "csharp.pdf", "page": 7}),
        ]
    )
    return store
