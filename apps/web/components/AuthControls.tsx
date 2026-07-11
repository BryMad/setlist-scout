"use client";

import { useEffect, useState } from "react";

/**
 * Spotify login state (v1 parity). Status comes from /api/me because the
 * session cookie is HttpOnly.
 *
 * Two shapes: "bar" (desktop header — green pill / small text button) and
 * "menu" (mobile dropdown — uniform full-width rows like any other menu item).
 */
export default function AuthControls({ variant = "bar" }: { variant?: "bar" | "menu" }) {
  const [status, setStatus] = useState<"unknown" | "out" | "in">("unknown");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => res.json())
      .then((data: { loggedIn?: boolean }) => {
        if (!cancelled) setStatus(data.loggedIn ? "in" : "out");
      })
      .catch(() => {
        if (!cancelled) setStatus("out");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "unknown") return null;

  const login = () => {
    const back = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    window.location.href = `/auth/login?return=${back}`;
  };

  const logout = async () => {
    await fetch("/auth/logout", { method: "POST" }).catch(() => {});
    setStatus("out");
  };

  if (variant === "menu") {
    return status === "out" ? (
      <button
        onClick={login}
        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-[#1DB954] transition hover:bg-zinc-800"
      >
        Log in
      </button>
    ) : (
      <button
        onClick={logout}
        className="block w-full px-4 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-zinc-800"
      >
        Log out
      </button>
    );
  }

  return status === "out" ? (
    <button
      onClick={login}
      className="shrink-0 rounded-full bg-[#1DB954] px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
    >
      Log in
    </button>
  ) : (
    <button
      onClick={logout}
      className="shrink-0 text-xs text-zinc-400 transition hover:text-zinc-100"
    >
      Log out
    </button>
  );
}
