import OpenAI from "openai";
import type { CloudflareEnv } from "@/types/env";

const MIN_SAMPLES_FOR_PROFILE = 3;
const MAX_SAMPLES_IN_PROMPT = 12;

interface SampleRow {
  content: string;
}

export async function regenerateStyleProfile(
  userId: string,
  env: CloudflareEnv
): Promise<void> {
  const samples = await env.DB.prepare(
    `SELECT content FROM writing_samples WHERE userId = ?1 ORDER BY createdAt DESC LIMIT ?2`
  )
    .bind(userId, MAX_SAMPLES_IN_PROMPT)
    .all<SampleRow>();

  const rows = samples.results ?? [];

  const totalCount = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM writing_samples WHERE userId = ?1`
  )
    .bind(userId)
    .first<{ count: number }>();

  if (rows.length < MIN_SAMPLES_FOR_PROFILE) {
    await env.DB.prepare(
      `UPDATE user_profiles SET styleSampleCount = ?1 WHERE userId = ?2`
    )
      .bind(totalCount?.count ?? rows.length, userId)
      .run();
    return;
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const numberedSamples = rows
    .map((row, i) => `Post ${i + 1}:\n${row.content}`)
    .join("\n\n---\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 350,
    messages: [
      {
        role: "system",
        content:
          "You are analyzing a professional's past LinkedIn posts to build a concise style guide an AI writing assistant can follow when drafting new posts in their voice. Output 6-10 short bullet points covering: typical opening style, sentence length and rhythm, vocabulary or phrases they favor, use of emoji or formatting, how they structure arguments or stories, and their sign-off style. Describe patterns only — do not quote their posts verbatim. Keep the whole output under 200 words.",
      },
      { role: "user", content: numberedSamples },
    ],
  });

  const styleProfile = completion.choices[0]?.message?.content ?? null;

  await env.DB.prepare(
    `UPDATE user_profiles SET styleProfile = ?1, styleSampleCount = ?2 WHERE userId = ?3`
  )
    .bind(styleProfile, totalCount?.count ?? rows.length, userId)
    .run();
}
