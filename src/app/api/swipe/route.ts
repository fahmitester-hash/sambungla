import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { nanoid } from "nanoid";
import { z } from "zod";

export const runtime = "edge";

const SwipeCreateSchema = z.object({
  content: z.string().min(10).max(3000),
  note: z.string().max(200).optional().default(""),
  source: z.enum(["manual", "own_post"]).optional().default("manual"),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { env } = getRequestContext();

  const entries = await env.DB.prepare(
    `SELECT id, content, note, source, createdAt FROM swipe_file
     WHERE userId = ?1 ORDER BY createdAt DESC LIMIT 100`
  )
    .bind(session.user.id)
    .all();

  return new Response(JSON.stringify({ entries: entries.results ?? [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let parsed: z.infer<typeof SwipeCreateSchema>;
  try {
    parsed = SwipeCreateSchema.parse(await request.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: "Validation failed", details: err }), {
      status: 400,
    });
  }

  const { env } = getRequestContext();
  const id = nanoid();

  await env.DB.prepare(
    `INSERT INTO swipe_file (id, userId, content, note, source) VALUES (?1, ?2, ?3, ?4, ?5)`
  )
    .bind(id, session.user.id, parsed.content, parsed.note || null, parsed.source)
    .run();

  return new Response(JSON.stringify({ success: true, id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
