"use client";

import { useEffect, useState } from "react";

/**
 * Header login state (v1 parity): "Log in with Spotify" when signed out,
 * a connected marker + log out when signed in. Status comes from /api/me
 * because the session cookie is HttpOnly.
 */
export default function AuthControls() {
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

  if (status === "out") {
    return (
      <button
        onClick={() => {
          const back = encodeURIComponent(
            window.location.pathname + window.location.search
          );
          window.location.href = `/auth/login?return=${back}`;
        }}
        className="shrink-0 rounded-full bg-[#1DB954] px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
      >
        Log in
      </button>
    );
  }

  return (
    <button
      onClick={async () => {
        await fetch("/auth/logout", { method: "POST" }).catch(() => {});
        setStatus("out");
      }}
      className="shrink-0 text-xs text-zinc-400 transition hover:text-zinc-100"
    >
      Log out
    </button>
  );
}
