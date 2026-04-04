"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "../lib/util";
import Link from "next/link";
import {
  IconEye,
  IconEyeOff,
  IconShield,
  IconLock,
  IconUser,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Minus, Maximize2, X } from "lucide-react";
import { useAuth } from "../context/authContext";
import React, { Suspense } from "react";

// ─────────────────────────────────────────────
// Fingerprint SVG with scan animation
// ─────────────────────────────────────────────
const FingerprintIcon = ({ scanning }) => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    {scanning && (
      <span className="absolute inset-0 rounded-full animate-ping-slow bg-teal-400/20" />
    )}
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-10"
    >
      <path
        d="M8 44 C8 24 18 10 32 10 C46 10 56 24 56 44"
        stroke="#2dd4bf"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity={scanning ? 1 : 0.35}
        style={
          scanning
            ? {
                strokeDasharray: 90,
                strokeDashoffset: 90,
                animation: "drawRidge 0.4s ease forwards 0.0s",
              }
            : {}
        }
      />
      <path
        d="M13 46 C13 28 20 14 32 14 C44 14 51 28 51 46"
        stroke="#2dd4bf"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity={scanning ? 1 : 0.45}
        style={
          scanning
            ? {
                strokeDasharray: 78,
                strokeDashoffset: 78,
                animation: "drawRidge 0.4s ease forwards 0.1s",
              }
            : {}
        }
      />
      <path
        d="M18 48 C18 32 23 18 32 18 C41 18 46 32 46 48"
        stroke="#2dd4bf"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity={scanning ? 1 : 0.55}
        style={
          scanning
            ? {
                strokeDasharray: 62,
                strokeDashoffset: 62,
                animation: "drawRidge 0.4s ease forwards 0.2s",
              }
            : {}
        }
      />
      <path
        d="M23 50 C23 36 26 22 32 22 C38 22 41 36 41 50"
        stroke="#2dd4bf"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity={scanning ? 1 : 0.65}
        style={
          scanning
            ? {
                strokeDasharray: 48,
                strokeDashoffset: 48,
                animation: "drawRidge 0.4s ease forwards 0.3s",
              }
            : {}
        }
      />
      <path
        d="M28 52 C28 42 29 30 32 26 C35 30 36 42 36 52"
        stroke="#2dd4bf"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity={scanning ? 1 : 0.75}
        style={
          scanning
            ? {
                strokeDasharray: 30,
                strokeDashoffset: 30,
                animation: "drawRidge 0.4s ease forwards 0.4s",
              }
            : {}
        }
      />
      <circle
        cx="32"
        cy="32"
        r="2.2"
        fill="#2dd4bf"
        fillOpacity={scanning ? 1 : 0.6}
        style={
          scanning
            ? { animation: "pulseDot 0.8s ease-in-out infinite 0.5s" }
            : {}
        }
      />
      {scanning && (
        <line
          x1="8"
          y1="32"
          x2="56"
          y2="32"
          stroke="url(#scanGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ animation: "scanLine 1.1s ease-in-out infinite" }}
        />
      )}
      <defs>
        <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
          <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// ─────────────────────────────────────────────
// Google SVG Icon
// ─────────────────────────────────────────────
const GoogleIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// ─────────────────────────────────────────────
// GitHub SVG Icon
// ─────────────────────────────────────────────
const GitHubIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

// ─────────────────────────────────────────────
// OAuth divider
// ─────────────────────────────────────────────
const OAuthDivider = () => (
  <div className="flex items-center gap-2 my-0.5">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <span className="text-[10px] text-neutral-600 font-medium tracking-widest uppercase px-1">
      or continue with
    </span>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

// ─────────────────────────────────────────────
// OAuth Buttons
// ─────────────────────────────────────────────
const OAuthButtons = ({ onOAuth, oauthLoading }) => (
  <div className="flex gap-2">
    {/* Google */}
    <button
      type="button"
      onClick={() => onOAuth("google")}
      disabled={!!oauthLoading}
      className={cn(
        "relative flex-1 flex items-center justify-center gap-2",
        "h-9 rounded-lg text-[11px] font-semibold",
        "bg-white/5 border border-white/10",
        "hover:bg-white/10 hover:border-white/20",
        "hover:shadow-lg hover:shadow-blue-500/10",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "transition-all duration-300 group overflow-hidden",
        oauthLoading === "google" && "border-blue-500/30 bg-blue-500/5",
      )}
    >
      {/* Subtle hover shimmer */}
      <span className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {oauthLoading === "google" ? (
        <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      ) : (
        <GoogleIcon className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      <span className="text-neutral-300 group-hover:text-white transition-colors relative z-10">
        {oauthLoading === "google" ? "Connecting…" : "Google"}
      </span>
    </button>

    {/* GitHub */}
    <button
      type="button"
      onClick={() => onOAuth("github")}
      disabled={!!oauthLoading}
      className={cn(
        "relative flex-1 flex items-center justify-center gap-2",
        "h-9 rounded-lg text-[11px] font-semibold",
        "bg-white/5 border border-white/10",
        "hover:bg-white/10 hover:border-white/20",
        "hover:shadow-lg hover:shadow-purple-500/10",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "transition-all duration-300 group overflow-hidden",
        oauthLoading === "github" && "border-purple-500/30 bg-purple-500/5",
      )}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {oauthLoading === "github" ? (
        <div className="w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      ) : (
        <GitHubIcon className="w-3.5 h-3.5 text-neutral-300 group-hover:text-white transition-colors flex-shrink-0" />
      )}
      <span className="text-neutral-300 group-hover:text-white transition-colors relative z-10">
        {oauthLoading === "github" ? "Connecting…" : "GitHub"}
      </span>
    </button>
  </div>
);

// ─────────────────────────────────────────────
// Main login content
// ─────────────────────────────────────────────
const LoginContent = () => {
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [savedCredentials, setSavedCredentials] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // ── OAuth state ──────────────────────────────
  const [oauthLoading, setOauthLoading] = useState(null); // "google" | "github" | null

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/admin");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const loadCredentials = async () => {
      const creds = await window.electron?.getCredentials();
      if (creds) {
        setSavedCredentials(creds);
        setFormData({ email: creds.email, password: creds.password });
        setRememberMe(true);
      }
    };
    loadCredentials();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electron?.biometricAuth) {
      setBiometricAvailable(true);
    }
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please provide a valid email";
    return "";
  };
  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };
  const validateField = (name, value) => {
    switch (name) {
      case "email":
        return validateEmail(value);
      case "password":
        return validatePassword(value);
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name])
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    setFocusedField("");
  };
  const handleFocus = (fieldName) => setFocusedField(fieldName);

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return !Object.values(newErrors).some((e) => e !== "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError("Please fix the errors before submitting");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const normalizedData = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      };
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(normalizedData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }
      if (data.data.session) {
        await refreshSession();
        if (rememberMe)
          window.electron?.saveCredentials({
            email: normalizedData.email,
            password: normalizedData.password,
          });
        else window.electron?.clearCredentials();
        router.push("/admin");
      } else {
        setError("Authentication failed. No session received.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth handler ────────────────────────────────────────────────────────────
  const handleOAuth = async (provider) => {
    setOauthLoading(provider);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/auth/oauth/${provider}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || `Failed to initiate ${provider} login.`);
        return;
      }

      const data = await res.json();

      if (!data.url) {
        setError("OAuth URL not received. Please try again.");
        return;
      }

      // Redirect browser to provider (Google/GitHub)
      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setOauthLoading(null);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError("");
    try {
      const biometric = await window.electron?.biometricAuth();
      if (!biometric?.success) {
        setError(biometric?.reason || "Biometric verification failed.");
        return;
      }
      const filePath =
        "P:\\PROGRAMMING\\Programming Security Keys\\biometric_login.dat";
      const creds = await window.electron?.readBiometricCredentials({
        filePath,
      });
      if (!creds?.success) {
        setError(creds?.reason || "Could not read credentials file.");
        return;
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: creds.email, password: creds.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed.");
        return;
      }
      await refreshSession();
      router.push("/admin");
    } catch {
      setError("Network error.");
    } finally {
      setBiometricLoading(false);
    }
  };

  const vantaRef = useRef(null);
  useEffect(() => {
    let effect;
    const loadVanta = async () => {
      if (!window.VANTA) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js";
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }
      if (window.VANTA?.NET && vantaRef.current) {
        effect = window.VANTA.NET({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundColor: 0x0,
          points: 20.0,
          maxDistance: 10.0,
          spacing: 20.0,
        });
      }
    };
    loadVanta();
    return () => {
      if (effect) effect.destroy();
    };
  }, []);

  return (
    <>
      <div ref={vantaRef} className="fixed inset-0 -z-10 pointer-events-none" />

      {/* ── Window chrome ── */}
      <div
        className="fixed top-0 left-0 right-28 h-8 z-40"
        style={{ WebkitAppRegion: "drag" }}
      />
      <div
        className="fixed top-0 right-0 z-50 flex items-center gap-0.5 p-1"
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <button
          onClick={() => window.electron?.minimizeWindow()}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 hover:bg-white/10"
        >
          <Minus className="w-3 h-3 text-white/50 hover:text-white transition-colors" />
        </button>
        <button
          onClick={() => window.electron?.maximizeWindow()}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 hover:bg-white/10"
        >
          <Maximize2 className="w-3 h-3 text-white/50 hover:text-white transition-colors" />
        </button>
        <button
          onClick={() => window.electron?.closeWindow()}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90 hover:bg-red-500/20"
        >
          <X className="w-3 h-3 text-white/50 hover:text-red-400 transition-colors" />
        </button>
      </div>

      {/* ── Back button ── */}
      <Link
        href="/"
        className="fixed top-1.5 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-lg transition-all duration-300 hover:scale-105 group text-xs"
      >
        <IconArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
        Home
      </Link>

      {/* ── Viewport-locked layout ── */}
      <div className="fixed inset-0 flex items-center justify-center px-4 pt-8 pb-2 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-float animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl animate-float animation-delay-4000" />
        </div>

        <div className="relative z-10 w-full max-w-sm flex flex-col gap-2.5">
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 backdrop-blur-sm flex-shrink-0">
              <IconShield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                Admin Portal
              </h1>
              <p className="text-neutral-500 text-[11px]">
                Secure access to your dashboard
              </p>
            </div>
          </div>

          {/* ── Card ── */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-5 py-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 pointer-events-none" />

            {/* Saved credentials pill */}
            {savedCredentials && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <IconCheck className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <p className="text-[11px] text-cyan-400">
                  Saved credentials loaded
                </p>
              </div>
            )}

            {/* ── Email ── */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
                <IconUser className="w-3.5 h-3.5 text-cyan-400" />
                Email
              </label>
              <div className="relative">
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus("email")}
                  onBlur={handleBlur}
                  required
                  autoComplete="email"
                  className={cn(
                    "bg-white/5 border text-white h-9 text-sm rounded-lg transition-all duration-300",
                    "focus:bg-white/10 focus:ring-1 placeholder:text-neutral-600",
                    errors.email && touched.email
                      ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                      : "border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20",
                  )}
                  placeholder="Enter your email"
                />
                {errors.email && touched.email && (
                  <IconX className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400" />
                )}
                {!errors.email && touched.email && formData.email && (
                  <IconCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-400" />
                )}
              </div>
              {errors.email && touched.email && (
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <IconAlertCircle className="w-2.5 h-2.5" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* ── Password ── */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
                <IconLock className="w-3.5 h-3.5 text-cyan-400" />
                Password
              </label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus("password")}
                  onBlur={handleBlur}
                  required
                  autoComplete="current-password"
                  className={cn(
                    "bg-white/5 border text-white h-9 text-sm rounded-lg pr-9 transition-all duration-300",
                    "focus:bg-white/10 focus:ring-1 placeholder:text-neutral-600",
                    errors.password && touched.password
                      ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                      : "border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20",
                  )}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-cyan-400 transition-colors z-10"
                >
                  {showPassword ? (
                    <IconEyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <IconEye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between min-h-[14px]">
                {errors.password && touched.password ? (
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <IconAlertCircle className="w-2.5 h-2.5" />
                    {errors.password}
                  </p>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => router.push("/login/reset")}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium transition-colors ml-auto relative group"
                >
                  Forgot Password?
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300" />
                </button>
              </div>
            </div>

            {/* ── Error banner ── */}
            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg animate-shake">
                <IconAlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* ── Remember me ── */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 accent-cyan-500"
              />
              <label htmlFor="rememberMe" className="text-xs text-neutral-400">
                Remember me
              </label>
            </div>

            {/* ── Sign in button ── */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !!oauthLoading}
              className={cn(
                "w-full h-10 rounded-lg font-semibold text-sm text-white relative overflow-hidden group transition-all duration-300",
                "bg-gradient-to-r from-cyan-600 to-indigo-600",
                "hover:from-cyan-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-cyan-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transform hover:scale-[1.02] active:scale-[0.98]",
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <IconShield className="w-4 h-4" />
                    Sign in securely
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>

            {/* ── OAuth divider + buttons ── */}
            <OAuthDivider />
            <OAuthButtons onOAuth={handleOAuth} oauthLoading={oauthLoading} />

            {/* ── Bottom row: register link ←——→ biometric box ── */}
            <div className="flex items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold transition-colors relative group whitespace-nowrap"
              >
                No account?{" "}
                <span className="underline underline-offset-2">Register</span>
              </button>

              <div className="flex-1 h-px bg-white/10" />

              {biometricAvailable && (
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading || !!oauthLoading}
                  aria-label="Sign in with biometrics"
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1",
                    "w-[72px] h-[60px] rounded-xl flex-shrink-0",
                    "bg-gradient-to-br from-teal-950/80 to-cyan-950/80",
                    "border border-teal-500/25 hover:border-teal-400/60",
                    "hover:shadow-lg hover:shadow-teal-500/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transform hover:scale-105 active:scale-95",
                    "transition-all duration-300 backdrop-blur-sm",
                    biometricLoading &&
                      "border-teal-400/50 shadow-lg shadow-teal-500/25",
                  )}
                >
                  {biometricLoading && (
                    <span className="absolute inset-0 rounded-xl border border-teal-400/40 animate-pulse-ring" />
                  )}
                  <FingerprintIcon scanning={biometricLoading} />
                  <span className="text-[9px] font-medium text-teal-300/70 tracking-wide leading-none">
                    {biometricLoading ? "Verifying…" : "Biometric"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ── Micro footer ── */}
          <p className="text-center text-[10px] text-neutral-700 tracking-wide">
            🔒 Enterprise-grade encryption · © 2026 Admin Panel
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-30px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(15px);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-4px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(4px);
          }
        }
        @keyframes drawRidge {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes pulseDot {
          0%,
          100% {
            r: 2.2;
            opacity: 1;
          }
          50% {
            r: 3.5;
            opacity: 0.6;
          }
        }
        @keyframes scanLine {
          0% {
            transform: translateY(-18px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(18px);
            opacity: 0;
          }
        }
        @keyframes pingSlow {
          0% {
            transform: scale(0.95);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        @keyframes pulseRing {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.06);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
        .animation-delay-4000 {
          animation-delay: 4000ms;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-ping-slow {
          animation: pingSlow 1.4s ease-out infinite;
        }
        .animate-pulse-ring {
          animation: pulseRing 1.2s ease-out infinite;
        }
      `}</style>
    </>
  );
};

function LoginPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-neutral-400 text-sm font-medium">
              Loading secure portal...
            </p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

export default LoginPageWrapper;
