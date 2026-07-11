"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ArtistSearch from "./ArtistSearch";
import AuthControls from "./AuthControls";
import Wordmark from "./Wordmark";

/** Always-available top bar: logo home link, artist search, About, login state.
 *  On mobile the search stays primary and About + auth collapse behind a
 *  hamburger that opens an anchored dropdown card (not a full-width panel —
 *  a two-item menu wants a compact popover under its trigger). */
export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // navigating away always closes the menu
  useEffect(() => setMenuOpen(false), [pathname]);

  // click-outside and Escape close it, standard popover behavior
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <div className="flex flex-1 justify-end">
          {!isHome && <ArtistSearch variant="header" />}
        </div>

        <nav className="hidden shrink-0 items-center gap-4 sm:flex">
          <Link
            href="/about"
            className={`text-xs transition hover:text-zinc-100 ${
              pathname === "/about" ? "text-zinc-100" : "text-zinc-400"
            }`}
          >
            About
          </Link>
          <AuthControls />
        </nav>

        <div ref={menuRef} className="relative shrink-0 sm:hidden">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="rounded-md p-1.5 text-zinc-400 transition hover:text-zinc-100"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <>
                  <path d="M3.5 3.5l11 11" />
                  <path d="M14.5 3.5l-11 11" />
                </>
              ) : (
                <>
                  <path d="M2.5 4.75h13" />
                  <path d="M2.5 9h13" />
                  <path d="M2.5 13.25h13" />
                </>
              )}
            </svg>
          </button>

          {/* anchored dropdown card — same surface tokens as the search dropdown */}
          {menuOpen && (
            <nav className="absolute right-0 top-full z-50 mt-2 w-max min-w-24 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1.5 shadow-2xl">
              <Link
                href="/about"
                className={`block px-4 py-2.5 text-sm transition hover:bg-zinc-800 ${
                  pathname === "/about" ? "text-zinc-100" : "text-zinc-300"
                }`}
              >
                About
              </Link>
              <AuthControls variant="menu" />
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
