# Project Tracker — User Guide

For engineers (and PM users who want the engineer-side workflow). PM-specific
duties are covered in [`PM_ADMIN_GUIDE.md`](./PM_ADMIN_GUIDE.md).

---

## 1. Sign in

1. Open the application URL in any browser.
2. Enter your **email** and **password**. Initial credentials are provided by
   your PM (one-time temporary password — change it after first login? Not in
   v1; ask your PM to reset if you forget).
3. You land on the **Dashboard** with KPI cards for your projects.

If you mistype the password, an error toast appears. After three failed
attempts contact the PM for a reset.

> Workflow A in CLAUDE.md §3.1.

## 2. Create a project

1. From the **Dashboard** or **Projects** page, click **New project**.
2. Fill the form **section by section**:
   - **§1 Identifiers** — project name, infrastructure (Road / Bridge),
     project type (Multiyear / Source Approved / Yearly Tendered)
   - **§2 Cost** — original contract price, optional price escalation +
     contingencies
   - **§3 Time** — contract date and intended completion date, both in **BS**
     (Bikram Sambat). Use the dropdowns or **Today** button.
   - **§4–§7 Payment / Advance / Budget / Budget Planning** — leave at 0 if
     no payments yet
   - **§8 Progress** — physical progress %
3. Click **Create project**. You are redirected to the project detail page.

The project is automatically owned by you (the signed-in engineer).

> Workflow B in CLAUDE.md §3.2.

## 3. Add a Variation Order (VO)

1. Open the project's detail page → **VOs** tab.
2. Click **Add VO** form below the list.
3. Fill:
   - **Revised contract amount** — the new total contract value after this VO
   - **Approval date** (BS)
   - **Description**
4. Submit. The VO is auto-numbered (VO-1, VO-2, …). The project's **Current
   contract amount** updates immediately.

You cannot add VOs to a Completed or Archived project — the Add form is
hidden in those cases.

> Workflow C in CLAUDE.md §3.3.

## 4. Add an Extension of Time (EoT)

1. Open the project's detail page → **EoTs** tab.
2. Fill the **Add EoT** form:
   - **Extended to date** (BS) — must be later than the previous EoT's date,
     or later than the project's intended completion date for the first EoT.
     The form shows a live `+N days` preview.
   - **Approval date** (BS)
   - **Reason**
3. Submit. The EoT is auto-numbered. The project's **Revised completion**
   date updates.

> Workflow D in CLAUDE.md §3.4.

## 5. Update payments, advance, and progress

1. Open the project → **Edit** (top right of the detail page).
2. Update relevant sections (Payment, Advance Payment, Budget Planning,
   Progress).
3. Save.

The detail page auto-recalculates:
- **Current FY payment so far** = payment till date − payment till last FY
- **Current FY advance recovered** = outstanding advance till last FY −
  outstanding advance till date
- **Effective money out** = payment till date + outstanding advance till date
- **Overall financial progress %** = effective money out ÷ total revised cost
- **Current FY budget expenditure %** = current FY payment so far ÷ current
  FY budget
- **Current FY surplus / deficit** = current FY budget − expected payment
  till FY end

> Workflow E in CLAUDE.md §3.5.

## 6. Mark a project complete

1. Open the project → **Mark complete** button (top right).
2. The project moves out of **Projects** into **Completed Projects**.
3. It remains visible to you and the PM.

Only Running projects show the button.

> Workflow F in CLAUDE.md §3.6.

## 7. Generate an Excel report

For your own project:

- Open the project → **Download Excel** button (top right). You get a
  five-sheet workbook: Summary, Variation Orders, EoTs, FY History, Advance
  Ledger.

For all your projects:

- Visit **Projects** page → (no list-export button in v1 for engineers; the
  PM has a richer reports hub at `/reports` and can share files with you).

> Workflow I in CLAUDE.md §3.9.

## Status badges (CLAUDE.md §8)

The project detail page header surfaces:

- **Running** (green) / **Completed** (blue) / **Archived** (gray)
- **Overdue** (red) — running past the revised completion date
- **Overpaid vs Progress** (amber) — financial % > physical % + 10
- **Advance Not Recovered** (red) — completed but outstanding advance > 0
- **Deficit** (red) — current FY surplus / deficit < 0

## Tips

- **BS dates are stored as AD internally.** The display always shows BS for
  consistency with Nepal government workflows.
- **Currency is shown in Indian/Nepali grouping** (e.g. `Rs. 1,25,00,000`).
  When entering numbers, use plain digits — no commas.
- **Scope** — engineers only see their own projects. Even by URL, you cannot
  view another engineer's project (you'll get a 404).
- **Theme** — click the sun/moon icon in the top nav to switch dark ↔ light.
  Preference persists across sessions.
