import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  ArrowDown,
  Loader2, 
  AlertTriangle,
  Lightbulb,
  Cpu
} from "lucide-react";
import { marked } from "marked";
import type { ChatMessage } from "../types";
import { sendChatPrompt } from "../services/api";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  onClearChat: () => void;
  prefillPrompt: string | null;
  onClearPrefill: () => void;
  baseUrl: string;
}

export function ChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  prefillPrompt,
  onClearPrefill,
  baseUrl,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle prefill prompt from document list
  useEffect(() => {
    if (prefillPrompt) {
      setInput(prefillPrompt);
      onClearPrefill();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [prefillPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    setErrorText(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSendMessage(userMsg);
    setInput("");

    setIsLoading(true);

    try {
      const responseContent = await sendChatPrompt(textToSend, baseUrl);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onSendMessage(aiMsg);
    } catch (err: any) {
      setErrorText(err?.message || "Failed to get response from the RAG assistant.");
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Error communicating with the backend:**\n\n${err?.message || "Server did not respond."}\n\n*Please ensure your Express server is running on \`PORT=8080\` and has Qdrant & Groq credentials set in \`.env\`.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      onSendMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const exportChatHistory = () => {
    if (messages.length === 0) return;
    const transcript = messages
      .map(
        (m) =>
          `### ${m.role === "user" ? "👤 User" : "🤖 NexusDoc AI"} (${m.timestamp})\n\n${m.content}\n\n---`
      )
      .join("\n\n");

    const blob = new Blob([transcript], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexusdoc-rag-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const starterSuggestions = [
    { title: "Summarize Document", prompt: "Summarize the primary purpose and main conclusions of the uploaded document in 4 concise bullet points." },
    { title: "Key Findings & Data", prompt: "Extract all significant data points, metrics, statistics, and dates mentioned in the text." },
    { title: "Identify Risks & Gaps", prompt: "What potential risks, limitations, or unanswered questions are highlighted in the document?" },
    { title: "Action Items & Next Steps", prompt: "List the recommended action items, responsibilities, and next steps described in the material." },
  ];

  return (
    <div className="flex flex-col h-[760px] glass-panel rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden relative">
      {/* Chat Header Bar */}
      <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#0c1220]/70 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-sm shadow-indigo-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              RAG Intelligence Thread
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Top-5 Similarity Grounding
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <>
              <button
                onClick={exportChatHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Export Chat History as Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Clear Chat Thread"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10 mb-4 animate-float">
              <Sparkles className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              Ask questions about your documents
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-md">
              The assistant queries your Qdrant vector database using cosine similarity, injects the most relevant chunks into GROQ Llama-3, and synthesizes answers.
            </p>

            {/* Quick Starter Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-6">
              {starterSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(item.prompt)}
                  className="p-3 text-left rounded-xl bg-slate-900/60 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 transition-all group cursor-pointer"
                >
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{item.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? "ml-auto justify-end" : "mr-auto justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-600/20 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`group relative rounded-2xl px-4 py-3 transition-all ${
                    isUser
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/15"
                      : message.error
                      ? "bg-rose-950/30 border border-rose-500/30 text-rose-200 shadow-md"
                      : "glass-card text-slate-200 shadow-md border border-white/[0.08]"
                  }`}
                >
                  {/* Message Content */}
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div
                      className="markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(message.content) as string,
                      }}
                    />
                  )}

                  {/* Message Footer / Copy button */}
                  <div
                    className={`flex items-center gap-2 mt-2 pt-1.5 text-[10px] ${
                      isUser
                        ? "text-indigo-200 justify-end"
                        : "text-slate-500 border-t border-slate-800/60 justify-between"
                    }`}
                  >
                    <span>{message.timestamp}</span>

                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-opacity"
                        title="Copy to clipboard"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card rounded-2xl px-4 py-3 border border-indigo-500/20 text-slate-300 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-200">
                  Retrieving relevant context from Vector DB & generating answer...
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  Similarity search (Top 5) → GROQ inference
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#0c1220]/80 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative flex items-center"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask anything about the ingested documents... (Enter to send, Shift+Enter for new line)"
            className="w-full glass-input text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3.5 pr-24 text-xs sm:text-sm resize-none focus:outline-none transition-all leading-relaxed"
            style={{ minHeight: "48px", maxHeight: "140px" }}
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg font-medium transition-all ${
                input.trim() && !isLoading
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 scale-100 active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
              }`}
              title="Send Prompt (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
          <span>Target Endpoint: <code className="text-slate-400 font-mono">{baseUrl}/chat</code></span>
          <span>Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
