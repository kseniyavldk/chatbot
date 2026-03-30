"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  mode: "login" | "register";
  onClose: () => void;
  onSwitch: (mode: "login" | "register") => void;
}

export function AuthModal({ mode, onClose, onSwitch }: Props) {
  const { login, register, loginPending, registerPending } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isPending = loginPending || registerPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") await login({ email, password });
      else await register({ email, password });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <p className="subtitle">
          {mode === "login"
            ? "Log in to access your chats"
            : "Sign up for unlimited messages"}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending
              ? "Please wait…"
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>
        <div className="modal-switch">
          {mode === "login" ? (
            <>
              'Don't have an account?{" "}
              <a onClick={() => onSwitch("register")}>Sign up</a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a onClick={() => onSwitch("login")}>Log in</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
