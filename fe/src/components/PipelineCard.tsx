import React from "react";
import { GitBranch, FileSearch, Database, Zap, Cpu, ArrowRight } from "lucide-react";

export function PipelineCard() {
  const steps = [
    {
      icon: FileSearch,
      title: "PDF Parsing",
      detail: "pdf-parse / binary buffer",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: GitBranch,
      title: "Text Chunking",
      detail: "1000 chunk / 200 overlap",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: Database,
      title: "Vector Embeddings",
      detail: "Qdrant Vector Database",
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: Zap,
      title: "Similarity Search",
      detail: "Top-5 cosine matches",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: Cpu,
      title: "GROQ LLM Agent",
      detail: "Context-grounded answer",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          RAG Pipeline Architecture
        </h4>
        <span className="text-[10px] text-slate-500 font-mono">End-to-End Flow</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg border ${step.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-mono text-slate-600 font-bold">0{idx + 1}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 truncate">{step.title}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
