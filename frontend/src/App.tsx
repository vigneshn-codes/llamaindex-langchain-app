import { useCallback, useEffect, useState } from "react";
import { getDocuments, runQuery } from "./api";
import type { DocumentsResponse, QueryResponse } from "./types";
import { DocumentPanel } from "./components/DocumentPanel";
import { QueryBar } from "./components/QueryBar";
import { ResultCard } from "./components/ResultCard";
import { DiffHighlight } from "./components/DiffHighlight";

export default function App() {
  const [docs, setDocs] = useState<DocumentsResponse | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [history, setHistory] = useState<QueryResponse[]>([]);

  const fetchDocs = useCallback(async () => {
    try {
      const d = await getDocuments();
      setDocs(d);
    } catch {
      /* backend not yet ready */
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const isLoaded =
    (docs?.loaded_in_llamaindex?.length ?? 0) > 0 ||
    (docs?.loaded_in_langchain?.length ?? 0) > 0;

  const handleQuery = async (question: string, topK: number) => {
    setQueryLoading(true);
    setResult(null);
    try {
      const r = await runQuery(question, topK);
      setResult(r);
      setHistory((prev) => [r, ...prev].slice(0, 10));
    } catch (err: any) {
      alert(err.response?.data?.detail ?? "Query failed.");
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              LlamaIndex <span className="text-gray-400 font-normal">vs</span> LangChain
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Side-by-side RAG comparison
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> LlamaIndex
            <span className="ml-3 inline-block w-2 h-2 rounded-full bg-emerald-500" /> LangChain
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0">
          <DocumentPanel
            docs={docs}
            onLoaded={fetchDocs}
            onDocsChange={fetchDocs}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          <QueryBar
            onQuery={handleQuery}
            loading={queryLoading}
            disabled={!isLoaded}
          />

          {queryLoading && (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              <svg
                className="animate-spin mr-3 h-5 w-5 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Running both frameworks in parallel…
            </div>
          )}

          {result && !queryLoading && (
            <>
              <DiffHighlight result={result} />
              <div className="grid grid-cols-2 gap-5">
                <ResultCard result={result.llamaindex} color="blue" />
                <ResultCard result={result.langchain} color="green" />
              </div>
            </>
          )}

          {!result && !queryLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <svg
                className="w-12 h-12 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p className="text-sm">
                {isLoaded
                  ? "Ask a question to see the comparison"
                  : "Load documents to get started"}
              </p>
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div className="mt-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                Query history
              </h2>
              <div className="flex flex-col gap-2">
                {history.slice(1).map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setResult(r)}
                    className="text-left text-sm bg-white border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    {r.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
