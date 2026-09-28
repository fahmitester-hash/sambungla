"use client";

import { useEffect, useState } from "react";

interface ProfileData {
  industry: string;
  targetAudience: string;
}

const EMPTY_PROFILE: ProfileData = {
  industry: "",
  targetAudience: "",
};

interface StyleData {
  styleProfile: string | null;
  sampleCount: number;
  recentSamples: { id: string; source: string; preview: string }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [styleData, setStyleData] = useState<StyleData | null>(null);
  const [draftSamples, setDraftSamples] = useState<string[]>([]);
  const [currentDraft, setCurrentDraft] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function loadStyle() {
      try {
        const response = await fetch("/api/style/samples");
        if (response.ok) setStyleData(await response.json());
      } catch {
        // Non-critical — the rest of the profile page still works.
      }
    }
    loadStyle();
  }, []);

  function addDraftSample() {
    const trimmed = currentDraft.trim();
    if (trimmed.length < 50) return;
    setDraftSamples((prev) => [...prev, trimmed]);
    setCurrentDraft("");
  }

  function removeDraftSample(index: number) {
    setDraftSamples((prev) => prev.filter((_, i) => i !== index));
  }

  async function analyzeStyle() {
    if (draftSamples.length === 0) return;
    setAnalyzing(true);
    try {
      const response = await fetch("/api/style/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples: draftSamples }),
      });
      if (response.ok) {
        setDraftSamples([]);
        const refreshed = await fetch("/api/style/samples");
        if (refreshed.ok) setStyleData(await refreshed.json());
      }
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) throw new Error("Failed to load profile");
        const data = await response.json();
        if (!cancelled) {
          setProfile({
            industry: data.industry ?? "",
            targetAudience: data.targetAudience ?? "",
          });
        }
      } catch {
        if (!cancelled) setLoadError("Couldn't load your profile. Please refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
  }

  async function handleSave() {
    setSaving(true);
    setSaveState("idle");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setSaveState(response.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#16241F]/60">Loading your profile…</p>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-2xl">Profile settings</h1>
      <p className="mt-1 text-sm text-[#16241F]/60">
        This context shapes every post that gets generated for you.
      </p>

      {loadError && (
        <p className="mt-4 border-l-2 border-[#C1553D] bg-white px-4 py-2 text-sm text-[#C1553D]">
          {loadError}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-6">
        <div>
          <label htmlFor="industry" className="text-sm font-medium">
            Industry
          </label>
          <input
            id="industry"
            type="text"
            value={profile.industry}
            onChange={(e) => update("industry", e.target.value)}
            placeholder="e.g. Fintech, F&B, Property"
            className="mt-2 w-full border border-[#D8DDD4] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[#16241F]/40 focus:border-[#16241F]"
          />
        </div>

        <div>
          <label htmlFor="targetAudience" className="text-sm font-medium">
            Target audience
          </label>
          <input
            id="targetAudience"
            type="text"
            value={profile.targetAudience}
            onChange={(e) => update("targetAudience", e.target.value)}
            placeholder="e.g. HR leaders at Malaysian SMEs"
            className="mt-2 w-full border border-[#D8DDD4] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[#16241F]/40 focus:border-[#16241F]"
          />
        </div>

        <div className="border-t border-[#D8DDD4] pt-6">
          <p className="text-sm font-medium">Writing style memory</p>
          <p className="mt-1 text-xs text-[#16241F]/55">
            {styleData
              ? `Learned from ${styleData.sampleCount} of your posts — ${
                  styleData.sampleCount >= 3
                    ? "actively shaping your drafts"
                    : `${3 - styleData.sampleCount} more needed to activate`
                }.`
              : "Loading…"}
          </p>

          {styleData?.styleProfile && (
            <div className="mt-3 border border-[#D8DDD4] bg-white p-4 text-xs leading-relaxed text-[#16241F]/75">
              <p className="whitespace-pre-wrap">{styleData.styleProfile}</p>
            </div>
          )}

          <p className="mt-4 text-xs text-[#16241F]/55">
            Posts you schedule and publish through Sambungla are learned
            automatically. You can also paste in older posts from elsewhere
            to speed this up.
          </p>

          <textarea
            value={currentDraft}
            onChange={(e) => setCurrentDraft(e.target.value)}
            rows={3}
            placeholder="Paste one past post here, then tap Add"
            className="mt-3 w-full resize-none border border-[#D8DDD4] bg-white px-3 py-2 text-xs outline-none placeholder:text-[#16241F]/40 focus:border-[#16241F]"
          />
          <button
            type="button"
            onClick={addDraftSample}
            disabled={currentDraft.trim().length < 50}
            className="mt-2 border border-[#D8DDD4] bg-white px-4 py-1.5 text-xs disabled:opacity-40"
          >
            Add post
          </button>

          {draftSamples.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {draftSamples.map((sample, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 border border-[#D8DDD4] bg-white px-3 py-2 text-xs"
                >
                  <span className="text-[#16241F]/70">
                    {sample.slice(0, 80)}…
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDraftSample(i)}
                    className="shrink-0 text-[#C1553D]"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={analyzeStyle}
                disabled={analyzing}
                className="mt-1 bg-[#16241F] px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
              >
                {analyzing
                  ? "Analyzing…"
                  : `Analyze ${draftSamples.length} post${
                      draftSamples.length > 1 ? "s" : ""
                    }`}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#16241F] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saveState === "saved" && (
            <span className="text-sm text-[#2F6F62]">Saved</span>
          )}
          {saveState === "error" && (
            <span className="text-sm text-[#C1553D]">Couldn't save. Try again.</span>
          )}
        </div>
      </div>
    </div>
  );
}
