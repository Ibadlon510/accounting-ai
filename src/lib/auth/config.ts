import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

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

/**
 * Auth config — NO adapter, NO static DB imports.
 * Safe to evaluate at build time and in Edge middleware.
 * Uses JWT sessions so no DB-backed session storage is needed.
 * Google OAuth user creation is handled in the signIn callback.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
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
      // For Google OAuth: create or find the user in our DB
      if (account?.provider === "google" && user.email) {
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

      // For Google OAuth: always resolve the DB UUID (not the Google sub ID)
      // This ensures both new and returning Google users get the correct DB id
      if (account?.provider === "google" && user?.email) {
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

      // On session update (e.g. after email verification), re-fetch emailVerified from DB
      if (trigger === "update" && token.id) {
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const userId = token.id as string;

        const [fresh] = await db
          .select({ emailVerified: users.emailVerified })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (fresh) {
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
