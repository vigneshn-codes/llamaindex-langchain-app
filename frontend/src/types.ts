export interface RetrievedNode {
  text: string;
  score: number | null;
  source: string;
}

export interface TokenUsage {
  prompt?: number;
  completion?: number;
  embedding?: number;
  total: number;
}

export interface FrameworkResult {
  answer?: string;
  retrieved_nodes?: RetrievedNode[];
  latency_ms?: number;
  tokens?: TokenUsage;
  framework?: string;
  model?: string;
  retrieval_strategy?: string;
  error?: string;
}

export interface QueryResponse {
  question: string;
  llamaindex: FrameworkResult;
  langchain: FrameworkResult;
}

export interface DocumentsResponse {
  sample_files: string[];
  uploaded_files: string[];
  loaded_in_llamaindex: string[];
  loaded_in_langchain: string[];
}

export interface LoadResponse {
  message: string;
  llamaindex: { doc_count: number; embedding_tokens: number };
  langchain: { doc_count: number; embedding_tokens: number };
}
