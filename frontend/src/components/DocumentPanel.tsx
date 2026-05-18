import { useRef, useState } from "react";
import type { DocumentsResponse } from "../types";
import { uploadFile, loadDocuments } from "../api";

interface Props {
  docs: DocumentsResponse | null;
  onLoaded: () => void;
  onDocsChange: () => void;
}

export function DocumentPanel({ docs, onLoaded, onDocsChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [useSamples, setUseSamples] = useState(true);
  const [useUploads, setUseUploads] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const isLoaded =
    (docs?.loaded_in_llamaindex?.length ?? 0) > 0 ||
    (docs?.loaded_in_langchain?.length ?? 0) > 0;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await uploadFile(file);
      setMessage(r.message);
      onDocsChange();
    } catch {
      setMessage("Upload failed.");
    }
    e.target.value = "";
  };

  const handleLoad = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const r = await loadDocuments(useSamples, useUploads);
      setMessage(r.message);
      onLoaded();
    } catch (err: any) {
      setMessage(err.response?.data?.detail ?? "Load failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <h2 className="font-semibold text-gray-800">Documents</h2>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            isLoaded ? "bg-green-500" : "bg-amber-400"
          }`}
        />
        <span className="text-gray-600">
          {isLoaded ? "Loaded into both frameworks" : "Not yet loaded"}
        </span>
      </div>

      {/* Sample files */}
      {docs && docs.sample_files.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">
            Sample documents
          </p>
          <ul className="flex flex-col gap-1">
            {docs.sample_files.map((f) => (
              <li key={f} className="text-xs text-gray-700 flex items-center gap-1.5">
                <span className="text-gray-400">📄</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded files */}
      {docs && docs.uploaded_files.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">
            Uploaded files
          </p>
          <ul className="flex flex-col gap-1">
            {docs.uploaded_files.map((f) => (
              <li key={f} className="text-xs text-gray-700 flex items-center gap-1.5">
                <span className="text-gray-400">📎</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.pdf,.md"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full text-sm border-2 border-dashed border-gray-300 rounded-lg py-2.5 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          + Upload document (.txt, .pdf, .md)
        </button>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={useSamples}
            onChange={(e) => setUseSamples(e.target.checked)}
            className="accent-blue-600"
          />
          Include sample documents
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={useUploads}
            onChange={(e) => setUseUploads(e.target.checked)}
            className="accent-blue-600"
          />
          Include uploaded documents
        </label>
      </div>

      {/* Load button */}
      <button
        onClick={handleLoad}
        disabled={loading}
        className="w-full bg-gray-900 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Loading…" : isLoaded ? "Reload Documents" : "Load Documents"}
      </button>

      {message && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{message}</p>
      )}
    </div>
  );
}
