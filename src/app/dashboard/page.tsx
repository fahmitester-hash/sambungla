"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Tone = "corporate-en" | "humble-local" | "manglish";

interface ToneOption {
  value: Tone;
  label: string;
  accent: string;
  helper: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    value: "corporate-en",
    label: "Corporate English",
    accent: "#C69C4B",
    helper: "Clean, elite, KLCC-standard",
  },
  {
    value: "humble-local",
    label: "Humble Local",
    accent: "#2F6F62",
    helper: "Polished, ecosystem-minded",
  },
  {
    value: "manglish",
    label: "Conversational Manglish",
    accent: "#C1553D",
    helper: "Authentic startup-scene tone",
  },
];

type GenerationState = "idle" | "streaming" | "done" | "error";

function DashboardPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [rawPrompt, setRawPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("corporate-en");

  const [outputText, setOutputText] = useState("");
  const [postId, setPostId] = useState<string | null>(null);
  const [genState, setGenState] = useState<GenerationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedToSwipe, setSavedToSwipe] = useState(false);

  useEffect(() => {
    const seed = searchParams.get("seed");
    if (seed) {
      setRawPrompt(seed);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [copyLabel, setCopyLabel] = useState("Copy text");

  const [scheduledFor, setScheduledFor] = useState("");
  const [queueState, setQueueState] = useState<"idle" | "sending" | "queued" | "error">("idle");

  const abortRef = useRef<AbortController | null>(null);

  const activeTone = TONE_OPTIONS.find((t) => t.value === tone)!;

  async function handleGenerate() {
    if (!rawPrompt.trim() || genState === "streaming") return;

    setGenState("streaming");
    setErrorMessage(null);
    setOutputText("");
    setPostId(null);
    setIsEditing(false);
    setQueueState("idle");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawPrompt, tone }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errJson = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(errJson?.error ?? "Something went wrong generating your post.");
        setGenState("error");
        return;
      }

      const returnedPostId = response.headers.get("X-Post-Id");
      setPostId(returnedPostId);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutputText(accumulated);
      }

      setGenState("done");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMessage("Connection lost while generating. Please try again.");
        setGenState("error");
      }
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setGenState("done");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(outputText);
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy text"), 1800);
  }

  async function handleSaveToSwipe() {
    if (!outputText) return;
    await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: outputText, source: "own_post" }),
    });
    setSavedToSwipe(true);
    setTimeout(() => setSavedToSwipe(false), 1800);
  }

  function startEditing() {
    setEditableText(outputText);
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!postId) {
      setOutputText(editableText);
      setIsEditing(false);
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedContent: editableText }),
      });

      if (response.ok) {
        setOutputText(editableText);
        setIsEditing(false);
      } else {
        const errJson = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(errJson?.error ?? "Couldn't save your edits. Please try again.");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleSendToQueue() {
    if (!postId || !scheduledFor) return;

    setQueueState("sending");
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          scheduledFor: new Date(scheduledFor).toISOString(),
        }),
      });

      setQueueState(response.ok ? "queued" : "error");
    } catch {
      setQueueState("error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-2xl">New post</h1>
      <p className="mt-1 text-sm text-[#16241F]/60">
        Drop in a raw idea, pick a tone, and let it generate.
      </p>

      <div className="mt-8">
        <label htmlFor="rawPrompt" className="text-sm font-medium">
          What's the post about?
        </label>
        <textarea
          id="rawPrompt"
          value={rawPrompt}
          onChange={(e) => setRawPrompt(e.target.value)}
          rows={4}
          placeholder="e.g. We just closed our Series A led by a Klang Valley VC..."
          className="mt-2 w-full resize-none border border-[#D8DDD4] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#16241F]/40 focus:border-[#16241F]"
        />
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium">Tone</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TONE_OPTIONS.map((option) => {
            const active = option.value === tone;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTone(option.value)}
                className="border bg-white px-4 py-3 text-left transition-colors"
                style={{
                  borderColor: active ? option.accent : "#D8DDD4",
                  borderLeftWidth: active ? "3px" : "1px",
                }}
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs text-[#16241F]/55">
                  {option.helper}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!rawPrompt.trim() || genState === "streaming"}
          className="bg-[#16241F] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {genState === "streaming" ? "Generating…" : "Generate post"}
        </button>
        {genState === "streaming" && (
          <button
            type="button"
            onClick={handleStop}
            className="text-sm text-[#16241F]/60 underline underline-offset-4"
          >
            Stop
          </button>
        )}
      </div>

      {errorMessage && (
        <p className="mt-4 border-l-2 border-[#C1553D] bg-white px-4 py-2 text-sm text-[#C1553D]">
          {errorMessage}
        </p>
      )}

      {(outputText || genState === "streaming") && (
        <div className="mt-8">
          <div
            className="border bg-white p-6"
            style={{ borderLeftWidth: "3px", borderColor: activeTone.accent, borderTopColor: "#D8DDD4", borderRightColor: "#D8DDD4", borderBottomColor: "#D8DDD4" }}
          >
            {isEditing ? (
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                rows={10}
                className="w-full resize-none border-none p-0 font-serif text-base leading-relaxed outline-none"
              />
            ) : (
              <p className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                {outputText}
                {genState === "streaming" && (
                  <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#16241F] align-middle" />
                )}
              </p>
            )}
          </div>

          {genState !== "streaming" && outputText && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {isEditing ? (
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="border border-[#16241F] px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                  {savingEdit ? "Saving…" : "Save changes"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  className="border border-[#D8DDD4] px-4 py-2 text-sm"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="border border-[#D8DDD4] px-4 py-2 text-sm"
              >
                {copyLabel}
              </button>
              <button
                type="button"
                onClick={handleSaveToSwipe}
                className="border border-[#D8DDD4] px-4 py-2 text-sm"
              >
                {savedToSwipe ? "Saved" : "Save to swipe file"}
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="border border-[#D8DDD4] bg-white px-3 py-2 text-sm outline-none focus:border-[#16241F]"
                />
                <button
                  type="button"
                  onClick={handleSendToQueue}
                  disabled={!scheduledFor || !postId || queueState === "sending"}
                  className="bg-[#2F6F62] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  {queueState === "sending" ? "Sending…" : "Send to queue"}
                </button>
              </div>
            </div>
          )}

          {queueState === "queued" && (
            <p className="mt-3 text-sm text-[#2F6F62]">
              Scheduled. Your post will auto-publish to LinkedIn at the chosen time.
            </p>
          )}
          {queueState === "error" && (
            <p className="mt-3 text-sm text-[#C1553D]">
              Couldn't schedule this post. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-[#16241F]/60">Loading…</p>}
    >
      <DashboardPageInner />
    </Suspense>
  );
}
