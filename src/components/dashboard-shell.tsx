"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import LinkedInReconnectBanner from "@/components/linkedin-reconnect-banner";

interface DashboardShellProps {
  userName: string | null;
  userEmail: string | null;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inspiration", href: "/dashboard/inspiration" },
  { label: "Content queue", href: "/dashboard/queue" },
  { label: "Profile settings", href: "/dashboard/profile" },
];

export default function DashboardShell({
  userName,
  userEmail,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#EEF1EC] text-[#16241F]">
      <div className="flex items-center justify-between border-b border-[#D8DDD4] px-4 py-3 md:hidden">
        <span className="font-serif text-lg">Sambungla</span>
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center border border-[#D8DDD4] text-[#16241F]"
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex">
        <aside className="hidden md:flex md:w-60 md:flex-col md:justify-between md:border-r md:border-[#D8DDD4] md:px-5 md:py-8 md:min-h-screen">
          <div>
            <span className="font-serif text-xl">Sambungla</span>
            <nav className="mt-10 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 text-sm transition-colors ${
                      active
                        ? "border-l-2 border-[#C69C4B] bg-white/60 pl-[10px] font-medium"
                        : "border-l-2 border-transparent pl-[10px] text-[#16241F]/70 hover:bg-white/40"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-[#D8DDD4] pt-4">
            <p className="text-sm font-medium">{userName ?? "Your account"}</p>
            <p className="mt-0.5 truncate text-xs text-[#16241F]/60">{userEmail}</p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-3 text-sm text-[#16241F]/70 underline decoration-[#D8DDD4] underline-offset-4 hover:text-[#16241F]"
            >
              Sign out
            </button>
          </div>
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Close menu overlay"
              className="absolute inset-0 bg-[#16241F]/40"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-[#EEF1EC] px-5 py-8">
              <span className="font-serif text-xl">Sambungla</span>
              <nav className="mt-10 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`px-3 py-2 text-sm ${
                        active
                          ? "border-l-2 border-[#C69C4B] bg-white/60 pl-[10px] font-medium"
                          : "border-l-2 border-transparent pl-[10px] text-[#16241F]/70"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-8 border-t border-[#D8DDD4] pt-4">
                <p className="text-sm font-medium">{userName ?? "Your account"}</p>
                <p className="mt-0.5 truncate text-xs text-[#16241F]/60">{userEmail}</p>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="mt-3 text-sm text-[#16241F]/70 underline decoration-[#D8DDD4] underline-offset-4"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
          <LinkedInReconnectBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
