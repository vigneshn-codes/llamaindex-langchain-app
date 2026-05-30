import type { QueryResponse } from "../types";

interface Props {
  result: QueryResponse;
}

export function DiffHighlight({ result }: Props) {
  const li = result.llamaindex;
  const lc = result.langchain;

  if (li.error || lc.error) return null;

  const liLatency = li.latency_ms ?? 0;
  const lcLatency = lc.latency_ms ?? 0;
  const fasterFramework = liLatency < lcLatency ? "LlamaIndex" : "LangChain";
  const latencyDiff = Math.abs(liLatency - lcLatency).toFixed(0);

  const liTokens = li.tokens?.total ?? 0;
  const lcTokens = lc.tokens?.total ?? 0;
  const efficientFramework = liTokens < lcTokens ? "LlamaIndex" : liTokens === lcTokens ? null : "LangChain";

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-amber-800 mb-3">Key Differences</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <DiffItem
          label="Speed"
          value={`${fasterFramework} faster by ${latencyDiff}ms`}
        />
        {efficientFramework && (
          <DiffItem
            label="Token efficiency"
            value={`${efficientFramework} used fewer tokens (${Math.abs(liTokens - lcTokens)} diff)`}
          />
        )}
        <DiffItem
          label="Retrieval scores"
          value={
            li.retrieved_nodes?.some((n) => n.score !== null)
              ? "LlamaIndex returns similarity scores"
              : "Both return chunks without scores"
          }
        />
      </div>
    </div>
  );
}

function DiffItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-amber-100 px-3 py-2.5">
      <div className="text-xs text-amber-600 font-medium">{label}</div>
      <div className="text-gray-800 mt-0.5">{value}</div>
    </div>
  );
}
