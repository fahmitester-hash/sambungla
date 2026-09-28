import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { CloudflareEnv } from "@/types/env";

export const runtime = "edge";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { env } = getRequestContext<CloudflareEnv>();

  const result = await env.DB.prepare(
    `DELETE FROM swipe_file WHERE id = ?1 AND userId = ?2`
  )
    .bind(params.id, session.user.id)
    .run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({ error: "Entry not found" }), { status: 404 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
