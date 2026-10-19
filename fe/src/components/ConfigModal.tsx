import React, { useState } from "react";
import { X, Check, Globe, RefreshCw, Server, AlertCircle, Info } from "lucide-react";
import { pingBackend, setApiBaseUrl } from "../services/api";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onUpdateUrl: (url: string) => void;
}

export function ConfigModal({
  isOpen,
  onClose,
  currentUrl,
  onUpdateUrl,
}: ConfigModalProps) {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    pingMs: number;
    statusText: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await pingBackend(urlInput.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        ok: false,
        pingMs: 0,
        statusText: err?.message || "Failed to reach server",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = urlInput.trim();
    setApiBaseUrl(trimmed);
    onUpdateUrl(trimmed);
    onClose();
  };

  const presetUrls = [
    { label: "Bun Reverse Proxy (/api)", value: "/api", desc: "No CORS issues, proxies to backend directly" },
    { label: "Direct Backend (http://localhost:8080)", value: "http://localhost:8080", desc: "Direct browser-to-Express requests" },
    { label: "Direct IPv4 (http://127.0.0.1:8080)", value: "http://127.0.0.1:8080", desc: "Explicit localhost IPv4 address" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/[0.1] p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Backend Connection Settings</h3>
              <p className="text-xs text-slate-400">Configure target API endpoint for upload and chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Backend Endpoint Base URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="/api or http://localhost:8080"
                className="flex-1 glass-input rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin text-indigo-400" : ""}`} />
                <span>Test Ping</span>
              </button>
            </div>
          </div>

          {/* Test feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                testResult.ok
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.ok ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {testResult.ok ? "Server Reachable!" : "Could not connect to server."}
                </span>
              </div>
              <span className="font-mono text-[11px]">
                {testResult.ok ? `${testResult.pingMs}ms` : testResult.statusText}
              </span>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Quick Presets</p>
            <div className="space-y-1.5">
              {presetUrls.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setUrlInput(preset.value)}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                    urlInput === preset.value
                      ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-300"
                      : "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <p className="text-xs font-medium">{preset.label}</p>
                    <p className="text-[11px] text-slate-500">{preset.desc}</p>
                  </div>
                  {urlInput === preset.value && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Architecture hint */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p>
              Your backend Express server is defined in <code className="text-indigo-300 font-mono">ts/index.ts</code> and listens on port <strong>8080</strong> by default.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
