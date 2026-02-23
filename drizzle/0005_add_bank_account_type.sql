-- Add account_type to bank_accounts for segregating bank vs credit card accounts
ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "account_type" varchar(20) NOT NULL DEFAULT 'bank';
