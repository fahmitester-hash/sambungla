import { auth } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const RECONNECT_WARNING_WINDOW_SECONDS = 7 * 24 * 60 * 60;

interface LinkedInAccountRow {
  expires_at: number | null;
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { env } = getRequestContext();

  const row = await env.DB.prepare(
    `SELECT expires_at FROM accounts WHERE userId = ?1 AND provider = 'linkedin' LIMIT 1`
  )
    .bind(session.user.id)
    .first<LinkedInAccountRow>();

  if (!row || !row.expires_at) {
    return new Response(
      JSON.stringify({ connected: false, expiresAt: null, needsReconnect: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const secondsRemaining = row.expires_at - nowSeconds;
  const needsReconnect = secondsRemaining <= RECONNECT_WARNING_WINDOW_SECONDS;

  return new Response(
    JSON.stringify({
      connected: secondsRemaining > 0,
      expiresAt: row.expires_at,
      needsReconnect,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
