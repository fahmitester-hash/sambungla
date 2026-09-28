import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { z } from "zod";
import type { CloudflareEnv } from "@/types/env";

export const runtime = "edge";

const PatchSchema = z.object({
  generatedContent: z.string().min(1).max(6000),
});

const EDIT_LOCK_WINDOW_MS = 15 * 60 * 1000;

interface PendingScheduleRow {
  scheduledFor: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let parsed: z.infer<typeof PatchSchema>;
  try {
    parsed = PatchSchema.parse(await request.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: "Validation failed", details: err }), {
      status: 400,
    });
  }

  const { env } = getRequestContext<CloudflareEnv>();

  const pendingSchedule = await env.DB.prepare(
    `SELECT scheduledFor FROM scheduling_queue WHERE postId = ?1 AND status = 'pending' LIMIT 1`
  )
    .bind(params.id)
    .first<PendingScheduleRow>();

  if (pendingSchedule) {
    const scheduledMs = new Date(pendingSchedule.scheduledFor).getTime();
    const msRemaining = scheduledMs - Date.now();

    if (msRemaining <= EDIT_LOCK_WINDOW_MS) {
      return new Response(
        JSON.stringify({
          error:
            "This post is locked for editing — it publishes within 15 minutes and can no longer be changed.",
        }),
        { status: 423, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const result = await env.DB.prepare(
    `UPDATE posts SET generatedContent = ?1 WHERE id = ?2 AND userId = ?3`
  )
    .bind(parsed.generatedContent, params.id, session.user.id)
    .run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { env } = getRequestContext<CloudflareEnv>();

  const post = await env.DB.prepare(
    `SELECT generatedContent FROM posts WHERE id = ?1 AND userId = ?2 LIMIT 1`
  )
    .bind(params.id, session.user.id)
    .first<{ generatedContent: string }>();

  if (!post) {
    return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
  }

  return new Response(JSON.stringify(post), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
