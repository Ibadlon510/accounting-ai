---
name: Dashboard Pill
overview: Add a dashboard pill on Sales, Purchases, Documents, Inventory, and Banking pages. The pill opens a context-aware popover with metrics, bar/line/pie/scatter charts, and tables. Users can hide widgets and save preferences (localStorage).
todos: []
isProject: false
---

# Dashboard Pill Implementation

## Architecture

```mermaid
flowchart TB
    subgraph pages [Pages with Dashboard Pill]
        Sales[Sales]
        Purchases[Purchases]
        Documents[Documents]
        Inventory[Inventory]
        Banking[Banking]
    end
    
    subgraph component [Shared Component]
        Pill[DashboardPill]
        Popover[Popover]
        Content[MiniDashboardContent]
        Customize[DashboardCustomizePanel]
        Prefs[useDashboardPillPreferences]
    end
    
    subgraph storage [Storage]
        LocalStorage[localStorage]
    end
    
    subgraph variants [Content by Path]
        SalesContent[Sales: Revenue, Invoices, Customers]
        PurchContent[Purchases: Expenses, Bills, Suppliers]
        DocContent[Documents: Pending, Verified, Recent]
        InvContent[Inventory: Items, Value, Low Stock]
        BankContent[Banking: Balance, Unreconciled, Txns]
    end
    
    subgraph api [APIs]
        Stats[/api/dashboard/stats]
        SalesAPI[/api/sales/mini-stats]
        PurchAPI[/api/purchases/mini-stats]
        DocAPI[/api/documents/mini-stats]
        InvAPI[/api/inventory/mini-stats]
        BankAPI[/api/banking/mini-stats]
    end
    
    Sales --> Pill
    Purchases --> Pill
    Documents --> Pill
    Inventory --> Pill
    Banking --> Pill
    
    Pill --> Popover
    Popover --> Content
    Content --> Customize
    Content --> Prefs
    Prefs --> LocalStorage
    Customize --> Prefs
    
    Content -->|path sales| SalesContent
    Content -->|path purchases| PurchContent
    Content -->|path documents| DocContent
    Content -->|path inventory| InvContent
    Content -->|path banking| BankContent
    
    SalesContent --> Stats
    SalesContent --> SalesAPI
    PurchContent --> Stats
    PurchContent --> PurchAPI
    DocContent --> Stats
    DocContent --> DocAPI
    InvContent --> Stats
    InvContent --> InvAPI
    BankContent --> Stats
    BankContent --> BankAPI
```



---

## 1. Dashboard Composition Per Page

The Dashboard Pill renders **context-aware content** based on the current page. Each widget can be hidden by the user; preferences are persisted. All widgets below are included by default unless hidden.

### Sales — `/sales`, `/sales/*`


| Widget ID         | Type      | Description                                      |
| ----------------- | --------- | ------------------------------------------------ |
| `metricsRow`      | Metrics   | Revenue, Outstanding, Overdue, Invoices          |
| `avgInvoiceValue` | Metric    | AED per invoice                                  |
| `collectionRate`  | Metric    | Paid / Total as %                                |
| `yoyGrowth`       | Metric    | Revenue vs same period last year %               |
| `barChart`        | Bar       | Monthly revenue (last 6 months)                  |
| `revenueTrend`    | Line      | Cumulative / rolling revenue trend               |
| `pieChart`        | Pie       | Invoice status (draft/sent/paid/partial/overdue) |
| `topCustomers`    | Table     | Top 5 customers by revenue                       |
| `topProducts`     | Table/Bar | Top products by revenue (from invoice lines)     |
| `scatterChart`    | Scatter   | Invoice amount vs due date                       |


### Purchases — `/purchases`, `/purchases/*`


| Widget ID              | Type             | Description                        |
| ---------------------- | ---------------- | ---------------------------------- |
| `metricsRow`           | Metrics          | Expenses, Outstanding, Paid, Bills |
| `avgBillValue`         | Metric           | AED per bill                       |
| `paymentRate`          | Metric           | Paid / Total as %                  |
| `upcomingPayables`     | Metric           | Bills due in 7 days / 30 days      |
| `supplierCountTrend`   | Metric/Sparkline | Supplier count change              |
| `barChart`             | Bar              | Monthly expenses (last 6 months)   |
| `pieChart`             | Pie              | Bill status breakdown              |
| `topExpenseCategories` | Pie/Bar          | By GL account from bill lines      |
| `topSuppliers`         | Table            | Top 5 suppliers by total           |


### Documents — `/documents`


| Widget ID           | Type    | Description                            |
| ------------------- | ------- | -------------------------------------- |
| `metricsRow`        | Metrics | Pending, Verified, Flagged, Total      |
| `successRate`       | Metric  | Verified / (Verified + Failed) %       |
| `avgConfidence`     | Metric  | Mean AI confidence of processed docs   |
| `oldestPending`     | Metric  | Age in days of oldest unprocessed doc  |
| `barChart`          | Bar     | Documents processed per month          |
| `processingByMonth` | Bar     | Processed vs failed per month          |
| `pieChart`          | Pie     | Document status                        |
| `documentsByType`   | Pie     | Invoice, receipt, bill, bank statement |
| `recentDocuments`   | Table   | 5 most recent documents                |


### Inventory — `/inventory`


| Widget ID           | Type    | Description                           |
| ------------------- | ------- | ------------------------------------- |
| `metricsRow`        | Metrics | Items, Products, Value, Low Stock     |
| `reorderAlerts`     | Metric  | Items at or below reorder level       |
| `stockOutRisk`      | Metric  | Items at 0 or negative stock          |
| `inventoryTurnover` | Metric  | COGS / avg inventory (if data exists) |
| `barChart`          | Bar     | Inventory value trend (last 6 months) |
| `pieChart`          | Pie     | Product vs Service split              |
| `valueByCategory`   | Pie/Bar | Value by category                     |
| `topItemsByValue`   | Table   | Top 5 items by value                  |
| `lowStockTable`     | Table   | Low stock items                       |


### Banking — `/banking`


| Widget ID             | Type        | Description                        |
| --------------------- | ----------- | ---------------------------------- |
| `metricsRow`          | Metrics     | Balance, Unreconciled, Accounts    |
| `reconciliationRate`  | Metric      | Reconciled / Total transactions %  |
| `inVsOutThisMonth`    | Dual metric | Incoming vs outgoing cash          |
| `pendingAiMatches`    | Metric      | Transactions with AI suggestions   |
| `barChart`            | Bar         | Cash flow (in/out) by month        |
| `balanceTrend`        | Line        | Account balance over last 6 months |
| `pieChart`            | Pie         | Balance per bank account           |
| `recentTransactions`  | Table       | 5 most recent transactions         |
| `largestTransactions` | Table       | Top 5 by amount                    |


---

## 1b. User Preference: Hide/Show Widgets

Users can hide any widget and save their preference. Preferences persist across sessions.

### Behavior

- **Customize button:** Gear/settings icon in the popover header opens a "Customize dashboard" panel
- **Widget toggles:** Each widget has a checkbox; unchecked = hidden
- **Save:** Changes apply immediately and persist to storage
- **Reset:** "Reset to default" restores all widgets visible

### Storage

- **Key:** `dashboard-pill-preferences` in `localStorage`
- **Shape:** `Record<variant, Record<widgetId, boolean>>` — e.g. `{ sales: { barChart: true, scatterChart: false }, purchases: { ... } }`
- **Optional later:** Add `user_preferences` table or `organizations.dashboardPillPreferences` JSONB for cross-device sync

### Implementation

- **Hook:** `useDashboardPillPreferences(variant)` — returns `{ visible, setVisible, reset }`
- **Component:** `DashboardWidget` wrapper — renders children only if `visible[widgetId] !== false`
- **Customize panel:** Inline in popover or small modal; list all widget IDs for current variant with checkboxes

---

## 2. New APIs for Mini Stats

Each module gets a mini-stats endpoint returning chart-ready data. Existing `[/api/dashboard/stats](src/app/api/dashboard/stats/route.ts)` provides aggregate metrics. Extend or add fields for the new widgets.


| Endpoint      | Additional response fields (beyond base)                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Sales**     | `avgInvoiceValue`, `collectionRate`, `yoyGrowth`, `revenueTrend`, `topProducts`, `scatterData`                           |
| **Purchases** | `avgBillValue`, `paymentRate`, `upcomingPayables7d`, `upcomingPayables30d`, `supplierCountTrend`, `topExpenseCategories` |
| **Documents** | `successRate`, `avgConfidence`, `oldestPendingDays`, `processingByMonth`, `documentsByType`                              |
| **Inventory** | `reorderAlerts`, `stockOutRisk`, `turnover`, `valueByCategory`, `topItemsByValue`                                        |
| **Banking**   | `reconciliationRate`, `inVsOutThisMonth`, `pendingAiMatches`, `balanceTrend`, `largestTransactions`                      |


**Files to create:**

- `src/app/api/sales/mini-stats/route.ts`
- `src/app/api/purchases/mini-stats/route.ts`
- `src/app/api/documents/mini-stats/route.ts`
- `src/app/api/inventory/mini-stats/route.ts`
- `src/app/api/banking/mini-stats/route.ts`

---

## 3. MiniDashboardContent Component

**File:** `src/components/dashboard/dashboard-pill-content.tsx` (new)

Accepts `variant` prop: `"sales" | "purchases" | "documents" | "inventory" | "banking"`. Uses `usePathname()` if variant not passed.

**Layout:** ~450-550px wide, scrollable. Header: title + Customize (gear) icon. Each widget wrapped in `DashboardWidget` — renders only if `visible[widgetId]` is true.

**Widgets:** Render all widgets from section 1 for the current variant, wrapped with visibility check. Order: metrics row → extra metrics → bar/line charts → pie charts → tables → scatter (if any) → footer.

**Reuse:** [IncomeChart](src/components/charts/income-chart.tsx), [ForecastBarChart](src/components/charts/forecast-bar-chart.tsx), [ExpenseDonut](src/components/charts/expense-donut.tsx). Add compact variants. Use Recharts for Line, Scatter, dual-series Bar.

### Supporting components

- `**DashboardWidget`** — Wrapper: `if (visible) return children; else return null`
- `**DashboardCustomizePanel`** — List of widget IDs with checkboxes, Reset button, uses `useDashboardPillPreferences`

---

## 4. DashboardPill Component

**File:** `src/components/dashboard/dashboard-pill.tsx` (new)

- **Trigger:** Pill button (matches existing pill style: `rounded-full px-4 py-2`, icon + "Dashboard" label)
- **Container:** Radix `Popover` with `align="end"`, `side="bottom"`, large content area
- **Content:** Renders `MiniDashboardContent` with `variant` derived from `usePathname()` (e.g. `/sales` → `"sales"`)
- **Path mapping:** Match pathname prefix: `/sales`, `/sales/`* → sales; `/purchases`, `/purchases/`* → purchases; `/documents` → documents; `/inventory` → inventory; `/banking` → banking

Reference pill styling from [Sales layout](src/app/(dashboard)/sales/layout.tsx) (lines 37-45): `rounded-full px-4 py-2`.

---

## 5. Placement Across Pages

### Sales Layout

**File:** [src/app/(dashboard)/sales/layout.tsx](src/app/(dashboard)/sales/layout.tsx)

Add `DashboardPill` as the first pill in the nav (before Invoices): "Dashboard". On click, opens popover with mini dashboard.

### Purchases Layout

**File:** [src/app/(dashboard)/purchases/layout.tsx](src/app/(dashboard)/purchases/layout.tsx)

Add `DashboardPill` as an additional pill at the start: "Dashboard" — same component.

### Documents Page

**File:** [src/app/(dashboard)/documents/page.tsx](src/app/(dashboard)/documents/page.tsx)

Add `DashboardPill` in the header row (e.g., next to "Document Vault" or in the filter/toolbar area). Use `PageHeader` action slot if available, or a flex row above content.

### Inventory Page

**File:** [src/app/(dashboard)/inventory/page.tsx](src/app/(dashboard)/inventory/page.tsx)

Add `DashboardPill` in the toolbar row (next to search and "Add Item" button).

### Banking Page

**File:** [src/app/(dashboard)/banking/page.tsx](src/app/(dashboard)/banking/page.tsx)

Add `DashboardPill` in the header/toolbar area, consistent with Documents/Inventory.

---

## 6. UI Primitives

- **Popover:** Use Radix `Popover` (from shadcn); add via `npx shadcn add popover` if not present.
- **Charts:** Recharts — BarChart, PieChart, LineChart, ScatterChart. Compact variants (~120-150px height) for mini dashboard.

---

## 7. File Summary


| Action | File                                                     |
| ------ | -------------------------------------------------------- |
| Create | `src/app/api/sales/mini-stats/route.ts`                  |
| Create | `src/app/api/purchases/mini-stats/route.ts`              |
| Create | `src/app/api/documents/mini-stats/route.ts`              |
| Create | `src/app/api/inventory/mini-stats/route.ts`              |
| Create | `src/app/api/banking/mini-stats/route.ts`                |
| Create | `src/components/dashboard/dashboard-pill.tsx`            |
| Create | `src/components/dashboard/dashboard-pill-content.tsx`    |
| Create | `src/components/dashboard/dashboard-widget.tsx`          |
| Create | `src/components/dashboard/dashboard-customize-panel.tsx` |
| Create | `src/hooks/use-dashboard-pill-preferences.ts`            |
| Edit   | `src/app/(dashboard)/sales/layout.tsx`                   |
| Edit   | `src/app/(dashboard)/purchases/layout.tsx`               |
| Edit   | `src/app/(dashboard)/documents/page.tsx`                 |
| Edit   | `src/app/(dashboard)/inventory/page.tsx`                 |
| Edit   | `src/app/(dashboard)/banking/page.tsx`                   |


---

## 8. Empty State

Each variant handles empty data gracefully:

- **Sales:** "No invoices yet", zero metrics, empty table
- **Purchases:** "No bills yet", zero metrics, empty table
- **Documents:** "No documents yet", zero metrics, empty table
- **Inventory:** "No items yet", zero metrics, empty table
- **Banking:** "No transactions yet", zero balance, empty table

All mini-stats APIs return empty arrays and zeros when no data exists.

---

## 9. Widget IDs Reference

For the preferences schema, each variant uses these widget IDs (see section 1). The customize panel shows human-readable labels, e.g. "Monthly revenue" for `barChart`, "Invoice amount vs due date" for `scatterChart`.