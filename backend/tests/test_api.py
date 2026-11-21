import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.rag import create_rag_agent
from tests.conftest import FakeToolModel, final_answer, search_call


@pytest.fixture
def client(populated_store):
    model = FakeToolModel(responses=[search_call("records", "c1"), final_answer("Records are immutable.", "c2")])
    app.state.agent = create_rag_agent(model, populated_store)
    return TestClient(app)  # not used as a context manager, so the real lifespan does not run


def test_health(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_returns_answer_and_sources(client):
    response = client.post("/api/chat", json={"session_id": "s1", "message": "What is a record?"})

    assert response.status_code == 200
    assert response.json() == {
        "answer": "Records are immutable.",
        "sources": [{"file": "csharp.pdf", "page": 3}, {"file": "csharp.pdf", "page": 7}],
    }


@pytest.mark.parametrize(
    "body",
    [{}, {"session_id": "s1"}, {"message": "hi"}, {"session_id": "s1", "message": ""}, {"session_id": "", "message": "hi"}],
)
def test_chat_rejects_invalid_body(client, body):
    assert client.post("/api/chat", json=body).status_code == 422
