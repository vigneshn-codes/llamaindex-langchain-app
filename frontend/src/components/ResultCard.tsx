import type { FrameworkResult } from "../types";

interface Props {
  result: FrameworkResult;
  color: "blue" | "green";
}

const colorMap = {
  blue: {
    header: "bg-blue-600",
    badge: "bg-blue-100 text-blue-800",
    border: "border-blue-200",
    node: "bg-blue-50 border-blue-100",
    score: "text-blue-600",
  },
  green: {
    header: "bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-800",
    border: "border-emerald-200",
    node: "bg-emerald-50 border-emerald-100",
    score: "text-emerald-600",
  },
};

export function ResultCard({ result, color }: Props) {
  const c = colorMap[color];

  if (result.error) {
    return (
      <div className={`rounded-xl border ${c.border} overflow-hidden`}>
        <div className={`${c.header} text-white px-5 py-3 font-semibold`}>
          {result.framework ?? "Framework"}
        </div>
        <div className="p-5 text-red-600 text-sm">Error: {result.error}</div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className={`${c.header} text-white px-5 py-3`}>
        <div className="font-semibold text-lg">{result.framework}</div>
        <div className="text-xs opacity-80 mt-0.5">{result.retrieval_strategy}</div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Latency" value={`${result.latency_ms?.toFixed(0)} ms`} />
          <Metric label="LLM Tokens" value={String(result.tokens?.prompt ?? result.tokens?.total ?? "—")} />
          <Metric label="Total Tokens" value={String(result.tokens?.total ?? "—")} />
        </div>

        {/* Answer */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Answer
          </h3>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {result.answer}
          </p>
        </section>

        {/* Retrieved context */}
        {result.retrieved_nodes && result.retrieved_nodes.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Retrieved Context ({result.retrieved_nodes.length} chunks)
            </h3>
            <div className="flex flex-col gap-2">
              {result.retrieved_nodes.map((node, i) => (
                <div
                  key={i}
                  className={`rounded-lg border ${c.node} p-3 text-xs`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-600">{node.source}</span>
                    {node.score !== null && (
                      <span className={`font-mono ${c.score} font-semibold`}>
                        score: {node.score}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 leading-relaxed line-clamp-4">
                    {node.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-800 mt-0.5">{value}</div>
    </div>
  );
}
