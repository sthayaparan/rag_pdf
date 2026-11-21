from langchain_core.messages import HumanMessage

from app.rag import ChatAnswer, Source, ask, create_rag_agent, make_search_tool
from tests.conftest import FakeToolModel, final_answer, search_call


def test_search_tool_returns_formatted_chunks_and_documents(populated_store):
    tool = make_search_tool(populated_store)

    msg = tool.invoke({"type": "tool_call", "name": tool.name, "args": {"query": "records"}, "id": "1"})

    assert "[csharp.pdf, page 3]" in msg.content
    assert "[csharp.pdf, page 7]" in msg.content
    assert {d.metadata["page"] for d in msg.artifact} == {3, 7}


def test_ask_returns_answer_with_retrieved_sources(populated_store):
    model = FakeToolModel(responses=[search_call("records", "c1"), final_answer("Records are immutable.", "c2")])
    agent = create_rag_agent(model, populated_store)

    result = ask(agent, "s1", "What is a record?")

    assert isinstance(result, ChatAnswer)
    assert result.answer == "Records are immutable."
    assert result.sources == [Source(file="csharp.pdf", page=3), Source(file="csharp.pdf", page=7)]


def test_ask_without_search_has_no_sources(populated_store):
    model = FakeToolModel(responses=[final_answer("Hello!", "c1")])
    agent = create_rag_agent(model, populated_store)

    assert ask(agent, "s1", "Hi").sources == []


def test_sources_only_from_current_turn(populated_store):
    model = FakeToolModel(
        responses=[search_call("records", "c1"), final_answer("First.", "c2"), final_answer("Second.", "c3")]
    )
    agent = create_rag_agent(model, populated_store)

    ask(agent, "s1", "What is a record?")
    second = ask(agent, "s1", "Thanks")

    assert second.answer == "Second."
    assert second.sources == []


def test_memory_is_kept_per_session(populated_store):
    model = FakeToolModel(responses=[final_answer("A", "c1"), final_answer("B", "c2"), final_answer("C", "c3")])
    agent = create_rag_agent(model, populated_store)

    ask(agent, "s1", "first question")
    ask(agent, "s1", "follow up")
    ask(agent, "s2", "other session")

    def human_texts(call):
        return [m.content for m in call if isinstance(m, HumanMessage)]

    assert human_texts(model.received[1]) == ["first question", "follow up"]
    assert human_texts(model.received[2]) == ["other session"]

