import React from "react";
import { 
  Sparkles, 
  Database, 
  Terminal, 
  Settings2, 
  Radio, 
  FileText,
  Activity,
  Layers
} from "lucide-react";
import type { BackendStatus, UploadedDoc } from "../types";

interface HeaderProps {
  status: BackendStatus;
  docs: UploadedDoc[];
  onOpenSettings: () => void;
  onOpenConsole: () => void;
  showConsole: boolean;
}

export function Header({
  status,
  docs,
  onOpenSettings,
  onOpenConsole,
  showConsole,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090d16]/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0b0f1a] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl blur opacity-30 -z-10 group-hover:opacity-75 transition duration-1000"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                NexusDoc <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                RAG Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <span>LangChain</span>
              <span className="text-slate-600">•</span>
              <span>Qdrant Vectors</span>
              <span className="text-slate-600">•</span>
              <span>GROQ LLM</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Tools */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Docs in vault count badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vault:</span>
            <strong className="text-white font-semibold">{docs.length}</strong>
            <span className="text-slate-500 text-[11px]">PDF{docs.length === 1 ? "" : "s"}</span>
          </div>

          {/* Backend Connection Badge */}
          <button
            onClick={onOpenSettings}
            title={`Backend URL: ${status.backendUrl} (Click to configure)`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              status.isReachable
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/15"
                : "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/15"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  status.isReachable ? "bg-emerald-400" : "bg-rose-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  status.isReachable ? "bg-emerald-500" : "bg-rose-500"
                }`}
              ></span>
            </span>
            <span className="hidden sm:inline">Backend:</span>
            <span>{status.isReachable ? `Connected (${status.pingMs}ms)` : "Offline"}</span>
          </button>

          {/* API Debug Console Toggle */}
          <button
            onClick={onOpenConsole}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showConsole
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/25"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">API Console</span>
          </button>

          {/* Settings / Config Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700 transition-all"
            title="Configure Backend URL"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
