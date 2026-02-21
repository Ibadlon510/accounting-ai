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
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Subscription plan for token economy (MVP)
export const SUBSCRIPTION_PLANS = ["FREELANCER", "BUSINESS", "ENTERPRISE", "ARCHIVE"] as const;
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
  subscriptionPlan: varchar("subscription_plan", { length: 20 }).notNull().default("FREELANCER"),
  tokenBalance: integer("token_balance").notNull().default(50),
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
});

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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
});

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
  amountDue: numeric("amount_due", { precision: 18, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  journalEntryId: uuid("journal_entry_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("5"),
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
  amountDue: numeric("amount_due", { precision: 18, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  journalEntryId: uuid("journal_entry_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("5"),
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
  taxCode: varchar("tax_code", { length: 20 }).default("VAT5"),
  salesAccountId: uuid("sales_account_id").references(() => chartOfAccounts.id),
  purchaseAccountId: uuid("purchase_account_id").references(() => chartOfAccounts.id),
  inventoryAccountId: uuid("inventory_account_id").references(() => chartOfAccounts.id),
  trackInventory: boolean("track_inventory").notNull().default(true),
  quantityOnHand: numeric("quantity_on_hand", { precision: 18, scale: 4 }).default("0"),
  reorderLevel: numeric("reorder_level", { precision: 18, scale: 4 }),
  isActive: boolean("is_active").notNull().default(true),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Bank Accounts ──────────────────────────────────────────
export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  bankName: varchar("bank_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 50 }),
  iban: varchar("iban", { length: 50 }),
  swiftCode: varchar("swift_code", { length: 20 }),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  ledgerAccountId: uuid("ledger_account_id").references(() => chartOfAccounts.id),
  currentBalance: numeric("current_balance", { precision: 18, scale: 2 }).default("0"),
  isActive: boolean("is_active").notNull().default(true),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
});

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

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  s3Key: varchar("s3_key", { length: 512 }).notNull(),
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
  glAccountId: uuid("gl_account_id")
    .notNull()
    .references(() => chartOfAccounts.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
