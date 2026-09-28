import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import { z } from "zod";
import type { CloudflareEnv } from "@/types/env";

export const runtime = "edge";

const SamplesSchema = z.object({
  samples: z.array(z.string().min(50).max(3000)).min(1).max(10),
});

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

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { env } = getRequestContext<CloudflareEnv>();

  const profile = await env.DB.prepare(
    `SELECT styleProfile, styleSampleCount FROM user_profiles WHERE userId = ?1 LIMIT 1`
  )
    .bind(session.user.id)
    .first<{ styleProfile: string | null; styleSampleCount: number | null }>();

  const recentSamples = await env.DB.prepare(
    `SELECT id, source, createdAt, substr(content, 1, 80) as preview
     FROM writing_samples WHERE userId = ?1 ORDER BY createdAt DESC LIMIT 10`
  )
    .bind(session.user.id)
    .all();

  return new Response(
    JSON.stringify({
      styleProfile: profile?.styleProfile ?? null,
      sampleCount: profile?.styleSampleCount ?? 0,
      recentSamples: recentSamples.results ?? [],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let parsed: z.infer<typeof SamplesSchema>;
  try {
    parsed = SamplesSchema.parse(await request.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: "Validation failed", details: err }), {
      status: 400,
    });
  }

  const { env } = getRequestContext<CloudflareEnv>();

  const insertStatements = parsed.samples.map((content) =>
    env.DB.prepare(
      `INSERT INTO writing_samples (id, userId, content, source) VALUES (?1, ?2, ?3, 'manual')`
    ).bind(nanoid(), session.user.id, content)
  );

  await env.DB.batch(insertStatements);
  await regenerateStyleProfile(session.user.id, env);

  return new Response(JSON.stringify({ success: true }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
