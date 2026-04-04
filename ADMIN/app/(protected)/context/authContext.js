// context/auth-context.jsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

// ─── How long before AT expiry we proactively refresh (4 min before 15 min AT) ──
const PROACTIVE_REFRESH_MS = 11 * 60 * 1000;

export function AuthProvider({ children }) {
  // Single auth state object — one setState call = one render, no cascading effects
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true, // true until first session restore completes
    expiresAt: null, // unix seconds from server, used to schedule refresh
  });

  const router = useRouter();

  // ─── Refs (never cause re-renders) ──────────────────────────────────────────
  const refreshPromiseRef = useRef(null); // in-flight refresh dedup
  const refreshTimerRef = useRef(null); // scheduled proactive refresh timer
  const isMountedRef = useRef(true); // guard against setState after unmount

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const safeSetState = useCallback((update) => {
    if (isMountedRef.current) setAuthState((prev) => ({ ...prev, ...update }));
  }, []);

  const clearAuth = useCallback(() => {
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = null;
    refreshPromiseRef.current = null;
    safeSetState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      expiresAt: null,
    });
  }, [safeSetState]);

  // ─── Deduplicated refresh ────────────────────────────────────────────────────
  // Returns { ok: boolean, user?, expiresAt? }
  const refreshSession = useCallback(async () => {
    // If a refresh is already in flight, wait for it — don't fire a second one
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          clearAuth();
          return { ok: false };
        }

        const body = await res.json();
        // Backend returns: { success, data: { user, session: { expires_at } } }
        const user = body?.data?.user ?? null;
        const expiresAt = body?.data?.session?.expires_at ?? null;

        safeSetState({
          user,
          isAuthenticated: true,
          isLoading: false,
          expiresAt,
        });
        return { ok: true, user, expiresAt };
      } catch {
        clearAuth();
        return { ok: false };
      } finally {
        // Clear only after settled so concurrent callers awaited the real result
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, [clearAuth, safeSetState]);

  // ─── Schedule next proactive refresh based on token expiry ──────────────────
  const scheduleRefresh = useCallback(
    (expiresAt) => {
      clearTimeout(refreshTimerRef.current);
      if (!expiresAt) return;

      const expiresAtMs = expiresAt * 1000; // server gives unix seconds
      const now = Date.now();
      const delay = expiresAtMs - now - PROACTIVE_REFRESH_MS;

      if (delay <= 0) {
        // Already within the refresh window — refresh immediately
        refreshSession();
        return;
      }

      refreshTimerRef.current = setTimeout(() => {
        refreshSession().then((result) => {
          if (result.ok && result.expiresAt) {
            scheduleRefresh(result.expiresAt); // chain next refresh
          }
        });
      }, delay);
    },
    [refreshSession],
  );

  // ─── Kick off schedule whenever expiresAt changes ───────────────────────────
  useEffect(() => {
    if (authState.isAuthenticated && authState.expiresAt) {
      scheduleRefresh(authState.expiresAt);
    }
    return () => clearTimeout(refreshTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.expiresAt]); // only expiresAt — not isAuthenticated

  // ─── Restore session on mount (runs exactly once) ────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

        if (cancelled) return;

        if (res.ok) {
          const body = await res.json();
          // Backend returns: { success, data: { user } }
          const user = body?.data?.user ?? null;

          if (!user) {
            // /auth/me succeeded but returned no user — try refresh
            await refreshSession();
            return;
          }

          // /auth/me doesn't return expiresAt, so immediately kick a refresh
          // to get the expiry time and set up the schedule
          safeSetState({
            user,
            isAuthenticated: true,
            isLoading: false,
            expiresAt: null,
          });
          const result = await refreshSession();
          if (result.ok && result.expiresAt) {
            scheduleRefresh(result.expiresAt);
          }
          return;
        }

        if (res.status === 401) {
          // AT missing or expired — try to recover with RT
          if (!cancelled) await refreshSession();
          return;
        }

        // Any other error (500, network down, etc.)
        clearAuth();
      } catch {
        if (!cancelled) clearAuth();
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    clearAuth(); // clear local state immediately

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Server best-effort — local state already cleared
    }

    router.push("/login");
  }, [clearAuth, router]);

  const apiFetch = useCallback(
    async (input, init) => {
      let finalInput = input;

      if (typeof input === "string") {
        const base = process.env.NEXT_PUBLIC_SERVER_API_URL;

        if (input.startsWith(base)) {
          finalInput = input.replace(base, "/api");
        }
      }

      const res = await fetch(finalInput, {
        ...init,
        credentials: "include",
      });

      if (res.status === 401) {
        const result = await refreshSession();

        if (!result.ok) {
          router.push("/login");
          return res;
        }

        // Retry with same transformed URL
        return fetch(finalInput, {
          ...init,
          credentials: "include",
        });
      }

      return res;
    },
    [refreshSession, router],
  );

  const value = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    logout,
    apiFetch, // expose this — components use apiFetch, not raw fetch
    refreshSession, // expose for manual triggers if needed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
