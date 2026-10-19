import React, { useState, useEffect } from "react";
import "./index.css";
import { Header } from "./components/Header";
import { DocumentUploader } from "./components/DocumentUploader";
import { ChatInterface } from "./components/ChatInterface";
import { ConfigModal } from "./components/ConfigModal";
import { ApiConsole } from "./components/ApiConsole";
import { PipelineCard } from "./components/PipelineCard";
import type { UploadedDoc, ChatMessage, BackendStatus } from "./types";
import { getApiBaseUrl, pingBackend } from "./services/api";

export function App() {
  const [baseUrl, setBaseUrl] = useState<string>(getApiBaseUrl());
  const [docs, setDocs] = useState<UploadedDoc[]>(() => {
    try {
      const stored = localStorage.getItem("nexus_docs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem("nexus_messages");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    backendUrl: baseUrl,
    isReachable: false,
    pingMs: 0,
    lastChecked: new Date().toLocaleTimeString(),
    useProxy: baseUrl === "/api",
  });

  const [prefillPrompt, setPrefillPrompt] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConsole, setShowConsole] = useState(false);

  // Persist docs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nexus_docs", JSON.stringify(docs));
    } catch {
      // storage quota or disabled
    }
  }, [docs]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nexus_messages", JSON.stringify(messages));
    } catch {
      // storage quota or disabled
    }
  }, [messages]);

  // Initial and periodic probe of backend health
  const checkHealth = async (url: string = baseUrl) => {
    const res = await pingBackend(url);
    setBackendStatus({
      backendUrl: url,
      isReachable: res.ok,
      pingMs: res.pingMs,
      lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      useProxy: url === "/api",
    });
  };

  useEffect(() => {
    checkHealth(baseUrl);
    const interval = setInterval(() => {
      checkHealth(baseUrl);
    }, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [baseUrl]);

  const handleDocAdded = (doc: UploadedDoc) => {
    setDocs((prev) => [doc, ...prev]);
  };

  const handleDocRemoved = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSendMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleClearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem("nexus_messages");
    } catch {
      // ignore
    }
  };

  const handleUpdateUrl = (newUrl: string) => {
    setBaseUrl(newUrl);
    checkHealth(newUrl);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col relative selection:bg-indigo-500 selection:text-white">
      {/* Ambient glowing background orbs */}
      <div className="ambient-glow w-[500px] h-[500px] -top-32 -left-32 bg-indigo-600 animate-pulse-glow" />
      <div className="ambient-glow w-[600px] h-[600px] top-1/3 -right-48 bg-purple-600 animate-pulse-glow" style={{ animationDelay: "-3s" }} />
      <div className="ambient-glow w-[450px] h-[450px] -bottom-24 left-1/4 bg-cyan-600 animate-pulse-glow" style={{ animationDelay: "-6s" }} />

      {/* Main App Header */}
      <Header
        status={backendStatus}
        docs={docs}
        onOpenSettings={() => setShowConfigModal(true)}
        onOpenConsole={() => setShowConsole(!showConsole)}
        showConsole={showConsole}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: PDF Ingestion & Knowledge Vault */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <DocumentUploader
              docs={docs}
              onDocAdded={handleDocAdded}
              onDocRemoved={handleDocRemoved}
              onSelectPrompt={(p) => setPrefillPrompt(p)}
              baseUrl={baseUrl}
            />
          </div>

          {/* Right Column: Interactive RAG Chat Thread */}
          <div className="lg:col-span-7 xl:col-span-8">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              prefillPrompt={prefillPrompt}
              onClearPrefill={() => setPrefillPrompt(null)}
              baseUrl={baseUrl}
            />
          </div>
        </div>

        {/* Bottom Section: Pipeline Architecture & Parameters Card */}
        <PipelineCard />
      </main>

      {/* Modals & Overlays */}
      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        currentUrl={baseUrl}
        onUpdateUrl={handleUpdateUrl}
      />

      <ApiConsole
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
        baseUrl={baseUrl}
      />
    </div>
  );
}

export default App;
