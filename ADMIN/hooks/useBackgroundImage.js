"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { backgrounds } from "@/components/ui/bg";

export function useBackgroundImage(intervalMs = 0) {
  const [theme, setTheme] = useState("light");
  const [bgImage, setBgImage] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const intervalRef = useRef(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        setTheme(e.newValue || "light");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Function to get random background
  const getRandomBg = useCallback(() => {
    const isDark = theme === "dark";
    const arr = isDark ? backgrounds.dark : backgrounds.light;
    return arr[Math.floor(Math.random() * arr.length)];
  }, [theme]);

  // Initialize background image
  useEffect(() => {
    setBgImage(getRandomBg());
  }, [getRandomBg]);

  // Function to rotate background
  const rotateBg = useCallback(() => {
    setBgImage(getRandomBg());
  }, [getRandomBg]);

  // Setup interval rotation
  useEffect(() => {
    if (intervalMs > 0) {
      setIsRotating(true);
      intervalRef.current = setInterval(() => {
        rotateBg();
      }, intervalMs);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsRotating(false);
      };
    } else {
      setIsRotating(false);
    }
  }, [intervalMs, rotateBg]);

  return {
    bgImage,
    rotateBg,
    isRotating,
    theme,
  };
}