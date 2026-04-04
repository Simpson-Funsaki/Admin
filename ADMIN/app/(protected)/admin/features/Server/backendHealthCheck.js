"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useBackgroundContext } from "@/app/(protected)/context/BackgroundContext";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, style = {}, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
  >
    <path d={d} />
  </svg>
);

const IC = {
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  refresh:
    "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.8-3.6L23 10M1 14l4.7 4.6A9 9 0 0 0 20.5 15",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  terminal: "M4 17l6-6-6-6M12 19h8",
  wifi: "M1 1l22 22M16.7 16.7A8 8 0 0 0 5.3 5.3M10.7 10.7A4 4 0 0 0 13.3 13.3M14 12a2 2 0 0 0-2-2",
  alert:
    "M10.3 3.3L1.2 18a1 1 0 0 0 .9 1.5h18a1 1 0 0 0 .9-1.5L11.7 3.3a1 1 0 0 0-1.7 0zM12 9v4M12 17h.01",
  copy: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  brain:
    "M9.5 2a2.5 2.5 0 0 1 5 0M12 8v4M8 16a4 4 0 1 1 8 0M4.5 10a7.5 7.5 0 0 0 15 0",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  server:
    "M20 2H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM20 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z",
  chevronRight: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
};

// ─── Services Config ───────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: "s1",
    name: "Main Server",
    type: "NestJS",
    desc: "Core API & business logic",
    healthUrl: process.env.NEXT_PUBLIC_SERVICE1_HEALTH,
    accent: "#a78bfa",
  },
  {
    id: "s2",
    name: "Auth Service",
    type: "Micro",
    desc: "JWT & access control",
    healthUrl: process.env.NEXT_PUBLIC_SERVICE2_HEALTH,
    accent: "#38bdf8",
  },
  {
    id: "s3",
    name: "Link Service",
    type: "Micro",
    desc: "URL shortening & analytics",
    healthUrl: process.env.NEXT_PUBLIC_SERVICE4_HEALTH,
    accent: "#34d399",
  },
  {
    id: "s4",
    name: "ML Backend",
    type: "FastAPI",
    desc: "ML inference & predictions",
    healthUrl: process.env.NEXT_PUBLIC_SERVICE3_HEALTH,
    accent: "#fbbf24",
  },
  {
    id: "s5",
    name: "Log Service",
    type: "Micro",
    desc: "Centralized logging & monitoring",
    healthUrl: process.env.NEXT_PUBLIC_SERVICE5_HEALTH,
    accent: "#f472b6",
  },
];

// ─── Parsers ───────────────────────────────────────────────────────────────────
let _uid = 0;
function parseLog(raw) {
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    const msg = obj.message || "";
    const methodMatch = msg.match(/^(GET|POST|PUT|DELETE|PATCH)\s/);
    return {
      _uid: ++_uid,
      level: (obj.level || "info").toLowerCase(),
      method: methodMatch?.[1] || null,
      path: obj.path || null,
      status: obj.statusCode || null,
      duration: obj.duration !== undefined ? obj.duration : null,
      ip: obj.ip || null,
      message: msg,
      ts: obj.ts ? new Date(obj.ts) : new Date(),
      raw: JSON.stringify(obj, null, 2),
    };
  } catch {
    return {
      _uid: ++_uid,
      level: "info",
      message: String(raw),
      ts: new Date(),
      raw: String(raw),
    };
  }
}

function parseInsight(raw, eventType) {
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      _uid: ++_uid,
      type: obj.type || "insight",
      severity: obj.severity || "low",
      summary: obj.summary || "",
      context: obj.context || null,
      recommendation: obj.recommendation || null,
      occurrences: obj.occurrences || 1,
      affectedPaths: obj.affectedPaths || [],
      metrics: obj.metrics || null,
      analyzedAt: obj.analyzedAt ? new Date(obj.analyzedAt) : new Date(),
      isLive: eventType === "insight:live",
      raw: JSON.stringify(obj, null, 2),
    };
  } catch {
    return null;
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const DARK_LEVEL_META = {
  error: { color: "#f87171", bg: "rgba(248,113,113,0.09)", label: "ERR" },
  warn: { color: "#fbbf24", bg: "rgba(251,191,36,0.09)", label: "WRN" },
  debug: { color: "#818cf8", bg: "rgba(129,140,248,0.09)", label: "DBG" },
  info: { color: "#22d3ee", bg: "rgba(34,211,238,0.07)", label: "INF" },
};
const LIGHT_LEVEL_META = {
  error: { color: "#dc2626", bg: "rgba(220,38,38,0.08)", label: "ERR" },
  warn: { color: "#d97706", bg: "rgba(217,119,6,0.08)", label: "WRN" },
  debug: { color: "#6366f1", bg: "rgba(99,102,241,0.08)", label: "DBG" },
  info: { color: "#0891b2", bg: "rgba(8,145,178,0.07)", label: "INF" },
};
const METHOD_COLOR = {
  GET: "#22d3ee",
  POST: "#a78bfa",
  PUT: "#fbbf24",
  DELETE: "#f87171",
  PATCH: "#34d399",
};
const METHOD_COLOR_LIGHT = {
  GET: "#0891b2",
  POST: "#7c3aed",
  PUT: "#d97706",
  DELETE: "#dc2626",
  PATCH: "#059669",
};
const statusColor = (s) =>
  s >= 500
    ? "#f87171"
    : s >= 400
      ? "#fb923c"
      : s >= 300
        ? "#fbbf24"
        : "#34d399";
const statusColorLight = (s) =>
  s >= 500
    ? "#dc2626"
    : s >= 400
      ? "#ea580c"
      : s >= 300
        ? "#d97706"
        : "#059669";

const SEVERITY_META_DARK = {
  critical: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    bar: "#f87171",
    badge: "rgba(248,113,113,0.15)",
    label: "CRIT",
  },
  high: {
    color: "#fb923c",
    bg: "rgba(251,146,60,0.10)",
    bar: "#fb923c",
    badge: "rgba(251,146,60,0.13)",
    label: "HIGH",
  },
  medium: {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.09)",
    bar: "#fbbf24",
    badge: "rgba(251,191,36,0.12)",
    label: "MED",
  },
  low: {
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    bar: "#34d399",
    badge: "rgba(52,211,153,0.11)",
    label: "LOW",
  },
  info: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.08)",
    bar: "#60a5fa",
    badge: "rgba(96,165,250,0.11)",
    label: "INFO",
  },
};
const SEVERITY_META_LIGHT = {
  critical: {
    color: "#dc2626",
    bg: "rgba(220,38,38,0.07)",
    bar: "#dc2626",
    badge: "rgba(220,38,38,0.1)",
    label: "CRIT",
  },
  high: {
    color: "#ea580c",
    bg: "rgba(234,88,12,0.07)",
    bar: "#ea580c",
    badge: "rgba(234,88,12,0.09)",
    label: "HIGH",
  },
  medium: {
    color: "#d97706",
    bg: "rgba(217,119,6,0.07)",
    bar: "#d97706",
    badge: "rgba(217,119,6,0.09)",
    label: "MED",
  },
  low: {
    color: "#059669",
    bg: "rgba(5,150,105,0.06)",
    bar: "#059669",
    badge: "rgba(5,150,105,0.08)",
    label: "LOW",
  },
  info: {
    color: "#2563eb",
    bg: "rgba(37,99,235,0.06)",
    bar: "#2563eb",
    badge: "rgba(37,99,235,0.08)",
    label: "INFO",
  },
};

// ─── Global CSS ────────────────────────────────────────────────────────────────
const EXTRA_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  .font-sg  { font-family:'Space Grotesk',sans-serif; }
  .font-ibm { font-family:'IBM Plex Mono',monospace; }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%{box-shadow:0 0 0 0 rgba(34,197,94,.45)} 70%{box-shadow:0 0 0 8px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }
  @keyframes slide-in{ from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fade-in { from{opacity:0} to{opacity:1} }
  .spin      { animation:spin .9s linear infinite; }
  .pulse-dot { animation:pulse 1.6s infinite; }
  .slide-in  { animation:slide-in .2s ease forwards; }
  .fade-in   { animation:fade-in .25s ease forwards; }
  .sn-sb::-webkit-scrollbar       { width:3px;height:3px; }
  .sn-sb::-webkit-scrollbar-track { background:transparent; }
  .sn-sb::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1);border-radius:2px; }
  .sn-sb-l::-webkit-scrollbar       { width:3px;height:3px; }
  .sn-sb-l::-webkit-scrollbar-track { background:transparent; }
  .sn-sb-l::-webkit-scrollbar-thumb { background:rgba(0,0,0,.12);border-radius:2px; }
  .log-row:hover   { background:rgba(255,255,255,.028)!important; }
  .log-row-l:hover { background:rgba(0,0,0,.022)!important; }
  .ins-row:hover   { background:rgba(255,255,255,.025)!important; }
  .cp-wrap .cp-btn { opacity:0;transition:opacity .15s; }
  .cp-wrap:hover .cp-btn { opacity:1; }
  .btn-h { transition:all .18s;cursor:pointer; }
  .btn-h:hover { opacity:.85;transform:translateY(-1px); }
  .card-h { transition:border-color .2s,box-shadow .2s; }
  .card-h:hover { border-color:rgba(167,139,250,.45)!important; box-shadow:0 8px 40px rgba(0,0,0,.7)!important; }
`;

// ─── Mini Charts ──────────────────────────────────────────────────────────────
function Sparkline({ data, color, width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1),
    min = Math.min(...data, 0),
    range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts.split(" ").at(-1).split(",")[0]}
        cy={pts.split(" ").at(-1).split(",")[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function MiniBarChart({ buckets, isDark }) {
  const maxVal = Math.max(...buckets.map((b) => b.total), 1);
  const W = 320,
    H = 60,
    gap = 3;
  const bw = (W - gap * (buckets.length - 1)) / buckets.length;
  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      {buckets.map((b, i) => {
        const x = i * (bw + gap);
        const errH = (b.error / maxVal) * H,
          warnH = (b.warn / maxVal) * H;
        const infoH = ((b.total - b.error - b.warn) / maxVal) * H;
        let y = H;
        const segs = [
          { h: errH, fill: "#f87171" },
          { h: warnH, fill: "#fbbf24" },
          {
            h: infoH,
            fill: isDark ? "rgba(34,211,238,0.5)" : "rgba(8,145,178,0.4)",
          },
        ];
        return (
          <g key={i}>
            {segs.map((s, si) => {
              if (s.h < 0.5) return null;
              y -= s.h;
              return (
                <rect
                  key={si}
                  x={x}
                  y={y}
                  width={bw}
                  height={s.h}
                  fill={s.fill}
                  rx="1"
                  opacity="0.85"
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments, size = 80, thickness = 14 }) {
  const r = (size - thickness) / 2,
    cx = size / 2,
    cy = size / 2,
    circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={thickness}
      />
      {segments.map((s, i) => {
        const dash = (s.value / total) * circ,
          gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

function SevPill({ severity, isDark }) {
  const m =
    (isDark ? SEVERITY_META_DARK : SEVERITY_META_LIGHT)[severity] ||
    (isDark ? SEVERITY_META_DARK : SEVERITY_META_LIGHT).info;
  return (
    <span
      className="font-ibm"
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 4,
        color: m.color,
        background: m.badge,
        border: `1px solid ${m.color}30`,
        letterSpacing: "0.08em",
      }}
    >
      {m.label}
    </span>
  );
}

// ─── Insight Detail ────────────────────────────────────────────────────────────
function InsightDetail({ insight, isDark, T, onClose }) {
  const sm =
    (isDark ? SEVERITY_META_DARK : SEVERITY_META_LIGHT)[insight.severity] ||
    (isDark ? SEVERITY_META_DARK : SEVERITY_META_LIGHT).info;
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard.writeText(insight.raw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  return (
    <div
      className="slide-in"
      style={{
        margin: "0 0 2px 0",
        padding: "14px 18px 16px",
        background: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.018)",
        borderLeft: `3px solid ${sm.bar}`,
        borderRadius: "0 0 8px 8px",
      }}
    >
      {insight.metrics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {[
            ["Total Logs", insight.metrics.totalLogs],
            ["Errors", insight.metrics.errorCount],
            ["Warnings", insight.metrics.warnCount],
            [
              "Avg Response",
              insight.metrics.avgResponseTimeMs != null
                ? `${insight.metrics.avgResponseTimeMs}ms`
                : "—",
            ],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                textAlign: "center",
                background: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.04)",
                border: `1px solid ${T.border}`,
              }}
            >
              <div
                className="font-sg"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: sm.color,
                  lineHeight: 1,
                }}
              >
                {v ?? "—"}
              </div>
              <div
                className="font-ibm"
                style={{
                  fontSize: 9,
                  color: T.textSub,
                  marginTop: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {k}
              </div>
            </div>
          ))}
        </div>
      )}
      <p
        className="font-ibm"
        style={{
          fontSize: 11,
          color: T.msgColor,
          lineHeight: 1.7,
          marginBottom: 10,
        }}
      >
        {insight.summary}
      </p>
      {insight.recommendation && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 10,
            background: isDark
              ? "rgba(167,139,250,0.06)"
              : "rgba(124,58,237,0.04)",
            border: `1px solid ${isDark ? "rgba(167,139,250,0.18)" : "rgba(124,58,237,0.14)"}`,
          }}
        >
          <div
            className="font-ibm"
            style={{
              fontSize: 9,
              color: isDark ? "#a78bfa" : "#7c3aed",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            ⚡ Recommendation
          </div>
          <p
            className="font-ibm"
            style={{
              fontSize: 11,
              color: isDark ? "rgba(255,255,255,0.68)" : "rgba(30,27,75,0.75)",
              lineHeight: 1.6,
            }}
          >
            {insight.recommendation}
          </p>
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={copy}
          className="font-ibm btn-h"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            padding: "5px 12px",
            borderRadius: 6,
            border: `1px solid ${copied ? "rgba(34,197,94,.4)" : T.border}`,
            color: copied ? "#22c55e" : T.textSub,
            background: copied ? "rgba(34,197,94,.06)" : "transparent",
          }}
        >
          <Icon
            d={
              copied
                ? "M20 6L9 17l-5-5"
                : "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
            }
            size={10}
          />{" "}
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <button
          onClick={onClose}
          className="font-ibm btn-h"
          style={{
            fontSize: 10,
            padding: "5px 12px",
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            color: T.textSub,
            background: "transparent",
          }}
        >
          Collapse ↑
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: SERVICE HEALTH
// ═══════════════════════════════════════════════════════════════════════════════
function ServiceHealthTab({
  isDark,
  T,
  statuses,
  checking,
  checkingAll,
  checkOne,
  checkAll,
  actionLines,
}) {
  const aliveN = Object.values(statuses).filter((s) => s.alive).length;
  const checkedN = Object.keys(statuses).length;
  const downN = Object.values(statuses).filter((s) => !s.alive).length;
  const healthScore =
    checkedN === 0 ? null : Math.round((aliveN / checkedN) * 100);

  return (
    <div className="fade-in w-full mt-5">
      {/* Summary Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Health Score",
            value: healthScore !== null ? `${healthScore}%` : "—",
            color:
              healthScore === 100
                ? "#34d399"
                : healthScore > 50
                  ? "#fbbf24"
                  : healthScore !== null
                    ? "#f87171"
                    : T.text,
            icon: IC.shield,
          },
          {
            label: "Services Online",
            value:
              checkedN > 0
                ? `${aliveN}/${checkedN}`
                : `${SERVICES.length} total`,
            color: "#34d399",
            icon: IC.check,
          },
          {
            label: "Services Down",
            value: downN > 0 ? downN : checkedN > 0 ? 0 : "—",
            color: downN > 0 ? "#f87171" : T.text,
            icon: IC.x,
          },
          {
            label: "Last Checked",
            value: actionLines[0]
              ? actionLines[0].ts.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })
              : "Never",
            color: T.textSub,
            icon: IC.clock,
          },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            className="card-h rounded-2xl flex items-center gap-3 p-4"
            style={{
              background: isDark ? "rgba(15,10,30,0.82)" : "#fff",
              border: `1px solid ${T.border}`,
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon d={icon} size={16} style={{ color }} />
            </div>
            <div>
              <div
                className="font-sg text-2xl font-bold leading-none"
                style={{ color }}
              >
                {value}
              </div>
              <div
                className="font-ibm text-[10px] mt-1 uppercase tracking-widest"
                style={{ color: T.textSub }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div
          className="font-sg text-xs font-semibold uppercase tracking-widest"
          style={{ color: T.textSub }}
        >
          Service Status
        </div>
        <button
          onClick={checkAll}
          disabled={checkingAll}
          className="btn-h font-sg flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white border-none"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#4338ca)",
            opacity: checkingAll ? 0.5 : 1,
            boxShadow: "0 4px 20px rgba(109,40,217,.35)",
          }}
        >
          <Icon
            d={IC.activity}
            size={14}
            className={checkingAll ? "spin" : ""}
          />
          {checkingAll ? "Checking…" : "Check All"}
        </button>
      </div>

      {/* Service Cards */}
      <div
        className="grid gap-3 mb-6"
        style={{
          gridTemplateColumns: "repeat(auto-fill,minmax(min(260px,100%),1fr))",
        }}
      >
        {SERVICES.map((svc) => {
          const s = statuses[svc.id],
            ck = checking[svc.id],
            alive = s?.alive;
          const barColor = ck
            ? svc.accent
            : s
              ? alive
                ? "#22c55e"
                : "#ef4444"
              : "transparent";
          return (
            <div
              key={svc.id}
              className="card-h rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: isDark ? "rgba(15,10,30,0.82)" : "#fff",
                border: `1px solid ${s && !alive ? "rgba(239,68,68,0.3)" : T.border}`,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl transition-colors duration-300"
                style={{ background: barColor, opacity: s || ck ? 1 : 0.2 }}
              />
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300"
                      style={{ background: barColor }}
                    />
                    <span
                      className="font-sg text-sm font-bold"
                      style={{ color: T.text }}
                    >
                      {svc.name}
                    </span>
                  </div>
                  <div
                    className="font-ibm text-[11px]"
                    style={{ color: T.textSub }}
                  >
                    {svc.desc}
                  </div>
                </div>
                <span
                  className="font-ibm text-[10px] px-2 py-1 rounded-md border flex-shrink-0"
                  style={{ border: `1px solid ${T.border}`, color: T.textSub }}
                >
                  {svc.type}
                </span>
              </div>
              <div
                className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg"
                style={{
                  background: s
                    ? alive
                      ? "rgba(34,197,94,0.06)"
                      : "rgba(239,68,68,0.06)"
                    : isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.03)",
                }}
              >
                {ck ? (
                  <Icon
                    d={IC.clock}
                    size={14}
                    style={{ color: "#fbbf24", flexShrink: 0 }}
                    className="spin"
                  />
                ) : s ? (
                  alive ? (
                    <Icon
                      d={IC.check}
                      size={14}
                      style={{ color: "#22c55e", flexShrink: 0 }}
                    />
                  ) : (
                    <Icon
                      d={IC.x}
                      size={14}
                      style={{ color: "#f87171", flexShrink: 0 }}
                    />
                  )
                ) : (
                  <Icon
                    d={IC.clock}
                    size={14}
                    style={{ color: T.textSub, flexShrink: 0 }}
                  />
                )}
                <span
                  className="font-ibm text-xs font-medium"
                  style={{
                    color: ck
                      ? "#fbbf24"
                      : s
                        ? alive
                          ? "#22c55e"
                          : "#f87171"
                        : T.textSub,
                  }}
                >
                  {ck
                    ? "Checking…"
                    : s
                      ? alive
                        ? `Online · ${s.duration}ms`
                        : s.error || "Unreachable"
                      : "Not checked"}
                </span>
              </div>
              <button
                onClick={() => checkOne(svc)}
                disabled={ck}
                className="btn-h font-ibm w-full py-2 rounded-lg text-[11px] flex items-center justify-center gap-1.5 border"
                style={{
                  border: `1px solid ${T.border}`,
                  color: T.textSub,
                  background: "transparent",
                  opacity: ck ? 0.5 : 1,
                }}
              >
                <Icon d={IC.refresh} size={11} className={ck ? "spin" : ""} />{" "}
                {ck ? "Checking" : "Check Health"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Action Log */}
      <div
        className="font-sg text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: T.textSub }}
      >
        Action Output
      </div>
      <div
        className="rounded-2xl overflow-hidden border"
        style={{
          border: `1px solid ${T.border}`,
          background: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.03)",
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            borderColor: T.border,
          }}
        >
          <div className="flex gap-1.5">
            {["#ff5f57", "#ffbd2e", "#28c840"].map((c) => (
              <span
                key={c}
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: c }}
              />
            ))}
          </div>
          <span className="font-ibm text-[11px]" style={{ color: T.textSub }}>
            output.log
          </span>
        </div>
        <div className="sn-sb p-4 max-h-52 overflow-y-auto">
          {actionLines.length === 0 ? (
            <span
              className="font-ibm text-xs italic"
              style={{ color: T.textSub }}
            >
              Run "Check All" to see results here…
            </span>
          ) : (
            actionLines.map((l, i) => (
              <div key={i} className="flex gap-3 py-0.5 items-baseline">
                <span
                  className="font-ibm text-[10px] flex-shrink-0"
                  style={{ color: T.textSub }}
                >
                  {l.ts.toLocaleTimeString()}
                </span>
                <span
                  className="font-ibm text-xs"
                  style={{
                    color:
                      l.kind === "ok"
                        ? "#22c55e"
                        : l.kind === "err"
                          ? "#f87171"
                          : "#a78bfa",
                  }}
                >
                  {l.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: SERVER MONITORING
// ═══════════════════════════════════════════════════════════════════════════════
function ServerMonitoringTab({ isDark, T, logs, insights, sseStatus }) {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [logFilter, setLogFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [insightFilter, setInsightFilter] = useState("all");
  const [insightSearch, setInsightSearch] = useState("");
  const [expandedInsight, setExpandedInsight] = useState(null);
  const [sortCol, setSortCol] = useState("analyzedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [copiedUid, setCopiedUid] = useState(null);

  const glass = (accentColor) => ({
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)",
    border: isDark
      ? "1px solid rgba(255,255,255,0.11)"
      : `1px solid rgba(109,40,217,0.18)`,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: accentColor
      ? `0 0 0 1px ${accentColor}20, 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.09)`
      : isDark
        ? "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)"
        : "0 4px 24px rgba(109,40,217,0.1), inset 0 1px 0 rgba(255,255,255,0.85)",
  });

  const sseDot =
    sseStatus === "connected"
      ? "#22c55e"
      : sseStatus === "connecting"
        ? "#fbbf24"
        : "#ef4444";
  const sbClass = isDark ? "sn-sb" : "sn-sb-l";

  const lc = useMemo(
    () =>
      logs.reduce((a, l) => {
        a[l.level] = (a[l.level] || 0) + 1;
        return a;
      }, {}),
    [logs],
  );
  const ic = useMemo(
    () =>
      insights.reduce((a, i) => {
        a[i.type] = (a[i.type] || 0) + 1;
        return a;
      }, {}),
    [insights],
  );

  const logBuckets = useMemo(() => {
    const now = Date.now(),
      N = 30;
    const buckets = Array.from({ length: N }, (_, i) => ({
      label: `${N - 1 - i}m`,
      total: 0,
      error: 0,
      warn: 0,
    }));
    logs.forEach((l) => {
      const age = Math.floor((now - l.ts.getTime()) / 60000);
      if (age >= 0 && age < N) {
        const idx = N - 1 - age;
        buckets[idx].total++;
        if (l.level === "error") buckets[idx].error++;
        if (l.level === "warn") buckets[idx].warn++;
      }
    });
    return buckets;
  }, [logs]);

  const errorSparkline = logBuckets.map((b) => b.error);
  const warnSparkline = logBuckets.map((b) => b.warn);

  const topPaths = useMemo(() => {
    const counts = {};
    logs
      .filter((l) => l.path)
      .forEach((l) => {
        counts[l.path] = (counts[l.path] || 0) + 1;
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [logs]);

  const methodStats = useMemo(() => {
    const stats = {};
    logs
      .filter((l) => l.method && l.duration != null)
      .forEach((l) => {
        if (!stats[l.method])
          stats[l.method] = { total: 0, count: 0, errors: 0 };
        stats[l.method].total += l.duration;
        stats[l.method].count++;
        if (l.status >= 500) stats[l.method].errors++;
      });
    return Object.entries(stats).map(([m, s]) => ({
      method: m,
      avg: Math.round(s.total / s.count),
      count: s.count,
      errors: s.errors,
    }));
  }, [logs]);

  const sevBreakdown = useMemo(() => {
    const counts = {};
    insights.forEach((i) => {
      counts[i.severity] = (counts[i.severity] || 0) + 1;
    });
    return counts;
  }, [insights]);

  const filteredLogs = useMemo(
    () =>
      logs.filter((l) => {
        if (logFilter !== "all" && l.level !== logFilter) return false;
        if (
          logSearch &&
          !l.message.toLowerCase().includes(logSearch.toLowerCase())
        )
          return false;
        return true;
      }),
    [logs, logFilter, logSearch],
  );

  const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const filteredInsights = useMemo(() => {
    return insights
      .filter((i) => insightFilter === "all" || i.type === insightFilter)
      .filter(
        (i) =>
          !insightSearch ||
          i.summary.toLowerCase().includes(insightSearch.toLowerCase()) ||
          (i.context || "").toLowerCase().includes(insightSearch.toLowerCase()),
      )
      .sort((a, b) => {
        if (sortCol === "severity") {
          const d = (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
          return sortDir === "asc" ? d : -d;
        }
        if (sortCol === "analyzedAt") {
          const av = a.analyzedAt?.getTime() ?? 0,
            bv = b.analyzedAt?.getTime() ?? 0;
          return sortDir === "asc" ? av - bv : bv - av;
        }
        return 0;
      });
  }, [insights, insightFilter, insightSearch, sortCol, sortDir]);

  const copyLog = (log) =>
    navigator.clipboard.writeText(log.raw).then(() => {
      setCopiedUid(log._uid);
      setTimeout(() => setCopiedUid(null), 1400);
    });
  const MAIN_COLOR = isDark ? "#7c3aed" : "#6d28d9";
  const subTabs = [
    { id: "overview", label: "Overview" },
    { id: "terminal", label: `Terminal (${logs.length})` },
    { id: "insights", label: `Insights (${insights.length})` },
  ];

  return (
    <div className="fade-in w-full pt-4">
      {/* Sub-tab bar */}
      <div
        className="flex gap-1 mb-5 p-1 rounded-xl w-fit"
        style={{
          background: isDark ? "rgba(20,10,40,0.45)" : "rgba(255,255,255,0.62)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.13)"
            : "1px solid rgba(109,40,217,0.2)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "0 4px 24px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {subTabs.map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveSubTab(st.id)}
            className="tab-pill font-sg px-4 py-1.5 rounded-[9px] text-xs font-semibold border-none"
            style={{
              background:
                activeSubTab === st.id
                  ? isDark
                    ? "rgba(124,58,237,0.25)"
                    : "rgba(109,40,217,0.15)"
                  : "transparent",
              color:
                activeSubTab === st.id
                  ? isDark
                    ? "#c4b5fd"
                    : "#6d28d9"
                  : T.textSub,
              boxShadow:
                activeSubTab === st.id
                  ? "0 2px 8px rgba(124,58,237,0.2)"
                  : "none",
              cursor: "pointer",
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeSubTab === "overview" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
            {[
              {
                label: "Total Logs",
                value: logs.length,
                color: "#22d3ee",
                sparkData: logBuckets.map((b) => b.total),
              },
              {
                label: "Errors",
                value: lc.error || 0,
                color: "#f87171",
                sparkData: errorSparkline,
              },
              {
                label: "Warnings",
                value: lc.warn || 0,
                color: "#fbbf24",
                sparkData: warnSparkline,
              },
              {
                label: "Debug",
                value: lc.debug || 0,
                color: "#818cf8",
                sparkData: null,
              },
              {
                label: "Insights",
                value: insights.length,
                color: "#a78bfa",
                sparkData: null,
              },
              {
                label: "LLM Errors",
                value: ic.error || 0,
                color: "#fb923c",
                sparkData: null,
              },
            ].map(({ label, value, color, sparkData }) => (
              <div
                key={label}
                className="card-h rounded-xl p-3.5"
                style={{
                  background: isDark
                    ? "rgba(20,10,40,0.45)"
                    : "rgba(255,255,255,0.62)",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.13)"
                    : "1px solid rgba(109,40,217,0.2)",
                  borderTop: `2px solid ${color}bb`,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: `0 0 18px ${color}18, 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div
                      className="font-sg text-2xl font-bold leading-none"
                      style={{ color }}
                    >
                      {value.toLocaleString()}
                    </div>
                    <div
                      className="font-ibm text-[9px] mt-1 uppercase tracking-widest"
                      style={{ color: T.textSub }}
                    >
                      {label}
                    </div>
                  </div>
                  {sparkData && (
                    <Sparkline
                      data={sparkData}
                      color={color}
                      width={50}
                      height={24}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div
            className="grid gap-3 mb-3"
            style={{ gridTemplateColumns: "2fr 1fr" }}
          >
            <div
              className="rounded-2xl p-4"
              style={{
                background: isDark
                  ? "rgba(20,10,40,0.45)"
                  : "rgba(255,255,255,0.62)",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.13)"
                  : "1px solid rgba(109,40,217,0.2)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark
                  ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 4px 24px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div
                    className="font-sg text-[13px] font-bold"
                    style={{ color: T.text }}
                  >
                    Log Activity
                  </div>
                  <div
                    className="font-ibm text-[10px] mt-0.5"
                    style={{ color: T.textSub }}
                  >
                    Last 30 minutes · 1-min buckets
                  </div>
                </div>
                <div className="flex gap-3">
                  {[
                    ["Errors", "#f87171"],
                    ["Warnings", "#fbbf24"],
                    [
                      "Info",
                      isDark ? "rgba(34,211,238,0.5)" : "rgba(8,145,178,0.4)",
                    ],
                  ].map(([l, c]) => (
                    <div key={l} className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ background: c }}
                      />
                      <span
                        className="font-ibm text-[9px]"
                        style={{ color: T.textSub }}
                      >
                        {l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <MiniBarChart buckets={logBuckets} isDark={isDark} />
              <div className="flex justify-between mt-1">
                {["30m", "20m", "10m", "now"].map((l) => (
                  <span
                    key={l}
                    className="font-ibm text-[8px]"
                    style={{ color: T.textSub }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: isDark
                  ? "rgba(20,10,40,0.45)"
                  : "rgba(255,255,255,0.62)",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.13)"
                  : "1px solid rgba(109,40,217,0.2)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark
                  ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 4px 24px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div
                className="font-sg text-[13px] font-bold mb-1"
                style={{ color: T.text }}
              >
                Level Breakdown
              </div>
              <div
                className="font-ibm text-[10px] mb-4"
                style={{ color: T.textSub }}
              >
                By log level
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <DonutChart
                    size={80}
                    thickness={12}
                    segments={[
                      { value: lc.error || 0, color: "#f87171" },
                      { value: lc.warn || 0, color: "#fbbf24" },
                      { value: lc.debug || 0, color: "#818cf8" },
                      { value: lc.info || 0, color: "#22d3ee" },
                    ]}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="font-sg text-xs font-bold"
                      style={{ color: T.text }}
                    >
                      {logs.length > 999 ? "1k+" : logs.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {[
                    ["ERR", lc.error || 0, "#f87171"],
                    ["WRN", lc.warn || 0, "#fbbf24"],
                    ["DBG", lc.debug || 0, "#818cf8"],
                    ["INF", lc.info || 0, "#22d3ee"],
                  ].map(([l, v, c]) => (
                    <div key={l} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
                        style={{ background: c }}
                      />
                      <span
                        className="font-ibm text-[9px] w-7"
                        style={{ color: T.textSub }}
                      >
                        {l}
                      </span>
                      <div
                        className="flex-1 h-1 rounded-sm overflow-hidden"
                        style={{
                          background: isDark
                            ? "rgba(255,255,255,0.09)"
                            : "#fff",
                        }}
                      >
                        <div
                          className="h-full rounded-sm transition-all duration-300"
                          style={{
                            width: `${Math.round((v / Math.max(logs.length, 1)) * 100)}%`,
                            background: c,
                          }}
                        />
                      </div>
                      <span
                        className="font-ibm text-[9px] w-7 text-right"
                        style={{ color: c }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div
              className="rounded-2xl p-4"
              style={{
                background: isDark
                  ? "rgba(20,10,40,0.45)"
                  : "rgba(255,255,255,0.62)",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.13)"
                  : "1px solid rgba(109,40,217,0.2)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark
                  ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 4px 24px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div
                className="font-sg text-[13px] font-bold mb-1"
                style={{ color: T.text }}
              >
                Top Endpoints
              </div>
              <div
                className="font-ibm text-[10px] mb-3"
                style={{ color: T.textSub }}
              >
                By request count
              </div>
              {topPaths.length === 0 ? (
                <div
                  className="font-ibm text-[11px] text-center py-5"
                  style={{ color: T.textSub }}
                >
                  No HTTP log data yet
                </div>
              ) : (
                topPaths.map(([path, count]) => {
                  const maxCount = topPaths[0][1];
                  const short = path.length > 38 ? "…" + path.slice(-36) : path;
                  return (
                    <div key={path} className="mb-2">
                      <div className="flex justify-between mb-0.5">
                        <span
                          className="font-ibm text-[10px]"
                          style={{ color: T.text }}
                        >
                          {short}
                        </span>
                        <span
                          className="font-ibm text-[10px]"
                          style={{ color: T.textSub }}
                        >
                          {count}
                        </span>
                      </div>
                      <div
                        className="h-0.5 rounded-sm overflow-hidden"
                        style={{
                          background: isDark
                            ? "rgba(255,255,255,0.09)"
                            : "#fff",
                        }}
                      >
                        <div
                          className="h-full rounded-sm transition-all duration-300"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            background: `${MAIN_COLOR}88`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: isDark
                  ? "rgba(20,10,40,0.45)"
                  : "rgba(255,255,255,0.62)",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.13)"
                  : "1px solid rgba(109,40,217,0.2)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark
                  ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 4px 24px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div
                className="font-sg text-[13px] font-bold mb-1"
                style={{ color: T.text }}
              >
                Method Stats
              </div>
              <div
                className="font-ibm text-[10px] mb-3"
                style={{ color: T.textSub }}
              >
                Avg response time & count
              </div>
              {methodStats.length === 0 ? (
                <div
                  className="font-ibm text-[11px] text-center py-5"
                  style={{ color: T.textSub }}
                >
                  No HTTP log data yet
                </div>
              ) : (
                <table
                  className="w-full"
                  style={{ borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      {["Method", "Requests", "Avg ms", "Errors"].map((h) => (
                        <th
                          key={h}
                          className="font-ibm text-[9px] uppercase tracking-widest text-left pb-2 font-semibold"
                          style={{ color: T.textSub }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {methodStats.map(({ method, avg, count, errors }) => (
                      <tr key={method}>
                        <td className="py-1">
                          <span
                            className="font-ibm text-[11px] font-semibold"
                            style={{
                              color:
                                (isDark ? METHOD_COLOR : METHOD_COLOR_LIGHT)[
                                  method
                                ] || T.text,
                            }}
                          >
                            {method}
                          </span>
                        </td>
                        <td
                          className="font-ibm text-[11px] py-1"
                          style={{ color: T.text }}
                        >
                          {count}
                        </td>
                        <td
                          className="font-ibm text-[11px] py-1"
                          style={{
                            color:
                              avg > 500
                                ? "#f87171"
                                : avg > 200
                                  ? "#fbbf24"
                                  : "#34d399",
                          }}
                        >
                          {avg}ms
                        </td>
                        <td
                          className="font-ibm text-[11px] py-1"
                          style={{ color: errors > 0 ? "#f87171" : T.textSub }}
                        >
                          {errors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Charts row 3 */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4"
              style={{
                background: isDark
                  ? "rgba(20,10,40,0.45)"
                  : "rgba(255,255,255,0.62)",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.13)"
                  : "1px solid rgba(109,40,217,0.2)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark
                  ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 4px 24px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div
                className="font-sg text-[13px] font-bold mb-1"
                style={{ color: T.text }}
              >
                Insight Severity
              </div>
              <div
                className="font-ibm text-[10px] mb-3"
                style={{ color: T.textSub }}
              >
                LLM analysis breakdown
              </div>
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <DonutChart
                    size={80}
                    thickness={12}
                    segments={[
                      { value: sevBreakdown.critical || 0, color: "#f87171" },
                      { value: sevBreakdown.high || 0, color: "#fb923c" },
                      { value: sevBreakdown.medium || 0, color: "#fbbf24" },
                      { value: sevBreakdown.low || 0, color: "#34d399" },
                      { value: sevBreakdown.info || 0, color: "#60a5fa" },
                    ]}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="font-sg text-xs font-bold"
                      style={{ color: T.text }}
                    >
                      {insights.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {[
                    ["CRIT", sevBreakdown.critical || 0, "#f87171"],
                    ["HIGH", sevBreakdown.high || 0, "#fb923c"],
                    ["MED", sevBreakdown.medium || 0, "#fbbf24"],
                    ["LOW", sevBreakdown.low || 0, "#34d399"],
                    ["INFO", sevBreakdown.info || 0, "#60a5fa"],
                  ].map(([l, v, c]) => (
                    <div key={l} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
                        style={{ background: c }}
                      />
                      <span
                        className="font-ibm text-[9px] w-8"
                        style={{ color: T.textSub }}
                      >
                        {l}
                      </span>
                      <div
                        className="flex-1 h-0.5 rounded-sm overflow-hidden"
                        style={{
                          background: isDark
                            ? "rgba(255,255,255,0.09)"
                            : "#fff",
                        }}
                      >
                        <div
                          className="h-full rounded-sm"
                          style={{
                            width: `${Math.round((v / Math.max(insights.length, 1)) * 100)}%`,
                            background: c,
                          }}
                        />
                      </div>
                      <span
                        className="font-ibm text-[9px] w-5 text-right"
                        style={{ color: c }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{
                background: isDark
                  ? "rgba(20,10,40,0.45)"
                  : "rgba(255,255,255,0.62)",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.13)"
                  : "1px solid rgba(109,40,217,0.2)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: isDark
                  ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "0 4px 24px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div
                className="font-sg text-[13px] font-bold mb-1"
                style={{ color: T.text }}
              >
                Recent Errors
              </div>
              <div
                className="font-ibm text-[10px] mb-3"
                style={{ color: T.textSub }}
              >
                Latest error-level logs
              </div>
              <div className={`${sbClass} max-h-36 overflow-y-auto`}>
                {logs
                  .filter((l) => l.level === "error")
                  .slice(0, 10)
                  .map((l) => (
                    <div
                      key={l._uid}
                      className="py-1.5 border-b"
                      style={{ borderColor: T.border }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="font-ibm text-[9px] px-1.5 py-px rounded-sm"
                          style={{
                            color: "#f87171",
                            background: "rgba(248,113,113,0.1)",
                          }}
                        >
                          ERR
                        </span>
                        {l.method && (
                          <span
                            className="font-ibm text-[9px]"
                            style={{
                              color:
                                (isDark ? METHOD_COLOR : METHOD_COLOR_LIGHT)[
                                  l.method
                                ] || T.text,
                            }}
                          >
                            {l.method}
                          </span>
                        )}
                        {l.status && (
                          <span
                            className="font-ibm text-[9px]"
                            style={{ color: "#f87171" }}
                          >
                            {l.status}
                          </span>
                        )}
                        <span
                          className="font-ibm text-[9px] ml-auto"
                          style={{ color: T.textSub }}
                        >
                          {l.ts.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div
                        className="font-ibm text-[10px] overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ color: T.msgColor }}
                      >
                        {l.message}
                      </div>
                    </div>
                  ))}
                {logs.filter((l) => l.level === "error").length === 0 && (
                  <div
                    className="font-ibm text-[11px] text-center py-5"
                    style={{ color: T.textSub }}
                  >
                    No errors 🎉
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TERMINAL ── */}
      {activeSubTab === "terminal" && (
        <div className="flex flex-col" style={{ height: 580 }}>
          <div
            className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 rounded-t-xl border border-b-0"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.03)",
              borderColor: T.border,
            }}
          >
            <div className="flex gap-1 flex-wrap">
              {["all", "info", "warn", "error", "debug"].map((f) => {
                const active = logFilter === f,
                  meta = T.LEVEL_META[f];
                return (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className="btn-h font-ibm flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] border"
                    style={{
                      border: `1px solid ${active ? (isDark ? "rgba(124,58,237,.55)" : "rgba(124,58,237,.4)") : T.border}`,
                      color: active
                        ? isDark
                          ? "#e2d9f3"
                          : "#4c1d95"
                        : isDark
                          ? "#71717a"
                          : "#6b7280",
                      background: active
                        ? isDark
                          ? "rgba(124,58,237,.12)"
                          : "rgba(124,58,237,.08)"
                        : "transparent",
                    }}
                  >
                    {f !== "all" && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: meta?.color }}
                      />
                    )}
                    {f.toUpperCase()}{" "}
                    <span style={{ opacity: 0.5, fontSize: 9 }}>
                      ({f === "all" ? logs.length : lc[f] || 0})
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 min-w-[140px]">
              <Icon
                d={IC.search}
                size={11}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: T.textSub,
                  pointerEvents: "none",
                }}
              />
              <input
                className="font-ibm w-full pl-7 pr-2.5 py-1 rounded-lg text-[11px] outline-none border"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter messages…"
                style={{
                  border: `1px solid ${T.border}`,
                  background: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.03)",
                  color: T.text,
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className={sseStatus === "connected" ? "pulse-dot" : ""}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: sseDot,
                  display: "inline-block",
                }}
              />
              <span className="font-ibm text-[10px]" style={{ color: sseDot }}>
                {sseStatus === "connected"
                  ? "LIVE"
                  : sseStatus === "connecting"
                    ? "…"
                    : "OFFLINE"}
              </span>
              <span
                className="font-ibm text-[10px]"
                style={{ color: T.textSub }}
              >
                {filteredLogs.length}/{logs.length}
              </span>
            </div>
          </div>
          <div
            className={`${sbClass} flex-1 overflow-y-auto rounded-b-xl border`}
            style={{
              border: `1px solid ${T.border}`,
              background: isDark ? "#050509" : "#f8f5ff",
              fontFamily: "'IBM Plex Mono',monospace",
            }}
          >
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <span
                    className="font-ibm text-[11px]"
                    style={{ color: T.textSub }}
                  >
                    {sseStatus === "connected"
                      ? logSearch || logFilter !== "all"
                        ? "No matching logs"
                        : "Awaiting log data…"
                      : "Waiting for SSE connection…"}
                  </span>
                </div>
              </div>
            ) : (
              filteredLogs.map((log, i) => {
                const meta = T.LEVEL_META[log.level] || T.LEVEL_META.info;
                const copied = copiedUid === log._uid;
                return (
                  <div
                    key={log._uid}
                    className={`cp-wrap ${isDark ? "log-row" : "log-row-l"} slide-in flex items-stretch`}
                    style={{
                      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.03)" : "rgba(147,51,234,0.05)"}`,
                    }}
                  >
                    <div
                      className="font-ibm w-9 py-1.5 pr-1.5 text-right text-[9px] flex-shrink-0 border-r select-none"
                      style={{
                        color: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(30,27,75,0.15)",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(147,51,234,0.08)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0 flex items-start gap-2 px-3 py-1">
                      <span
                        className="font-ibm text-[10px] flex-shrink-0 w-16 pt-px"
                        style={{ color: isDark ? "#22c55e" : "#16a34a" }}
                      >
                        {log.ts.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      <span
                        className="font-ibm text-[9px] font-bold flex-shrink-0 mt-px px-1 py-0.5 rounded min-w-[30px] text-center"
                        style={{
                          color: meta.color,
                          background: meta.bg,
                          border: `1px solid ${meta.color}1f`,
                        }}
                      >
                        {meta.label}
                      </span>
                      <div
                        className="font-ibm flex-1 min-w-0 text-[11px] leading-relaxed break-words"
                        style={{
                          color: isDark
                            ? "rgba(255,255,255,0.68)"
                            : "rgba(30,27,75,0.78)",
                        }}
                      >
                        {log.method ? (
                          <>
                            <span
                              style={{
                                fontWeight: 700,
                                marginRight: 6,
                                color: T.METHOD_COLOR[log.method] || T.text,
                              }}
                            >
                              {log.method}
                            </span>
                            <span
                              style={{
                                marginRight: 4,
                                color: isDark
                                  ? "rgba(255,255,255,0.38)"
                                  : "rgba(30,27,75,0.45)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "inline-block",
                                maxWidth: "30ch",
                                verticalAlign: "bottom",
                              }}
                            >
                              {log.path}
                            </span>
                            <span
                              style={{
                                marginRight: 4,
                                color: isDark
                                  ? "rgba(255,255,255,0.16)"
                                  : "rgba(30,27,75,0.28)",
                              }}
                            >
                              →
                            </span>
                            {log.status && (
                              <span
                                style={{
                                  fontWeight: 700,
                                  marginRight: 4,
                                  color: T.statusColor(log.status),
                                }}
                              >
                                {log.status}
                              </span>
                            )}
                            {log.duration != null && (
                              <span
                                style={{
                                  marginRight: 4,
                                  color: isDark
                                    ? "rgba(255,255,255,0.25)"
                                    : "rgba(30,27,75,0.38)",
                                }}
                              >
                                [{log.duration}ms]
                              </span>
                            )}
                            {log.ip && (
                              <span
                                style={{
                                  color: isDark
                                    ? "rgba(255,255,255,0.18)"
                                    : "rgba(30,27,75,0.3)",
                                }}
                              >
                                | {log.ip}
                              </span>
                            )}
                          </>
                        ) : (
                          <span>{log.message}</span>
                        )}
                      </div>
                      <button
                        className="cp-btn font-ibm btn-h flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border flex-shrink-0 mt-px"
                        onClick={() => copyLog(log)}
                        style={{
                          border: `1px solid ${copied ? "rgba(34,197,94,.4)" : T.border}`,
                          color: copied
                            ? "#22c55e"
                            : isDark
                              ? "#52525b"
                              : "#9ca3af",
                          background: copied
                            ? "rgba(34,197,94,.06)"
                            : "transparent",
                        }}
                      >
                        <Icon
                          d={
                            copied
                              ? "M20 6L9 17l-5-5"
                              : "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                          }
                          size={9}
                        />
                        {copied ? "✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div
            className="font-ibm flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 mt-0.5 text-[10px]"
            style={{ color: T.textSub }}
          >
            <div className="flex gap-3 flex-wrap">
              {Object.entries(T.LEVEL_META).map(([lvl, m]) => (
                <div key={lvl} className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-sm"
                    style={{ background: m.color }}
                  />
                  {lvl}: {lc[lvl] || 0}
                </div>
              ))}
            </div>
            <span>↑ newest first</span>
          </div>
        </div>
      )}

      {/* ── INSIGHTS ── */}
      {activeSubTab === "insights" && (
        <div className="flex flex-col" style={{ height: 580 }}>
          <div
            className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 rounded-t-xl border border-b-0"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.03)",
              borderColor: T.border,
            }}
          >
            <div className="flex gap-1 flex-wrap">
              {[
                {
                  id: "all",
                  label: "All",
                  count: insights.length,
                  dot: isDark ? "#71717a" : "#9ca3af",
                },
                {
                  id: "error",
                  label: "Errors",
                  count: ic.error || 0,
                  dot: isDark ? "#f87171" : "#dc2626",
                },
                {
                  id: "insight",
                  label: "Insights",
                  count: ic.insight || 0,
                  dot: isDark ? "#a78bfa" : "#7c3aed",
                },
                {
                  id: "summary",
                  label: "Summary",
                  count: ic.summary || 0,
                  dot: isDark ? "#60a5fa" : "#2563eb",
                },
              ].map(({ id, label, count, dot }) => {
                const active = insightFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setInsightFilter(id)}
                    className="btn-h font-ibm flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] border"
                    style={{
                      border: `1px solid ${active ? (isDark ? "rgba(167,139,250,.5)" : "rgba(124,58,237,.4)") : T.border}`,
                      color: active
                        ? isDark
                          ? "#e2d9f3"
                          : "#4c1d95"
                        : isDark
                          ? "#71717a"
                          : "#6b7280",
                      background: active
                        ? isDark
                          ? "rgba(167,139,250,.1)"
                          : "rgba(124,58,237,.07)"
                        : "transparent",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: dot }}
                    />
                    {label}{" "}
                    <span style={{ opacity: 0.5, fontSize: 9 }}>({count})</span>
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 min-w-[160px]">
              <Icon
                d={IC.search}
                size={11}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: T.textSub,
                  pointerEvents: "none",
                }}
              />
              <input
                className="font-ibm w-full pl-7 pr-2.5 py-1 rounded-lg text-[11px] outline-none border"
                value={insightSearch}
                onChange={(e) => setInsightSearch(e.target.value)}
                placeholder="Search summary or context…"
                style={{
                  border: `1px solid ${T.border}`,
                  background: isDark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.03)",
                  color: T.text,
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
              <span
                className={sseStatus === "connected" ? "pulse-dot" : ""}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: sseDot,
                  display: "inline-block",
                }}
              />
              <span className="font-ibm text-[10px]" style={{ color: sseDot }}>
                {sseStatus === "connected" ? "LIVE" : "OFFLINE"}
              </span>
              <span
                className="font-ibm text-[10px]"
                style={{ color: T.textSub }}
              >
                {filteredInsights.length}/{insights.length}
              </span>
            </div>
          </div>
          <div
            className={`${sbClass} flex-1 overflow-y-auto rounded-b-xl border`}
            style={{
              border: `1px solid ${T.border}`,
              background: isDark ? "#050509" : "#f8f5ff",
            }}
          >
            {filteredInsights.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span
                  className="font-ibm text-[11px]"
                  style={{ color: T.textSub }}
                >
                  {sseStatus === "connected"
                    ? insightSearch || insightFilter !== "all"
                      ? "No matching insights"
                      : "Awaiting LLM insights…"
                    : "Connecting…"}
                </span>
              </div>
            ) : (
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    className="sticky top-0 z-10 border-b"
                    style={{
                      background: isDark ? "#050509" : "#f8f5ff",
                      borderColor: T.border,
                    }}
                  >
                    {[
                      { col: "severity", label: "Severity" },
                      { col: "type", label: "Type" },
                      { col: "context", label: "Context" },
                      { col: "summary", label: "Summary" },
                      { col: "analyzedAt", label: "Time" },
                      { col: "occurrences", label: "×" },
                      { col: null, label: "" },
                    ].map(({ col, label }) => (
                      <th
                        key={label}
                        onClick={() =>
                          col &&
                          (sortCol === col
                            ? setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                            : (setSortCol(col), setSortDir("desc")))
                        }
                        className="font-ibm text-[9px] uppercase tracking-widest px-2.5 py-2 text-left font-semibold"
                        style={{
                          color: T.textSub,
                          cursor: col ? "pointer" : "default",
                          userSelect: "none",
                        }}
                      >
                        {label}{" "}
                        {col && sortCol === col && (
                          <span style={{ opacity: 0.7 }}>
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInsights.map((ins) => {
                    const sm =
                      (isDark ? SEVERITY_META_DARK : SEVERITY_META_LIGHT)[
                        ins.severity
                      ] ||
                      (isDark ? SEVERITY_META_DARK : SEVERITY_META_LIGHT).info;
                    const isExp = expandedInsight === ins._uid;
                    return (
                      <>
                        <tr
                          key={ins._uid}
                          onClick={() =>
                            setExpandedInsight(isExp ? null : ins._uid)
                          }
                          className="ins-row"
                          style={{
                            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(147,51,234,0.06)"}`,
                            borderLeft: `3px solid ${isExp ? sm.bar : "transparent"}`,
                            background: isExp
                              ? isDark
                                ? `${sm.bar}12`
                                : `${sm.bar}08`
                              : "transparent",
                            cursor: "pointer",
                            transition: "all .15s",
                          }}
                        >
                          <td className="px-2.5 py-1.5 whitespace-nowrap">
                            <SevPill severity={ins.severity} isDark={isDark} />
                          </td>
                          <td className="px-2.5 py-1.5 whitespace-nowrap">
                            <span
                              className="font-ibm text-[9px] px-1.5 py-0.5 rounded"
                              style={{
                                color:
                                  ins.type === "error"
                                    ? isDark
                                      ? "#f87171"
                                      : "#dc2626"
                                    : ins.type === "summary"
                                      ? isDark
                                        ? "#60a5fa"
                                        : "#2563eb"
                                      : isDark
                                        ? "#a78bfa"
                                        : "#7c3aed",
                                background:
                                  ins.type === "error"
                                    ? "rgba(248,113,113,.1)"
                                    : ins.type === "summary"
                                      ? "rgba(96,165,250,.1)"
                                      : "rgba(167,139,250,.1)",
                              }}
                            >
                              {ins.type}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap">
                            {ins.context ? (
                              <span
                                className="font-ibm text-[10px]"
                                style={{
                                  color: isDark ? "#a78bfa" : "#7c3aed",
                                }}
                              >
                                {ins.context}
                              </span>
                            ) : (
                              <span
                                style={{
                                  opacity: 0.25,
                                  fontFamily: "'IBM Plex Mono',monospace",
                                  fontSize: 11,
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-1.5 max-w-[360px]">
                            <div className="flex items-center gap-1.5">
                              {ins.isLive && (
                                <span
                                  className="font-ibm text-[8px] px-1 py-px rounded"
                                  style={{
                                    background: "rgba(34,197,94,0.14)",
                                    color: "#22c55e",
                                    border: "1px solid rgba(34,197,94,0.3)",
                                    flexShrink: 0,
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                              <span
                                className="font-ibm text-[11px] overflow-hidden text-ellipsis whitespace-nowrap block"
                                style={{
                                  color: isDark
                                    ? "rgba(255,255,255,0.72)"
                                    : "rgba(30,27,75,0.78)",
                                }}
                              >
                                {ins.summary}
                              </span>
                            </div>
                          </td>
                          <td className="px-2.5 py-1.5 whitespace-nowrap">
                            <span
                              className="font-ibm text-[10px]"
                              style={{ color: isDark ? "#22c55e" : "#16a34a" }}
                            >
                              {ins.analyzedAt.toLocaleTimeString("en-US", {
                                hour12: false,
                              })}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 whitespace-nowrap">
                            <span
                              className="font-ibm text-[11px] font-bold"
                              style={{ color: sm.color }}
                            >
                              {ins.occurrences}×
                            </span>
                          </td>
                          <td className="px-2 py-1.5 w-6">
                            <Icon
                              d={isExp ? IC.chevronDown : IC.chevronRight}
                              size={11}
                              style={{ color: T.textSub, display: "block" }}
                            />
                          </td>
                        </tr>
                        {isExp && (
                          <tr key={`exp-${ins._uid}`}>
                            <td colSpan={7}>
                              <InsightDetail
                                insight={ins}
                                isDark={isDark}
                                T={T}
                                onClose={() => setExpandedInsight(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div
            className="font-ibm flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 mt-0.5 text-[10px]"
            style={{ color: T.textSub }}
          >
            <div className="flex gap-3 flex-wrap">
              {[
                ["error", isDark ? "#f87171" : "#dc2626"],
                ["insight", isDark ? "#a78bfa" : "#7c3aed"],
                ["summary", isDark ? "#60a5fa" : "#2563eb"],
              ].map(([t, c]) => (
                <div key={t} className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-sm"
                    style={{ background: c }}
                  />
                  {t}: {ic[t] || 0}
                </div>
              ))}
            </div>
            <span>{filteredInsights.length} rows · click row to expand</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD — fits inside parent layout (no own header/sidebar)
// ═══════════════════════════════════════════════════════════════════════════════
export default function ServiceDashboard() {
  const { theme } = useBackgroundContext();
  const isDark = theme === "dark";

  const [statuses, setStatuses] = useState({});
  const [checking, setChecking] = useState({});
  const [checkingAll, setCheckingAll] = useState(false);
  const [actionLines, setActionLines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [insights, setInsights] = useState([]);
  const [sseStatus, setSseStatus] = useState("disconnected");
  const [sseError, setSseError] = useState(null);
  const [activeTab, setActiveTab] = useState("health");

  const esRef = useRef(null);
  const reconRef = useRef(null);
  const attempts = useRef(0);

  const T = {
    bg: "transparent",
    border: isDark ? "rgba(255,255,255,0.18)" : "rgba(147,51,234,0.15)", // was 0.12
    text: isDark ? "#dde0f0" : "#1e1b4b",
    textSub: isDark ? "#a1a1aa" : "#6b7280", // was #71717a, brighter
    msgColor: isDark ? "rgba(255,255,255,0.7)" : "rgba(30,27,75,0.8)",
    LEVEL_META: isDark ? DARK_LEVEL_META : LIGHT_LEVEL_META,
    METHOD_COLOR: isDark ? METHOD_COLOR : METHOD_COLOR_LIGHT,
    statusColor: isDark ? statusColor : statusColorLight,
  };

  // SSE: Log Stream
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const connect = () => {
      setSseStatus("connecting");
      const es = new EventSource(`${base}/logs/stream`);
      esRef.current = es;
      const historyBatch = [];
      let historyLogged = false;
      es.onopen = () => {
        setSseStatus("connected");
        setSseError(null);
        attempts.current = 0;
      };
      es.addEventListener("log:history", (e) => {
        const log = parseLog(e.data);
        historyBatch.push(log);
        setLogs((p) => [...p, log].slice(0, 1000));
      });
      es.addEventListener("log:live", (e) => {
        if (!historyLogged) {
          historyLogged = true;
        }
        const log = parseLog(e.data);
        setLogs((p) => [log, ...p].slice(0, 1000));
      });
      es.onmessage = (e) => {
        if (!e.data || e.data === "ping") return;
        try {
          const parsed = JSON.parse(e.data);
          if (!parsed?.level && !parsed?.message) return;
          const log = parseLog(e.data);
          if (!historyLogged) historyBatch.push(log);
          setLogs((p) => [...p, log].slice(0, 1000));
        } catch {}
      };
      es.onerror = () => {
        setSseStatus("disconnected");
        setSseError("Connection lost");
        es.close();
        if (attempts.current < 5) {
          attempts.current++;
          reconRef.current = setTimeout(connect, 3000);
        } else setSseError("Max reconnect attempts reached.");
      };
    };
    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(reconRef.current);
    };
  }, []);

  // SSE: Insight Stream
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const esI = new EventSource(`${base}/logs/insights/stream?limit=80`);
    const insightBatch = [];
    let insightHistoryLogged = false;
    esI.addEventListener("insight:history", (e) => {
      const ins = parseInsight(e.data, "insight:history");
      if (ins) {
        insightBatch.push(ins);
        setInsights((p) => [...p, ins].slice(0, 1000));
      }
    });
    esI.addEventListener("insight:live", (e) => {
      if (!insightHistoryLogged) {
        insightHistoryLogged = true;
      }
      const ins = parseInsight(e.data, "insight:live");
      if (ins) setInsights((p) => [ins, ...p].slice(0, 1000));
    });
    esI.addEventListener("ping", () => {
      insightHistoryLogged = true;
    });
    esI.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (!parsed?._id) return;
        const ins = parseInsight(e.data, "insight:history");
        if (ins) {
          insightBatch.push(ins);
          setInsights((p) => [ins, ...p].slice(0, 1000));
        }
      } catch {}
    };
    esI.onerror = () => {};
    return () => esI.close();
  }, []);

  // Health check logic
  const checkOne = useCallback(async (svc) => {
    setChecking((p) => ({ ...p, [svc.id]: true }));
    const t0 = Date.now();
    try {
      const res = await fetch(svc.healthUrl, { method: "GET" });
      const dur = Date.now() - t0;
      setStatuses((p) => ({
        ...p,
        [svc.id]: { alive: res.ok, duration: dur },
      }));
      setActionLines((p) =>
        [
          {
            kind: res.ok ? "ok" : "err",
            text: `${res.ok ? "✓" : "✗"} ${svc.name}: ${res.ok ? `Healthy · ${dur}ms` : `HTTP ${res.status}`}`,
            ts: new Date(),
          },
          ...p,
        ].slice(0, 50),
      );
    } catch (e) {
      setStatuses((p) => ({
        ...p,
        [svc.id]: { alive: false, error: e.message },
      }));
      setActionLines((p) =>
        [
          { kind: "err", text: `✗ ${svc.name}: ${e.message}`, ts: new Date() },
          ...p,
        ].slice(0, 50),
      );
    } finally {
      setChecking((p) => ({ ...p, [svc.id]: false }));
    }
  }, []);

  const checkAll = useCallback(async () => {
    setCheckingAll(true);
    setActionLines([
      {
        kind: "sys",
        text: "▶  Running health checks for all services…",
        ts: new Date(),
      },
    ]);
    for (const s of SERVICES) {
      await checkOne(s);
      await new Promise((r) => setTimeout(r, 180));
    }
    setActionLines((p) => [
      { kind: "ok", text: "✅  All health checks complete", ts: new Date() },
      ...p,
    ]);
    setCheckingAll(false);
  }, [checkOne]);

  const sseDot =
    sseStatus === "connected"
      ? "#22c55e"
      : sseStatus === "connecting"
        ? "#fbbf24"
        : "#ef4444";
  const lc = logs.reduce((a, l) => {
    a[l.level] = (a[l.level] || 0) + 1;
    return a;
  }, {});
  const aliveN = Object.values(statuses).filter((s) => s.alive).length;
  const checkedN = Object.keys(statuses).length;

  const TABS = [
    {
      id: "health",
      label: "Service Health",
      icon: IC.shield,
      badge: checkedN > 0 ? `${aliveN}/${checkedN}` : null,
    },
    {
      id: "monitoring",
      label: "Server Monitoring",
      icon: IC.activity,
      badge: logs.length > 0 ? logs.length.toLocaleString() : null,
    },
  ];

  return (
    <>
      <style>{EXTRA_CSS}</style>

      {/*
        ┌──────────────────────────────────────────────────────────┐
        │  This component renders INSIDE the parent layout's       │
        │  content area (after sidebar + header are already        │
        │  rendered by the parent). It does NOT include its own    │
        │  sticky navbar. It fills the available space with        │
        │  flex-col and overflow-auto.                             │
        └──────────────────────────────────────────────────────────┘
      */}
      <div
        className="font-sg flex flex-col w-full h-full overflow-hidden"
        style={{ color: T.text }}
      >
        {/* ── Inner tab bar (replaces the old sticky header) ── */}
        <div
          className="flex items-center justify-between px-6 py-2 border-b flex-shrink-0"
          style={{
            background: isDark ? "rgba(5,5,9,0.6)" : "rgba(255,255,255,0.7)",
            backdropFilter: "blur(10px)",
            borderColor: T.border,
          }}
        >
          {/* Tab pills */}
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="tab-pill font-sg flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] border-none"
                  style={{
                    background: active
                      ? isDark
                        ? "rgba(124,58,237,0.2)"
                        : "rgba(109,40,217,0.1)"
                      : "transparent",
                    color: active
                      ? isDark
                        ? "#c4b5fd"
                        : "#6d28d9"
                      : T.textSub,
                    cursor: "pointer",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <Icon d={tab.icon} size={13} />
                  {tab.label}
                  {tab.badge && (
                    <span
                      className="font-ibm text-[10px] px-1.5 py-px rounded-full"
                      style={{
                        background: active
                          ? isDark
                            ? "rgba(124,58,237,0.3)"
                            : "rgba(109,40,217,0.15)"
                          : isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.06)",
                        color: active
                          ? isDark
                            ? "#c4b5fd"
                            : "#6d28d9"
                          : T.textSub,
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              {[
                ["ERR", lc.error || 0, "#f87171"],
                ["WRN", lc.warn || 0, "#fbbf24"],
              ].map(
                ([l, v, c]) =>
                  v > 0 && (
                    <div
                      key={l}
                      className="font-ibm flex items-center gap-1 px-2 py-1 rounded-md"
                      style={{
                        background: `${c}14`,
                        border: `1px solid ${c}30`,
                      }}
                    >
                      <span
                        className="w-1 h-1 rounded-full inline-block"
                        style={{ background: c }}
                      />
                      <span style={{ color: c, fontSize: 10 }}>{l}</span>
                      <span style={{ color: c, fontSize: 10, fontWeight: 600 }}>
                        {v}
                      </span>
                    </div>
                  ),
              )}
            </div>
            <div
              className="font-ibm flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px]"
              style={{ border: `1px solid ${T.border}` }}
            >
              <span
                className={sseStatus === "connected" ? "pulse-dot" : ""}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: sseDot,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: sseDot }}>
                {sseStatus === "connected"
                  ? "Live"
                  : sseStatus === "connecting"
                    ? "Connecting…"
                    : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Scrollable content area ── */}
        <div
          className="flex-1 overflow-y-auto sn-sb px-6 pb-8"
          style={{
            background: "rgba(5, 0, 15, 0.3)", // ← very transparent, lets wallpaper breathe
            backdropFilter: "blur(2px)", // ← light global blur on content area
            WebkitBackdropFilter: "blur(2px)",
          }}
        >
          {activeTab === "health" ? (
            <ServiceHealthTab
              isDark={isDark}
              T={T}
              statuses={statuses}
              checking={checking}
              checkingAll={checkingAll}
              checkOne={checkOne}
              checkAll={checkAll}
              actionLines={actionLines}
            />
          ) : (
            <ServerMonitoringTab
              isDark={isDark}
              T={T}
              logs={logs}
              insights={insights}
              sseStatus={sseStatus}
            />
          )}

          {/* SSE Error banner */}
          {sseError && sseStatus !== "connected" && (
            <div
              className="mt-4 p-4 rounded-xl flex gap-3 items-start"
              style={{
                border: "1px solid rgba(248,113,113,.25)",
                background: "rgba(248,113,113,.06)",
              }}
            >
              <Icon
                d={IC.alert}
                size={16}
                style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <div
                  className="font-sg text-[13px] font-bold mb-1"
                  style={{ color: "#f87171" }}
                >
                  SSE Connection Error
                </div>
                <div
                  className="font-ibm text-[11px]"
                  style={{ color: "rgba(248,113,113,.6)" }}
                >
                  {sseError}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
