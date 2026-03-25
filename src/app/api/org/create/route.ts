import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, userRoles } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; currency?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, currency } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  }
  if (name.trim().length > 255) {
    return NextResponse.json({ error: "Organization name is too long" }, { status: 400 });
  }

  const currencyCode = (currency && typeof currency === "string" && currency.trim().length === 3)
    ? currency.trim().toUpperCase()
    : "AED";

  try {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: name.trim(),
        currency: currencyCode,
      })
      .returning();

    await db.insert(userRoles).values({
      userId: session.user.id,
      organizationId: newOrg.id,
      role: "owner",
    });

    return NextResponse.json({ organization: newOrg }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create organization";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
