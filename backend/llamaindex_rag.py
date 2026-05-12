import time
from pathlib import Path
from typing import Optional

from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
)
from llama_index.core.callbacks import CallbackManager, TokenCountingHandler
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
import tiktoken


_index: Optional[VectorStoreIndex] = None
_loaded_files: list[str] = []

_TOKENIZER = tiktoken.encoding_for_model("gpt-4o-mini").encode


def _make_counter() -> TokenCountingHandler:
    return TokenCountingHandler(tokenizer=_TOKENIZER)


def _apply_settings(token_counter: TokenCountingHandler) -> None:
    Settings.llm = OpenAI(model="gpt-4o-mini", temperature=0)
    Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
    Settings.callback_manager = CallbackManager([token_counter])
    Settings.chunk_size = 512
    Settings.chunk_overlap = 64


def load_documents(paths: list[str]) -> dict:
    global _index, _loaded_files

    counter = _make_counter()
    _apply_settings(counter)

    docs = []
    for path in paths:
        p = Path(path)
        if p.is_dir():
            loaded = SimpleDirectoryReader(str(p)).load_data()
        else:
            loaded = SimpleDirectoryReader(input_files=[str(p)]).load_data()
        docs.extend(loaded)

    _index = VectorStoreIndex.from_documents(docs)
    _loaded_files = [Path(p).name for p in paths]

    return {
        "doc_count": len(docs),
        "embedding_tokens": counter.total_embedding_token_count,
    }


def query(question: str, top_k: int = 3) -> dict:
    if _index is None:
        raise RuntimeError("No documents loaded. Call load_documents first.")

    counter = _make_counter()
    _apply_settings(counter)

    query_engine = _index.as_query_engine(similarity_top_k=top_k)

    start = time.perf_counter()
    response = query_engine.query(question)
    latency_ms = (time.perf_counter() - start) * 1000

    retrieved_nodes = []
    if hasattr(response, "source_nodes"):
        for node in response.source_nodes:
            retrieved_nodes.append(
                {
                    "text": node.node.text[:500],
                    "score": round(node.score, 4) if node.score is not None else None,
                    "source": node.node.metadata.get("file_name", "unknown"),
                }
            )

    llm_tokens = counter.total_llm_token_count
    embed_tokens = counter.total_embedding_token_count

    return {
        "answer": str(response),
        "retrieved_nodes": retrieved_nodes,
        "latency_ms": round(latency_ms, 1),
        "tokens": {
            "prompt": counter.prompt_llm_token_count,
            "completion": counter.completion_llm_token_count,
            "embedding": embed_tokens,
            "total": llm_tokens + embed_tokens,
        },
        "framework": "LlamaIndex",
        "model": "gpt-4o-mini",
        "retrieval_strategy": "VectorStoreIndex (cosine similarity, SentenceSplitter)",
    }


def get_loaded_files() -> list[str]:
    return _loaded_files
