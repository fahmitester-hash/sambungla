"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 px-4 transition-colors duration-300 ${
        scrolled
          ? "border-b border-ink/10 bg-paper/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
          Sambungla
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-medium text-ink/70 md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-ink">
            How it works
          </a>
          <a href="#pricing" className="transition-colors hover:text-ink">
            Pricing
          </a>
          <Link href="/login" className="transition-colors hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-ink px-4 py-1.5 text-white transition-opacity hover:opacity-80"
          >
            Get started
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 border-t border-ink/10 bg-paper px-1 py-5 text-sm text-ink/80 md:hidden">
          <a href="#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </a>
          <a href="#pricing" onClick={() => setOpen(false)}>
            Pricing
          </a>
          <Link href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-full bg-ink px-4 py-2 text-center font-medium text-white"
          >
            Get started
          </Link>
        </nav>
      )}
    </header>
  );
}
