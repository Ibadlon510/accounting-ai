import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, userRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // recovery, signup, magiclink etc.
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=not_configured`);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
