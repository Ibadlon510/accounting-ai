import { NextResponse } from "next/server";
import { getCurrentOrganizationId } from "@/lib/org/server";
import { db } from "@/lib/db";
import { organizations, auditLogs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const ASSISTANT_TOKEN_COST = 1; // 1 token per assistant query
const MIN_BALANCE = ASSISTANT_TOKEN_COST;

const SYSTEM_PROMPT = `You are an AI accounting assistant for an SME accounting app. You help with:
- Questions about revenue, expenses, gross margin, cash flow, and financial summaries
- Overdue invoices, receivables, and payables
- Expense categories and top spend
- Bank reconciliation and unreconciled transactions
- VAT (5%), VAT 201 returns, and estimated VAT liability
- Document vault: receipts, invoices, duplicate checks
- Inventory and low stock
- General double-entry bookkeeping and tax compliance

Answer in clear, concise language. Use AED for currency. If the user asks about data you don't have access to (e.g. live DB data), give a helpful general answer and suggest they check the relevant report or page. Stay professional and accurate.`;

export async function POST(request: Request) {
  const orgId = await getCurrentOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message: string; context?: { pathname?: string; entityId?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const [org] = await db
    .select({ tokenBalance: organizations.tokenBalance, subscriptionPlan: organizations.subscriptionPlan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }
  if (org.subscriptionPlan === "ARCHIVE") {
    return NextResponse.json(
      { error: "Archive mode: read-only. Restore subscription to use the assistant." },
      { status: 403 }
    );
  }
  if (Number(org.tokenBalance ?? 0) < MIN_BALANCE) {
    return NextResponse.json(
      { error: "Insufficient token balance. Upgrade or refill to use the AI assistant." },
      { status: 402 }
    );
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI assistant is not configured" },
      { status: 503 }
    );
  }

  const contextHint = body.context?.pathname
    ? ` (User is currently on: ${body.context.pathname})`
    : "";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\nCurrent context:${contextHint}\n\nUser question: ${message}` }],
        },
      ],
    });

    const response = result.response;
    const text = response.text();
    if (text == null || text === "") {
      return NextResponse.json(
        { error: "No response from assistant" },
        { status: 502 }
      );
    }

    await db
      .update(organizations)
      .set({
        tokenBalance: Math.max(0, Number(org.tokenBalance ?? 0) - ASSISTANT_TOKEN_COST),
      })
      .where(eq(organizations.id, orgId));

    let userId: string | undefined;
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const [appUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.authId, authUser.id))
          .limit(1);
        userId = appUser?.id;
      }
    }
    await db.insert(auditLogs).values({
      organizationId: orgId,
      userId,
      action: "assistant_query",
      entity: "assistant",
      entityId: null,
      metadata: { pathname: body.context?.pathname },
    });

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Assistant chat error:", err);
    return NextResponse.json(
      { error: "Assistant is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
