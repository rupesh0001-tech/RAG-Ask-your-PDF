import React, { useState } from "react";
import { Terminal, Play, Check, Copy, AlertCircle, RefreshCw, X } from "lucide-react";
import { getApiBaseUrl } from "../services/api";

interface ApiConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  baseUrl: string;
}

export function ApiConsole({ isOpen, onClose, baseUrl }: ApiConsoleProps) {
  const [selectedRoute, setSelectedRoute] = useState<"chat" | "upload">("chat");
  const [chatPromptInput, setChatPromptInput] = useState("What are the key conclusions in the document?");
  const [loading, setLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<{
    status: number;
    timeMs: number;
    data: any;
    error?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setLoading(true);
    setResponseLog(null);
    const start = performance.now();

    const targetUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

    try {
      if (selectedRoute === "chat") {
        const endpoint = targetUrl === "/api" ? "/api/chat" : `${targetUrl}/chat`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: chatPromptInput }),
        });
        const elapsed = Math.round(performance.now() - start);

        let data: any;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          data = await res.text();
        }

        setResponseLog({
          status: res.status,
          timeMs: elapsed,
          data,
          error: !res.ok,
        });
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setResponseLog({
        status: 0,
        timeMs: elapsed,
        data: { message: err?.message || "Network error" },
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    if (!responseLog) return;
    try {
      const text = typeof responseLog.data === "string" 
        ? responseLog.data 
        : JSON.stringify(responseLog.data, null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-white/[0.1] p-5 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">API Debugger & Playground</h3>
              <p className="text-[11px] text-slate-400">Directly execute backend endpoints and inspect raw responses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Console Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Method and Endpoint Selector */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
              POST
            </span>
            <div className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200">
              {baseUrl}/chat
            </div>
            <button
              onClick={handleExecute}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Play className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Sending..." : "Execute"}</span>
            </button>
          </div>

          {/* Request Payload Editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Request JSON Body <code className="text-indigo-400 font-mono font-normal">&#123; "prompt": "..." &#125;</code>
            </label>
            <textarea
              rows={3}
              value={chatPromptInput}
              onChange={(e) => setChatPromptInput(e.target.value)}
              className="w-full glass-input rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none"
              placeholder="Enter your prompt string here..."
            />
          </div>

          {/* Response Inspector */}
          {responseLog && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      responseLog.status >= 200 && responseLog.status < 300
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    HTTP {responseLog.status || "FAIL"}
                  </span>
                  <span className="text-slate-400 text-[11px]">{responseLog.timeMs}ms</span>
                </div>

                <button
                  onClick={copyResponse}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy Response"}</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto max-h-[220px]">
                {typeof responseLog.data === "string"
                  ? responseLog.data
                  : JSON.stringify(responseLog.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
