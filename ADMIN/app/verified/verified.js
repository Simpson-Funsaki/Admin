"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";

function PasswordResetModal({ token, onSuccess, onError }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState("");

  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  const strength = getStrength(password);

  const handleSubmit = async () => {
    setValidationError("");
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        onError(err.message || "Password reset failed.");
        return;
      }

      onSuccess();
    } catch (e) {
      onError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div style={styles.lockIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={styles.modalTitle}>Set New Password</h2>
          <p style={styles.modalSubtitle}>
            Choose a strong password to secure your account.
          </p>
        </div>

        {/* Fields */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>New Password</label>
          <div style={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
            <button
              onClick={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
              type="button"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={styles.strengthTrack}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.strengthSegment,
                      background: i <= strength ? strengthColors[strength] : "#e5e7eb",
                      transition: "background 0.3s ease",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, color: strengthColors[strength], fontWeight: 600 }}>
                {strengthLabels[strength]}
              </span>
            </div>
          )}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Confirm Password</label>
          <div style={styles.inputWrapper}>
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              style={{
                ...styles.input,
                borderColor:
                  confirmPassword.length > 0 && confirmPassword !== password
                    ? "#ef4444"
                    : "#e5e7eb",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) =>
                (e.target.style.borderColor =
                  confirmPassword !== password && confirmPassword.length > 0
                    ? "#ef4444"
                    : "#e5e7eb")
              }
            />
            <button
              onClick={() => setShowConfirm((v) => !v)}
              style={styles.eyeBtn}
              type="button"
            >
              {showConfirm ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <p style={styles.fieldError}>Passwords do not match</p>
          )}
        </div>

        {validationError && (
          <div style={styles.errorBox}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {validationError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...styles.submitBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={styles.btnSpinner} /> Resetting...
            </span>
          ) : (
            "Reset Password"
          )}
        </button>
      </div>
    </div>
  );
}

function VerifiedContent() {
  const router = useRouter();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState(null);

  useEffect(() => {
const handleAuthCallback = async () => {
  try {
    const hashParams = new URLSearchParams(
      window.location.hash.substring(1)
    );

    const type = hashParams.get("type");
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token"); // ← read this

    if (!access_token) {
      setStatus("error");
      setMessage("Missing authentication token");
      return;
    }

    // ── RECOVERY ──
    if (type === "recovery") {
      setRecoveryToken(access_token);
      setStatus("recovery");
      setShowPasswordModal(true);
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    // ── Send both tokens to backend ──
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_API_URL}/auth/verify-callback`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token, refresh_token, type }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      setStatus("error");
      setMessage(errorData.message || "Authentication failed");
      return;
    }

    setStatus("success");
    setMessage(
      type === "signup"
        ? "Email verified successfully!"
        : "Authentication successful!"
    );

    window.history.replaceState(null, "", window.location.pathname);

    // ── OAuth: go to /admin. Signup email: go to /login ──
    const destination = type === "signup" ? "/login" : "/admin";
    setTimeout(() => router.push(destination), 2000);

  } catch (err) {
    setStatus("error");
    setMessage("An unexpected error occurred. Please try again.");
  }
};

    handleAuthCallback();
  }, [router]);

  const handlePasswordResetSuccess = () => {
    setShowPasswordModal(false);
    setStatus("success");
    setMessage("Password reset successfully!");
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  const handlePasswordResetError = (errMsg) => {
    setShowPasswordModal(false);
    setStatus("error");
    setMessage(errMsg);
  };

  return (
    <>
      {showPasswordModal && (
        <PasswordResetModal
          token={recoveryToken}
          onSuccess={handlePasswordResetSuccess}
          onError={handlePasswordResetError}
        />
      )}

      <div className="verified-container">
        <div className="verified-card">
          {(status === "verifying" || status === "recovery") && (
            <>
              <div className="spinner"></div>
              <h1>
                {status === "recovery"
                  ? "Almost there..."
                  : "Verifying your account..."}
              </h1>
              <p>
                {status === "recovery"
                  ? "Please set your new password in the popup."
                  : "Please wait while we confirm your email address."}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h1>Success!</h1>
              <p>{message}</p>
              <p className="redirect-text">Redirecting you to login...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <h1>Verification Failed</h1>
              <p>{message}</p>
              <button
                onClick={() => router.push("/login")}
                className="retry-button"
              >
                Go to Login
              </button>
            </>
          )}
        </div>

        <style jsx>{`
          .verified-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
              sans-serif;
          }
          .verified-card {
            background: white;
            border-radius: 16px;
            padding: 48px 40px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .spinner {
            margin: 0 auto 24px;
            width: 48px;
            height: 48px;
            border: 4px solid #f3f4f6;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .success-icon, .error-icon {
            margin: 0 auto 24px;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: scaleIn 0.5s ease-out;
          }
          .success-icon { background: #d1fae5; color: #059669; }
          .error-icon   { background: #fee2e2; color: #dc2626; }
          .success-icon svg, .error-icon svg { width: 36px; height: 36px; }
          @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
          h1 { margin: 0 0 12px; font-size: 28px; font-weight: 700; color: #111827; }
          p  { margin: 0 0 16px; font-size: 16px; color: #6b7280; line-height: 1.6; }
          .redirect-text { font-size: 14px; color: #9ca3af; margin-top: 24px; }
          .retry-button {
            margin-top: 24px;
            padding: 12px 32px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .retry-button:hover {
            background: #5568d3;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          @media (max-width: 640px) {
            .verified-card { padding: 32px 24px; }
            h1 { font-size: 24px; }
            p  { font-size: 15px; }
          }
        `}</style>
      </div>
    </>
  );
}

export default function VerifiedPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "48px 40px", textAlign: "center" }}>
            <div style={{ margin: "0 auto 24px", width: "48px", height: "48px", border: "4px solid #f3f4f6", borderTopColor: "#667eea", borderRadius: "50%" }} />
            <h1>Loading...</h1>
          </div>
        </div>
      }
    >
      <VerifiedContent />
    </Suspense>
  );
}

// ─── Modal styles (plain JS object, no JSX scope needed) ───────────────────
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    animation: "fadeIn 0.2s ease-out",
  },
  modal: {
    background: "white",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
    animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
  },
  modalHeader: {
    textAlign: "center",
    marginBottom: 28,
  },
  lockIcon: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  modalTitle: {
    margin: "0 0 8px",
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
  },
  modalSubtitle: {
    margin: 0,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    width: "100%",
    padding: "11px 44px 11px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 15,
    color: "#111827",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    background: "#fafafa",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  strengthTrack: {
    display: "flex",
    gap: 4,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  fieldError: {
    margin: "6px 0 0",
    fontSize: 12,
    color: "#ef4444",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#dc2626",
    marginBottom: 20,
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s",
    letterSpacing: "0.02em",
  },
  btnSpinner: {
    display: "inline-block",
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};