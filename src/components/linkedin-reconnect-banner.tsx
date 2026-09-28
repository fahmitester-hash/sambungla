"use client";

import { useEffect, useState } from "react";

interface StatusResponse {
  connected: boolean;
  expiresAt: number | null;
  needsReconnect: boolean;
}

export default function LinkedInReconnectBanner() {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch("/api/linkedin/status");
        if (!response.ok) return;
        const data: StatusResponse = await response.json();
        if (!cancelled) setStatus(data);
      } catch {
        // Silent — banner just won't show if the check itself fails.
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || !status.needsReconnect) return null;

  const message = status.connected
    ? "Your LinkedIn connection expires soon. Reconnect to keep auto-publishing your scheduled posts."
    : "Your LinkedIn connection has expired. Reconnect to resume auto-publishing.";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-2 border-[#C1553D] bg-white px-4 py-3">
      <p className="text-sm text-[#16241F]">{message}</p>
      <a
        href="/api/auth/signin/linkedin?callbackUrl=/dashboard"
        className="whitespace-nowrap bg-[#16241F] px-4 py-2 text-sm font-medium text-white"
      >
        Reconnect LinkedIn
      </a>
    </div>
  );
}
