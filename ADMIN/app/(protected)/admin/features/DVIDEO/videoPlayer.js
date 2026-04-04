"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Play, X, Grid3x3, List, Search, Clock,
  ChevronDown, Youtube, HardDrive, Plus, Trash2,
  Link, CheckCircle, AlertCircle, Loader2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ytEmbed  = (id) => `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
const ytThumb  = (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
const LS_KEY   = "doraflix_youtube_videos";

/** Extract YouTube video ID from any YT URL format */
function parseYouTubeId(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {}
  // bare ID fallback (11 chars)
  const bare = url.trim().split("?")[0].split("/").pop();
  if (/^[a-zA-Z0-9_-]{11}$/.test(bare)) return bare;
  return null;
}

/** Parse ISO 8601 duration → "H:MM:SS" */
function parseDuration(iso) {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || 0), min = parseInt(m[2] || 0), s = parseInt(m[3] || 0);
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadYTVideos() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function saveYTVideos(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

// ── Add Video Modal ───────────────────────────────────────────────────────────
function AddVideoModal({ onClose, onAdd, existingIds }) {
  const [url, setUrl]         = useState("");
  const [status, setStatus]   = useState("idle"); // idle | loading | preview | error
  const [errMsg, setErrMsg]   = useState("");
  const [preview, setPreview] = useState(null);   // fetched metadata
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleFetch = async () => {
    setErrMsg(""); setPreview(null);
    const vid = parseYouTubeId(url);
    if (!vid) { setStatus("error"); setErrMsg("Could not find a valid YouTube video ID in that URL."); return; }
    if (existingIds.has(vid)) { setStatus("error"); setErrMsg("This video is already in your collection."); return; }

    setStatus("loading");
    try {
      // noembed.com is a free oEmbed provider — no API key required
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (data.error || !data.title) throw new Error("Video not found or is private/restricted.");

      // Parse year from author/upload info — noembed doesn't give year,
      // so we derive it from the thumbnail URL or default to current year
      const year = new Date().getFullYear();

      setPreview({
        id:        `yt-${Date.now()}`,
        youtubeId: vid,
        name:      data.title,
        year,
        thumbnail: ytThumb(vid),
        duration:  null,       // noembed doesn't provide duration
        category:  "YouTube",
        addedAt:   new Date().toISOString(),
      });
      setStatus("preview");
    } catch (e) {
      setStatus("error");
      setErrMsg(e.message || "Failed to fetch video info. The video may be private.");
    }
  };

  const handleAdd = () => {
    if (!preview) return;
    onAdd(preview);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") status === "preview" ? handleAdd() : handleFetch();
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#13131a", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,0,0,0.15)" }}>
              <Youtube className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Add YouTube Video</h2>
              <p className="text-gray-600 text-xs">Paste any YouTube URL or video ID</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* URL input */}
          <div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="https://youtube.com/watch?v=... or youtu.be/..."
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setStatus("idle"); setPreview(null); }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 rounded-xl outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
              <button
                onClick={handleFetch}
                disabled={!url.trim() || status === "loading"}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 shrink-0"
                style={{ background: "#e50914" }}
              >
                {status === "loading"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : "Fetch"}
              </button>
            </div>
          </div>

          {/* Error */}
          {status === "error" && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-sm"
              style={{ background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.2)", color: "#fca5a5" }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {errMsg}
            </div>
          )}

          {/* Preview card */}
          {status === "preview" && preview && (
            <div className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
              <div className="flex gap-3 p-3">
                <img src={preview.thumbnail} alt={preview.name}
                  className="rounded-lg object-cover shrink-0"
                  style={{ width: 120, height: 68 }}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/120x68/111/444?text=No+Image"; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{preview.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}>
                      ID: {preview.youtubeId}
                    </span>
                  </div>
                  {/* Editable year */}
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs text-gray-600">Year:</label>
                    <input
                      type="number"
                      value={preview.year}
                      onChange={(e) => setPreview({ ...preview, year: parseInt(e.target.value) || preview.year })}
                      className="w-20 px-2 py-0.5 rounded text-xs text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <label className="text-xs text-gray-600 ml-1">Category:</label>
                    <input
                      type="text"
                      value={preview.category}
                      onChange={(e) => setPreview({ ...preview, category: e.target.value })}
                      className="flex-1 px-2 py-0.5 rounded text-xs text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                </div>
              </div>
              {/* Success banner */}
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium"
                style={{ background: "rgba(34,197,94,0.08)", borderTop: "1px solid rgba(34,197,94,0.15)", color: "#86efac" }}>
                <CheckCircle className="w-3.5 h-3.5" /> Video found! Edit details above if needed, then click Add.
              </div>
            </div>
          )}

          {/* Example URLs info */}
          {status === "idle" && (
            <div className="text-xs text-gray-700 space-y-1">
              <p className="text-gray-500 font-medium mb-1.5">Accepted formats:</p>
              <p>• <span className="text-gray-500">https://youtube.com/watch?v=<span style={{color:"#e50914"}}>dQw4w9WgXcQ</span></span></p>
              <p>• <span className="text-gray-500">https://youtu.be/<span style={{color:"#e50914"}}>dQw4w9WgXcQ</span></span></p>
              <p>• <span className="text-gray-500">Just the ID: <span style={{color:"#e50914"}}>dQw4w9WgXcQ</span></span></p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={status !== "preview"}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30"
            style={{ background: "#e50914" }}
          >
            <span className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add to Collection
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ activeTab, setActiveTab, search, setSearch, driveCount, ytCount, onAddVideo }) {
  return (
    <nav className="sticky top-0 z-50"
      style={{ background: "rgba(8,8,12,0.96)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 flex items-center gap-4 sm:gap-6" style={{ height: 64 }}>
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#e50914,#900)" }}>
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight hidden sm:block">
            Dora<span style={{ color: "#e50914" }}>Flix</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {[
            { key: "drive",   label: "Movies",  icon: HardDrive, count: driveCount },
            { key: "youtube", label: "YouTube", icon: Youtube,   count: ytCount },
          ].map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={activeTab === key ? { background: "#e50914", color: "#fff" } : { color: "#6b7280" }}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="text-xs opacity-60 font-normal">({count})</span>
            </button>
          ))}
        </div>

        {/* Add video button — only on youtube tab */}
        {activeTab === "youtube" && (
          <button onClick={onAddVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white transition-all hover:scale-105 shrink-0"
            style={{ background: "linear-gradient(135deg,#e50914,#c00)" }}>
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Video</span>
          </button>
        )}

        {/* Search */}
        <div className="ml-auto relative w-44 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input type="text" placeholder="Search…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 rounded-lg outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Hero Banner ───────────────────────────────────────────────────────────────
function HeroBanner({ video, onPlay, isYT }) {
  if (!video) return null;
  const thumb = isYT ? ytThumb(video.youtubeId) : video.thumbnail;
  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8 cursor-pointer group"
      style={{ height: 300 }} onClick={() => onPlay(video)}>
      <img src={thumb} alt={video.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(90deg,rgba(8,8,12,0.97) 0%,rgba(8,8,12,0.5) 60%,transparent 100%)" }} />
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: "#e50914", color: "#fff" }}>FEATURED</span>
          <span className="text-gray-400 text-xs">{video.year}</span>
          {video.duration && <span className="text-gray-500 text-xs">· {video.duration}</span>}
        </div>
        <h2 className="text-white font-black text-xl sm:text-3xl max-w-lg leading-tight mb-4">{video.name}</h2>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white w-fit text-sm transition-all hover:scale-105"
          style={{ background: "#e50914" }}>
          <Play className="w-4 h-4 fill-white" /> Watch Now
        </button>
      </div>
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ decades, activeDecade, setActiveDecade, sortBy, setSortBy, viewMode, setViewMode, total, filtered }) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
      <div className="flex flex-wrap gap-1.5">
        {decades.map((d) => (
          <button key={d} onClick={() => setActiveDecade(d)}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150"
            style={activeDecade === d
              ? { background: "#e50914", color: "#fff" }
              : { background: "rgba(255,255,255,0.06)", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.07)" }}>
            {d}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold text-gray-300 rounded-lg cursor-pointer outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="year">Year ↑</option>
            <option value="year-desc">Year ↓</option>
            <option value="name">A–Z</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
        </div>
        <div className="flex items-center rounded-lg overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {[{ mode: "grid", icon: Grid3x3 }, { mode: "list", icon: List }].map(({ mode, icon: Icon }) => (
            <button key={mode} onClick={() => setViewMode(mode)} className="p-1.5 transition-colors"
              style={{ background: viewMode === mode ? "rgba(229,9,20,0.2)" : "transparent",
                       color: viewMode === mode ? "#e50914" : "#6b7280" }}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-600 hidden md:block">{filtered}/{total}</span>
      </div>
    </div>
  );
}

// ── Grid Card ─────────────────────────────────────────────────────────────────
function GridCard({ video, onPlay, isYT, onDelete }) {
  const [hov, setHov] = useState(false);
  const thumb = isYT ? ytThumb(video.youtubeId) : video.thumbnail;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="cursor-pointer rounded-xl overflow-hidden transition-all duration-300 relative"
      style={{ background: "rgba(255,255,255,0.03)",
               border: hov ? "1px solid rgba(229,9,20,0.45)" : "1px solid rgba(255,255,255,0.06)",
               transform: hov ? "translateY(-5px)" : "translateY(0)",
               boxShadow: hov ? "0 20px 40px rgba(0,0,0,0.6)" : "none" }}>
      {/* Delete button (YT only) */}
      {isYT && onDelete && hov && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
          className="absolute top-2 left-2 z-10 p-1.5 rounded-lg transition-all"
          style={{ background: "rgba(0,0,0,0.75)", border: "1px solid rgba(229,9,20,0.4)", color: "#fca5a5" }}
          title="Remove from collection">
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      <div onClick={() => onPlay(video)} className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
        <img src={thumb} alt={video.name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hov ? "scale(1.08)" : "scale(1)" }}
          onError={(e) => { e.target.src = "https://via.placeholder.com/300x450/111/444?text=No+Image"; }} />
        <div className="absolute inset-0 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top,rgba(8,8,12,0.9) 0%,transparent 50%)", opacity: hov ? 1 : 0.5 }} />
        {video.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}>
            <Clock className="w-2.5 h-2.5" />{video.duration}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{ opacity: hov ? 1 : 0 }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(229,9,20,0.92)", boxShadow: "0 0 32px rgba(229,9,20,0.55)" }}>
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {isYT && (
          <div className="absolute top-2 right-2 p-1 rounded" style={{ background: "rgba(0,0,0,0.7)" }}>
            <Youtube className="w-3 h-3 text-red-500" />
          </div>
        )}
      </div>
      <div onClick={() => onPlay(video)} className="p-3">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1 transition-colors"
          style={{ color: hov ? "#e50914" : "#e5e7eb" }}>{video.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs">{video.year}</span>
          {video.category && (
            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: "rgba(229,9,20,0.12)", color: "#e50914" }}>{video.category}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({ videos, onPlay, isYT, onDelete }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="grid text-xs font-semibold uppercase tracking-wider text-gray-600 px-4 py-2.5"
        style={{ gridTemplateColumns: isYT ? "60px 1fr 80px 100px 36px" : "60px 1fr 80px 100px",
                 background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span /><span>Title</span><span className="text-center">Year</span><span className="text-right">Duration</span>
        {isYT && <span />}
      </div>
      {videos.map((video, i) => {
        const thumb = isYT ? ytThumb(video.youtubeId) : video.thumbnail;
        return (
          <div key={video.id}
            className="grid items-center px-4 py-2.5 group transition-colors duration-150"
            style={{ gridTemplateColumns: isYT ? "60px 1fr 80px 100px 36px" : "60px 1fr 80px 100px",
                     borderBottom: i < videos.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(229,9,20,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <div className="w-10 h-14 rounded overflow-hidden shrink-0 cursor-pointer" onClick={() => onPlay(video)}>
              <img src={thumb} alt={video.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 px-3 cursor-pointer" onClick={() => onPlay(video)}>
              <p className="text-white text-sm font-medium truncate group-hover:text-red-400 transition-colors">{video.name}</p>
              {video.category && <p className="text-xs text-gray-600 mt-0.5">{video.category}</p>}
            </div>
            <div className="text-center text-gray-500 text-xs font-medium">{video.year}</div>
            <div className="text-right text-gray-500 text-xs font-medium">{video.duration || "—"}</div>
            {isYT && onDelete && (
              <div className="flex justify-center">
                <button onClick={() => onDelete(video.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:text-red-400"
                  style={{ color: "#6b7280" }} title="Remove">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Related Card (player sidebar) ─────────────────────────────────────────────
function RelatedCard({ video, onPlay, isYT }) {
  const [hov, setHov] = useState(false);
  const thumb = isYT ? ytThumb(video.youtubeId) : video.thumbnail;
  return (
    <div onClick={() => onPlay(video)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="flex gap-3 cursor-pointer rounded-xl p-2 transition-all duration-150"
      style={{ background: hov ? "rgba(255,255,255,0.06)" : "transparent",
               border: hov ? "1px solid rgba(229,9,20,0.25)" : "1px solid transparent" }}>
      <div className="relative rounded-lg overflow-hidden shrink-0" style={{ width: 120, height: 68 }}>
        <img src={thumb} alt={video.name}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: hov ? "scale(1.06)" : "scale(1)" }}
          onError={(e) => { e.target.src = "https://via.placeholder.com/120x68/111/444?text=No+Image"; }} />
        {video.duration && (
          <div className="absolute bottom-1 right-1 text-white font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.85)", fontSize: 10 }}>{video.duration}</div>
        )}
        {hov && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}>
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold leading-snug line-clamp-2 transition-colors"
          style={{ color: hov ? "#fff" : "#d1d5db" }}>{video.name}</p>
        <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
          {video.year}{video.duration && ` · ${video.duration}`}
        </p>
      </div>
    </div>
  );
}

// ── Player Page ───────────────────────────────────────────────────────────────
function PlayerPage({ video, onClose, isYT, allVideos }) {
  const [current, setCurrent] = useState(video);
  const src = isYT ? ytEmbed(current.youtubeId) : current.driveLink;

  const related = useMemo(() =>
    [...allVideos].filter((v) => v.id !== current.id)
      .sort((a, b) => Math.abs(a.year - current.year) - Math.abs(b.year - current.year)),
    [allVideos, current]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0a0a0e" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 shrink-0"
        style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)",
                 background: "rgba(8,8,12,0.98)", backdropFilter: "blur(12px)" }}>
        <button onClick={onClose}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden sm:inline text-sm">Back to Library</span>
        </button>
        <div className="w-px h-5 mx-2 shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#e50914,#900)" }}>
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="font-black text-base hidden sm:block" style={{ color: "#e50914" }}>DоraFlix</span>
        </div>
        <div className="flex-1 min-w-0 ml-2 hidden md:block">
          <p className="text-white font-semibold text-sm truncate">{current.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isYT
            ? <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold"
                style={{ background: "rgba(255,0,0,0.15)", color: "#f87171" }}>
                <Youtube className="w-3 h-3" /> YouTube
              </span>
            : <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold"
                style={{ background: "rgba(59,130,246,0.12)", color: "#93c5fd" }}>
                <HardDrive className="w-3 h-3" /> Drive
              </span>
          }
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 2/3 player */}
        <div className="flex flex-col overflow-y-auto" style={{ flex: "0 0 66.666%", background: "#0a0a0e" }}>
          <div className="relative w-full bg-black shrink-0" style={{ paddingBottom: "56.25%" }}>
            <iframe key={current.id} src={src}
              className="absolute inset-0 w-full h-full" style={{ border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen title={current.name} />
          </div>
          <div className="px-5 py-4">
            <h1 className="text-white font-black text-lg sm:text-xl leading-tight mb-2">{current.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}>{current.year}</span>
              {current.duration && (
                <span className="flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}>
                  <Clock className="w-3.5 h-3.5" />{current.duration}
                </span>
              )}
              {current.category && (
                <span className="text-sm font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(229,9,20,0.12)", color: "#e50914" }}>{current.category}</span>
              )}
            </div>
            <div className="mt-4 mb-1" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <p className="text-xs text-gray-600 mt-2">
              {isYT ? "Streaming from YouTube" : "Streaming from Google Drive"} · {related.length + 1} in collection
            </p>
          </div>
        </div>

        <div style={{ width: 1, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

        {/* 1/3 related */}
        <div className="flex flex-col overflow-hidden" style={{ flex: "0 0 33.333%", background: "#0c0c10" }}>
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-white font-bold text-sm">Up Next</h3>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>Sorted by closest release year</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(229,9,20,0.3) transparent" }}>
            {related.map((v) => (
              <RelatedCard key={v.id} video={v} onPlay={setCurrent} isYT={isYT} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── YouTube Empty State ───────────────────────────────────────────────────────
function YouTubeEmpty({ onAdd }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.18)" }}>
        <Youtube className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-white font-bold text-xl mb-2">No YouTube Videos Yet</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-6 leading-relaxed">
        Add your first YouTube video using the <strong className="text-gray-300">Add Video</strong> button.
        Videos are saved automatically and persist across sessions.
      </p>
      <button onClick={onAdd}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
        style={{ background: "#e50914" }}>
        <Plus className="w-4 h-4" /> Add Your First Video
      </button>
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────────────────────
export default function DriveVideoPlayer() {
  const [activeTab,    setActiveTab]    = useState("drive");
  const [driveVideos,  setDriveVideos]  = useState([]);
  const [ytVideos,     setYtVideos]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isYTModal,    setIsYTModal]    = useState(false);
  const [viewMode,     setViewMode]     = useState("grid");
  const [search,       setSearch]       = useState("");
  const [activeDecade, setActiveDecade] = useState("All");
  const [sortBy,       setSortBy]       = useState("year");
  const [showAddModal, setShowAddModal] = useState(false);

  // Load drive videos from /videos.json
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/videos.json");
        if (!res.ok) throw new Error("Failed to fetch");
        setDriveVideos((await res.json()) || []);
      } catch {
        setError("Could not load Drive videos.");
      } finally { setLoading(false); }
    })();
  }, []);

  // Load YouTube videos from localStorage (mirrors youtube_videos.json pattern)
  useEffect(() => { setYtVideos(loadYTVideos()); }, []);

  // Escape closes player
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setSelectedVideo(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Reset filters on tab switch
  useEffect(() => { setSearch(""); setActiveDecade("All"); setSortBy("year"); }, [activeTab]);

  const handleAddVideo = (videoData) => {
    const updated = [...ytVideos, videoData];
    setYtVideos(updated);
    saveYTVideos(updated);           // persist to localStorage
  };

  const handleDeleteVideo = (id) => {
    const updated = ytVideos.filter((v) => v.id !== id);
    setYtVideos(updated);
    saveYTVideos(updated);
  };

  const sourceList = activeTab === "drive" ? driveVideos : ytVideos;

  const decades = useMemo(() => {
    const s = new Set(sourceList.map((v) => `${Math.floor(v.year / 10) * 10}s`));
    return ["All", ...Array.from(s).sort()];
  }, [sourceList]);

  const filtered = useMemo(() => {
    let list = sourceList.filter((v) => {
      const ms = v.name.toLowerCase().includes(search.toLowerCase());
      const md = activeDecade === "All" || `${Math.floor(v.year / 10) * 10}s` === activeDecade;
      return ms && md;
    });
    if (sortBy === "year")      list = [...list].sort((a, b) => a.year - b.year);
    else if (sortBy === "year-desc") list = [...list].sort((a, b) => b.year - a.year);
    else                        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [sourceList, search, activeDecade, sortBy]);

  const featured = useMemo(
    () => sourceList.length ? sourceList[sourceList.length - 1] : null,
    [sourceList]);

  const handlePlay = (video) => { setSelectedVideo(video); setIsYTModal(activeTab === "youtube"); };
  const existingYTIds = useMemo(() => new Set(ytVideos.map((v) => v.youtubeId)), [ytVideos]);

  const isYT = activeTab === "youtube";
  const showEmptyYT = isYT && ytVideos.length === 0;
  const showHero = !search && activeDecade === "All" && !showEmptyYT;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#08080c" }}>
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="w-14 h-14 rounded-full border-2 animate-spin"
              style={{ borderColor: "transparent", borderTopColor: "#e50914", borderRightColor: "rgba(229,9,20,0.25)" }} />
            <Play className="absolute inset-0 m-auto w-5 h-5 text-red-500 fill-red-500" />
          </div>
          <p className="text-white font-bold text-lg">Loading DоraFlix</p>
          <p className="text-gray-600 text-sm mt-1">Preparing your collection…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#08080c", color: "#e5e7eb" }}>
      <Navbar
        activeTab={activeTab} setActiveTab={setActiveTab}
        search={search} setSearch={setSearch}
        driveCount={driveVideos.length} ytCount={ytVideos.length}
        onAddVideo={() => setShowAddModal(true)}
      />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-8">
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm"
            style={{ background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.2)", color: "#fca5a5" }}>
            <X className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Section label + add button */}
        <div className="flex items-center justify-between gap-2.5 mb-6">
          <div className="flex items-center gap-2.5">
            {isYT ? <Youtube className="w-5 h-5 text-red-500" /> : <HardDrive className="w-5 h-5 text-red-500" />}
            <h1 className="text-white font-black text-xl">
              {isYT ? "YouTube Videos" : "Doraemon Movies"}
              <span className="text-gray-600 font-normal text-sm ml-2">
                · {isYT ? "YouTube Collection" : "Google Drive Collection"}
              </span>
            </h1>
          </div>
          {isYT && ytVideos.length > 0 && (
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: "#e50914" }}>
              <Plus className="w-4 h-4" /> Add Video
            </button>
          )}
        </div>

        {showEmptyYT ? (
          <YouTubeEmpty onAdd={() => setShowAddModal(true)} />
        ) : (
          <>
            {showHero && <HeroBanner video={featured} onPlay={handlePlay} isYT={isYT} />}
            <FilterBar
              decades={decades} activeDecade={activeDecade} setActiveDecade={setActiveDecade}
              sortBy={sortBy} setSortBy={setSortBy}
              viewMode={viewMode} setViewMode={setViewMode}
              total={sourceList.length} filtered={filtered.length}
            />
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <Search className="w-12 h-12 text-gray-800 mb-4" />
                <p className="text-gray-400 font-semibold text-lg">No results for "{search}"</p>
                <p className="text-gray-600 text-sm mt-1">Try a different title or change the decade filter</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 sm:gap-5"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                {filtered.map((v) => (
                  <GridCard key={v.id} video={v} onPlay={handlePlay} isYT={isYT}
                    onDelete={isYT ? handleDeleteVideo : null} />
                ))}
              </div>
            ) : (
              <ListView videos={filtered} onPlay={handlePlay} isYT={isYT}
                onDelete={isYT ? handleDeleteVideo : null} />
            )}
          </>
        )}
      </main>

      <footer className="mt-16 py-5 text-center text-xs text-gray-700"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        DоraFlix · {driveVideos.length} Drive movies · {ytVideos.length} YouTube videos
      </footer>

      {/* Player */}
      {selectedVideo && (
        <PlayerPage video={selectedVideo} onClose={() => setSelectedVideo(null)}
          isYT={isYTModal} allVideos={isYTModal ? ytVideos : driveVideos} />
      )}

      {/* Add video modal */}
      {showAddModal && (
        <AddVideoModal onClose={() => setShowAddModal(false)}
          onAdd={handleAddVideo} existingIds={existingYTIds} />
      )}
    </div>
  );
}