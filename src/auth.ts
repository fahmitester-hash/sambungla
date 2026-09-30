import NextAuth from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";
import { D1Adapter } from "@auth/d1-adapter";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { nanoid } from "nanoid";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const { env } = getRequestContext();

  return {
    adapter: D1Adapter(env.DB),
    providers: [
      LinkedIn({
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
        authorization: {
          params: {
            scope: "openid profile email w_member_social",
          },
        },
      }),
    ],
    session: {
      strategy: "database",
      maxAge: 30 * 24 * 60 * 60,
    },
    secret: env.AUTH_SECRET,
    trustHost: true,
    pages: {
      signIn: "/login",
      error: "/login",
    },
    events: {
      async createUser({ user }) {
        if (!user.id) return;
        const profileId = nanoid();
        await env.DB.prepare(
          `INSERT INTO user_profiles (id, userId, industry, targetAudience)
           VALUES (?1, ?2, NULL, NULL)`
        )
          .bind(profileId, user.id)
          .run();
      },
      async signIn({ user, account }) {
        if (!user.id || !account || account.provider !== "linkedin") return;
        if (!account.access_token) return;

        await env.DB.prepare(
          `UPDATE accounts
           SET access_token = ?1, expires_at = ?2, refresh_token = ?3
           WHERE userId = ?4 AND provider = 'linkedin'`
        )
          .bind(
            account.access_token,
            account.expires_at ?? null,
            account.refresh_token ?? null,
            user.id
          )
          .run();
      },
    },
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          session.user.id = user.id;
        }
        return session;
      },
    },
  };
});
