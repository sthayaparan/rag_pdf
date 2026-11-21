import logging
from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "knowledgebase"
BATCH_SIZE = 500


def load_documents(path: Path) -> list[Document]:
    """Load every page of every PDF under `path`, recursively."""
    docs = []
    for pdf in sorted(path.rglob("*.pdf")):
        source = pdf.relative_to(path).as_posix()
        for number, page in enumerate(PdfReader(pdf).pages, start=1):
            text = page.extract_text()
            if text.strip():
                docs.append(Document(page_content=text, metadata={"source": source, "page": number}))
    return docs


def split_documents(docs: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    return splitter.split_documents(docs)


def get_vector_store(embeddings: Embeddings | None = None, persist_dir: Path | None = None) -> Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings
        or OpenAIEmbeddings(model=settings.embedding_model, api_key=settings.openai_api_key),
        persist_directory=str(persist_dir or settings.chroma_dir),
    )


def build_vector_store(store: Chroma, kb_dir: Path | None = None) -> int:
    """Populate the store from the knowledge base unless it already has data. Returns the chunk count."""
    existing = len(store.get(include=[])["ids"])
    if existing:
        logger.info("Vector store already populated with %d chunks", existing)
        return existing
    chunks = split_documents(load_documents(kb_dir or settings.knowledgebase_dir))
    for start in range(0, len(chunks), BATCH_SIZE):
        store.add_documents(chunks[start : start + BATCH_SIZE])
        logger.info("Embedded %d/%d chunks", min(start + BATCH_SIZE, len(chunks)), len(chunks))
    logger.info("Ingested %d chunks", len(chunks))
    return len(chunks)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    vector_store = get_vector_store()
    vector_store.reset_collection()
    build_vector_store(vector_store)
