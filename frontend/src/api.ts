import axios from "axios";
import type {
  DocumentsResponse,
  LoadResponse,
  QueryResponse,
} from "./types";

const api = axios.create({ baseURL: "http://localhost:8000" });

export const getDocuments = () =>
  api.get<DocumentsResponse>("/api/documents").then((r) => r.data);

export const loadDocuments = (useSamples: boolean, useUploads: boolean) =>
  api
    .post<LoadResponse>("/api/load", {
      use_samples: useSamples,
      use_uploads: useUploads,
    })
    .then((r) => r.data);

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post<{ message: string }>("/api/upload", form).then((r) => r.data);
};

export const runQuery = (question: string, topK: number) =>
  api
    .post<QueryResponse>("/api/query", { question, top_k: topK })
    .then((r) => r.data);
