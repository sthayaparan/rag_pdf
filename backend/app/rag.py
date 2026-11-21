from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel, Field

from app.config import settings

SEARCH_TOOL_NAME = "search_knowledgebase"

SYSTEM_PROMPT = """You are a helpful, knowledgeable, friendly assistant answering questions about a C# programming knowledge base.

Use the search_knowledgebase tool to find relevant passages, with a short, focused query.
Search once; search again only for a different aspect of the question, and never more than
three times. Then give your answer straight away.
Answer only from the retrieved passages and the conversation so far. If the passages do not
contain the answer, say that the knowledge base does not cover it.
Write clear, concise answers in Markdown. Use fenced code blocks with the language (```csharp)
for code. Do not list sources in the answer; they are shown separately."""


class AgentAnswer(BaseModel):
    answer: str = Field(description="The answer to the user's question, in Markdown")


class Source(BaseModel):
    file: str
    page: int


class ChatAnswer(BaseModel):
    answer: str
    sources: list[Source]


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1)
    message: str = Field(min_length=1)


def make_search_tool(store: Chroma):
    @tool(SEARCH_TOOL_NAME, response_format="content_and_artifact")
    def search_knowledgebase(query: str) -> tuple[str, list[Document]]:
        """Search the C# knowledge base for passages relevant to the query."""
        docs = store.similarity_search(query, k=5)
        content = "\n\n".join(
            f"[{doc.metadata['source']}, page {doc.metadata['page']}]\n{doc.page_content}" for doc in docs
        )
        content = content + f"\n\nOriginal user query: {query}"
        return content, docs

    return search_knowledgebase


def create_chat_model() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.chat_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
    )


def create_rag_agent(model: BaseChatModel, store: Chroma) -> CompiledStateGraph:
    return create_agent(
        model,
        tools=[make_search_tool(store)],
        system_prompt=SYSTEM_PROMPT,
        response_format=ToolStrategy(AgentAnswer),
        checkpointer=InMemorySaver(),
    )


def ask(agent: CompiledStateGraph, session_id: str, message: str) -> ChatAnswer:
    result = agent.invoke(
        {"messages": [HumanMessage(message)]},
        {"configurable": {"thread_id": session_id}},
    )
    return ChatAnswer(answer=result["structured_response"].answer, sources=turn_sources(result["messages"]))


def turn_sources(messages: list) -> list[Source]:
    """Unique sources retrieved by the search tool since the latest user message."""
    sources: list[Source] = []
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            break
        if isinstance(msg, ToolMessage) and msg.name == SEARCH_TOOL_NAME:
            for doc in msg.artifact:
                source = Source(file=doc.metadata["source"], page=doc.metadata["page"])
                if source not in sources:
                    sources.append(source)
    return sorted(sources, key=lambda s: (s.file, s.page))
