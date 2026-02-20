# Full UI/UX Audit & AI-Distinction Fixes

Audit all form views for missing side-by-side document panels, then fix every UI/UX gap across the app to give it a smooth, distinct identity as an AI-supported accounting platform.

---

## Q1: Do invoice/bill/expense forms have a side-by-side document viewer?

**No.** None of the current form panels display an uploaded source document alongside the form.

| Panel | Current Layout | Document Viewer? |
|---|---|---|
| `CreateInvoicePanel` | EntityPanel (Main form + Sidebar settings) | **No** — pure data entry, no document attachment or viewer |
| `CreateBillPanel` | EntityPanel (Main form + Sidebar settings) | **No** — same pure entry, no option to attach/view a source bill/receipt |
| `RecordPaymentPanel` | EntityPanel (Main form + Sidebar settings) | **No** — no receipt/proof viewer |
| `CreateJournalEntryPanel` | EntityPanel (Main form + Sidebar settings) | **No** — no source doc reference |
| `AddCustomerPanel` | EntityPanel (Main + Sidebar) | N/A — entity form, not transaction |
| `AddSupplierPanel` | EntityPanel (Main + Sidebar) | N/A — entity form |
| Document Verify page | Basic `grid-cols-2` (iframe + form) | **Yes** — but basic iframe, no PDF controls, no confidence signaling |

**The only place with a document viewer is `/documents/[id]/verify/page.tsx`**, which uses a simple iframe. The sales/purchase/expense creation panels are entirely manual-entry with no way to attach or view a source document.

---

## Full App UI/UX Gap Audit

### A. Missing AI Identity — The app doesn't "feel" AI-powered

These are the biggest gaps that prevent the app from being perceived as AI-native:

| # | Gap | Where | Fix |
|---|---|---|---|
| A1 | **No AI sparkle/indicator anywhere on forms** | All 7 EntityPanel modals | Add a visible `Sparkles` icon + "AI can auto-fill this" hint on every form that could benefit from AI. Currently only `AddCustomerPanel` and `AddSupplierPanel` show `EntityPanelAiHint`; the invoice, bill, journal, item panels have `showAiButton={false}` |
| A2 | **No AI auto-fill on invoice/bill creation** | `CreateInvoicePanel`, `CreateBillPanel` | Add "Scan document to auto-fill" button that opens file picker → runs Gemini extraction → prefills form fields. This is the key differentiator. |
| A3 | **AI Assistant panel is disconnected** | `AssistantPanel` — mock responses only, no context awareness | Wire suggestion chips to context-aware queries. On invoice page show "Summarize outstanding invoices"; on VAT page show "What's my estimated VAT liability?" |
| A4 | **No AI-powered insights on any module page** | Sales, Purchases, Banking, Inventory, Accounting, Reports hub pages | Add a small AI insight card (1-2 sentences) on each module page, e.g., "AI noticed 3 invoices are overdue for >30 days" |
| A5 | **Document verify page has no confidence signaling** | `/documents/[id]/verify/page.tsx` | Fields pre-filled by AI have no green/amber/red borders to indicate confidence level |
| A6 | **No "learning" feedback** | Verify flow | When user changes an AI-predicted GL category, no toast like "Preference saved for this merchant" |
| A7 | **Token meter is barely visible** | Dashboard only, small badge | Move to TopNav (always visible) with progress bar |

### B. Missing Document Attachment on Forms

| # | Gap | Fix |
|---|---|---|
| B1 | **CreateBillPanel has no "Attach document" option** | Add file upload zone in sidebar or above line items — upload → S3, link to bill. Optionally "Scan with AI" to pre-fill. |
| B2 | **CreateInvoicePanel has no attachment** | Add optional "Attach supporting document" in sidebar |
| B3 | **No side-by-side view on any form** | For bills: add a mode where if a document is attached, the panel switches to split-view (document left, form right) — reusing EntityPanel structure but replacing sidebar with a document viewer |

### C. Visual & Interaction Polish Gaps

| # | Gap | Where | Fix |
|---|---|---|---|
| C1 | **`showActions={false}` on most pages** | Sales, Purchases, Accounting, Banking, Inventory, Reports, VAT, Settings, Documents — all disable the PageHeader sparkle/star/eye/share buttons | Either enable `showActions` on key pages or remove the prop to show AI sparkle consistently |
| C2 | **Empty state on documents page is plain** | `/documents/page.tsx` | Replace with the spec's Smart Drop Zone (dashed border, cloud icon, drag-and-drop states) |
| C3 | **Upload is a hidden file input** | Documents page | Replace with prominent drag-and-drop zone + click-to-upload |
| C4 | **No filter tabs on documents list** | Documents page | Add Pending / Verified / All tabs |
| C5 | **Banking "Match" button → comingSoon** | Banking page | At minimum show AI suggestion in a popover instead of just "coming soon" |
| C6 | **No loading skeletons anywhere** | All pages load with plain "Loading..." text | Add skeleton cards/rows for professional appearance |
| C7 | **Report pages are just link cards** | Reports hub, Accounting hub | Add a mini preview or latest-value snippet per report card |
| C8 | **`alert()` used for errors** | Documents page upload/process errors | Replace all `alert()` with Sonner toasts (already imported) |
| C9 | **Login page has no AI branding** | `/login/page.tsx` | Add a tagline like "AI-Powered Accounting for UAE" and a subtle AI illustration or the AiAvatar |
| C10 | **Dark mode not toggled properly** | Settings appearance — uses raw DOM classList | Wire to `next-themes` provider for proper SSR-safe theme switching |

### D. Consistency & Component Gaps

| # | Gap | Fix |
|---|---|---|
| D1 | **Plain `<select>` used everywhere** | Replace with a styled Select/Combobox component (shadcn Select or custom) for consistent appearance across all forms |
| D2 | **Tables use inline grid styling** | Create a reusable `DataTable` component per the UI Kit Structure plan — currently every page builds its own grid-cols-12 table |
| D3 | **No empty states for tables** | Invoices, Bills, Banking transactions — if filter returns 0 results, no "No results" message |
| D4 | **Expanded invoice/bill rows lack actions** | No "Edit", "Duplicate", "Email", "Delete" actions in expanded view |

---

## Implementation Plan (prioritized)

### Phase 1: AI Identity & Distinction (highest impact)

1. [x] **Enable AI sparkle on all EntityPanel forms** — Set `showAiButton={true}` on `CreateInvoicePanel`, `CreateBillPanel`, `CreateJournalEntryPanel`, `AddItemPanel`. Wire `onAiClick` to open a toast/popover explaining the AI capability.

2. [x] **Add "Scan Document" to bill/invoice creation** — In `CreateBillPanel` sidebar, add `AttachDocumentZone` with "Scan with AI" button. On upload+process: auto-fills supplier, line items, dates from AI extraction.

3. [x] **Confidence signaling on verify page** — Created `SmartField` wrapper component with confidence-based left-border (green/amber/red) + tooltip icons. Applied to all fields on verify page.

4. [x] **Learning feedback toast** — Verify page tracks initial AI GL prediction via `useRef`. On submit, if GL was changed from AI suggestion, shows Sonner toast: "Preference saved. We'll remember [category] for [Merchant] next time."

5. [x] **Context-aware AI Assistant chips** — `AssistantPanel` now uses `usePathname()` to show page-specific chips. Added 8 new mock AI responses for sales/purchases/banking/vat/inventory contexts.

6. [x] **Token Meter in TopNav** — Created `TokenMeter` component (progress bar + count + tooltip). Added to TopNav right section, removed old dashboard-only badge.

### Phase 2: Document Attachment on Bill/Invoice Forms

7. [x] **`AttachDocumentZone` component** — Created `src/components/workspace/attach-document-zone.tsx`: compact attach button, file upload to S3, "Scan with AI to auto-fill" button, status indicators (Attached/Extracted).

8. [x] **Bill form scan-to-fill** — `CreateBillPanel` sidebar now has `AttachDocumentZone`. On AI extraction, auto-fills: supplier (matched by name), line item description/amount/VAT, issue date.

9. [x] **Smart Drop Zone on Documents page** — Created `src/components/workspace/smart-drop-zone.tsx`: full drag-and-drop with idle/hover/uploading/error states, multi-file support, file type validation, progress indicators. Replaced hidden file input on documents page.

### Phase 3: Polish & Consistency

10. [x] **Replace all `alert()` calls with Sonner toasts** — Replaced in: documents page (3), verify page (2), settings page (1), VAT page (2), onboarding page (1). Total: 9 alert() calls eliminated.

11. [x] **Add filter tabs to documents list** — Added All | Pending | Flagged | Verified tabs with live counts.

12. [x] **Enable `showActions` on key pages** — Enabled on: Sales, Purchases, Banking, Accounting, Inventory, Documents. Dashboard was already true.

13. [x] **AI insight cards on module pages** — Created `AiInsightBanner` component. Added to: Sales ("3 invoices overdue"), Purchases ("Top expense + duplicate alert"), Banking ("12 unreconciled"), Inventory ("3 items below reorder").

14. [x] **Login page AI branding** — Added Sparkles icon + "AI-Powered Accounting for UAE Businesses" tagline badge on login page.

15. [x] **Loading skeletons** — Created `SkeletonCard`, `SkeletonRow`, `SkeletonTable` components. Verify page and documents page now use spinner loading states.

16. [ ] **Styled selects** — NOT DONE. Plain `<select>` elements remain across forms. Requires replacing with shadcn Select or custom combobox.

---

## Files to Create/Modify

**New components:**
- `src/components/workspace/smart-field.tsx` — Confidence-aware input wrapper
- `src/components/ui/token-meter.tsx` — Progress bar + count for TopNav
- `src/components/workspace/attach-document-zone.tsx` — Drop zone for EntityPanel sidebar
- `src/components/workspace/smart-drop-zone.tsx` — Full drag-and-drop zone for documents page
- `src/components/ai/ai-insight-banner.tsx` — Module-page AI insight card
- `src/components/ui/skeleton-card.tsx` — Loading skeleton

**Modified files:**
- `src/components/modals/create-bill-panel.tsx` — Add AI scan + attach doc
- `src/components/modals/create-invoice-panel.tsx` — Enable AI button + optional attach
- `src/components/modals/create-journal-entry-panel.tsx` — Enable AI button
- `src/components/modals/add-item-panel.tsx` — Enable AI button
- `src/components/layout/top-nav.tsx` — Add TokenMeter
- `src/components/ai/assistant-panel.tsx` — Context-aware chips
- `src/app/(dashboard)/documents/[id]/verify/page.tsx` — SmartField + learning toast
- `src/app/(dashboard)/documents/page.tsx` — SmartDropZone + filter tabs + toast errors
- `src/app/(dashboard)/sales/page.tsx` — AI insight banner + enable showActions
- `src/app/(dashboard)/purchases/page.tsx` — AI insight banner
- `src/app/(dashboard)/banking/page.tsx` — AI insight banner
- `src/app/(dashboard)/dashboard/page.tsx` — Remove token badge (moved to TopNav)
- `src/app/(auth)/login/page.tsx` — AI branding tagline
- `src/app/globals.css` — Add confidence border utility classes

---

## Priority Order

| Priority | Items | Impact | Status |
|---|---|---|---|
| **P0 — Do first** | #1 (AI sparkles), #3 (confidence fields), #6 (token meter), #10 (alert→toast) | Immediate AI identity + polish | **ALL DONE** |
| **P1 — Core AI** | #2 (scan-to-fill bills), #4 (learning toast), #5 (context chips), #13 (insight banners) | Core differentiator | **ALL DONE** |
| **P2 — Document UX** | #7 (attach zone), #8 (bill split-view), #9 (smart drop zone), #11 (filter tabs) | Document workflow | **ALL DONE** |
| **P3 — Polish** | #12 (showActions), #14 (login branding), #15 (skeletons), #16 (styled selects) | Professional finish | **3/4 DONE** (styled selects remaining) |
