"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <Button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%",
              marginTop: "8px",
              background: "var(--accent)",
              color: "#fff",
            }}
          >
            {isPending
              ? "Please wait…"
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </Button>
        </form>

        <div className="modal-switch">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
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
