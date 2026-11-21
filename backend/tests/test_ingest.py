from langchain_core.documents import Document

from app.ingest import build_vector_store, load_documents, split_documents


def test_load_documents_finds_nested_pdfs(kb_dir):
    docs = load_documents(kb_dir)

    assert {d.metadata["source"] for d in docs} == {"top.pdf", "nested/deeper/inner.pdf"}
    assert len(docs) == 3


def test_load_documents_records_page_numbers(kb_dir):
    docs = load_documents(kb_dir)

    top = sorted((d.metadata["page"], d.page_content) for d in docs if d.metadata["source"] == "top.pdf")
    assert top[0][0] == 1 and "Records" in top[0][1]
    assert top[1][0] == 2 and "Structs" in top[1][1]


def test_split_documents_keeps_metadata():
    doc = Document("word " * 1000, metadata={"source": "a/b.pdf", "page": 4})

    chunks = split_documents([doc])

    assert len(chunks) > 1
    assert all(len(c.page_content) <= 1000 for c in chunks)
    assert all(c.metadata == {"source": "a/b.pdf", "page": 4} for c in chunks)


def test_build_vector_store_populates_once(store, kb_dir):
    first = build_vector_store(store, kb_dir)
    second = build_vector_store(store, kb_dir)

    assert first == 3
    assert second == 3
    assert len(store.get()["ids"]) == 3


def test_built_store_is_searchable(store, kb_dir):
    build_vector_store(store, kb_dir)

    results = store.similarity_search("anything", k=5)

    assert len(results) == 3
    assert all({"source", "page"} <= r.metadata.keys() for r in results)
