"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { adminFeatures } from "../config/adminFeatures";

const SIDEBAR_MODES = { EXPANDED: "expanded", COMPACT: "compact" };
const WIDTH = { EXPANDED: 256, COMPACT: 64 };

function SidebarLogo({ isCompact, isDark, titleGradient, textMuted }) {
  return (
    <div className={`flex items-center gap-3 p-3 ${isCompact ? "justify-center" : "justify-start"}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
        <span className="text-white text-xs font-black">A</span>
      </div>
      {!isCompact && (
        <div className="flex-1 min-w-0 overflow-hidden">
          <h2 className={`text-base font-bold bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent truncate`}>
            Admin Panel
          </h2>
          <p className={`text-xs ${textMuted} truncate`}>Management Dashboard</p>
        </div>
      )}
    </div>
  );
}

function NavItem({
  featureKey, feature, isActive, isCompact, isDark, onSelect,
  textDefault, hoverBg, textHover, inactiveIconColor, descriptionText,
}) {
  const Icon = feature.icon;
  return (
    <button
      onClick={() => onSelect(featureKey)}
      title={isCompact ? feature.title : undefined}
      className={`
        relative w-full flex items-center rounded-xl
        transition-all duration-200 group
        ${isCompact ? "justify-center p-3" : "gap-3 px-4 py-3"}
        ${isActive
          ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg shadow-purple-500/20`
          : `${textDefault} ${hoverBg} ${textHover}`
        }
      `}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white/60" />
      )}

      <Icon className={`flex-shrink-0 w-5 h-5 transition-colors ${
        isActive ? "text-white" : `${inactiveIconColor} group-hover:text-white`
      }`} />

      {!isCompact && (
        <div className="flex-1 text-left min-w-0">
          <p className={`font-semibold text-sm truncate leading-tight ${
            isActive ? "text-white" : textDefault
          }`}>
            {feature.title}
          </p>
          {feature.description && !isActive && (
            <p className={`text-xs truncate mt-0.5 ${descriptionText} group-hover:opacity-100`}>
              {feature.description}
            </p>
          )}
        </div>
      )}

      {!isCompact && isActive && (
        <ChevronRight className="w-4 h-4 text-white/70 flex-shrink-0" />
      )}
      {!isCompact && feature.badge && (
        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
          {feature.badge}
        </span>
      )}
      {isCompact && feature.badge && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </button>
  );
}

function SidebarFooter({ userRole, isCompact, isDark, borderColor, footerBg, textMuted }) {
  return (
    <div className={`border-t ${borderColor} ${isCompact ? "p-2" : "p-3"}`}>
      <div className={`${footerBg} rounded-lg transition-colors ${isCompact ? "p-2 flex justify-center" : "p-3"}`}>
        {isCompact ? (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isDark ? "bg-purple-500/30 text-purple-300" : "bg-purple-500 text-white"
          }`}>
            {userRole?.[0]?.toUpperCase() ?? "?"}
          </div>
        ) : (
          <p className={`text-xs font-medium ${textMuted} truncate`}>
            Role:{" "}
            <span className={isDark ? "text-purple-400 font-semibold" : "text-purple-700 font-bold"}>
              {userRole}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function ResizeHandle({ isDark, onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-50 group"
    >
      <div className={`w-full h-full transition-colors duration-150 ${
        isDark ? "group-hover:bg-purple-500/50" : "group-hover:bg-purple-400/50"
      }`} />
    </div>
  );
}

export default function AdminSidebar({
  activeFeature, onFeatureSelect, userRole, width, onResizeStart, theme,
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState(SIDEBAR_MODES.COMPACT);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseEnter = useCallback(() => setSidebarMode(SIDEBAR_MODES.EXPANDED), []);
  const handleMouseLeave = useCallback(() => setSidebarMode(SIDEBAR_MODES.COMPACT), []);
  const handleFeatureSelect = useCallback((key) => {
    onFeatureSelect(key);
    setIsMobileOpen(false);
  }, [onFeatureSelect]);

  const filteredFeatures = Object.entries(adminFeatures).filter(
    ([_, feature]) => feature.roles.includes(userRole)
  );

  const isDark = theme === "dark";
  const isCompact = sidebarMode === SIDEBAR_MODES.COMPACT;
  const resolvedWidth = isCompact ? WIDTH.COMPACT : width;

  const tokens = isDark ? {
    // ── DARK MODE ──────────────────────────────────────────
    sidebarBg: "bg-white/5 backdrop-blur-2xl",
    borderColor: "border-white/10",
    titleGradient: "from-purple-400 to-pink-400",
    textMuted: "text-gray-400",
    textDefault: "text-gray-300",
    textHover: "hover:text-white",
    hoverBg: "hover:bg-white/10",
    footerBg: "bg-white/5",
    mobileBtnBg: "bg-purple-700",
    inactiveIconColor: "text-gray-400",
    descriptionText: "text-gray-500 opacity-80",
    scrollbarTrack: "rgba(15,23,42,0.3)",
    scrollbarThumb: "linear-gradient(180deg,#a855f7,#ec4899)",
    scrollbarThumbHover: "linear-gradient(180deg,#9333ea,#db2777)",
    divider: "bg-gradient-to-r from-white/20 via-white/10 to-transparent",
  } : {
    // ── LIGHT MODE ─────────────────────────────────────────
    sidebarBg: "bg-white/20 backdrop-blur-2xl",
    borderColor: "border-purple-200/60",
    titleGradient: "from-purple-700 to-pink-600",
    textMuted: "text-purple-400",
    textDefault: "text-purple-900",
    textHover: "hover:text-purple-900",
    hoverBg: "hover:bg-purple-100/60",
    footerBg: "bg-purple-50/80",
    mobileBtnBg: "bg-purple-500",
    inactiveIconColor: "text-purple-500",
    descriptionText: "text-purple-400 opacity-90",
    scrollbarTrack: "rgba(233,213,255,0.4)",
    scrollbarThumb: "linear-gradient(180deg,#9333ea,#db2777)",
    scrollbarThumbHover: "linear-gradient(180deg,#7c3aed,#be185d)",
    divider: "bg-gradient-to-r from-purple-300/60 via-purple-200/40 to-transparent",
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen((prev) => !prev)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 ${tokens.mobileBtnBg} text-white rounded-lg shadow-lg`}
        style={{ WebkitAppRegion: "no-drag" }}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ width: `${resolvedWidth}px`, minWidth: `${resolvedWidth}px` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative fixed lg:sticky top-0 left-0 h-screen
          ${tokens.sidebarBg}
          border-r ${tokens.borderColor}
          flex flex-col z-40
          transition-[width] duration-300 ease-in-out
          shadow-lg ${isDark ? "shadow-black/20" : "shadow-purple-200/50"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <style jsx>{`
          .sidebar-nav::-webkit-scrollbar { width: 4px; }
          .sidebar-nav::-webkit-scrollbar-track { background: ${tokens.scrollbarTrack}; border-radius: 10px; }
          .sidebar-nav::-webkit-scrollbar-thumb { background: ${tokens.scrollbarThumb}; border-radius: 10px; }
          .sidebar-nav::-webkit-scrollbar-thumb:hover { background: ${tokens.scrollbarThumbHover}; }
          .sidebar-nav { scrollbar-width: thin; scrollbar-color: #a855f7 ${tokens.scrollbarTrack}; }
        `}</style>

        <SidebarLogo
          isCompact={isCompact}
          isDark={isDark}
          titleGradient={tokens.titleGradient}
          textMuted={tokens.textMuted}
        />

        <div className={`mx-3 h-px flex-shrink-0 ${tokens.divider}`} />

        <nav className={`flex-1 overflow-y-auto sidebar-nav ${isCompact ? "px-2 py-3 space-y-1" : "px-3 py-3 space-y-0.5"}`}>
          {filteredFeatures.map(([key, feature]) => (
            <NavItem
              key={key}
              featureKey={key}
              feature={feature}
              isActive={activeFeature === key}
              isCompact={isCompact}
              isDark={isDark}
              onSelect={handleFeatureSelect}
              textDefault={tokens.textDefault}
              hoverBg={tokens.hoverBg}
              textHover={tokens.textHover}
              inactiveIconColor={tokens.inactiveIconColor}
              descriptionText={tokens.descriptionText}
            />
          ))}
        </nav>

        <div className={`mx-3 h-px flex-shrink-0 ${tokens.divider}`} />

        <SidebarFooter
          userRole={userRole}
          isCompact={isCompact}
          isDark={isDark}
          borderColor={tokens.borderColor}
          footerBg={tokens.footerBg}
          textMuted={tokens.textMuted}
        />

        {!isCompact && <ResizeHandle isDark={isDark} onMouseDown={onResizeStart} />}
      </aside>
    </>
  );
}