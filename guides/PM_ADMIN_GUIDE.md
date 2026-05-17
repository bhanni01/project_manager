# Project Tracker — PM Admin Guide

For the Project Manager. Engineer-side workflows are covered in
[`USER_GUIDE.md`](./USER_GUIDE.md); everything below adds to what an engineer
can already do.

---

## 1. Add a user

1. Top nav → **Users** → **New user**.
2. Fill **Name**, **Email**, **Role** (Engineer or Project Manager).
3. Submit. The system generates a 10-character temporary password, hashes it
   with bcrypt, and displays it **once** as a yellow banner with a Copy
   button.
4. Share the password with the user offline (Signal, in-person, internal
   email). It is **never shown again** — if you miss it, use Reset Password
   (below).

CLAUDE.md §2.2.5.

## 2. Reset a forgotten password

1. **Users** → click the user → **Reset password** (Danger zone).
2. A new temporary password is generated and displayed once.
3. The old password no longer works.

## 3. Change a user's role

1. **Users** → click the user → set **Role** → **Save**.
2. Guardrails enforced server-side:
   - You **cannot demote the only active PM**. Promote another user to PM
     first.
   - You **cannot change your own role** (deactivate yourself and recreate
     if needed, but only after promoting someone else to PM).

Both `USER_UPDATE` and `ROLE_CHANGE` audit events are written.

## 4. Deactivate / reactivate a user

1. **Users** → click the user → **Deactivate user** in the Danger zone.
2. The user can no longer sign in. Their existing project ownership is
   retained for historical attribution; deactivation does **not** orphan
   projects.
3. **Reactivate** to restore sign-in access.

Guardrails: you cannot deactivate yourself, and you cannot deactivate the
only active PM.

## 5. Reassign a project's owner

1. Open the project → **Edit**.
2. As PM, the form shows an **Engineer** dropdown (§9 in the form).
3. Pick a different engineer and **Save changes**.

A `PROJECT_REASSIGN` audit event records the before/after engineerId.

CLAUDE.md §13.5.3.

## 6. Archive / restore a completed project

- **Archive**: open a Completed project → **Archive** button (top right).
  The project disappears from `/projects` and `/projects/completed` and
  appears only on `/projects/archive`.
- **Restore**: open the archived project → **Restore** button. It returns to
  `/projects/completed`.

CLAUDE.md Workflow G (§3.7).

## 7. Close the current fiscal year and open the next

This is the **most sensitive workflow** in the application — it modifies
every non-archived project and creates one snapshot per project. Always read
the dry-run preview before confirming.

1. Top nav → **Fiscal Year** → **Close & open next FY**.
2. Enter the next FY label (`NNNN/NN`, e.g. `2083/84`) and BS start + end
   dates.
3. **Preview rollover** — you land on a dry-run page showing:
   - Closing FY / Opening FY summary
   - Per-project snapshot table (FY payment, FY budget, surplus / deficit,
     projected new `currentFYBudget`)
   - Totals row
4. Click **Confirm rollover** to commit. The transaction atomically:
   - Closes the current FY (`isCurrent = false`, `closedAt`, `closedById`)
   - Creates the next FY (`isCurrent = true`)
   - Snapshots every non-archived project's payment, budget, advance, and
     progress at the moment of close
   - Rolls each project's balances forward: `paymentTillLastFY` becomes the
     current `paymentTillDate`; `currentFYBudget` becomes the old
     `nextFYBudgetRequirement`; forecast fields are cleared
5. If the action crashes mid-way it is safe to re-run — the
   `(projectId, fiscalYearId)` unique constraint prevents double-snapshots
   via `skipDuplicates`.

CLAUDE.md Workflow H (§3.8).

## 8. Generate reports

Top nav → **Reports**. Five exports, all multi-sheet `.xlsx`:

| Report             | Sheets                                            | Audience |
| ------------------ | ------------------------------------------------- | -------- |
| Single Project     | Summary / VOs / EoTs / FY History / Advance Ledger | PM + engineer (own) |
| Project List       | Projects / Counts                                 | PM + engineer (own scope) |
| Completed Projects | Completed / By Engineer / By Year / Cost Variance | PM + engineer (own scope) |
| Budget Planning    | FY Plan / Forecasts                               | PM only  |
| Office Dashboard   | KPIs / Per Engineer / FY Trend                    | PM only  |

Filenames follow `<ReportName>_<FY>_<YYYY-MM-DD>.xlsx`. Currency uses
Indian/Nepali grouping; percentages format as `0.00%`; conditional color
scales highlight outliers.

CLAUDE.md §9.

## 9. Audit log

Every mutating action writes a row to the `AuditEvent` table:

- `USER_CREATE`, `USER_UPDATE`, `ROLE_CHANGE`, `PASSWORD_RESET`,
  `USER_DEACTIVATE`, `USER_REACTIVATE`
- `PROJECT_CREATE`, `PROJECT_UPDATE`, `PROJECT_REASSIGN`,
  `PROJECT_COMPLETE`, `PROJECT_ARCHIVE`, `PROJECT_RESTORE`
- `VO_ADD`, `EOT_ADD`
- `FY_ROLLOVER`
- `LOGIN`, `LOGOUT`

Inspect with `psql`:
```sql
SELECT "createdAt", action, "actorUserId", "targetType", "targetId"
FROM "AuditEvent"
ORDER BY "createdAt" DESC
LIMIT 50;
```

There is no audit-viewer UI in v1; this is a developer/operator concern.

## 10. Operating notes

- **Sign-out** does not invalidate existing JWT sessions (deactivating a
  user blocks new logins but their current session lives until expiry).
  Refresh `AUTH_SECRET` server-side if you need to force-logout everyone.
- **FY rollover** is locked to one PM at a time by the partial unique index
  `one_current_fy` — Postgres rejects a second `isCurrent = true` row.
- **No email infrastructure** is wired up. Password resets are manual: PM
  generates → shares offline.
