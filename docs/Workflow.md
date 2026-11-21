# Workflow

How a question travels from the browser to the backend and back. Diagrams use Mermaid.

## Architecture

```mermaid
flowchart TB
    subgraph Browser
        UI["Chat UI<br/>components/Chat.tsx"]
        API["lib/api.ts<br/>sendMessage()"]
    end

    subgraph Frontend["Next.js server :3000"]
        Proxy["Rewrite /api/* to :8000<br/>proxyTimeout 120 s"]
    end

    subgraph Backend["FastAPI :8000"]
        Route["POST /api/chat<br/>app/main.py"]
        Ask["ask()<br/>app/rag.py"]
        Agent["LangChain agent<br/>create_agent"]
        Memory[("InMemorySaver<br/>chat history per session_id")]
        Tool["search_knowledgebase tool"]
        Sources["turn_sources()<br/>file and page from retrieved chunks"]
    end

    subgraph Storage["Local storage"]
        Chroma[("Chroma<br/>backend/chroma_db")]
        KB[/"knowledgebase/**/*.pdf"/]
    end

    subgraph External["External APIs"]
        OpenRouter["OpenRouter<br/>chat model"]
        OpenAI["OpenAI<br/>text-embedding-3-small"]
    end

    UI --> API -->|"POST /api/chat<br/>session_id, message"| Proxy --> Route --> Ask --> Agent
    Agent <--> Memory
    Agent <-->|"tool calls and answer"| OpenRouter
    Agent --> Tool -->|"similarity search, top 5"| Chroma
    Tool -->|"embed query"| OpenAI
    Ask --> Sources
    Route -->|"answer, sources"| Proxy --> API --> UI
    KB -.->|"ingested at startup"| Chroma
```

## Asking a question

```mermaid
sequenceDiagram
    actor User
    participant UI as Chat UI (browser)
    participant Next as Next.js :3000
    participant API as FastAPI :8000
    participant Agent as LangChain agent
    participant LLM as OpenRouter model
    participant Chroma as Chroma
    participant Emb as OpenAI embeddings

    User->>UI: Type question, press Enter
    UI->>UI: Show question and typing indicator
    UI->>Next: POST /api/chat {session_id, message}
    Next->>API: Proxy request
    API->>Agent: invoke(message, thread_id = session_id)
    Agent->>Agent: Load earlier messages for this session
    Agent->>LLM: System prompt, history, question
    LLM-->>Agent: Call search_knowledgebase(query)
    Agent->>Emb: Embed query
    Emb-->>Agent: Query vector
    Agent->>Chroma: Similarity search, k = 5
    Chroma-->>Agent: Chunks with file and page
    Agent->>LLM: Retrieved passages
    Note over Agent,LLM: The model may search again, at most three times
    LLM-->>Agent: Call AgentAnswer(answer) (structured output)
    Agent->>Agent: Save turn to session memory
    Agent-->>API: structured_response and messages
    API->>API: turn_sources(): unique file and page from this turn's search results
    API-->>Next: {answer, sources}
    Next-->>UI: Response
    UI->>User: Markdown answer with source chips
```

If the request fails, the UI shows an inline error and the user can send the question again.

## Startup ingestion

Runs once, when the backend starts with an empty vector store (or manually with `uv run python -m app.ingest`).

```mermaid
flowchart LR
    Start["Backend starts<br/>lifespan()"] --> Check{"Chroma collection<br/>has chunks?"}
    Check -->|yes| Ready["Create agent<br/>ready for requests"]
    Check -->|no| Load["Load every PDF under knowledgebase/<br/>one document per page"]
    Load --> Split["Split into chunks<br/>1000 chars, 150 overlap"]
    Split --> Embed["Embed in batches of 500<br/>OpenAI embeddings"]
    Embed --> Store[("Persist to<br/>backend/chroma_db")]
    Store --> Ready
```

## Sessions

- The browser creates a `session_id` with `crypto.randomUUID()`. "New chat" creates a new one.
- The backend uses it as the LangGraph `thread_id`, so follow-up questions see the earlier conversation.
- History is held in memory only and is lost when the backend restarts.
