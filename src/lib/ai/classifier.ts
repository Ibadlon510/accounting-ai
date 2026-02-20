import { db } from "@/lib/db";
import { classificationRules, chartOfAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type SuggestResult = {
  glAccountId: string;
  glCode: string;
  glName: string;
  confidence: number;
} | null;

/**
 * Built-in keyword -> GL code rules (UAE CoA). Applied when no org rule matches.
 * Order matters: first match wins. Use uppercase keywords.
 */
const BUILTIN_RULES: Array<{ pattern: RegExp | string; code: string; confidence: number }> = [
  { pattern: /DEWA|EMPRESS|SEWA|FEWA|ELECTRICITY|UTILITY/i, code: "6210", confidence: 0.92 },
  { pattern: /DU\b|ETISALAT|TELECOM|INTERNET|PHONE/i, code: "6230", confidence: 0.9 },
  { pattern: /RENT|NATIONAL PROPERTIES|LEASE/i, code: "6110", confidence: 0.95 },
  { pattern: /SALARY|SALARIES|PAYROLL|WAGES/i, code: "6000", confidence: 0.95 },
  { pattern: /BANK CHARGES|BANK FEE|MONTHLY FEE/i, code: "6950", confidence: 0.98 },
  { pattern: /GULF IT|OFFICE EQUIPMENT|EQUIPMENT|COMPUTER/i, code: "6300", confidence: 0.85 },
  { pattern: /AMAZON|OFFICE SUPPLIES|STATIONERY|SUPPLIES/i, code: "6300", confidence: 0.8 },
  { pattern: /ENOC|PETROL|FUEL|TRAVEL|UBER|TAXI|HOTEL|RESTAURANT|STARBUCKS|MEALS/i, code: "6400", confidence: 0.75 },
  { pattern: /TRF FROM|TRANSFER FROM|RECEIVABLE|CUSTOMER PAYMENT/i, code: "1210", confidence: 0.88 },
  { pattern: /INSURANCE/i, code: "6600", confidence: 0.9 },
  { pattern: /TRADE LICENSE|VISA|LABOUR|GOVERNMENT/i, code: "6800", confidence: 0.85 },
  { pattern: /LEGAL|AUDIT|CONSULTANCY|PROFESSIONAL FEES/i, code: "6500", confidence: 0.85 },
  { pattern: /MARKETING|ADVERTISING|GOOGLE|META/i, code: "6900", confidence: 0.82 },
];

function normalizeForMatch(text: string): string {
  return text.trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Suggest GL account for a bank transaction using org-learned rules first, then built-in rules.
 * Resolves to accountId from the org's chart of accounts.
 */
export async function suggestGL(
  orgId: string,
  description: string,
  _amount?: number,
  merchant?: string
): Promise<SuggestResult> {
  const combined = [description, merchant].filter(Boolean).join(" ");
  const normalized = normalizeForMatch(combined);
  if (!normalized) return null;

  // 1) Learned rules: pattern contained in description/merchant (case-insensitive)
  const rules = await db
    .select({
      pattern: classificationRules.pattern,
      accountId: classificationRules.accountId,
      confidence: classificationRules.confidence,
    })
    .from(classificationRules)
    .where(eq(classificationRules.organizationId, orgId));

  for (const rule of rules) {
    if (!rule.accountId) continue;
    const pat = normalizeForMatch(rule.pattern);
    if (normalized.includes(pat) || pat.includes(normalized)) {
      const [account] = await db
        .select({ id: chartOfAccounts.id, code: chartOfAccounts.code, name: chartOfAccounts.name })
        .from(chartOfAccounts)
        .where(
          and(
            eq(chartOfAccounts.id, rule.accountId),
            eq(chartOfAccounts.organizationId, orgId)
          )
        )
        .limit(1);
      if (account) {
        const conf = Number(rule.confidence ?? 1);
        return {
          glAccountId: account.id,
          glCode: account.code,
          glName: account.name,
          confidence: Math.min(1, conf),
        };
      }
    }
  }

  // 2) Built-in keyword rules
  for (const r of BUILTIN_RULES) {
    const matches =
      typeof r.pattern === "string"
        ? normalized.includes(normalizeForMatch(r.pattern))
        : r.pattern.test(combined);
    if (matches) {
      const [account] = await db
        .select({ id: chartOfAccounts.id, code: chartOfAccounts.code, name: chartOfAccounts.name })
        .from(chartOfAccounts)
        .where(
          and(
            eq(chartOfAccounts.organizationId, orgId),
            eq(chartOfAccounts.code, r.code)
          )
        )
        .limit(1);
      if (account) {
        return {
          glAccountId: account.id,
          glCode: account.code,
          glName: account.name,
          confidence: r.confidence,
        };
      }
    }
  }

  return null;
}

/**
 * Persist a classification rule: when user confirms or corrects a GL for a transaction.
 */
export async function learnClassification(
  orgId: string,
  pattern: string,
  glAccountId: string
): Promise<void> {
  const pat = pattern.trim();
  if (!pat) return;

  const existing = await db
    .select({ id: classificationRules.id, timesUsed: classificationRules.timesUsed })
    .from(classificationRules)
    .where(
      and(
        eq(classificationRules.organizationId, orgId),
        eq(classificationRules.pattern, pat)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const nextUsed = (Number(existing[0].timesUsed) || 0) + 1;
    await db
      .update(classificationRules)
      .set({
        accountId: glAccountId,
        timesUsed: nextUsed,
      })
      .where(eq(classificationRules.id, existing[0].id));
  } else {
    await db.insert(classificationRules).values({
      organizationId: orgId,
      pattern: pat,
      accountId: glAccountId,
      confidence: "1",
      timesUsed: 1,
    });
  }
}
