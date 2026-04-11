"use client";

import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("SW registered"))
        .catch((err) => console.log("SW error:", err));
    }
  }, []);

  return null;
}