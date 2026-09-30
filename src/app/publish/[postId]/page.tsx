"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface PostData {
  generatedContent: string;
}

export default function PublishPage() {
  const params = useParams<{ postId: string }>();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy post text");

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      try {
        const response = await fetch(`/api/posts/${params.postId}`);
        if (!response.ok) throw new Error("Not found");
        const data = (await response.json()) as PostData;
        if (!cancelled) setPost(data);
      } catch {
        if (!cancelled) setLoadError("Couldn't load this post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPost();
    return () => {
      cancelled = true;
    };
  }, [params.postId]);

  async function handleCopy() {
    if (!post) return;
    await navigator.clipboard.writeText(post.generatedContent);
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy post text"), 1800);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="text-sm text-[#16241F]/60">Loading your post…</p>
      </div>
    );
  }

  if (loadError || !post) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="border-l-2 border-[#C1553D] bg-white px-4 py-2 text-sm text-[#C1553D]">
          {loadError ?? "This post is no longer available."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-[#EEF1EC] px-4 py-10">
      <h1 className="font-serif text-2xl text-[#16241F]">Ready to publish</h1>
      <p className="mt-1 text-sm text-[#16241F]/60">
        Copy your text, then paste it into a new LinkedIn post.
      </p>

      <div className="mt-6 border border-[#D8DDD4] bg-white p-6">
        <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-[#16241F]">
          {post.generatedContent}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="bg-[#16241F] px-5 py-2.5 text-sm font-medium text-white"
        >
          {copyLabel}
        </button>
        <a
          href="https://www.linkedin.com/feed/"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-[#D8DDD4] bg-white px-5 py-2.5 text-sm font-medium text-[#16241F]"
        >
          Open LinkedIn
        </a>
      </div>
    </div>
  );
}
