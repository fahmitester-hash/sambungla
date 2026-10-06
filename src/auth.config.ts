import type { NextAuthConfig } from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";
import { getRequestContext } from "@cloudflare/next-on-pages";

// Edge-safe config used by middleware: no database adapter, no D1 access.
// Session is verified from a signed JWT cookie only, which is why this
// stays fast and crash-free inside middleware on Cloudflare's edge runtime.
export default function buildAuthConfig(): NextAuthConfig {
  const { env } = getRequestContext();

  return {
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
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    },
    secret: env.AUTH_SECRET,
    trustHost: true,
    pages: {
      signIn: "/login",
      error: "/login",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user?.id) {
          token.id = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.id) {
          session.user.id = token.id as string;
        }
        return session;
      },
    },
  };
}
