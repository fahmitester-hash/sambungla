import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { nanoid } from "nanoid";
import { z } from "zod";
import { regenerateStyleProfile } from "@/lib/style-profile";

export const runtime = "edge";

const SamplesSchema = z.object({
  samples: z.array(z.string().min(50).max(3000)).min(1).max(10),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { env } = getRequestContext();

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

  const { env } = getRequestContext();

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
