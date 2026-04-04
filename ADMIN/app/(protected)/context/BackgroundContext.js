"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useBackgroundImage } from "@/hooks/useBackgroundImage";

const BackgroundContext = createContext({
  bgImage: "",
  rotateBg: () => {},
  isRotating: false,
  theme: "dark",
  setTheme: () => {},
});

export function BackgroundProvider({ children, rotationInterval = 0 }) {
  const bgData = useBackgroundImage(rotationInterval);
  const [theme, setThemeState] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setThemeState(saved);

    const handleStorage = (e) => {
      if (e.key === "theme") setThemeState(e.newValue || "dark");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "theme", newValue: newTheme }),
    );
  };

  return (
    <BackgroundContext.Provider value={{ ...bgData, theme, setTheme }}>
      {/* Layer 1: background image with blur applied directly */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: bgData.bgImage
            ? `url(${bgData.bgImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(14px)",
          transform: "scale(1.05)", // prevents blur edge artifacts
          zIndex: 0,
        }}
      />

      {/* Layer 2: dark/light tint */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor:
            theme === "dark"
              ? "rgba(5, 0, 20, 0.5)"
              : "rgba(255, 255, 255, 0.3)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Layer 3: content */}
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </BackgroundContext.Provider>
  );
}

export function useBackgroundContext() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error(
      "useBackgroundContext must be used within BackgroundProvider",
    );
  }
  return context;
}
