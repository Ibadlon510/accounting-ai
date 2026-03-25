import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  jsonb,
  boolean,
  integer,
  numeric,
  date,
  check,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Subscription plan for billing (Free + Pro + Archive)
export const SUBSCRIPTION_PLANS = ["FREE", "PRO", "ARCHIVE"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

// ─── Organizations ───────────────────────────────────────────
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  fiscalYearStart: integer("fiscal_year_start").notNull().default(1), // month 1-12
  taxRegistrationNumber: varchar("tax_registration_number", { length: 50 }),
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  logoUrl: text("logo_url"),
  subscriptionPlan: varchar("subscription_plan", { length: 20 }).notNull().default("FREE"),
  tokenBalance: integer("token_balance").notNull().default(0),
  freeAiDocsUsed: integer("free_ai_docs_used").notNull().default(0),
  freeAiStatementsUsed: integer("free_ai_statements_used").notNull().default(0),
  maxUsers: integer("max_users").notNull().default(1),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  extraSeats: integer("extra_seats").notNull().default(0),
  emailFromName: varchar("email_from_name", { length: 255 }),
  emailReplyTo: varchar("email_reply_to", { length: 255 }),
  emailSignatureHtml: text("email_signature_html"),
  emailDefaultCc: varchar("email_default_cc", { length: 500 }),
  autoSendOnInvoiceConfirm: boolean("auto_send_on_invoice_confirm").notNull().default(false),
  autoSendOnPaymentReceipt: boolean("auto_send_on_payment_receipt").notNull().default(false),
  isVatRegistered: boolean("is_vat_registered").notNull().default(false),
  taxLabel: varchar("tax_label", { length: 30 }).notNull().default("VAT"),
  defaultTaxCodeId: uuid("default_tax_code_id"), // FK to tax_codes enforced at app level (circular ref)
  numberFormat: varchar("number_format", { length: 20 }).notNull().default("1,234.56"),
  dateFormat: varchar("date_format", { length: 20 }).notNull().default("DD/MM/YYYY"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Users ───────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(), // NextAuth required field
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  hashedPassword: text("hashed_password"), // null for OAuth-only users
  image: text("image"),
  roleTitle: varchar("role_title", { length: 100 }),
  avatarUrl: text("avatar_url"),
  notificationPreferences: jsonb("notification_preferences"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Verification Tokens (password reset) ───────────────────
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (vt) => [
    primaryKey({ columns: [vt.identifier, vt.token] }),
  ]
);

// ─── User Roles (per organization) ──────────────────────────
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull().default("owner"), // owner, admin, accountant, viewer
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Audit Logs ─────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 50 }).notNull(), // create, update, delete, login, etc.
  entity: varchar("entity", { length: 100 }).notNull(), // table/entity name
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"), // additional context
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Account Types ──────────────────────────────────────────
// Standard categories: asset, liability, equity, revenue, expense
export const accountTypes = pgTable("account_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(), // e.g. "Current Assets"
  category: varchar("category", { length: 20 }).notNull(), // asset, liability, equity, revenue, expense
  normalBalance: varchar("normal_balance", { length: 6 }).notNull(), // debit or credit
  displayOrder: integer("display_order").notNull().default(0),
});

// ─── Chart of Accounts ──────────────────────────────────────
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  accountTypeId: uuid("account_type_id")
    .notNull()
    .references(() => accountTypes.id),
  code: varchar("code", { length: 20 }).notNull(), // e.g. "1100"
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Cash in Hand"
  description: text("description"),
  parentId: uuid("parent_id"), // self-referencing for sub-accounts
  isActive: boolean("is_active").notNull().default(true),
  isSystem: boolean("is_system").notNull().default(false), // system accounts can't be deleted
  taxCode: varchar("tax_code", { length: 20 }), // linked VAT code
  currency: varchar("currency", { length: 3 }), // override org currency
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  uniqueIndex("chart_of_accounts_org_code_idx").on(t.organizationId, t.code),
]);

// ─── Fiscal Years ───────────────────────────────────────────
export const fiscalYears = pgTable("fiscal_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(), // e.g. "FY 2025-2026"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isClosed: boolean("is_closed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Accounting Periods ─────────────────────────────────────
export const accountingPeriods = pgTable("accounting_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  fiscalYearId: uuid("fiscal_year_id")
    .notNull()
    .references(() => fiscalYears.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(), // e.g. "January 2026"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: varchar("status", { length: 10 }).notNull().default("open"), // open, closed, locked
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closedBy: uuid("closed_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Journal Entries ────────────────────────────────────────
// Immutable header for each transaction. Once posted, never updated.
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  periodId: uuid("period_id")
    .notNull()
    .references(() => accountingPeriods.id),
  entryNumber: varchar("entry_number", { length: 30 }).notNull(), // auto-generated sequence
  entryDate: date("entry_date").notNull(),
  description: text("description").notNull(),
  reference: varchar("reference", { length: 100 }), // invoice #, bill #, etc.
  sourceType: varchar("source_type", { length: 30 }), // manual, invoice, bill, payment, etc.
  sourceId: uuid("source_id"), // FK to the originating document
  status: varchar("status", { length: 10 }).notNull().default("posted"), // draft, posted, reversed
  reversalOf: uuid("reversal_of"), // links to the reversed entry
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull().default("1"),
  totalDebit: numeric("total_debit", { precision: 18, scale: 2 }).notNull().default("0"),
  totalCredit: numeric("total_credit", { precision: 18, scale: 2 }).notNull().default("0"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  postedBy: uuid("posted_by").references(() => users.id),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index("journal_entries_org_date_idx").on(t.organizationId, t.entryDate),
  uniqueIndex("journal_entries_org_number_idx").on(t.organizationId, t.entryNumber),
]);

// ─── Journal Lines ──────────────────────────────────────────
// Immutable debit/credit lines. Append-only.
export const journalLines = pgTable("journal_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  journalEntryId: uuid("journal_entry_id")
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => chartOfAccounts.id),
  description: text("description"),
  debit: numeric("debit", { precision: 18, scale: 2 }).notNull().default("0"),
  credit: numeric("credit", { precision: 18, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull().default("1"),
  baseCurrencyDebit: numeric("base_currency_debit", { precision: 18, scale: 2 }).notNull().default("0"),
  baseCurrencyCredit: numeric("base_currency_credit", { precision: 18, scale: 2 }).notNull().default("0"),
  taxCode: varchar("tax_code", { length: 20 }),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }),
  lineOrder: integer("line_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index("journal_lines_entry_idx").on(t.journalEntryId),
  index("journal_lines_org_account_idx").on(t.organizationId, t.accountId),
]);

// ─── Currencies ─────────────────────────────────────────────
export const currencies = pgTable("currencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  decimalPlaces: integer("decimal_places").notNull().default(2),
});

// ─── Exchange Rates ─────────────────────────────────────────
export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
  toCurrency: varchar("to_currency", { length: 3 }).notNull(),
  rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Customers ──────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  taxNumber: varchar("tax_number", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("UAE"),
  currency: varchar("currency", { length: 3 }).default("AED"),
  creditLimit: numeric("credit_limit", { precision: 18, scale: 2 }),
  paymentTermsDays: integer("payment_terms_days").default(30),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  isDemo: boolean("is_demo").notNull().default(false), // true = seeded demo data, safe to remove
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Suppliers ──────────────────────────────────────────────
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  taxNumber: varchar("tax_number", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("UAE"),
  currency: varchar("currency", { length: 3 }).default("AED"),
  paymentTermsDays: integer("payment_terms_days").default(30),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Invoices ───────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: varchar("status", { length: 15 }).notNull().default("draft"), // draft, sent, paid, partial, overdue, cancelled
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull().default("1"),
  subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  amountPaid: numeric("amount_paid", { precision: 18, scale: 2 }).notNull().default("0"),
  creditApplied: numeric("credit_applied", { precision: 18, scale: 2 }).notNull().default("0"),
  amountDue: numeric("amount_due", { precision: 18, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  terms: text("terms"),
  paymentInfo: text("payment_info"),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  journalEntryId: uuid("journal_entry_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("invoices_org_status_idx").on(t.organizationId, t.status),
  index("invoices_org_customer_idx").on(t.organizationId, t.customerId),
]);

// ─── Invoice Lines ──────────────────────────────────────────
export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  itemId: uuid("item_id"),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 18, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  taxCode: varchar("tax_code", { length: 20 }),
  taxCodeId: uuid("tax_code_id").references(() => taxCodes.id, { onDelete: "set null" }),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0"),
  accountId: uuid("account_id").references(() => chartOfAccounts.id),
  lineOrder: integer("line_order").notNull().default(0),
});

// ─── Bills ──────────────────────────────────────────────────
export const bills = pgTable("bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  billNumber: varchar("bill_number", { length: 30 }).notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: varchar("status", { length: 15 }).notNull().default("draft"),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull().default("1"),
  subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  amountPaid: numeric("amount_paid", { precision: 18, scale: 2 }).notNull().default("0"),
  creditApplied: numeric("credit_applied", { precision: 18, scale: 2 }).notNull().default("0"),
  amountDue: numeric("amount_due", { precision: 18, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  terms: text("terms"),
  paymentInfo: text("payment_info"),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  journalEntryId: uuid("journal_entry_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("bills_org_status_idx").on(t.organizationId, t.status),
  index("bills_org_supplier_idx").on(t.organizationId, t.supplierId),
]);

// ─── Bill Lines ─────────────────────────────────────────────
export const billLines = pgTable("bill_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  itemId: uuid("item_id"),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 18, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  taxCode: varchar("tax_code", { length: 20 }),
  taxCodeId: uuid("tax_code_id").references(() => taxCodes.id, { onDelete: "set null" }),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0"),
  accountId: uuid("account_id").references(() => chartOfAccounts.id),
  lineOrder: integer("line_order").notNull().default(0),
});

// ─── Payments ───────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  paymentNumber: varchar("payment_number", { length: 30 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentType: varchar("payment_type", { length: 15 }).notNull(), // received, made
  entityType: varchar("entity_type", { length: 10 }).notNull(), // customer, supplier
  entityId: uuid("entity_id").notNull(),
  bankAccountId: uuid("bank_account_id"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull().default("1"),
  method: varchar("method", { length: 20 }).default("bank_transfer"), // cash, bank_transfer, cheque, card
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  journalEntryId: uuid("journal_entry_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Payment Allocations ────────────────────────────────────
export const paymentAllocations = pgTable("payment_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  documentType: varchar("document_type", { length: 10 }).notNull(), // invoice, bill
  documentId: uuid("document_id").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
});

// ─── Items ──────────────────────────────────────────────────
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 50 }),
  description: text("description"),
  type: varchar("type", { length: 15 }).notNull().default("product"), // product, service
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }).default("pcs"),
  salesPrice: numeric("sales_price", { precision: 18, scale: 2 }),
  purchasePrice: numeric("purchase_price", { precision: 18, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 18, scale: 2 }).default("0"),
  taxCode: varchar("tax_code", { length: 20 }),
  defaultTaxCodeId: uuid("default_tax_code_id").references(() => taxCodes.id, { onDelete: "set null" }),
  salesAccountId: uuid("sales_account_id").references(() => chartOfAccounts.id),
  purchaseAccountId: uuid("purchase_account_id").references(() => chartOfAccounts.id),
  inventoryAccountId: uuid("inventory_account_id").references(() => chartOfAccounts.id),
  trackInventory: boolean("track_inventory").notNull().default(true),
  quantityOnHand: numeric("quantity_on_hand", { precision: 18, scale: 4 }).default("0"),
  reorderLevel: numeric("reorder_level", { precision: 18, scale: 4 }),
  isActive: boolean("is_active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Inventory Movements ────────────────────────────────────
export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  movementType: varchar("movement_type", { length: 20 }).notNull(), // purchase, sale, adjustment, transfer
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 18, scale: 2 }).notNull().default("0"),
  totalCost: numeric("total_cost", { precision: 18, scale: 2 }).notNull().default("0"),
  referenceType: varchar("reference_type", { length: 20 }), // invoice, bill
  referenceId: uuid("reference_id"),
  notes: text("notes"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Bank Accounts ──────────────────────────────────────────
export const bankAccountTypeValues = ["bank", "credit_card"] as const;
export type BankAccountType = (typeof bankAccountTypeValues)[number];

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  accountType: varchar("account_type", { length: 20 }).notNull().default("bank"), // bank | credit_card
  accountName: varchar("account_name", { length: 255 }).notNull(),
  bankName: varchar("bank_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 50 }),
  iban: varchar("iban", { length: 50 }),
  swiftCode: varchar("swift_code", { length: 20 }),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  ledgerAccountId: uuid("ledger_account_id").references(() => chartOfAccounts.id),
  currentBalance: numeric("current_balance", { precision: 18, scale: 2 }).default("0"),
  isActive: boolean("is_active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Bank Transactions ──────────────────────────────────────
export const bankTransactions = pgTable("bank_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  transactionDate: date("transaction_date").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // debit, credit
  reference: varchar("reference", { length: 100 }),
  category: varchar("category", { length: 50 }),
  isReconciled: boolean("is_reconciled").notNull().default(false),
  matchedJournalEntryId: uuid("matched_journal_entry_id"),
  suggestedAccountId: uuid("suggested_account_id"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  importBatch: varchar("import_batch", { length: 50 }),
  transferReference: varchar("transfer_reference", { length: 50 }),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("bank_txn_org_account_date_idx").on(t.organizationId, t.bankAccountId, t.transactionDate),
]);

// ─── Bank Statements ────────────────────────────────────────
export const bankStatements = pgTable("bank_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  fileName: varchar("file_name", { length: 255 }),
  s3Key: text("s3_key"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isDemo: boolean("is_demo").notNull().default(false),
});

// ─── Bank Statement Lines ───────────────────────────────────
export const bankStatementLines = pgTable("bank_statement_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankStatementId: uuid("bank_statement_id")
    .notNull()
    .references(() => bankStatements.id, { onDelete: "cascade" }),
  transactionDate: date("transaction_date").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // credit, debit
  reference: varchar("reference", { length: 100 }),
  matchedBankTransactionId: uuid("matched_bank_transaction_id").references(() => bankTransactions.id, { onDelete: "set null" }),
  reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
  lineOrder: integer("line_order").notNull().default(0),
});

// ─── Tax Codes ──────────────────────────────────────────────
export const taxCodes = pgTable("tax_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  type: varchar("type", { length: 15 }).notNull(), // output, input, exempt, zero, reverse_charge
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("tax_codes_org_code_idx").on(t.organizationId, t.code),
]);

// ─── VAT Returns ────────────────────────────────────────────
export const vatReturns = pgTable("vat_returns", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  status: varchar("status", { length: 15 }).notNull().default("draft"), // draft, filed, amended
  outputVat: numeric("output_vat", { precision: 18, scale: 2 }).notNull().default("0"),
  inputVat: numeric("input_vat", { precision: 18, scale: 2 }).notNull().default("0"),
  netVat: numeric("net_vat", { precision: 18, scale: 2 }).notNull().default("0"),
  taxableSales: numeric("taxable_sales", { precision: 18, scale: 2 }).default("0"),
  exemptSales: numeric("exempt_sales", { precision: 18, scale: 2 }).default("0"),
  zeroRatedSales: numeric("zero_rated_sales", { precision: 18, scale: 2 }).default("0"),
  taxablePurchases: numeric("taxable_purchases", { precision: 18, scale: 2 }).default("0"),
  filedAt: timestamp("filed_at", { withTimezone: true }),
  filedBy: uuid("filed_by").references(() => users.id),
  notes: text("notes"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Employees (Payroll Foundation) ─────────────────────────
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  employeeNumber: varchar("employee_number", { length: 20 }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  position: varchar("position", { length: 100 }),
  department: varchar("department", { length: 100 }),
  joinDate: date("join_date"),
  basicSalary: numeric("basic_salary", { precision: 18, scale: 2 }),
  housingAllowance: numeric("housing_allowance", { precision: 18, scale: 2 }),
  transportAllowance: numeric("transport_allowance", { precision: 18, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── AI Classification Rules ────────────────────────────────
export const classificationRules = pgTable("classification_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  accountId: uuid("account_id").references(() => chartOfAccounts.id),
  taxCode: varchar("tax_code", { length: 20 }),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).default("1"),
  timesUsed: integer("times_used").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Document Vault (Zero-Entry / AI extraction) ───────────
export const documentStatuses = ["PENDING", "PROCESSED", "FLAGGED", "ARCHIVED", "PROCESSING_FAILED"] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const documentTypes = ["purchase_invoice", "sales_invoice", "receipt", "credit_note", "bank_statement"] as const;
export type DocumentType = (typeof documentTypes)[number];

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  s3Key: varchar("s3_key", { length: 512 }).notNull(),
  documentType: varchar("document_type", { length: 20 }), // purchase_invoice, sales_invoice, receipt, credit_note, bank_statement
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  aiConfidence: numeric("ai_confidence", { precision: 5, scale: 4 }), // 0.0 to 1.0, null for manual
  extractedData: jsonb("extracted_data"),
  lastError: text("last_error"), // for PROCESSING_FAILED
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Document-derived accounting entry (1:1 after verify)
export const documentTransactions = pgTable("document_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .unique()
    .references(() => documents.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  totalAmount: numeric("total_amount", { precision: 18, scale: 2 }).notNull(),
  vatAmount: numeric("vat_amount", { precision: 18, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  merchantName: varchar("merchant_name", { length: 255 }).notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  glAccountId: uuid("gl_account_id").references(() => chartOfAccounts.id), // null when using line-level GL
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Line items for multi-item expenses (document_transactions)
export const documentTransactionLines = pgTable("document_transaction_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentTransactionId: uuid("document_transaction_id")
    .notNull()
    .references(() => documentTransactions.id, { onDelete: "cascade" }),
  description: text("description").notNull().default(""),
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 18, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0"),
  taxCodeId: uuid("tax_code_id").references(() => taxCodes.id, { onDelete: "set null" }),
  glAccountId: uuid("gl_account_id")
    .notNull()
    .references(() => chartOfAccounts.id),
  lineOrder: integer("line_order").notNull().default(0),
});

// ─── Expenses (standalone direct payments) ──────────────────
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  expenseNumber: varchar("expense_number", { length: 30 }).notNull(),
  date: date("date").notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  supplierName: varchar("supplier_name", { length: 255 }),
  bankAccountId: uuid("bank_account_id")
    .notNull()
    .references(() => bankAccounts.id),
  description: text("description"),
  subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  reference: varchar("reference", { length: 100 }),
  journalEntryId: uuid("journal_entry_id"),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenseLines = pgTable("expense_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  expenseId: uuid("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  description: text("description").notNull().default(""),
  glAccountId: uuid("gl_account_id")
    .notNull()
    .references(() => chartOfAccounts.id),
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 18, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0"),
  taxCodeId: uuid("tax_code_id").references(() => taxCodes.id, { onDelete: "set null" }),
  lineOrder: integer("line_order").notNull().default(0),
});

// ─── Credit Notes (Sales & Purchase) ────────────────────────
export const creditNotes = pgTable("credit_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  creditNoteNumber: varchar("credit_note_number", { length: 30 }).notNull(),
  creditNoteType: varchar("credit_note_type", { length: 10 }).notNull(), // sales, purchase
  date: date("date").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  billId: uuid("bill_id").references(() => bills.id, { onDelete: "set null" }),
  reason: text("reason"),
  subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 18, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  status: varchar("status", { length: 15 }).notNull().default("draft"), // draft, confirmed, applied
  journalEntryId: uuid("journal_entry_id"),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditNoteLines = pgTable("credit_note_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  creditNoteId: uuid("credit_note_id")
    .notNull()
    .references(() => creditNotes.id, { onDelete: "cascade" }),
  description: text("description").notNull().default(""),
  accountId: uuid("account_id")
    .notNull()
    .references(() => chartOfAccounts.id),
  quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 18, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0"),
  taxCodeId: uuid("tax_code_id").references(() => taxCodes.id, { onDelete: "set null" }),
  lineOrder: integer("line_order").notNull().default(0),
});

// ─── Team Invites ──────────────────────────────────────────
export const teamInvites = pgTable("team_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("accountant"),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Smart Learning: merchant → GL preference per org
export const merchantMaps = pgTable(
  "merchant_maps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    merchantName: varchar("merchant_name", { length: 255 }).notNull(),
    glAccountId: uuid("gl_account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull().default("1"),
    lastUsed: timestamp("last_used", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("merchant_maps_org_merchant_idx").on(t.organizationId, t.merchantName)]
);

// ─── Notifications ─────────────────────────────────────────
export const NOTIFICATION_CATEGORIES = ["billing", "team", "documents", "reports", "promo"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // null = org-wide
  category: varchar("category", { length: 20 }).notNull(), // billing, team, documents, reports, promo
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  icon: varchar("icon", { length: 30 }), // lucide icon name
  actionUrl: varchar("action_url", { length: 512 }), // deep link
  actionLabel: varchar("action_label", { length: 50 }), // CTA text
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── PDF Templates ──────────────────────────────────────────
export const PDF_DOCUMENT_TYPES = [
  "invoice", "bill", "credit_note", "statement",
  "profit_and_loss", "balance_sheet", "vat_audit", "inventory_valuation",
] as const;
export type PdfDocumentType = (typeof PDF_DOCUMENT_TYPES)[number];

export const pdfTemplates = pgTable("pdf_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  documentType: varchar("document_type", { length: 30 }).notNull(),
  baseTemplateId: varchar("base_template_id", { length: 50 }),
  htmlBody: text("html_body").notNull(),
  customCss: text("custom_css"),
  headerHtml: text("header_html"),
  footerHtml: text("footer_html"),
  watermark: varchar("watermark", { length: 100 }),
  pageSize: varchar("page_size", { length: 10 }).notNull().default("A4"),
  orientation: varchar("orientation", { length: 10 }).notNull().default("portrait"),
  marginTop: varchar("margin_top", { length: 10 }).default("15mm"),
  marginRight: varchar("margin_right", { length: 10 }).default("15mm"),
  marginBottom: varchar("margin_bottom", { length: 10 }).default("20mm"),
  marginLeft: varchar("margin_left", { length: 10 }).default("15mm"),
  accentColor: varchar("accent_color", { length: 7 }).default("#1a1a2e"),
  fontFamily: varchar("font_family", { length: 100 }).default("Plus Jakarta Sans"),
  showSections: jsonb("show_sections").$type<{ terms: boolean; notes: boolean; payment: boolean; signature: boolean; qrCode: boolean }>(),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Document Type Defaults (per-doc-type default content) ──
export const documentTypeDefaults = pgTable("document_type_defaults", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  documentType: varchar("document_type", { length: 30 }).notNull(),
  defaultTerms: text("default_terms"),
  defaultNotes: text("default_notes"),
  defaultPaymentInfo: text("default_payment_info"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Document Type PDF Settings (per-doc-type appearance for built-in templates) ──
export const documentTypePdfSettings = pgTable("document_type_pdf_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  documentType: varchar("document_type", { length: 30 }).notNull(),
  pageSize: varchar("page_size", { length: 10 }).default("A4"),
  orientation: varchar("orientation", { length: 10 }).default("portrait"),
  marginTop: varchar("margin_top", { length: 10 }).default("15mm"),
  marginRight: varchar("margin_right", { length: 10 }).default("15mm"),
  marginBottom: varchar("margin_bottom", { length: 10 }).default("20mm"),
  marginLeft: varchar("margin_left", { length: 10 }).default("15mm"),
  accentColor: varchar("accent_color", { length: 7 }).default("#1a1a2e"),
  fontFamily: varchar("font_family", { length: 100 }).default("Plus Jakarta Sans"),
  showSections: jsonb("show_sections").$type<{ terms: boolean; notes: boolean; payment: boolean; signature: boolean; qrCode: boolean }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Email Templates ────────────────────────────────────────
export const EMAIL_DOCUMENT_TYPES = [
  "invoice", "bill", "statement", "payment_receipt", "payment_reminder", "overdue_notice",
] as const;
export type EmailDocumentType = (typeof EMAIL_DOCUMENT_TYPES)[number];

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  documentType: varchar("document_type", { length: 30 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlBody: text("html_body").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Sent Emails ────────────────────────────────────────────
export const sentEmails = pgTable("sent_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sentBy: uuid("sent_by").references(() => users.id, { onDelete: "set null" }),
  documentType: varchar("document_type", { length: 30 }).notNull(),
  documentId: uuid("document_id"),
  documentNumber: varchar("document_number", { length: 50 }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  ccEmails: text("cc_emails"),
  bccEmails: text("bcc_emails"),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlBody: text("html_body").notNull(),
  hasAttachment: boolean("has_attachment").notNull().default(true),
  attachmentFilename: varchar("attachment_filename", { length: 255 }),
  resendEmailId: varchar("resend_email_id", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  emailTemplateId: uuid("email_template_id"),
  pdfTemplateId: varchar("pdf_template_id", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Contact Credits (overpayments + credit notes) ──────────
export const contactCredits = pgTable("contact_credits", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  contactType: varchar("contact_type", { length: 10 }).notNull(), // "customer" | "supplier"
  contactId: uuid("contact_id").notNull(),
  sourceType: varchar("source_type", { length: 20 }).notNull(), // "overpayment" | "credit_note"
  sourceId: uuid("source_id").notNull(),
  originalAmount: numeric("original_amount", { precision: 15, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  description: varchar("description", { length: 255 }),
  creditDate: varchar("credit_date", { length: 10 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("contact_credits_org_type_contact_idx").on(t.organizationId, t.contactType, t.contactId),
]);

// ─── Credit Applications ────────────────────────────────────
export const creditApplications = pgTable("credit_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  creditId: uuid("credit_id")
    .notNull()
    .references(() => contactCredits.id, { onDelete: "cascade" }),
  documentType: varchar("document_type", { length: 10 }).notNull(), // "invoice" | "bill"
  documentId: uuid("document_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  journalEntryId: uuid("journal_entry_id"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  appliedBy: uuid("applied_by").references(() => users.id, { onDelete: "set null" }),
});
