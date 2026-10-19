import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  FileCheck2, 
  AlertCircle, 
  CheckCircle2, 
  FileUp, 
  Layers, 
  Loader2, 
  Trash2, 
  MessageSquarePlus,
  BookOpen,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";
import type { UploadedDoc } from "../types";
import { uploadPdf } from "../services/api";

interface DocumentUploaderProps {
  docs: UploadedDoc[];
  onDocAdded: (doc: UploadedDoc) => void;
  onDocRemoved: (id: string) => void;
  onSelectPrompt: (prompt: string) => void;
  baseUrl: string;
}

type Stage = "idle" | "uploading" | "parsing" | "indexing" | "success" | "error";

export function DocumentUploader({
  docs,
  onDocAdded,
  onDocRemoved,
  onSelectPrompt,
  baseUrl,
}: DocumentUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMeta, setSuccessMeta] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const validateAndSelect = (file: File) => {
    setErrorMessage(null);
    setSuccessMeta(null);
    setStage("idle");

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF documents are supported by the backend vectorizer.");
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const triggerUpload = async () => {
    if (!selectedFile) return;

    setStage("uploading");
    setErrorMessage(null);

    // Simulate stepping through pipeline for rich visual feedback
    const parseTimer = setTimeout(() => {
      setStage("parsing");
    }, 900);

    const indexTimer = setTimeout(() => {
      setStage("indexing");
    }, 2200);

    try {
      const result = await uploadPdf(selectedFile, baseUrl);
      clearTimeout(parseTimer);
      clearTimeout(indexTimer);
      setStage("success");
      setSuccessMeta(result.meta);

      const newDoc: UploadedDoc = {
        id: Date.now().toString(),
        originalName: result.meta?.originalName || selectedFile.name,
        savedAs: result.meta?.savedAs || `${Date.now()}.pdf`,
        totalPages: result.meta?.totalPages,
        fileSizeBytes: selectedFile.size,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summary: result.summary,
      };

      onDocAdded(newDoc);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#6366f1", "#8b5cf6", "#06b6d4"],
        });
      } catch {
        // Safe fallback
      }
    } catch (err: any) {
      clearTimeout(parseTimer);
      clearTimeout(indexTimer);
      setStage("error");
      setErrorMessage(err?.message || "Failed to upload and vectorize document.");
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setStage("idle");
    setErrorMessage(null);
    setSuccessMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Zone Card */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Document Ingestion</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            POST /upload
          </span>
        </div>

        {/* Dropzone Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 relative group ${
            dragOver
              ? "border-indigo-400 bg-indigo-500/10 scale-[0.99]"
              : "border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/70"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <FileUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                <span className="text-indigo-400 underline decoration-indigo-400/40 hover:decoration-indigo-400">
                  Click to select PDF
                </span>{" "}
                or drag & drop here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Parsed, split into 1000-char chunks & stored in Qdrant Vector Store
              </p>
            </div>
          </div>
        </div>

        {/* Selected file preview & upload action */}
        {selectedFile && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-indigo-500/20 flex flex-col gap-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 flex-shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-100 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              {stage === "idle" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetSelection();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove selected file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Pipeline progress visualization */}
            {stage !== "idle" && stage !== "error" && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    {stage === "uploading" && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                    {stage === "parsing" && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                    {stage === "indexing" && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
                    {stage === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    
                    {stage === "uploading" && "1. Uploading PDF to Express server..."}
                    {stage === "parsing" && "2. Extracting text via pdf-parse..."}
                    {stage === "indexing" && "3. Splitting & indexing into Qdrant..."}
                    {stage === "success" && "Ready! Indexed in Vector Database"}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400">
                    {stage === "uploading" ? "30%" : stage === "parsing" ? "65%" : stage === "indexing" ? "90%" : "100%"}
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      stage === "uploading"
                        ? "w-[30%] bg-indigo-500"
                        : stage === "parsing"
                        ? "w-[65%] bg-cyan-500"
                        : stage === "indexing"
                        ? "w-[90%] bg-purple-500"
                        : "w-full bg-emerald-500"
                    }`}
                  ></div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {stage === "idle" && (
              <button
                onClick={triggerUpload}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Upload & Vectorize Document</span>
              </button>
            )}

            {stage === "success" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={resetSelection}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  Upload Another PDF
                </button>
                <button
                  onClick={() => onSelectPrompt(`Summarize the key information from "${selectedFile.name}"`)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Ask AI About It</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold">Upload Error</p>
              <p className="text-rose-200/80 text-[11px] mt-0.5 break-words">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Documents Vault */}
      <div className="glass-panel rounded-2xl p-5 border border-white/[0.08] shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Active Knowledge Base</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {docs.length} {docs.length === 1 ? "file" : "files"}
          </span>
        </div>

        {docs.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-800/80 text-center bg-slate-900/20">
            <p className="text-xs text-slate-400 font-medium">No documents uploaded in this session.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Upload a PDF above to ground the RAG model with custom knowledge.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="group p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                    <p className="text-xs font-semibold text-slate-200 truncate" title={doc.originalName}>
                      {doc.originalName}
                    </p>
                  </div>
                  <button
                    onClick={() => onDocRemoved(doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Remove from session list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{doc.totalPages ? `${doc.totalPages} pages` : "Indexed"}</span>
                  <span>{doc.uploadedAt}</span>
                </div>

                <button
                  onClick={() => onSelectPrompt(`What are the key points discussed in ${doc.originalName}?`)}
                  className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700/50 hover:border-indigo-500/30"
                >
                  <span>Query this doc</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
