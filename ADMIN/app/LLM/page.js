"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBackgroundContext } from "@/app/(protected)/context/BackgroundContext";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const OLLAMA_API = "http://localhost:11434";

// ── markdown-ish formatter ───────────────────────────────────
function FormattedMessage({ text }) {
  const lines = text.split("\n");
  const result = [];
  let codeBlock = [];
  let inCode = false;

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (inCode) {
        result.push(
          <pre
            key={i}
            className="font-mono text-xs bg-black/40 border border-cyan-900/40 rounded-lg px-4 py-3 my-3 overflow-x-auto whitespace-pre-wrap text-cyan-300"
          >
            {codeBlock.join("\n")}
          </pre>,
        );
        codeBlock = [];
        inCode = false;
      } else {
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeBlock.push(line);
      return;
    }

    if (line.startsWith("### "))
      return result.push(
        <p key={i} className="font-bold text-sm mt-3 mb-1 text-cyan-300">
          {line.slice(4)}
        </p>,
      );
    if (line.startsWith("## "))
      return result.push(
        <p key={i} className="font-bold text-base mt-4 mb-1 text-cyan-200">
          {line.slice(3)}
        </p>,
      );
    if (line.startsWith("# "))
      return result.push(
        <p key={i} className="font-bold text-lg mt-4 mb-1 text-white">
          {line.slice(2)}
        </p>,
      );
    if (line.startsWith("- ") || line.startsWith("* "))
      return result.push(
        <p key={i} className="pl-4 flex gap-2">
          <span className="text-cyan-500">▸</span>
          <span>{renderInline(line.slice(2))}</span>
        </p>,
      );
    if (/^\d+\.\s/.test(line))
      return result.push(
        <p key={i} className="pl-4">
          {renderInline(line)}
        </p>,
      );
    if (line.trim() === "") return result.push(<div key={i} className="h-2" />);
    result.push(<p key={i}>{renderInline(line)}</p>);
  });

  return <div className="space-y-0.5 leading-relaxed text-sm">{result}</div>;
}

function renderInline(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return (
        <strong key={i} className="text-cyan-200 font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code
          key={i}
          className="font-mono text-xs bg-cyan-950/60 border border-cyan-800/50 rounded px-1.5 py-0.5 text-cyan-300"
        >
          {p.slice(1, -1)}
        </code>
      );
    return p;
  });
}

// ── parsers ──────────────────────────────────────────────────
function parseOllamaList(raw) {
  if (!raw) return [];
  const lines = raw.split("\n").filter(Boolean);
  return lines.slice(1).map((line) => {
    const cols = line.trim().split(/\s{2,}/);
    return {
      name: cols[0] || "",
      id: cols[1] || "",
      size: cols[2] || "",
      modified: cols[3] || "",
    };
  });
}

function parseOllamaPs(raw) {
  if (!raw) return [];
  const lines = raw.split("\n").filter(Boolean);
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => {
    const cols = line.trim().split(/\s{2,}/);
    return {
      name: cols[0] || "",
      id: cols[1] || "",
      size: cols[2] || "",
      processor: cols[3] || "",
      until: cols[4] || "",
    };
  });
}

// ── hexagon icon ─────────────────────────────────────────────
function HexIcon({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
    >
      <polygon
        points="14,2 25,8 25,20 14,26 3,20 3,8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <polygon
        points="14,7 21,11 21,17 14,21 7,17 7,11"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );
}

// ── pulse dot ────────────────────────────────────────────────
function PulseDot({ active }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-emerald-400" : "bg-slate-600"}`}
      />
    </span>
  );
}

export default function OllamaPage() {
  const { theme } = useBackgroundContext();
  const isDark = theme === "dark";
  const router = useRouter();

  // ── theme tokens ─────────────────────────────────────────────
  const pageBg = isDark ? "bg-[#080c14]" : "bg-[#f0f4f8]";
  const cardBg = isDark
    ? "bg-[#0e1521]/90 border border-[#1a2740]/80"
    : "bg-white/90 border border-blue-100";
  const cardGlow = isDark
    ? "shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)]"
    : "shadow-lg";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-slate-500" : "text-gray-400";
  const textLabel = isDark ? "text-slate-300" : "text-gray-600";
  const inputBg = isDark
    ? "bg-[#0a1120] border-[#1e2f4a]"
    : "bg-slate-50 border-slate-200";
  const inputText = isDark
    ? "text-slate-100 placeholder-slate-600"
    : "text-gray-800 placeholder-gray-400";
  const inputFocus =
    "focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/60 focus:outline-none transition-all";
  const tabActive = isDark
    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)]"
    : "bg-cyan-500 text-white shadow-md";
  const tabInactive = isDark
    ? "text-slate-500 border border-transparent hover:text-slate-300 hover:border-slate-700"
    : "text-gray-500 border border-transparent hover:text-gray-700";
  const codeBg = isDark
    ? "bg-[#050a10] text-emerald-400 border border-[#0d1f30]"
    : "bg-gray-950 text-emerald-400 border border-gray-800";
  const tableHeader = isDark
    ? "text-slate-500 border-b border-[#1a2740]"
    : "text-gray-400 border-b border-gray-100";
  const tableRow = isDark
    ? "border-b border-[#111d2e]/80 hover:bg-cyan-950/10 transition-colors"
    : "border-b border-gray-50 hover:bg-blue-50/30 transition-colors";
  const accentBtn =
    "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_-3px_rgba(6,182,212,0.6)] transition-all";
  const neutralBtn = isDark
    ? "bg-[#111d2e] hover:bg-[#162236] text-slate-300 border border-[#1e2f4a] hover:border-slate-600 transition-all"
    : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-all";
  const dangerBtn =
    "bg-red-600/80 hover:bg-red-500 text-white border border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)] transition-all";
  const bubbleUser = isDark
    ? "bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-[0_4px_20px_-5px_rgba(6,182,212,0.4)]"
    : "bg-cyan-500 text-white";
  const bubbleAI = isDark
    ? "bg-[#0e1a2e] text-slate-100 border border-[#1a2f4a]"
    : "bg-white text-gray-800 border border-gray-200 shadow-sm";
  const divider = isDark ? "border-[#111d2e]" : "border-gray-100";
  const badgeOn =
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  const badgeOff = isDark
    ? "bg-slate-800/60 text-slate-500 border border-slate-700/50"
    : "bg-gray-100 text-gray-400 border border-gray-200";
  const gridOverlay = isDark ? "opacity-[0.03]" : "opacity-[0.04]";

  // ── state ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("chat");
  const [models, setModels] = useState([]);
  const [runningModels, setRunning] = useState([]);
  const [statusLog, setStatusLog] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingPs, setLoadingPs] = useState(false);
  const [warmingUp, setWarmingUp] = useState("");

  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const abortRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamBuffer]);

  const log = useCallback((msg, type = "info") => {
    setStatusLog((p) => [
      {
        id: Date.now() + Math.random(),
        msg,
        type,
        time: new Date().toLocaleTimeString(),
      },
      ...p,
    ]);
  }, []);

  const fetchList = async () => {
    setLoadingList(true);
    log("$ ollama list");
    try {
      const res = await window.ollama.list();
      if (res.success) {
        const rows = parseOllamaList(res.output);
        setModels(rows);
        log(`✓ ${rows.length} model(s) installed`, "success");
        if (rows.length && !selectedModel)
          setSelectedModel(rows[0].name.split(":")[0]);
      } else {
        log(`✗ ${res.output}`, "error");
      }
    } catch (e) {
      log(`✗ ${e}`, "error");
    } finally {
      setLoadingList(false);
    }
  };

  const fetchPs = async () => {
    setLoadingPs(true);
    log("$ ollama ps");
    try {
      const res = await window.ollama.ps();
      if (res.success) {
        const rows = parseOllamaPs(res.output);
        setRunning(rows);
        log(
          rows.length > 0
            ? `✓ ${rows.length} model(s) running`
            : "✓ No models loaded in memory.",
          rows.length > 0 ? "success" : "warn",
        );
      } else {
        log(`✗ ${res.output}`, "error");
      }
    } catch (e) {
      log(`✗ ${e}`, "error");
    } finally {
      setLoadingPs(false);
    }
  };

  const warmUpModel = async (modelName) => {
    setWarmingUp(modelName);
    log(`$ ollama run ${modelName}  (loading into memory…)`);
    try {
      const res = await window.ollama.run(modelName);
      log(
        res.success ? `✓ ${modelName} loaded` : `✗ ${res.output}`,
        res.success ? "success" : "error",
      );
      await fetchPs();
    } catch (e) {
      log(`✗ ${e}`, "error");
    } finally {
      setWarmingUp("");
    }
  };

  const [stoppingModel, setStoppingModel] = useState("");
  const stopModel = async (modelName) => {
    setStoppingModel(modelName);
    log(`$ Unloading ${modelName} from memory…`);
    try {
      const resp = await fetch(`${OLLAMA_API}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName, keep_alive: 0 }),
      });
      if (resp.ok) {
        log(`✓ ${modelName} unloaded`, "success");
      } else {
        const err = await resp.text();
        log(`✗ Failed to unload: ${err}`, "error");
      }
    } catch (e) {
      log(`✗ ${e.message}`, "error");
    } finally {
      setStoppingModel("");
      await fetchPs();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedModel || streaming) return;
    const userText = input.trim();
    setInput("");
    const newHistory = [...messages, { role: "user", content: userText }];
    setMessages(newHistory);
    setStreaming(true);
    setStreamBuffer("");
    abortRef.current = new AbortController();
    try {
      const resp = await fetch(`${OLLAMA_API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: selectedModel,
          messages: newHistory,
          stream: true,
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Ollama API ${resp.status}: ${errText}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter(Boolean)) {
          try {
            const json = JSON.parse(line);
            const token = json?.message?.content ?? "";
            fullResponse += token;
            setStreamBuffer(fullResponse);
          } catch {}
        }
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullResponse },
      ]);
    } catch (e) {
      if (e.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠ **Error:** ${e.message}\n\nMake sure:\n- Ollama is running (\`ollama serve\`)\n- The model \`${selectedModel}\` is pulled`,
          },
        ]);
      }
    } finally {
      setStreamBuffer("");
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => abortRef.current?.abort();
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    fetchList();
    fetchPs();
  }, []);

  // ────────────────────────────────────────────────────────────
  return (
    <div
      className={`h-screen flex flex-col ${pageBg} transition-colors duration-500 relative overflow-hidden`}
    >
      {/* Background grid */}
      <div
        className={`absolute inset-0 pointer-events-none ${gridOverlay}`}
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow */}
      {isDark && (
        <>
          <div className="absolute top-0 left-1/3 w-[600px] h-96 bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      <div className="relative flex flex-col flex-1 min-h-0 px-5 pt-5 pb-4 gap-4">
        {/* ── Header ── */}
        <div
          className={`${cardBg} ${cardGlow} rounded-2xl px-6 py-4 flex items-center`}
        >
          {/* Back Button - Left */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-cyan-500/10"
          >
            <ChevronLeft size={14} />
            BACK
          </button>

          {/* Logo + Title - Centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
            {/* Logo Icon */}
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_25px_-5px_rgba(6,182,212,0.7)]">
                <HexIcon size={22} className="text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#080c14] shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>

            {/* Title */}
            <div>
              <h1
                className={`text-xl font-bold tracking-tight ${textPrimary} font-mono`}
              >
                OLLAMA <span className="text-cyan-400">STUDIO</span>
              </h1>
              <p
                className={`text-xs ${textSecondary} tracking-widest uppercase`}
              >
                Local LLM Interface
              </p>
            </div>
          </div>

          {/* Right Side Badges */}
          <div className="ml-auto flex items-center gap-3">
            {/* Active Model Badge */}
            <div
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-mono ${runningModels.length > 0 ? badgeOn : badgeOff}`}
            >
              <PulseDot active={runningModels.length > 0} />
              {runningModels.length > 0 ? runningModels[0].name : "idle"}
            </div>

            {/* Model Count */}
            <div
              className={`hidden sm:flex items-center gap-2 text-xs ${textSecondary} font-mono`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
              {models.length} models
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2">
          {[
            { id: "chat", label: "Chat", icon: "◈" },
            { id: "status", label: "Status", icon: "⬡" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all font-mono ${activeTab === tab.id ? tabActive : tabInactive}`}
            >
              <span className="mr-2 opacity-70">{tab.icon}</span>
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ══════════════ CHAT TAB ══════════════ */}
        {activeTab === "chat" && (
          <div
            className={`${cardBg} ${cardGlow} rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden`}
          >
            {/* Model selector bar */}
            <div
              className={`flex items-center gap-3 px-6 py-3 border-b ${divider} shrink-0 bg-gradient-to-r ${isDark ? "from-cyan-950/20 to-transparent" : "from-cyan-50/50 to-transparent"}`}
            >
              <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-semibold ${textSecondary} uppercase tracking-widest whitespace-nowrap`}
                >
                  MODEL
                </span>
                <div className="flex-1 max-w-sm relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={`w-full pl-3 pr-8 py-2 rounded-lg border text-sm font-mono ${inputBg} ${inputText} ${inputFocus} appearance-none cursor-pointer`}
                  >
                    <option value="">— select —</option>
                    {models.map((m) => (
                      <option key={m.name} value={m.name.split(":")[0]}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <span
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs ${textSecondary} pointer-events-none`}
                  >
                    ▾
                  </span>
                </div>
                <span
                  className={`hidden md:flex items-center gap-1.5 text-xs font-mono ${textSecondary}`}
                >
                  <span
                    className={`${isDark ? "text-cyan-600" : "text-cyan-400"}`}
                  >
                    ⬡
                  </span>
                  localhost:11434/api/chat
                </span>
                <button
                  onClick={() => setMessages([])}
                  className={`ml-auto text-xs px-3 py-1.5 rounded-lg font-mono ${neutralBtn}`}
                >
                  CLEAR
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto py-5 space-y-5"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: isDark
                  ? "#1a2f4a transparent"
                  : "#cbd5e1 transparent",
              }}
            >
              <div className="max-w-4xl mx-auto px-6 space-y-5 h-full">
                {messages.length === 0 && !streaming && (
                  <div
                    className={`flex flex-col items-center justify-center h-full gap-4 ${textSecondary}`}
                  >
                    <div className="relative">
                      <HexIcon
                        size={56}
                        className={`${isDark ? "text-cyan-900" : "text-cyan-200"}`}
                      />
                      <div
                        className={`absolute inset-0 flex items-center justify-center ${isDark ? "text-cyan-800" : "text-cyan-300"} text-xs font-mono`}
                      >
                        AI
                      </div>
                    </div>
                    <p className={`text-sm font-mono ${textSecondary}`}>
                      {selectedModel
                        ? `[ ${selectedModel} · ready ]`
                        : "[ select a model to begin ]"}
                    </p>
                    {selectedModel && (
                      <p
                        className={`text-xs font-mono ${isDark ? "text-slate-700" : "text-gray-300"}`}
                      >
                        press enter ↵ to send
                      </p>
                    )}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_12px_-2px_rgba(6,182,212,0.5)]">
                        <HexIcon size={14} className="text-white/80" />
                      </div>
                    )}
                    <div
                      className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm ${msg.role === "user" ? bubbleUser : bubbleAI} ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    >
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <FormattedMessage text={msg.content} />
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0 mt-1 text-white/60 text-xs font-bold">
                        U
                      </div>
                    )}
                  </div>
                ))}

                {streaming && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_12px_-2px_rgba(6,182,212,0.5)]">
                      <HexIcon size={14} className="text-white/80" />
                    </div>
                    <div
                      className={`max-w-[72%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm ${bubbleAI}`}
                    >
                      {streamBuffer ? (
                        <FormattedMessage text={streamBuffer} />
                      ) : (
                        <span className="flex gap-1 items-center">
                          <span
                            className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div
              className={`px-6 py-4 border-t ${divider} shrink-0 ${isDark ? "bg-[#080d16]/60" : "bg-gray-50/60"}`}
            >
              <div className="max-w-4xl mx-auto">
                {!selectedModel && (
                  <p className="text-xs text-amber-500/80 mb-2 font-mono flex items-center gap-2">
                    <span>⚠</span> Select a model above first.
                  </p>
                )}
                <div className="flex gap-2.5 items-end">
                  <textarea
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!selectedModel || streaming}
                    placeholder={
                      selectedModel
                        ? "Ask anything…  [ Enter ↵ to send · Shift+Enter for newline ]"
                        : "Select a model first"
                    }
                    className={`flex-1 resize-none px-4 py-2.5 rounded-xl border text-sm font-mono ${inputBg} ${inputText} ${inputFocus} disabled:opacity-30`}
                    style={{ scrollbarWidth: "none" }}
                  />
                  {streaming ? (
                    <button
                      onClick={stopStreaming}
                      className={`px-5 py-2.5 rounded-xl text-sm font-mono font-semibold ${dangerBtn}`}
                    >
                      ■ STOP
                    </button>
                  ) : (
                    <button
                      onClick={sendMessage}
                      disabled={!selectedModel || !input.trim()}
                      className={`px-5 py-2.5 rounded-xl text-sm font-mono font-semibold ${accentBtn} disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none`}
                    >
                      SEND ›
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ STATUS TAB ══════════════ */}
        {activeTab === "status" && (
          <div
            className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: isDark
                ? "#1a2f4a transparent"
                : "#cbd5e1 transparent",
            }}
          >
            {/* Controls bar */}
            <div
              className={`${cardBg} ${cardGlow} rounded-2xl px-5 py-4 flex flex-wrap gap-3 items-center`}
            >
              <button
                onClick={fetchPs}
                disabled={loadingPs}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold ${accentBtn} disabled:opacity-50`}
              >
                {loadingPs ? "⟳ Checking…" : "⟳ ollama ps"}
              </button>
              <button
                onClick={fetchList}
                disabled={loadingList}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold ${accentBtn} disabled:opacity-50`}
              >
                {loadingList ? "⟳ Loading…" : "☰ ollama list"}
              </button>
              {runningModels.length > 0 && (
                <button
                  onClick={() =>
                    runningModels.forEach((m) =>
                      stopModel(m.name.split(":")[0]),
                    )
                  }
                  disabled={!!stoppingModel}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold ${dangerBtn} disabled:opacity-50`}
                >
                  ■ Stop All
                </button>
              )}
              <span
                className={`text-xs font-mono ${textSecondary} ml-auto flex items-center gap-1.5`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                IPC → PowerShell · REST → localhost:11434
              </span>
            </div>

            {/* Running models */}
            <div
              className={`${cardBg} ${cardGlow} rounded-2xl overflow-hidden`}
            >
              <div
                className={`px-5 py-3 border-b ${divider} flex items-center gap-2 ${isDark ? "bg-emerald-950/20" : "bg-emerald-50/50"}`}
              >
                <PulseDot active={runningModels.length > 0} />
                <h2
                  className={`text-xs font-mono font-bold uppercase tracking-widest ${textSecondary}`}
                >
                  Running — ollama ps
                </h2>
                {runningModels.length > 0 && (
                  <span className="ml-auto text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {runningModels.length} active
                  </span>
                )}
              </div>
              <div className="p-5">
                {runningModels.length === 0 ? (
                  <p
                    className={`text-sm font-mono ${textSecondary} flex items-center gap-2`}
                  >
                    <span className="opacity-40">◈</span> No models loaded in
                    memory.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={tableHeader}>
                          {["Name", "ID", "Size", "Processor", "Until", ""].map(
                            (h, i) => (
                              <th
                                key={i}
                                className="text-left px-3 py-2 font-mono text-xs uppercase tracking-widest"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {runningModels.map((m, i) => (
                          <tr key={i} className={tableRow}>
                            <td className="px-3 py-3 font-mono font-semibold text-cyan-400">
                              {m.name}
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-xs ${textSecondary}`}
                            >
                              {m.id}
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-xs ${textLabel}`}
                            >
                              {m.size}
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-xs ${textLabel}`}
                            >
                              {m.processor}
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-xs ${textSecondary}`}
                            >
                              {m.until}
                            </td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() => stopModel(m.name.split(":")[0])}
                                disabled={!!stoppingModel}
                                className={`text-xs px-3 py-1.5 rounded-lg font-mono ${dangerBtn} disabled:opacity-40`}
                              >
                                {stoppingModel === m.name.split(":")[0]
                                  ? "…"
                                  : "■ Stop"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Installed models */}
            <div
              className={`${cardBg} ${cardGlow} rounded-2xl overflow-hidden`}
            >
              <div
                className={`px-5 py-3 border-b ${divider} flex items-center gap-2 ${isDark ? "bg-cyan-950/10" : "bg-cyan-50/30"}`}
              >
                <span className="text-cyan-500 text-sm">⬡</span>
                <h2
                  className={`text-xs font-mono font-bold uppercase tracking-widest ${textSecondary}`}
                >
                  Installed — ollama list
                </h2>
                {models.length > 0 && (
                  <span className="ml-auto text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {models.length} installed
                  </span>
                )}
              </div>
              <div className="p-5">
                {models.length === 0 ? (
                  <p
                    className={`text-sm font-mono ${textSecondary} flex items-center gap-2`}
                  >
                    <span className="opacity-40">◈</span> No models found. Run{" "}
                    <code className="font-mono text-cyan-500 bg-cyan-950/30 border border-cyan-900/40 rounded px-1.5">
                      ollama pull &lt;model&gt;
                    </code>{" "}
                    in your terminal.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={tableHeader}>
                          {["Name", "ID", "Size", "Modified", "", ""].map(
                            (h, i) => (
                              <th
                                key={i}
                                className="text-left px-3 py-2 font-mono text-xs uppercase tracking-widest"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {models.map((m, i) => (
                          <tr key={i} className={tableRow}>
                            <td className="px-3 py-3 font-mono font-semibold text-cyan-400">
                              {m.name}
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-xs ${textSecondary}`}
                            >
                              {m.id}
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-xs ${textLabel}`}
                            >
                              {m.size}
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-xs ${textSecondary}`}
                            >
                              {m.modified}
                            </td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() =>
                                  warmUpModel(m.name.split(":")[0])
                                }
                                disabled={!!warmingUp}
                                className={`text-xs px-3 py-1.5 rounded-lg font-mono ${neutralBtn} disabled:opacity-40`}
                              >
                                {warmingUp === m.name.split(":")[0]
                                  ? "Loading…"
                                  : "▲ Load"}
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() => {
                                  setSelectedModel(m.name.split(":")[0]);
                                  setActiveTab("chat");
                                }}
                                className={`text-xs px-3 py-1.5 rounded-lg font-mono ${accentBtn}`}
                              >
                                Chat ›
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Activity log */}
            <div
              className={`${cardBg} ${cardGlow} rounded-2xl overflow-hidden`}
            >
              <div
                className={`px-5 py-3 border-b ${divider} flex items-center justify-between ${isDark ? "bg-slate-900/40" : "bg-gray-50/60"}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${isDark ? "text-slate-700" : "text-gray-300"}`}
                  >
                    ◉
                  </span>
                  <h2
                    className={`text-xs font-mono font-bold uppercase tracking-widest ${textSecondary}`}
                  >
                    Activity Log
                  </h2>
                </div>
                <button
                  onClick={() => setStatusLog([])}
                  className={`text-xs px-3 py-1.5 rounded-lg font-mono ${neutralBtn}`}
                >
                  CLEAR
                </button>
              </div>
              <div
                className={`${codeBg} rounded-b-2xl px-4 py-4 font-mono text-xs h-52 overflow-y-auto space-y-1`}
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#1a2f4a transparent",
                }}
              >
                {statusLog.length === 0 ? (
                  <p className="text-slate-700 italic">// no activity yet</p>
                ) : (
                  statusLog.map((e) => (
                    <div key={e.id} className="flex gap-3 items-baseline">
                      <span className="text-slate-700 shrink-0 tabular-nums">
                        [{e.time}]
                      </span>
                      <span
                        className={
                          e.type === "error"
                            ? "text-red-400"
                            : e.type === "success"
                              ? "text-emerald-400"
                              : e.type === "warn"
                                ? "text-amber-400"
                                : "text-green-400/80"
                        }
                      >
                        {e.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
