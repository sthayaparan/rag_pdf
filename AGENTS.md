# RAG System for a PDF-Based Knowledge Base

## Business Requirements

- An MVP of a RAG application delivered as a web app
- A chat screen where the user enters a question and the answer is displayed
- The priority is a slick, professional, gorgeous UI/UX with very simple features
- Keep it simple

## Scope

- No permanent persistence; only an in-memory session holding chat context for prompt engineering
- No user management for the MVP

## Project Structure

- `frontend/` - React and Next.js application
- `backend/` - Python FastAPI application
- `knowledgebase/` - PDF documents, organised in a nested folder structure
- `scripts/` - Start and stop server scripts for Windows and Linux
- `.env` - API keys, in the project root

## Technical Details

### Frontend

- Modern React and Next.js client application
- Popular, well-established UI libraries; as simple as possible but with an elegant UI
- npm for dependency and project management

### Backend

- Python FastAPI
- LangChain Agent Framework for the RAG code
- Pydantic for validation and LangChain structured output
- uv for dependency and project management

### AI and Retrieval

- OpenRouter for AI calls (API keys in `.env`)
- OpenAI text embeddings for converting text to vectors
- Open-source Chroma vector database storing document chunks as vectors for retrieval

### Testing

- Rigorous unit testing: pytest for the backend, Vitest for the frontend
- Integration and end-to-end testing with Playwright

## Coding Standards

1. Use the latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features.
3. Be concise. Keep the README minimal. IMPORTANT: no emojis ever

## Strategy

1. Write a plan with success criteria for each phase, to be checked off. Include project scaffolding (including `.gitignore`) and rigorous unit testing.
2. Execute the plan, ensuring all criteria are met
3. Carry out extensive integration testing with Playwright or similar, fixing defects
4. Only complete when the MVP is finished and tested, with the server running and ready for the user
