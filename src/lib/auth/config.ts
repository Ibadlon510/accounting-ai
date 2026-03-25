import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      emailVerified?: Date | null;
    };
  }
  interface User {
    emailVerified?: Date | null;
  }
}


const UNVERIFIED_SESSION_SECONDS = 5 * 60; // 5 minutes

/** OAuth provider IDs that use the same DB upsert logic */
const OAUTH_PROVIDERS = ["google", "microsoft-entra-id"];

const MAGIC_LINK_IDENTIFIER_PREFIX = "magic-link:";

/**
 * Auth config — NO adapter, NO static DB imports.
 * Safe to evaluate at build time and in Edge middleware.
 * Uses JWT sessions so no DB-backed session storage is needed.
 * OAuth user creation is handled in the signIn callback.
 */
export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/workspaces",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    ...(process.env.MICROSOFT_ENTRA_ID_ID && process.env.MICROSOFT_ENTRA_ID_SECRET
      ? [MicrosoftEntraID({
          clientId: process.env.MICROSOFT_ENTRA_ID_ID,
          clientSecret: process.env.MICROSOFT_ENTRA_ID_SECRET,
          issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_ID_TENANT_ID ?? "common"}/v2.0`,
        })]
      : []),
    Credentials({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const token = credentials?.token as string | undefined;
        if (!email || !token) return null;

        const { db } = await import("@/lib/db");
        const { users, verificationTokens } = await import("@/lib/db/schema");
        const { eq, and } = await import("drizzle-orm");

        // Use Web Crypto API (Edge-compatible) instead of Node crypto
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedToken = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        const identifier = `${MAGIC_LINK_IDENTIFIER_PREFIX}${email}`;

        const [record] = await db
          .select()
          .from(verificationTokens)
          .where(and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, hashedToken),
          ))
          .limit(1);

        if (!record || record.expires < new Date()) {
          // Clean up expired token if it exists
          if (record) {
            await db.delete(verificationTokens).where(and(
              eq(verificationTokens.identifier, identifier),
              eq(verificationTokens.token, hashedToken),
            ));
          }
          return null;
        }

        // Delete the used token
        await db.delete(verificationTokens).where(and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, hashedToken),
        ));

        // Find or create user
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing) {
          // Mark email as verified if not already
          if (!existing.emailVerified) {
            await db.update(users)
              .set({ emailVerified: new Date() })
              .where(eq(users.id, existing.id));
          }
          return {
            id: existing.id,
            email: existing.email,
            name: existing.name,
            image: existing.image ?? existing.avatarUrl,
            emailVerified: existing.emailVerified ?? new Date(),
          };
        }

        // Create new user — email is verified by magic link
        const [created] = await db
          .insert(users)
          .values({
            email,
            name: email.split("@")[0],
            emailVerified: new Date(),
          })
          .returning({ id: users.id });

        if (!created) return null;

        return {
          id: created.id,
          email,
          name: email.split("@")[0],
          emailVerified: new Date(),
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Dynamic import to avoid DB access at build time
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const bcrypt = (await import("bcryptjs")).default;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image ?? user.avatarUrl,
          emailVerified: user.emailVerified ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers: create or find the user in our DB
      if (account?.provider && OAUTH_PROVIDERS.includes(account.provider) && user.email) {
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const [existing] = await db
          .select({ id: users.id, emailVerified: users.emailVerified })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (!existing) {
          const [created] = await db
            .insert(users)
            .values({
              email: user.email,
              name: user.name ?? user.email.split("@")[0],
              image: user.image ?? null,
              emailVerified: new Date(),
            })
            .returning({ id: users.id });
          if (created) {
            user.id = created.id;
            user.emailVerified = new Date();
          }
        } else {
          user.id = existing.id;
          user.emailVerified = existing.emailVerified ?? null;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified ?? null;
      }

      // For OAuth providers: always resolve the DB UUID (not the provider's sub ID)
      // This ensures both new and returning OAuth users get the correct DB id
      if (account?.provider && OAUTH_PROVIDERS.includes(account.provider) && user?.email) {
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const [dbUser] = await db
          .select({ id: users.id, emailVerified: users.emailVerified })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (dbUser) {
          token.id = dbUser.id;
          token.emailVerified = (dbUser.emailVerified ?? null) as Date | null;
        }
      }

      // On session update (e.g. after email verification or email change), re-fetch from DB
      if (trigger === "update" && token.id) {
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const userId = token.id as string;

        const [fresh] = await db
          .select({ email: users.email, name: users.name, emailVerified: users.emailVerified })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (fresh) {
          token.email = fresh.email;
          token.name = fresh.name;
          token.emailVerified = (fresh.emailVerified ?? null) as Date | null;
        }
      }

      // Unverified users get a 5-minute session TTL as pressure to verify
      if (!token.emailVerified) {
        token.exp = Math.floor(Date.now() / 1000) + UNVERIFIED_SESSION_SECONDS;
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      session.user.emailVerified = (token.emailVerified as Date | null | undefined) ?? null;
      return session;
    },
  },
};
