"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatNumber } from "@/lib/accounting/engine";
import { Upload, Plus, Loader2, Landmark, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddBankAccountPanel } from "@/components/modals/add-bank-account-panel";
import { BankAccountCard } from "@/components/banking/bank-account-card";

type BankAccount = { id: string; accountType?: string; accountName: string; bankName: string; accountNumber?: string; iban: string; swiftCode?: string | null; currency: string; currentBalance: number; isActive: boolean };
type BankTransaction = { id: string; bankAccountId: string; transactionDate: string; amount: number; type: "debit" | "credit"; isReconciled: boolean };
type AccountType = "bank" | "credit_card";

function AccountSection({
  title,
  icon: Icon,
  accounts,
  allTransactions,
  emptyLabel,
  emptyHint,
        addLabel,
        onAdd,
        onAccountClick,
        onSettingsClick,
        loading,
      }: {
  title: string;
  icon: React.ElementType;
  accounts: BankAccount[];
  allTransactions: BankTransaction[];
  emptyLabel: string;
  emptyHint: string;
  addLabel: string;
  onAdd: () => void;
  onAccountClick: (id: string) => void;
  onSettingsClick?: (account: BankAccount) => void;
  loading: boolean;
}) {
  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const currency = accounts[0]?.currency ?? "AED";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-text-primary/5">
            <Icon className="h-4 w-4 text-text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">{title}</h2>
            {accounts.length > 0 && (
              <span className="text-[13px] text-text-meta">
                Total: <span className="font-semibold text-text-primary">{currency} {formatNumber(totalBalance)}</span>
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onAdd}
          className="h-9 gap-1.5 rounded-xl border-dashed border-border-subtle text-[12px] font-medium text-text-secondary hover:border-text-primary/30 hover:bg-text-primary/5 hover:text-text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading && accounts.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-8 text-text-secondary text-[13px]">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
          </div>
        ) : accounts.length === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="text-left dashboard-card border-l-[3px] border-l-transparent border-2 border-dashed border-border-subtle hover:border-[var(--accent-ai)]/50 hover:bg-text-primary/[0.03] transition-all min-h-[180px] flex flex-col items-center justify-center gap-3 py-8"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted/60">
              <Plus className="h-7 w-7 text-text-meta" strokeWidth={2} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[14px] font-semibold text-text-primary">{emptyLabel}</p>
              <p className="text-[12px] text-text-meta max-w-[180px]">{emptyHint}</p>
            </div>
          </button>
        ) : (
          accounts.map((account) => (
            <BankAccountCard
              key={account.id}
              id={account.id}
              accountName={account.accountName}
              bankName={account.bankName}
              accountType={(account.accountType as AccountType) ?? "bank"}
              currency={account.currency}
              currentBalance={account.currentBalance}
              isActive={account.isActive}
              transactions={allTransactions}
              onClick={() => onAccountClick(account.id)}
              onSettingsClick={onSettingsClick ? () => onSettingsClick(account) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function BankingAccountsPage() {
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [allTransactions, setAllTransactions] = useState<BankTransaction[]>([]);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addAccountType, setAddAccountType] = useState<AccountType>("bank");
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const bankOnly = useMemo(() => bankAccounts.filter((a) => (a.accountType ?? "bank") === "bank"), [bankAccounts]);
  const creditCardsOnly = useMemo(() => bankAccounts.filter((a) => a.accountType === "credit_card"), [bankAccounts]);

  const openAddPanel = (type: AccountType) => {
    setAddAccountType(type);
    setAddAccountOpen(true);
  };

  const refreshBanking = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    fetch("/api/banking", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error ?? `API returned ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        setBankAccounts(data.accounts ?? []);
        setAllTransactions(data.transactions ?? []);
      })
      .catch((err) => {
        console.error("[Banking] fetch error:", err);
        setFetchError(err?.message ?? "Failed to load accounts");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshBanking();
  }, []);

  return (
    <div className="space-y-10">
      {/* Top actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={() => router.push("/documents?upload=bank_statement")}
          className="h-10 gap-2 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-white hover:bg-text-primary/90"
        >
          <Upload className="h-4 w-4" /> Import Statement
        </Button>
      </div>

      {fetchError && (
        <div className="dashboard-card border-l-4 border-l-destructive">
          <p className="text-[13px] text-destructive font-medium">{fetchError}</p>
          <Button variant="outline" size="sm" onClick={refreshBanking} className="mt-2 rounded-xl text-[12px]">Retry</Button>
        </div>
      )}

      {/* Bank Accounts section */}
      <AccountSection
        title="Bank Accounts"
        icon={Landmark}
        accounts={bankOnly}
        allTransactions={allTransactions}
        emptyLabel="Add Bank Account"
        emptyHint="Connect your first bank account to start reconciling"
        addLabel="Add Bank Account"
        onAdd={() => openAddPanel("bank")}
        onAccountClick={(id) => router.push(`/banking/accounts/${id}`)}
        onSettingsClick={(account) => setEditAccount(account)}
        loading={loading}
      />

      {/* Credit Cards section */}
      <AccountSection
        title="Credit Cards"
        icon={CreditCard}
        accounts={creditCardsOnly}
        allTransactions={allTransactions}
        emptyLabel="Add Credit Card"
        emptyHint="Track credit card spending and reconcile statements"
        addLabel="Add Credit Card"
        onAdd={() => openAddPanel("credit_card")}
        onAccountClick={(id) => router.push(`/banking/accounts/${id}`)}
        onSettingsClick={(account) => setEditAccount(account)}
        loading={loading}
      />

      <AddBankAccountPanel
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        defaultAccountType={addAccountType}
        onSuccess={(account) => {
          refreshBanking();
          router.push(`/banking/accounts/${account.id}`);
        }}
      />

      <AddBankAccountPanel
        open={!!editAccount}
        onOpenChange={(open) => !open && setEditAccount(null)}
        account={editAccount}
        onSuccess={() => {
          refreshBanking();
          setEditAccount(null);
        }}
      />
    </div>
  );
}
