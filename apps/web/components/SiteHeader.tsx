"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ArtistSearch from "./ArtistSearch";
import AuthControls from "./AuthControls";
import Wordmark from "./Wordmark";

/** Always-available top bar: logo home link, artist search, About, login state. */
export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-6">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <div className="flex flex-1 justify-end">
          {!isHome && <ArtistSearch variant="header" />}
        </div>
        <nav className="flex shrink-0 items-center gap-4">
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
      </div>
    </header>
  );
}
