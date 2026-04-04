"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useBackgroundContext } from "@/app/(protected)/context/BackgroundContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  FileText,
  Upload,
  Tag,
  Link,
  AlignLeft,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  FileUp,
  Sparkles,
  X,
  RefreshCw,
  MessageSquare,
  Info,
  Zap,
  Cpu,
  ChevronDown,
} from "lucide-react";
import useApi from "@/services/authservices";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const estimateReadTime = (html) => {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const wordCount = (html) =>
  html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ onFileReady, isDark, fileName, isProcessing, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file?.name.match(/\.(docx|doc)$/i)) return;
    onFileReady(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !isProcessing && inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
        flex flex-col items-center justify-center gap-3 py-10 px-6 text-center select-none
        ${
          dragging
            ? isDark
              ? "border-amber-400 bg-amber-900/20"
              : "border-amber-500 bg-amber-50"
            : isDark
              ? "border-slate-600 hover:border-amber-500 bg-slate-800/40 hover:bg-slate-800/70"
              : "border-gray-200 hover:border-amber-400 bg-gray-50 hover:bg-amber-50/40"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".doc,.docx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {isProcessing ? (
        <>
          <Loader2
            className={`w-10 h-10 animate-spin ${isDark ? "text-amber-400" : "text-amber-500"}`}
          />
          <p
            className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-600"}`}
          >
            Converting document…
          </p>
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Sending to server, waiting for HTML…
          </p>
        </>
      ) : fileName ? (
        <>
          <CheckCircle className="w-10 h-10 text-emerald-500" />
          <p
            className={`text-sm font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
          >
            {fileName}
          </p>
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}
          >
            Click or drop to replace
          </p>
        </>
      ) : (
        <>
          <div
            className={`p-4 rounded-xl ${isDark ? "bg-slate-700/60" : "bg-white"} shadow-sm`}
          >
            <FileUp
              className={`w-8 h-8 ${isDark ? "text-amber-400" : "text-amber-500"}`}
            />
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-gray-700"}`}
            >
              Drop your Word document here
            </p>
            <p
              className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}
            >
              .docx or .doc — converted to HTML on your server
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full border font-medium
            ${isDark ? "border-slate-600 text-slate-400" : "border-gray-200 text-gray-500"}`}
          >
            Browse files
          </span>
        </>
      )}

      {error && (
        <div className="flex items-center gap-2 mt-1 text-red-500 text-xs">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}

// ─── Conversion Options (prompt + provider + model) ──────────────────────────

const PROVIDERS = [
  { value: "groq", label: "Groq", hint: "Fastest" },
  { value: "gemini", label: "Gemini", hint: "Balanced" },
  { value: "openrouter", label: "OpenRouter", hint: "Fallback" },
];

const MODELS = [
  { value: "fast", label: "Fast", hint: "Less tokens, quicker" },
  { value: "balanced", label: "Balanced", hint: "Recommended" },
  { value: "powerful", label: "Powerful", hint: "Best quality, more cost" },
];

function ConversionOptions({
  prompt,
  onPromptChange,
  providers,
  onProvidersChange,
  model,
  onModelChange,
  isDark,
}) {
  const [open, setOpen] = useState(false);

  const inputCls = `w-full rounded-xl px-4 py-2.5 text-xs outline-none transition-all border resize-none
    ${
      isDark
        ? "bg-slate-900/60 border-slate-700 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
        : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
    }`;

  const toggleProvider = (val) => {
    onProvidersChange(
      providers.includes(val)
        ? providers.filter((p) => p !== val)
        : [...providers, val],
    );
  };

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-xs font-medium transition-colors
          ${isDark ? "text-slate-400 hover:text-amber-400" : "text-gray-400 hover:text-amber-600"}`}
      >
        <Cpu className="w-3.5 h-3.5" />
        Conversion options
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full
          ${isDark ? "bg-slate-700 text-slate-400" : "bg-gray-100 text-gray-400"}`}
        >
          optional
        </span>
        <ChevronDown
          className={`w-3 h-3 ml-auto transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-3"
          >
            {/* Custom prompt */}
            <div className="space-y-1">
              <label
                className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider
                ${isDark ? "text-slate-500" : "text-gray-400"}`}
              >
                <MessageSquare className="w-3 h-3" /> Custom instructions
              </label>
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={`e.g. "Preserve all tables", "Skip headers/footers"…`}
                className={inputCls}
              />
              <p
                className={`text-[10px] ${isDark ? "text-slate-600" : "text-gray-400"}`}
              >
                Sent as <code className="font-mono">prompt</code> to your
                backend alongside the file.
              </p>
            </div>

            {/* Provider selection (multi-select, order = waterfall priority) */}
            <div className="space-y-1.5">
              <label
                className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider
                ${isDark ? "text-slate-500" : "text-gray-400"}`}
              >
                <Zap className="w-3 h-3" /> Providers
                <span
                  className={`ml-1 normal-case font-normal ${isDark ? "text-slate-600" : "text-gray-300"}`}
                >
                  (waterfall order, multi-select)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.map(({ value, label, hint }) => {
                  const active = providers.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleProvider(value)}
                      className={`flex flex-col items-start px-3 py-1.5 rounded-lg border text-left transition-all text-xs
                        ${
                          active
                            ? isDark
                              ? "border-amber-500 bg-amber-900/20 text-amber-300"
                              : "border-amber-400 bg-amber-50 text-amber-700"
                            : isDark
                              ? "border-slate-700 text-slate-500 hover:border-slate-500"
                              : "border-gray-200 text-gray-400 hover:border-gray-300"
                        }`}
                    >
                      <span className="font-semibold">{label}</span>
                      <span
                        className={`text-[10px] ${isDark ? "text-slate-600" : "text-gray-400"}`}
                      >
                        {hint}
                      </span>
                    </button>
                  );
                })}
              </div>
              {providers.length === 0 && (
                <p className="text-[10px] text-red-400">
                  Select at least one provider
                </p>
              )}
              {providers.length > 1 && (
                <p
                  className={`text-[10px] ${isDark ? "text-slate-600" : "text-gray-400"}`}
                >
                  Order: {providers.join(" → ")} — falls back to next if one
                  fails
                </p>
              )}
            </div>

            {/* Model tier */}
            <div className="space-y-1.5">
              <label
                className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider
                ${isDark ? "text-slate-500" : "text-gray-400"}`}
              >
                <Cpu className="w-3 h-3" /> Model tier
              </label>
              <div className="flex gap-2">
                {MODELS.map(({ value, label, hint }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onModelChange(value)}
                    className={`flex-1 flex flex-col items-center px-2 py-2 rounded-lg border text-xs transition-all
                      ${
                        model === value
                          ? isDark
                            ? "border-amber-500 bg-amber-900/20 text-amber-300"
                            : "border-amber-400 bg-amber-50 text-amber-700"
                          : isDark
                            ? "border-slate-700 text-slate-500 hover:border-slate-500"
                            : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                  >
                    <span className="font-semibold">{label}</span>
                    <span
                      className={`text-[10px] text-center mt-0.5 ${isDark ? "text-slate-600" : "text-gray-400"}`}
                    >
                      {hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, icon: Icon, children, isDark, hint }) {
  return (
    <div className="space-y-1.5">
      <label
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider
        ${isDark ? "text-slate-400" : "text-gray-500"}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
        {hint && (
          <span
            className={`ml-auto normal-case font-normal ${isDark ? "text-slate-600" : "text-gray-300"}`}
          >
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function TextInput({ isDark, ...props }) {
  return (
    <input
      className={`
        w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all border
        ${
          isDark
            ? "bg-slate-900/60 border-slate-700 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
            : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
        }
      `}
      {...props}
    />
  );
}

// ─── Tag Chip ─────────────────────────────────────────────────────────────────

function TagChip({ tag, onRemove, isDark }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border
      ${isDark ? "bg-amber-900/30 border-amber-700/50 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"}`}
    >
      {tag}
      <button
        onClick={() => onRemove(tag)}
        className="hover:opacity-70 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Step Badge ───────────────────────────────────────────────────────────────

function StepBadge({ n, label, active, done, isDark }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs font-medium transition-colors ${
        done
          ? "text-emerald-500"
          : active
            ? isDark
              ? "text-amber-400"
              : "text-amber-600"
            : isDark
              ? "text-slate-600"
              : "text-gray-300"
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border font-bold transition-all
        ${
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : active
              ? isDark
                ? "border-amber-500 text-amber-400"
                : "border-amber-500 text-amber-600"
              : isDark
                ? "border-slate-700 text-slate-600"
                : "border-gray-200 text-gray-300"
        }`}
      >
        {done ? "✓" : n}
      </span>
      {label}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ html, isDark }) {
  const words = wordCount(html);
  const headings = (html.match(/<h[1-6]/gi) || []).length;
  const images = (html.match(/<img/gi) || []).length;
  const tables = (html.match(/<table/gi) || []).length;

  const stat = (label, val) => (
    <span className="flex items-center gap-1">
      <span
        className={`font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}`}
      >
        {val}
      </span>
      <span>{label}</span>
    </span>
  );

  return (
    <div
      className={`flex flex-wrap items-center gap-3 px-4 py-2 text-xs border-t
      ${isDark ? "border-slate-800 text-slate-500 bg-slate-800/40" : "border-gray-100 text-gray-400 bg-gray-50"}`}
    >
      {stat("words", words)}
      <span className={isDark ? "text-slate-700" : "text-gray-200"}>·</span>
      {stat("headings", headings)}
      {tables > 0 && (
        <>
          <span className={isDark ? "text-slate-700" : "text-gray-200"}>·</span>
          {stat("tables", tables)}
        </>
      )}
      {images > 0 && (
        <>
          <span className={isDark ? "text-slate-700" : "text-gray-200"}>·</span>
          {stat("images", images)}
        </>
      )}
      <span className="ml-auto">{estimateReadTime(html)}</span>
    </div>
  );
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

function PreviewPanel({ formData, isDark }) {
  const hasContent = formData.title || formData.content;
  return (
    <div
      className={`h-full rounded-2xl overflow-hidden border flex flex-col
      ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-100"}`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-5 py-3 border-b text-xs font-semibold uppercase tracking-widest
        ${isDark ? "border-slate-800 text-slate-400 bg-slate-800/50" : "border-gray-100 text-gray-400 bg-gray-50"}`}
      >
        <Eye className="w-3.5 h-3.5" />
        Live Preview
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {hasContent ? (
          <article>
            {formData.title && (
              <header className="mb-6">
                <h1
                  className={`text-2xl font-bold leading-tight mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {formData.title}
                </h1>
                {formData.excerpt && (
                  <p className={`text-sm leading-relaxed mb-4 ${isDark ? "text-slate-300" : "text-gray-500"}`}>
                    {formData.excerpt}
                  </p>
                )}
                <div className={`flex flex-wrap items-center gap-4 text-xs mb-4 ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(formData.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {formData.content && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {estimateReadTime(formData.content)}
                    </span>
                  )}
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2.5 py-0.5 rounded-full text-xs border font-medium
                        ${isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-gray-100 border-gray-200 text-gray-600"}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className={`border-b mb-6 ${isDark ? "border-slate-700" : "border-gray-100"}`} />
              </header>
            )}

            {formData.content && (
              <>
                {/*
                  KEY CHANGE: Only fix what inline CSS cannot handle in dark mode.
                  - LLM already writes correct colors (#d0d0d0, #f0f0f0, #a8dadc etc.)
                  - We only override blockquote background (semi-transparent looks bad on slate-900)
                  - We remove Tailwind prose resets that fight inline styles
                  - NO !important overrides on text colors — trust the LLM inline CSS
                */}
                <style>{`
                  .preview-content * {
                    max-width: 100%;
                  }
                  .preview-content blockquote {
                    background: ${isDark ? "rgba(230,57,70,0.06)" : "rgba(230,57,70,0.04)"} !important;
                  }
                  .preview-content pre {
                    background: ${isDark ? "#0d1117" : "#f6f8fa"} !important;
                  }
                  .preview-content table {
                    background: transparent !important;
                  }
                  .preview-content tr:nth-child(even) {
                    background: ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"} !important;
                  }
                  .preview-content img {
                    border-radius: 6px;
                  }
                  /* Fix: LLM uses light colors on light mode bg */
                  ${!isDark ? `
                    .preview-content h1 { color: #1a1a2e !important; }
                    .preview-content h2 { color: #1a1a2e !important; }
                    .preview-content h3 { color: #0f3460 !important; }
                    .preview-content p  { color: #2d2d2d !important; }
                    .preview-content li { color: #2d2d2d !important; }
                    .preview-content blockquote { color: #444 !important; }
                  ` : ""}
                `}</style>

                <div
                  className="preview-content"
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: 1.85,
                    // Remove any Tailwind prose resets bleeding in
                    fontFamily: "inherit",
                  }}
                  dangerouslySetInnerHTML={{ __html: formData.content }}
                />
              </>
            )}
          </article>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center">
            <FileText className={`w-12 h-12 mb-3 ${isDark ? "text-slate-700" : "text-gray-200"}`} />
            <p className={`text-sm ${isDark ? "text-slate-500" : "text-gray-300"}`}>
              Your preview will appear here
            </p>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-gray-200"}`}>
              Upload a document to get started
            </p>
          </div>
        )}
      </div>

      {formData.content && <StatsBar html={formData.content} isDark={isDark} />}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
        ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
    >
      {type === "success" ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      {message}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Info Note ────────────────────────────────────────────────────────────────

function InfoNote({ children, isDark }) {
  return (
    <div
      className={`flex gap-2 text-xs rounded-lg px-3 py-2 border
      ${isDark ? "bg-slate-800/50 border-slate-700/50 text-slate-500" : "bg-gray-50 border-gray-100 text-gray-400"}`}
    >
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BlogUpload() {
  const { theme } = useBackgroundContext();
  const isDark = theme === "dark";

  // File state — keep the File object for regeneration
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [providers, setProviders] = useState(["groq", "gemini", "openrouter"]);
  const [model, setModel] = useState("balanced");

  // Conversion state
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [generationCount, setGenerationCount] = useState(0);

  const api = useApi();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    date: new Date().toISOString().split("T")[0],
    tags: [],
    content: "", // HTML returned from backend
  });
  const [tagInput, setTagInput] = useState("");

  // Publish state
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Steps
  const step1Done = !!formData.content;
  const step2Done = !!(formData.title && formData.slug);
  const step3Ready = step1Done && step2Done;

  // ── Core conversion — shared by upload + regenerate ──────────────────────
  /**
   * POST /api/convert-docx
   * FormData fields:
   *   file   — the raw .docx File object
   *   prompt — (optional) custom instruction string
   *
   * Expected response JSON:
   *   { html: "<p>...</p>" }
   */
  const convertFile = useCallback(
    async (fileToConvert, prompt, providerList, modelTier) => {
      if (!fileToConvert) return;

      setIsProcessing(true);
      setUploadError("");

      try {
        const fd = new FormData();
        fd.append("file", fileToConvert);
        if (prompt?.trim()) fd.append("prompt", prompt.trim());
        if (providerList?.length)
          fd.append("providers", providerList.join(","));
        if (modelTier) fd.append("model", modelTier);

        const res = await api(
          `${process.env.NEXT_PUBLIC_SERVER_API_URL}/convert-docx`,
          {
            method: "POST",
            body: fd,
          },
        );

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Server error ${res.status}`);
        }

        const data = await res.json();
        if (!data.html) throw new Error("No HTML returned from server");

        setFormData((p) => ({ ...p, content: data.html }));
        setGenerationCount((c) => c + 1);
        setToast({
          message: "Document converted successfully!",
          type: "success",
        });
      } catch (err) {
        setUploadError(err.message || "Conversion failed");
        setToast({
          message: err.message || "Conversion failed",
          type: "error",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  // ── New file uploaded ─────────────────────────────────────────────────────
  const handleFileReady = useCallback(
    (newFile) => {
      setFile(newFile);
      setFileName(newFile.name);
      setUploadError("");
      setGenerationCount(0);
      convertFile(newFile, customPrompt, providers, model);
    },
    [convertFile, customPrompt, providers, model],
  );

  // ── Regenerate — same file, possibly updated options ──────────────────────
  const handleRegenerate = useCallback(() => {
    if (!file) return;
    convertFile(file, customPrompt, providers, model);
  }, [file, customPrompt, providers, model, convertFile]);

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((p) => ({ ...p, title, slug: slugify(title) }));
  };

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,$/, "");
      if (t && !formData.tags.includes(t))
        setFormData((p) => ({ ...p, tags: [...p.tags, t] }));
      setTagInput("");
    }
  };

  const removeTag = (tag) =>
    setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));


  const handleSubmit = async () => {
    if (!step3Ready || submitting) return;
    setSubmitting(true);
    try {
      const res = await api(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/upload_blog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Publish failed: ${res.status}`);
      }

      setToast({ message: `"${formData.title}" published!`, type: "success" });

      // Reset everything
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        date: new Date().toISOString().split("T")[0],
        tags: [],
        content: "",
      });
      setFile(null);
      setFileName("");
      setGenerationCount(0);
      setCustomPrompt("");
      setProviders(["groq", "gemini", "openrouter"]);
      setModel("balanced");
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const bg = isDark ? "bg-slate-950" : "bg-gray-50";
  const cardBg = isDark
    ? "bg-slate-900/80 border-slate-800"
    : "bg-white border-gray-100";
  const heading = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-slate-500" : "text-gray-400";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles
              className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-500"}`}
            />
            <span
              className={`text-xs font-semibold uppercase tracking-widest ${isDark ? "text-amber-400" : "text-amber-500"}`}
            >
              Blog CMS
            </span>
          </div>
          <h1 className={`text-3xl font-bold ${heading}`}>New Blog Post</h1>
          <p className={`text-sm mt-1 ${sub}`}>
            Upload a Word doc → server converts to HTML → preview live →
            publish.
          </p>
        </div>

        {/* Steps */}
        <div
          className={`flex items-center gap-4 mb-8 px-5 py-3 rounded-xl border ${cardBg} w-fit`}
        >
          <StepBadge
            n={1}
            label="Upload & Convert"
            active={!step1Done}
            done={step1Done}
            isDark={isDark}
          />
          <ChevronRight
            className={`w-3.5 h-3.5 ${isDark ? "text-slate-700" : "text-gray-200"}`}
          />
          <StepBadge
            n={2}
            label="Fill Details"
            active={step1Done && !step2Done}
            done={step2Done}
            isDark={isDark}
          />
          <ChevronRight
            className={`w-3.5 h-3.5 ${isDark ? "text-slate-700" : "text-gray-200"}`}
          />
          <StepBadge
            n={3}
            label="Publish"
            active={step3Ready}
            done={false}
            isDark={isDark}
          />
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-[440px_1fr] gap-6 items-start">
          {/* Left */}
          <div className="space-y-5">
            {/* Upload Card */}
            <section className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
              <h2
                className={`text-sm font-semibold flex items-center gap-2 ${heading}`}
              >
                <Upload className="w-4 h-4" /> Document Upload
              </h2>

              <UploadZone
                onFileReady={handleFileReady}
                isDark={isDark}
                fileName={fileName}
                isProcessing={isProcessing}
                error={uploadError}
              />

              {/* Conversion options: prompt + provider + model */}
              <ConversionOptions
                prompt={customPrompt}
                onPromptChange={setCustomPrompt}
                providers={providers}
                onProvidersChange={setProviders}
                model={model}
                onModelChange={setModel}
                isDark={isDark}
              />

              {/* Regenerate — shown only after a file is loaded */}
              <AnimatePresence>
                {file && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <button
                      onClick={handleRegenerate}
                      disabled={isProcessing}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all
                        ${
                          isProcessing
                            ? isDark
                              ? "border-slate-700 text-slate-600 cursor-not-allowed"
                              : "border-gray-100 text-gray-300 cursor-not-allowed"
                            : isDark
                              ? "border-amber-700/50 text-amber-400 hover:bg-amber-900/20 cursor-pointer"
                              : "border-amber-200 text-amber-600 hover:bg-amber-50 cursor-pointer"
                        }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Regenerating…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" /> Regenerate HTML
                        </>
                      )}
                    </button>

                    {generationCount > 0 && (
                      <p
                        className={`text-center text-xs ${isDark ? "text-slate-600" : "text-gray-400"}`}
                      >
                        Generated{" "}
                        <span className="font-semibold">
                          {generationCount}×
                        </span>{" "}
                        from <span className="font-mono">{fileName}</span>
                      </p>
                    )}

                    <InfoNote isDark={isDark}>
                      Regenerate resends the same{" "}
                      <code className="font-mono">.docx</code> + your current
                      instructions to{" "}
                      <code className="font-mono">/api/convert-docx</code>.
                      Update the instructions above before clicking to change
                      the output.
                    </InfoNote>
                  </motion.div>
                )}
              </AnimatePresence>

              {!file && (
                <InfoNote isDark={isDark}>
                  File is <code className="font-mono">POST</code>&apos;d to{" "}
                  <code className="font-mono">/api/convert-docx</code>. Your
                  server must return{" "}
                  <code className="font-mono">{'{ html: "..." }'}</code>.
                </InfoNote>
              )}
            </section>

            {/* Details Card */}
            <section className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
              <h2
                className={`text-sm font-semibold flex items-center gap-2 ${heading}`}
              >
                <FileText className="w-4 h-4" /> Post Details
              </h2>

              <Field
                label="Title"
                icon={AlignLeft}
                isDark={isDark}
                hint={`${formData.title.length}/100`}
              >
                <TextInput
                  isDark={isDark}
                  maxLength={100}
                  placeholder="My awesome blog post"
                  value={formData.title}
                  onChange={handleTitleChange}
                />
              </Field>

              <Field label="URL Slug" icon={Link} isDark={isDark}>
                <div className="relative">
                  <span
                    className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none
                    ${isDark ? "text-slate-600" : "text-gray-300"}`}
                  >
                    /blog/
                  </span>
                  <TextInput
                    isDark={isDark}
                    name="slug"
                    placeholder="my-awesome-blog-post"
                    value={formData.slug}
                    onChange={handleChange}
                    style={{ paddingLeft: "2.75rem" }}
                  />
                </div>
              </Field>

              <Field
                label="Excerpt"
                icon={AlignLeft}
                isDark={isDark}
                hint={`${formData.excerpt.length}/200`}
              >
                <textarea
                  name="excerpt"
                  rows={2}
                  maxLength={200}
                  placeholder="A short description shown in listings…"
                  value={formData.excerpt}
                  onChange={handleChange}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all border resize-none
                    ${
                      isDark
                        ? "bg-slate-900/60 border-slate-700 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                        : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
                    }`}
                />
              </Field>

              <Field label="Publish Date" icon={Calendar} isDark={isDark}>
                <TextInput
                  isDark={isDark}
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Tags" icon={Tag} isDark={isDark}>
                <div
                  className={`rounded-xl border transition-all
                  ${isDark ? "border-slate-700 focus-within:border-amber-500" : "border-gray-200 focus-within:border-amber-400"}`}
                >
                  <div className="flex flex-wrap gap-1.5 p-2.5">
                    {formData.tags.map((tag) => (
                      <TagChip
                        key={tag}
                        tag={tag}
                        onRemove={removeTag}
                        isDark={isDark}
                      />
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      placeholder={
                        formData.tags.length
                          ? "Add more…"
                          : "Type and press Enter…"
                      }
                      className={`flex-1 min-w-[120px] text-sm outline-none bg-transparent
                        ${isDark ? "text-white placeholder-slate-600" : "text-gray-900 placeholder-gray-400"}`}
                    />
                  </div>
                </div>
                <p
                  className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-gray-400"}`}
                >
                  Press <kbd className="font-mono">Enter</kbd> or{" "}
                  <kbd className="font-mono">,</kbd> to add
                </p>
              </Field>
            </section>

            {/* Publish */}
            <button
              onClick={handleSubmit}
              disabled={!step3Ready || submitting}
              className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2.5
                transition-all duration-200
                ${
                  step3Ready && !submitting
                    ? "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-900/20 cursor-pointer"
                    : isDark
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Publish Post
                </>
              )}
            </button>

            {!step3Ready && (
              <p
                className={`text-center text-xs ${isDark ? "text-slate-600" : "text-gray-300"}`}
              >
                {!step1Done
                  ? "Upload a document to continue"
                  : "Add a title and slug to publish"}
              </p>
            )}
          </div>

          {/* Right — Preview */}
          <div
            className="lg:sticky lg:top-6"
            style={{ height: "calc(100vh - 9rem)" }}
          >
            <PreviewPanel formData={formData} isDark={isDark} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.message}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
