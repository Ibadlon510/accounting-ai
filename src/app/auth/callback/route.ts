import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, userRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type"); // recovery, signup, magiclink, email etc.
  const next = searchParams.get("next");

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=not_configured`);
  }

  let authError: Error | null = null;

  // Handle PKCE code exchange (OAuth, magic link with PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  }
  // Handle token_hash (email confirmation, recovery links)
  else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "recovery" | "signup" | "magiclink",
    });
    authError = error;
  }

  if (!authError && (code || token_hash)) {
    // Determine redirect destination
    let destination = next ?? "/dashboard";

    // Recovery flow → reset password page
    if (type === "recovery") {
      destination = "/reset-password";
    } else if (!next) {
      // For signup/magiclink: check if user has an org, if not → onboarding
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [appUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.authId, user.id))
            .limit(1);

          if (!appUser) {
            destination = "/onboarding";
          } else {
            const [role] = await db
              .select({ id: userRoles.id })
              .from(userRoles)
              .where(eq(userRoles.userId, appUser.id))
              .limit(1);

            if (!role) {
              destination = "/onboarding";
            }
          }
        }
      } catch {
        // If DB check fails, fall through to /dashboard — middleware will catch it
      }
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${destination}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${destination}`);
    } else {
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
