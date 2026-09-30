"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATE_LIBRARY, type TemplateEntry } from "@/lib/templates";

interface SwipeEntry {
  id: string;
  content: string;
  note: string | null;
  source: string;
  createdAt: string;
}

type Tab = "templates" | "swipe";

export default function InspirationPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("templates");

  const [swipeEntries, setSwipeEntries] = useState<SwipeEntry[]>([]);
  const [loadingSwipe, setLoadingSwipe] = useState(true);
  const [newSwipeText, setNewSwipeText] = useState("");
  const [newSwipeNote, setNewSwipeNote] = useState("");
  const [savingSwipe, setSavingSwipe] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadSwipeFile();
  }, []);

  async function loadSwipeFile() {
    setLoadingSwipe(true);
    try {
      const response = await fetch("/api/swipe");
      if (response.ok) {
        const data = (await response.json()) as { entries?: SwipeEntry[] };
        setSwipeEntries(data.entries ?? []);
      }
    } finally {
      setLoadingSwipe(false);
    }
  }

  function useAsSeed(text: string) {
    router.push(`/dashboard?seed=${encodeURIComponent(text)}`);
  }

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function addSwipeEntry() {
    if (newSwipeText.trim().length < 10) return;
    setSavingSwipe(true);
    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newSwipeText.trim(),
          note: newSwipeNote.trim(),
        }),
      });
      if (response.ok) {
        setNewSwipeText("");
        setNewSwipeNote("");
        loadSwipeFile();
      }
    } finally {
      setSavingSwipe(false);
    }
  }

  async function deleteSwipeEntry(id: string) {
    await fetch(`/api/swipe/${id}`, { method: "DELETE" });
    setSwipeEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const hooks = TEMPLATE_LIBRARY.filter((t) => t.type === "hook");
  const templates = TEMPLATE_LIBRARY.filter((t) => t.type === "template");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-2xl">Inspiration</h1>
      <p className="mt-1 text-sm text-[#16241F]/60">
        Start from a proven structure, or your own saved posts.
      </p>

      <div className="mt-6 flex gap-1 border-b border-[#D8DDD4]">
        <button
          type="button"
          onClick={() => setTab("templates")}
          className={`px-4 py-2 text-sm ${
            tab === "templates"
              ? "border-b-2 border-[#16241F] font-medium"
              : "text-[#16241F]/55"
          }`}
        >
          Hooks and templates
        </button>
        <button
          type="button"
          onClick={() => setTab("swipe")}
          className={`px-4 py-2 text-sm ${
            tab === "swipe"
              ? "border-b-2 border-[#16241F] font-medium"
              : "text-[#16241F]/55"
          }`}
        >
          My swipe file
        </button>
      </div>

      {tab === "templates" && (
        <div className="mt-6 flex flex-col gap-8">
          <TemplateSection
            title="Hooks"
            description="Opening angles to seed a new post."
            entries={hooks}
            onUse={useAsSeed}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
          <TemplateSection
            title="Templates"
            description="Full structural patterns for a post."
            entries={templates}
            onUse={useAsSeed}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        </div>
      )}

      {tab === "swipe" && (
        <div className="mt-6">
          <div className="border border-[#D8DDD4] bg-white p-4">
            <p className="text-sm font-medium">Save something for later</p>
            <p className="mt-1 text-xs text-[#16241F]/55">
              Paste a post you found inspiring — yours or someone else's. This
              saves the structure for reference; it won't be blended into
              your writing style memory.
            </p>
            <textarea
              value={newSwipeText}
              onChange={(e) => setNewSwipeText(e.target.value)}
              rows={3}
              placeholder="Paste the post text here"
              className="mt-3 w-full resize-none border border-[#D8DDD4] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#16241F]/40 focus:border-[#16241F]"
            />
            <input
              type="text"
              value={newSwipeNote}
              onChange={(e) => setNewSwipeNote(e.target.value)}
              placeholder="Optional note — why this one worked"
              className="mt-2 w-full border border-[#D8DDD4] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#16241F]/40 focus:border-[#16241F]"
            />
            <button
              type="button"
              onClick={addSwipeEntry}
              disabled={savingSwipe || newSwipeText.trim().length < 10}
              className="mt-3 bg-[#16241F] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {savingSwipe ? "Saving…" : "Save to swipe file"}
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {loadingSwipe && (
              <p className="text-sm text-[#16241F]/55">Loading…</p>
            )}
            {!loadingSwipe && swipeEntries.length === 0 && (
              <p className="text-sm text-[#16241F]/55">
                Nothing saved yet. Add a post above to get started.
              </p>
            )}
            {swipeEntries.map((entry) => (
              <div
                key={entry.id}
                className="border border-[#D8DDD4] bg-white p-4"
              >
                {entry.note && (
                  <p className="mb-2 text-xs font-medium text-[#2F6F62]">
                    {entry.note}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm text-[#16241F]/85">
                  {entry.content}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => useAsSeed(entry.content)}
                    className="bg-[#2F6F62] px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Use as seed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(entry.id, entry.content)}
                    className="border border-[#D8DDD4] bg-white px-3 py-1.5 text-xs"
                  >
                    {copiedId === entry.id ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSwipeEntry(entry.id)}
                    className="px-3 py-1.5 text-xs text-[#C1553D]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateSection({
  title,
  description,
  entries,
  onUse,
  onCopy,
  copiedId,
}: {
  title: string;
  description: string;
  entries: TemplateEntry[];
  onUse: (text: string) => void;
  onCopy: (id: string, text: string) => void;
  copiedId: string | null;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-[#16241F]/55">{description}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.id} className="border border-[#D8DDD4] bg-white p-4">
            <p className="text-sm font-medium">{entry.label}</p>
            <p className="mt-2 text-xs text-[#16241F]/60">{entry.seedText}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onUse(entry.seedText)}
                className="bg-[#2F6F62] px-3 py-1.5 text-xs font-medium text-white"
              >
                Use this
              </button>
              <button
                type="button"
                onClick={() => onCopy(entry.id, entry.seedText)}
                className="border border-[#D8DDD4] bg-white px-3 py-1.5 text-xs"
              >
                {copiedId === entry.id ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
