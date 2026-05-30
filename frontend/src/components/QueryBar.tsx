import { useState } from "react";

const SAMPLE_QUESTIONS = [
  "What is the difference between LlamaIndex and LangChain?",
  "How does backpropagation work in neural networks?",
  "When was artificial intelligence formally founded as a field?",
  "What are the main components of the Transformer architecture?",
  "What is the bias-variance tradeoff in machine learning?",
];

interface Props {
  onQuery: (question: string, topK: number) => void;
  loading: boolean;
  disabled: boolean;
}

export function QueryBar({ onQuery, loading, disabled }: Props) {
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(3);

  const submit = () => {
    if (!question.trim()) return;
    onQuery(question.trim(), topK);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask a question about your documents…"
          disabled={disabled || loading}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="topk" className="whitespace-nowrap">Top-K</label>
          <select
            id="topk"
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <button
          onClick={submit}
          disabled={disabled || loading || !question.trim()}
          className="bg-blue-600 text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? "Running…" : "Compare"}
        </button>
      </div>

      {/* Sample questions */}
      <div className="flex flex-wrap gap-2">
        {SAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => setQuestion(q)}
            disabled={disabled || loading}
            className="text-xs rounded-full bg-gray-100 text-gray-600 px-3 py-1 hover:bg-gray-200 disabled:opacity-40 transition-colors text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {disabled && (
        <p className="text-xs text-amber-600">
          Load documents first before running a query.
        </p>
      )}
    </div>
  );
}
