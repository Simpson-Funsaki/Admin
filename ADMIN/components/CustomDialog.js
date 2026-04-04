'use client'

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Icons ────────────────────────────────────────────────────────────────── */
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="11.5" x2="12" y2="16" strokeLinecap="round" />
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
    <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
  </svg>
);

const QuestionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ICONS = { info: InfoIcon, warning: WarningIcon, error: ErrorIcon, question: QuestionIcon };

const TYPE_COLORS = {
  info:     { icon: "#60a5fa", glow: "rgba(96,165,250,0.18)",  accent: "#3b82f6" },
  warning:  { icon: "#fbbf24", glow: "rgba(251,191,36,0.18)",  accent: "#f59e0b" },
  error:    { icon: "#f87171", glow: "rgba(248,113,113,0.18)", accent: "#ef4444" },
  question: { icon: "#a78bfa", glow: "rgba(167,139,250,0.18)", accent: "#8b5cf6" },
};

/* ─── Styles ────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

  .cd-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    transition: background 0.25s ease, backdrop-filter 0.25s ease, -webkit-backdrop-filter 0.25s ease;
    pointer-events: none;
  }
  .cd-overlay.cd-visible {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    pointer-events: all;
  }

  .cd-panel {
    font-family: 'Sora', sans-serif;
    position: relative;
    width: 380px;
    background: linear-gradient(145deg, #161618 0%, #111113 100%);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 18px;
    padding: 28px 28px 22px;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.5),
      0 24px 60px rgba(0,0,0,0.7),
      0 8px 24px rgba(0,0,0,0.4);
    transform: scale(0.92) translateY(12px);
    opacity: 0;
    transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease;
    will-change: transform, opacity;
    overflow: hidden;
  }

  .cd-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
    pointer-events: none;
    border-radius: inherit;
  }

  .cd-panel.cd-visible {
    transform: scale(1) translateY(0);
    opacity: 1;
  }

  /* Colored top accent bar */
  .cd-accent-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    border-radius: 18px 18px 0 0;
    opacity: 0.8;
  }

  /* Icon area */
  .cd-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    flex-shrink: 0;
  }
  .cd-icon-wrap svg {
    width: 22px;
    height: 22px;
  }

  /* Text */
  .cd-title {
    font-size: 15px;
    font-weight: 600;
    color: rgba(255,255,255,0.92);
    margin: 0 0 7px;
    letter-spacing: -0.01em;
    line-height: 1.35;
  }
  .cd-message {
    font-size: 13px;
    font-weight: 400;
    color: rgba(255,255,255,0.45);
    margin: 0;
    line-height: 1.6;
    letter-spacing: 0.01em;
  }

  /* Button row */
  .cd-buttons {
    display: flex;
    gap: 8px;
    margin-top: 24px;
    justify-content: flex-end;
  }

  .cd-btn {
    font-family: 'Sora', sans-serif;
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
    padding: 9px 18px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    outline: none;
    transition: transform 0.12s ease, box-shadow 0.18s ease, background 0.18s ease, opacity 0.12s ease;
    position: relative;
    overflow: hidden;
  }

  .cd-btn:active {
    transform: scale(0.95);
  }

  /* Secondary (cancel/later) button */
  .cd-btn-secondary {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.55);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  }
  .cd-btn-secondary:hover {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.75);
  }

  /* Primary (confirm) button */
  .cd-btn-primary {
    color: #fff;
    box-shadow: 0 4px 16px var(--btn-glow, rgba(99,102,241,0.35));
  }
  .cd-btn-primary:hover {
    opacity: 0.88;
    box-shadow: 0 6px 20px var(--btn-glow, rgba(99,102,241,0.45));
  }

  /* Noise grain overlay on panel */
  .cd-panel::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
    background-size: 180px;
    pointer-events: none;
    opacity: 0.5;
    mix-blend-mode: overlay;
    border-radius: inherit;
  }
`;

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function CustomDialog() {
  const [dialogs, setDialogs] = useState([]);
  const [visible, setVisible] = useState(false);
  const styleRef = useRef(null);

  // Inject styles once
  useEffect(() => {
    if (styleRef.current) return;
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => el.remove();
  }, []);

  // Listen for IPC events from main process
  useEffect(() => {
    if (!window.electron?.onShowDialog) return;
    const unsub = window.electron.onShowDialog((payload) => {
      setDialogs((prev) => [...prev, payload]);
    });
    return () => unsub?.();
  }, []);

  // Animate in/out
  useEffect(() => {
    if (dialogs.length > 0) {
      // small delay so the element is in DOM before transition fires
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [dialogs.length]);

  const current = dialogs[0] ?? null;

  const respond = useCallback(
    (response) => {
      if (!current) return;
      // Animate out first
      setVisible(false);
      setTimeout(() => {
        window.electron?.respondDialog({ id: current.id, response });
        setDialogs((prev) => prev.slice(1));
      }, 220);
    },
    [current]
  );

  // Keyboard: Enter = primary (0), Escape = cancelId
  useEffect(() => {
    if (!current) return;
    const handler = (e) => {
      if (e.key === "Enter") respond(current.defaultId ?? 0);
      if (e.key === "Escape") respond(current.cancelId ?? current.buttons.length - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, respond]);

  if (!current) return null;

  const type = current.type || "info";
  const colors = TYPE_COLORS[type] || TYPE_COLORS.info;
  const Icon = ICONS[type] || InfoIcon;
  const primaryIdx = current.defaultId ?? 0;
  const cancelIdx = current.cancelId ?? current.buttons.length - 1;

  return (
    <div className={`cd-overlay ${visible ? "cd-visible" : ""}`}>
      <div className={`cd-panel ${visible ? "cd-visible" : ""}`}>
        {/* Top accent bar */}
        <div
          className="cd-accent-bar"
          style={{ background: `linear-gradient(90deg, ${colors.accent}, transparent)` }}
        />

        {/* Icon */}
        <div
          className="cd-icon-wrap"
          style={{
            background: colors.glow,
            boxShadow: `0 0 20px ${colors.glow}`,
            color: colors.icon,
          }}
        >
          <Icon />
        </div>

        {/* Title */}
        <p className="cd-title">{current.title || current.message}</p>

        {/* Detail / secondary message */}
        {current.detail && <p className="cd-message">{current.detail}</p>}
        {!current.detail && current.title && (
          <p className="cd-message">{current.message}</p>
        )}

        {/* Buttons */}
        <div className="cd-buttons">
          {current.buttons.map((label, idx) => {
            const isPrimary = idx === primaryIdx;
            return (
              <button
                key={idx}
                className={`cd-btn ${isPrimary ? "cd-btn-primary" : "cd-btn-secondary"}`}
                style={
                  isPrimary
                    ? {
                        background: `linear-gradient(135deg, ${colors.accent}, ${colors.icon})`,
                        "--btn-glow": colors.glow,
                      }
                    : {}
                }
                onClick={() => respond(idx)}
                autoFocus={isPrimary}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}