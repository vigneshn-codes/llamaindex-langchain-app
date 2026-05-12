import time
from pathlib import Path
from typing import Optional

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_community.vectorstores import FAISS
from langchain_community.callbacks import get_openai_callback
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.chains import RetrievalQA


_vectorstore: Optional[FAISS] = None
_loaded_files: list[str] = []


def load_documents(paths: list[str]) -> dict:
    global _vectorstore, _loaded_files

    raw_docs = []
    for path in paths:
        p = Path(path)
        if p.is_dir():
            loader = DirectoryLoader(str(p), glob="*.txt", loader_cls=TextLoader)
            raw_docs.extend(loader.load())
        else:
            loader = TextLoader(str(p))
            raw_docs.extend(loader.load())

    splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)
    docs = splitter.split_documents(raw_docs)

    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    with get_openai_callback() as cb:
        _vectorstore = FAISS.from_documents(docs, embeddings)
        embedding_tokens = cb.total_tokens

    _loaded_files = [Path(p).name for p in paths]

    return {
        "doc_count": len(docs),
        "embedding_tokens": embedding_tokens,
    }


def query(question: str, top_k: int = 3) -> dict:
    if _vectorstore is None:
        raise RuntimeError("No documents loaded. Call load_documents first.")

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    retriever = _vectorstore.as_retriever(search_kwargs={"k": top_k})

    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
    )

    with get_openai_callback() as cb:
        start = time.perf_counter()
        result = chain.invoke({"query": question})
        latency_ms = (time.perf_counter() - start) * 1000

        prompt_tokens = cb.prompt_tokens
        completion_tokens = cb.completion_tokens
        total_tokens = cb.total_tokens

    retrieved_docs = []
    for doc in result.get("source_documents", []):
        retrieved_docs.append(
            {
                "text": doc.page_content[:500],
                "score": None,
                "source": Path(doc.metadata.get("source", "unknown")).name,
            }
        )

    return {
        "answer": result["result"],
        "retrieved_nodes": retrieved_docs,
        "latency_ms": round(latency_ms, 1),
        "tokens": {
            "prompt": prompt_tokens,
            "completion": completion_tokens,
            "total": total_tokens,
        },
        "framework": "LangChain",
        "model": "gpt-4o-mini",
        "retrieval_strategy": "FAISS (cosine similarity, RecursiveCharacterTextSplitter)",
    }


def get_loaded_files() -> list[str]:
    return _loaded_files
