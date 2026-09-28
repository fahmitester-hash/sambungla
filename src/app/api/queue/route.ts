import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { CloudflareEnv } from "@/types/env";

export const runtime = "edge";

const QueueSchema = z.object({
  postId: z.string().min(1),
  scheduledFor: z.string().datetime(),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let parsed: z.infer<typeof QueueSchema>;
  try {
    parsed = QueueSchema.parse(await request.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: "Validation failed", details: err }), {
      status: 400,
    });
  }

  const { env } = getRequestContext<CloudflareEnv>();

  const post = await env.DB.prepare(
    `SELECT id FROM posts WHERE id = ?1 AND userId = ?2 LIMIT 1`
  )
    .bind(parsed.postId, session.user.id)
    .first();

  if (!post) {
    return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
  }

  const queueId = nanoid();

  await env.DB.prepare(
    `INSERT INTO scheduling_queue (id, postId, userId, scheduledFor, status)
     VALUES (?1, ?2, ?3, ?4, 'pending')`
  )
    .bind(queueId, parsed.postId, session.user.id, parsed.scheduledFor)
    .run();

  await env.DB.prepare(`UPDATE posts SET status = 'queued' WHERE id = ?1`)
    .bind(parsed.postId)
    .run();

  return new Response(JSON.stringify({ success: true, queueId }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
