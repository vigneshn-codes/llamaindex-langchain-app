import asyncio
import os
import shutil
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import llamaindex_rag
import langchain_rag

load_dotenv()

app = FastAPI(title="LlamaIndex vs LangChain Comparison")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_DOCS_DIR = Path(__file__).parent / "sample_docs"
UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


class QueryRequest(BaseModel):
    question: str
    top_k: int = 3


class LoadRequest(BaseModel):
    use_samples: bool = True
    use_uploads: bool = True


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/documents")
def list_documents():
    sample_files = [f.name for f in SAMPLE_DOCS_DIR.glob("*.txt")]
    upload_files = [f.name for f in UPLOADS_DIR.glob("*") if f.is_file()]
    return {
        "sample_files": sample_files,
        "uploaded_files": upload_files,
        "loaded_in_llamaindex": llamaindex_rag.get_loaded_files(),
        "loaded_in_langchain": langchain_rag.get_loaded_files(),
    }


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    allowed_types = {".txt", ".pdf", ".md"}
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed_types:
        raise HTTPException(400, f"File type {suffix} not supported. Use: {allowed_types}")

    dest = UPLOADS_DIR / file.filename
    with open(dest, "wb") as f:
        content = await file.read()
        f.write(content)

    return {"message": f"Uploaded {file.filename}", "path": str(dest)}


@app.post("/api/load")
def load_documents(req: LoadRequest):
    paths = []
    if req.use_samples:
        paths.append(str(SAMPLE_DOCS_DIR))
    if req.use_uploads:
        upload_files = list(UPLOADS_DIR.glob("*"))
        paths.extend([str(f) for f in upload_files if f.is_file()])

    if not paths:
        raise HTTPException(400, "No document sources selected.")

    try:
        li_result = llamaindex_rag.load_documents(paths)
        lc_result = langchain_rag.load_documents(paths)
    except Exception as e:
        raise HTTPException(500, f"Loading failed: {str(e)}")

    return {
        "message": "Documents loaded into both frameworks.",
        "llamaindex": li_result,
        "langchain": lc_result,
    }


@app.post("/api/query")
async def run_query(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty.")

    async def run_llamaindex():
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, llamaindex_rag.query, req.question, req.top_k
        )

    async def run_langchain():
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, langchain_rag.query, req.question, req.top_k
        )

    try:
        li_result, lc_result = await asyncio.gather(
            run_llamaindex(), run_langchain(), return_exceptions=True
        )
    except Exception as e:
        raise HTTPException(500, str(e))

    def format_result(result):
        if isinstance(result, Exception):
            return {"error": str(result)}
        return result

    return {
        "question": req.question,
        "llamaindex": format_result(li_result),
        "langchain": format_result(lc_result),
    }
