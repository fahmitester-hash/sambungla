import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { z } from "zod";
import type { CloudflareEnv } from "@/types/env";

export const runtime = "edge";

const ProfileUpdateSchema = z.object({
  industry: z.string().max(200).optional().default(""),
  targetAudience: z.string().max(200).optional().default(""),
});

interface ProfileRow {
  industry: string | null;
  targetAudience: string | null;
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { env } = getRequestContext<CloudflareEnv>();

  const row = await env.DB.prepare(
    `SELECT industry, targetAudience FROM user_profiles WHERE userId = ?1 LIMIT 1`
  )
    .bind(session.user.id)
    .first<ProfileRow>();

  return new Response(JSON.stringify(row ?? {}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let parsed: z.infer<typeof ProfileUpdateSchema>;
  try {
    parsed = ProfileUpdateSchema.parse(await request.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: "Validation failed", details: err }), {
      status: 400,
    });
  }

  const { env } = getRequestContext<CloudflareEnv>();

  await env.DB.prepare(
    `UPDATE user_profiles
     SET industry = ?1, targetAudience = ?2
     WHERE userId = ?3`
  )
    .bind(
      parsed.industry || null,
      parsed.targetAudience || null,
      session.user.id
    )
    .run();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
