import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email/welcome";

/**
 * POST /api/email/welcome
 * Sends a branded welcome email to the authenticated user.
 * Called from the client after account creation succeeds.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.email) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const result = await sendWelcomeEmail({ to: user.email, name: user.name });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
