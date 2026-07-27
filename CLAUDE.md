# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

`izin-takip-projesi` — a leave/time-off tracking app with an all-Turkish UI. It began as a **client-only, statically-exported** Next.js app (no backend): auth and all domain data lived in `localStorage`. There is a working login flow, a guarded dashboard with overview/personnel/leave-requests/calendar/profile pages, CRUD dialogs, a light/dark theme toggle, an admin/employee role view, a mobile layout, and seeded demo data. All user-facing copy is Turkish — match that when adding UI. There is **no i18n layer**; `project description.txt` holds the original assignment brief.

> **Read the "Backend migration" section next — the app is now API-backed for all admin flows; only the employee self-service view still runs on the localStorage model this doc otherwise describes.**

## Backend migration (READ FIRST — admin flows done; working tree not yet committed)

The (uncommitted) working tree has migrated away from the localStorage stores toward a **real REST API served by a separate Laravel 12 + Sanctum backend repo** (`../staff-leave-tracker-backend`; PHP 8.2, all-Turkish domain code, its own CLAUDE.md). State of play: **all admin flows (personnel, leave-requests, calendar, dashboard, auth) are fully on the backend**; the **employee self-service view plus the derived-balance/localStorage store layer** below still run client-side. So it's a **hybrid** — don't assume either model in isolation, check the specific file.

- **`lib/api.ts`** (new) — `apiFetch<T>(endpoint, options)`: prepends `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api`), attaches `Authorization: Bearer <token>` from `localStorage["token"]`, and throws an `Error` with a Turkish message on a non-2xx response. All API calls go through this.
- **Auth is now real.** `AuthProvider.login` is **async**, POSTs to `/login`, stores the returned **Sanctum personal access token** (a Bearer token — *not* a JWT) under `localStorage["token"]`, and sets the user from the response — so the old "no credentials are checked / name derived from email" claim below is **no longer true for login**. `logout` POSTs `/logout` (backend revokes the current token). `signup`/`updateUser` are still local-only — **the backend exposes no register endpoint**, so accounts are seed-only (the backend seeds an admin `admin@test.com`); local `signup` does not create a real account.
- **Pages fetch directly, per-page.** `personnel`, `leave-requests`, `personnel/detail`, `calendar`, and `dashboard-stats` now use local `useState` + a `fetchData()`/`fetchPersonnel()` refetch-after-mutation pattern instead of the reactive `useSyncExternalStore` hooks. Each page maps raw snake_case API rows (`department.name`, `leave_type.slug`, `user.email`, `start_date`, …) into the camelCase domain types from `lib/data/types.ts` inline, typing the raw rows as `any[]`.
- **Dialogs write through the API too.** `personnel-dialog.tsx` and `leave-dialog.tsx` now POST/PUT via `apiFetch` (they used to call the localStorage store mutations). Both take an `onSaved` callback that the parent wires to its `fetchData()`/`fetchPersonnel()` so the list refreshes after a write. `personnel-dialog` populates a **real department `<select>`** from `GET /departments` and submits `department_id`; `leave-dialog` loads `GET /personnel` + `GET /leave-types`, resolves the selected slug to `leave_type_id`, and sends `total_days` computed by `workingDayCount` (holiday-aware). The leave-dialog's edit mode has **no status field** — status changes only through the approve/reject endpoints.
- **Endpoint surface (reconciled against the backend):** `POST /login` (rate-limited `throttle:5,1`), `POST /logout`, `GET /me`, `GET /dashboard`, `GET /departments`, `GET /leave-types`, `GET /personnel`, `GET /personnel/:id`, `POST /personnel`, `PUT /personnel/:id`, `DELETE /personnel/:id`, `GET /leave-requests`, `POST /leave-requests`, `PUT /leave-requests/:id`, `PATCH /leave-requests/:id/approve`, `PATCH /leave-requests/:id/reject` (body `{ rejection_reason }`), `DELETE /leave-requests/:id`. Everything except `POST /login` sits behind `auth:sanctum`. The backend enforces **no roles** — any authenticated user can do anything — so the admin/employee role switch stays purely a client-side view concern (consistent with the role store below). `GET /departments` and `GET /leave-types` are read-only reference lists exposed via `lib/api.ts` helpers `getDepartments()` / `getLeaveTypes()`.
- **Contract mismatches — all four now resolved (do not re-introduce):**
  1. **Day counting.** Resolved on **both** sides: the backend computes `total_days` via `App\Support\WorkingDays::count()` (weekends **and** Turkish holidays excluded), and `leave-dialog` still sends its own `workingDayCount(...)` value — the two agree. **Maintenance note:** keep the two holiday lists byte-for-byte identical — `lib/date/holidays.ts` (`publicHolidays2026` / `holidaySet2026`) ↔ backend `app/Support/WorkingDays.php` (`HOLIDAYS_2026`). Any edit to one **must** be mirrored to the other or the two counts diverge. The agreed 2026 set uses **07-20** (Barış ve Özgürlük Bayramı) and intentionally **excludes 07-15**; religious (Ramazan/Kurban) dates are approximate — verify against the Resmî Gazete.
  2. **`leave_type.slug`.** Confirmed present (the `leave_types` migration has a `slug` column; the seeder fills `annual|excuse|sick|unpaid`).
  3. **`GET /dashboard`.** Confirmed to exist (`DashboardController@stats`, returns `{ total_personnel, active_leaves, pending_requests, departments_count }`, matching `dashboard-stats.tsx`).
  4. **Personnel status enum.** `PersonnelStatus` already covers `inactive`; matches the backend's `active|on-leave|inactive|resigned`.
- **Backend changes made alongside this (in the sibling backend repo):** added `DepartmentController`/`LeaveTypeController` + their routes; `PersonnelController@index`/`@show` now eager-load `user` (so `personnel.user.email` is populated); `attachment_url` widened to `mediumText` (base64 data-URL uploads); the seeder now **links personnel↔users** (employee logins `ahmet@test.com` / `mehmet@test.com` / `ayse@test.com`, password `password`). **Re-run `php artisan migrate:fresh --seed`** to pick up the column change and the linked accounts.
- **Employee self-service view is now migrated too.** `components/auth/use-current-employee.ts` fetches `GET /personnel` and matches the authed email against `personnel.user.email` (returns `{ me, loading }`); `employee-dashboard.tsx` fetches `GET /personnel/:id` for the person's own leaves and derives balance via `computeLeaveBalance` (no more store hooks). This works now that the seeder links accounts — log in as `ahmet@test.com` / `password` and switch to the employee role.
- **The localStorage domain store (`lib/data/store.ts`) is now effectively dead — nothing imports it.** All personnel/leave data flows through `apiFetch`. The three admin-overview widgets (`recent-activity`, `on-leave-table`, `leave-distribution-chart`) take `personnel`/`requests` **as props**; the admin home (`app/(dashboard)/page.tsx` → `AdminOverview`) fetches `/personnel` + `/leave-requests` once and passes them down. Treat `store.ts`, `seed.ts`, and the reactive `usePersonnel`/`useLeaveRequests`/`usePersonnelBalance` hooks below as **legacy/removable**, not the live data layer.
- **Auth/session:** `apiFetch` handles **401** by clearing `localStorage["token"]` + `["izin-takip-auth"]` and redirecting to `/login` (skipped when already on `/login` so a bad-password 401 doesn't loop) — a stale/revoked token forces a clean re-login instead of a stuck dashboard. `AuthGuard` still only checks the stored user object, so the 401 path is what actually catches server-side session loss.
- **Deploy config:** `NEXT_PUBLIC_API_URL` is now wired into `next.config.ts`'s `env` block, with a committed `.env.example` (default `http://localhost:8000/api`). It still **falls back to `localhost:8000` if unset** — the GitHub Pages build must set a real public backend URL as a CI/repo variable or the live site can't reach any API (and no backend is publicly hosted yet). `output: "export"` remains — the SPA ships static and talks to the API purely client-side (compatible), but nothing server-side gates auth. The backend's CORS is wide open (`*`) for local dev.

**The whole app (admin + employee) is now on the backend and typechecks clean** (`npx tsc --noEmit` passes); `lib/data/store.ts` has no remaining importers. When extending, keep using `apiFetch` and the field-mapping pattern above — do **not** reach back into the store. Lint still reports pre-existing `no-explicit-any` on the inline `apiFetch<any[]>` mappings (non-blocking — ESLint is decoupled from `next build`).

## Commands

- `npm run dev` — start dev server (`next dev`), served at `/` (no basePath locally)
- `npm run build` — production build; `output: "export"` emits a static site to `out/`. This is also the only full typecheck (`next build` runs `tsc`); `npx tsc --noEmit` is the faster standalone check.
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)

No test runner is configured. `npm run start` exists but is meaningless for a static export — use `npm run build` to validate.

**Lint baseline:** `npm run lint` currently exits non-zero with ~5 pre-existing errors (`components/dashboard/theme-toggle.tsx` and `reject-dialog.tsx` — `react-hooks/set-state-in-effect`; `view-reason-dialog.tsx` — unescaped quotes) plus assorted unused-var warnings. Compare against that baseline rather than expecting a clean run, and **don't introduce new `setState`-inside-`useEffect`** — that rule is an error here (close dialogs/drawers from event handlers instead).

**Deployment:** `.github/workflows/deploy.yml` builds on every push to `main` and publishes `out/` to GitHub Pages.

## Static-export constraints (these shape the whole architecture)

`next.config.ts` sets `output: "export"` and deploys to GitHub Pages under `basePath` `/staff-leave-tracker-frontend` (production only; empty in dev). Consequences you must respect:

- **No server runtime.** No server middleware/`proxy.ts`, no route handlers, no server actions, no dynamic server rendering. Effectively everything is a client component (`"use client"`).
- **No dynamic route segments.** Detail views use query params instead, e.g. `personnel/detail/page.tsx` reads `?id=` via `useSearchParams` (wrapped in `<Suspense>`), linked as `/personnel/detail?id=${p.id}`.
- **basePath-aware asset URLs.** Build `<img>`/icon URLs from `process.env.NEXT_PUBLIC_BASE_PATH` (exposed via `next.config.ts` `env`) — don't hardcode `/`.
- **Images are `unoptimized`**, so components use plain `<img>` with an `eslint-disable-next-line @next/next/no-img-element` comment rather than `next/image`.

## Client-side stores (the core pattern)

State lives in **module-level stores synced through `useSyncExternalStore`**, hydration-safe by construction. Follow this exact pattern for any new persisted state — don't reach for Context-only state, Zustand, etc. Each has a `getServerSnapshot()` returning a stable constant so SSR/first-paint matches, and an `ensureInit()` that lazily reads `localStorage` on first client read.

There are three:

- `components/auth/auth-provider.tsx` — `AuthProvider` + `useAuth()`. Key `izin-takip-auth`. `User` is `{ name, email }` plus optional profile fields (`avatarUrl`, `title`, `phone`, `birthDate`, `location`, `bio`, emergency contact) edited from `/profile`. Exposes `login`, `signup`, `logout`, `updateUser`. **This description is the pre-migration behavior** (all local, no credentials checked, `login` derives a name from the email local-part) — the working tree has already replaced `login`/`logout` with real API calls (see "Backend migration" above); `signup`/`updateUser` remain local.
- `components/auth/role-store.ts` — `useRole()`, `useIsAdmin()`, `setRole()`. Key `izin-takip-role`, defaults to `admin`. Purely a **view-level** role switch (see below), not security.
- `lib/data/store.ts` — **LEGACY / no live importers** (superseded by the API — see the migration section; kept only for reference). personnel + leave requests (keys `izin-takip-personnel`, `izin-takip-leaves`). Reactive hooks (`usePersonnel`, `useLeaveRequests`, `useDashboardStats`, `usePersonnelBalance`), non-reactive readers safe for event handlers (`getPersonnelById`, `getLeavesByPersonnel`, `getLeaveBalance`), and mutations (`addPersonnel`, `updatePersonnel`, `deletePersonnel`, `addLeaveRequest`, `updateLeaveRequest`, `deleteLeaveRequest`, `setLeaveStatus(id, status, rejectionReason?)`). Seeds from `lib/data/seed.ts` on first read; `deletePersonnel` cascades to that person's leaves. `syncPersonnelStatuses()` runs after every leave mutation and auto-derives each person's `on-leave`/`active` status from approved leaves overlapping today (a `resigned` person is left untouched).

`components/auth/auth-guard.tsx` wraps the `(dashboard)` group and client-side-redirects to `/login` when unauthenticated (there's no server to gate routes). It uses a `useSyncExternalStore` "mounted" flag rather than `useState`-in-effect to avoid hydration mismatch.

## Roles (admin vs employee)

The role store drives **two different dashboards and two different chromes** — the biggest branching concept in the UI:

- `components/dashboard/dashboard-shell.tsx` is the layout brain: admin gets the `Sidebar` + `md:ml-64` content offset; employee gets no sidebar and full-width content.
- `components/dashboard/nav-items.ts` marks items `adminOnly`; `Sidebar` and `MobileTopBar` both filter with `isAdmin || !item.adminOnly` and share `isNavItemActive(pathname, href)` from that file. For an employee only "Genel Bakış" survives.
- `app/(dashboard)/page.tsx` renders `EmployeeDashboard` (personal balance, own requests, upcoming holidays) instead of the company-wide panel when `!isAdmin`.
- Admin-only pages (`/personnel`, `/personnel/detail`, `/leave-requests`, `/calendar`) each `router.replace("/")` in an effect and `return null` for employees.
- `components/auth/use-current-employee.ts` resolves "me" by matching the auth email against a `Personnel.email`; it returns `undefined` when there's no matching record, and `EmployeeDashboard` renders an explanatory notice for that case.
- `components/dashboard/role-switcher.tsx` (in both top bars) flips roles at runtime — the app is a demo, so this is a feature, not a debug hook.

## Domain model

`lib/data/types.ts` is the single source of truth: `Personnel`, `LeaveRequest`, their status/type unions, the **Turkish display-label maps** (`leaveTypeLabels`, `leaveStatusLabels`, `personnelStatusLabels`), and `attachmentConfig` (which leave types require a document — `sick` → "Doktor Raporu", `excuse` → "Dilekçe"). `LeaveType` is `annual | excuse | sick | unpaid`. Store internal values as the English union keys; render via these label maps — never hardcode Turkish strings for enum values.

Note `leaveDayCount()` in that file is now just a re-export of `workingDayCount` (business days), despite the name suggesting calendar days.

## Business-logic layer (`lib/date/`, `lib/data/balance.ts`, `lib/utils/`)

Pure, framework-free functions that encode the actual leave rules — keep them free of React/localStorage so they stay testable:

- `lib/date/business-days.ts` — `workingDayCount(start, end)` counts days **excluding weekends and public holidays**. Always parse `yyyy-mm-dd` with `parseLocalDate` (constructs a *local* Date) — never `new Date(iso)`, which is UTC and shifts `getDay()`/`getDate()` by a day.
- `lib/date/holidays.ts` — 2026 Turkish holidays as `publicHolidays2026` + `holidaySet2026` (O(1) lookup). National dates are fixed; **religious (Ramazan/Kurban) dates are approximate** and flagged to verify. No other year is covered.
- `lib/data/balance.ts` — `annualEntitlement(startDate)` derives yearly entitlement from seniority (Turkish Labour Law tiers: 14/20/26 days). `computeLeaveBalance(person, leaves)` returns a **derived, never-stored** `LeaveBalance`; only `type === "annual"` leaves deduct (sick/excuse/unpaid don't). The store wraps these as reactive `usePersonnelBalance(id)` and event-handler-safe `getLeaveBalance(id)` (the latter reads the full unfiltered data for correct remaining balance).
- `lib/utils/csv.ts` — despite the filename, the live export is **`downloadXlsx(filename, rows, columns)`**, a real `.xlsx` via SheetJS with auto column widths. `toCsv`/`downloadCsv` remain only for backwards compatibility. Surfaced through the generic `components/dashboard/export-button.tsx`, which exports the **currently visible (filtered)** rows.

## Toasts & the balance guard

- `components/ui/toast.tsx` — `AppToastProvider` (mounted in `app/layout.tsx` inside `AuthProvider`) wraps **`react-hot-toast`**; `useToast()` returns `{ success, error, info }`, each taking `(title, description?)`. Use it for all user feedback rather than `alert`.
- The leave form (`components/dashboard/leave-dialog.tsx`) blocks submit and fires `toast.error` when a **new `annual` request** exceeds the person's remaining balance (`getLeaveBalance` + `workingDayCount`), and shows a live "N iş günü · Kalan R gün" hint. It also enforces the `attachmentConfig` upload for sick/excuse leave.

## Routing structure

App Router with two route groups sharing the root layout (`app/layout.tsx`, which mounts `AuthProvider` → `AppToastProvider`):

- `app/(auth)/` — `login/` only. Its layout is a two-column shell: `components/auth/auth-backdrop.tsx` (tiled logo watermark + ambient blur) behind, `components/auth/auth-brand-panel.tsx` (`hidden lg:block`) beside the `AuthCard`.
- `app/(dashboard)/` — layout wraps children in `AuthGuard` + `DashboardShell`; pages: `/` (overview or employee panel), `/personnel`, `/personnel/detail`, `/leave-requests`, `/calendar` (month grid of approved + pending leaves), `/profile`. `TopNav` (`hidden md:flex`) carries the role switcher, theme toggle, and user menu.

## Responsive contract

`md` (768px) is the single breakpoint splitting mobile from desktop chrome. Both `Sidebar` and `TopNav` are `hidden md:flex`, so **`components/dashboard/mobile-nav.tsx` (`MobileTopBar`) is the only navigation below `md`** — a fixed h-16 bar with a hamburger opening a `@base-ui/react/dialog` drawer (closed from each link's `onClick`, never from an effect), plus role/theme/user controls.

Tables don't scroll horizontally on mobile: each renders twice — the `<table>` wrapped in `hidden md:block`, and the same rows mapped into `components/dashboard/mobile-card-list.tsx` (`MobileCardList` / `MobileCard` with `title`/`subtitle`/`leading`/`badge`/`rows`/`actions`). Follow that pattern for any new table. Panels scale with `p-5 md:p-8`, page titles with `text-3xl sm:text-4xl lg:text-5xl`, and stat cards are content-height (no fixed height) at `grid-cols-2` on mobile.

## UI stack specifics (differ from typical/older knowledge)

- **Next.js 16.2.10 + React 19.2** — newer than most training data. Per `AGENTS.md`, check `node_modules/next/dist/docs/` before relying on remembered Next.js APIs.
- **shadcn/ui is on `@base-ui/react`, not Radix.** See `components.json` (`style: "base-nova"`) and `components/ui/button.tsx` wrapping the primitives with `class-variance-authority`. New shadcn components follow the base-ui API (`Dialog.Root`/`Portal`/`Backdrop`/`Popup`, `Menu.Root`/`Trigger`/`Positioner`/`Popup`, `data-[starting-style]`/`data-[ending-style]` transitions), not the Radix-based examples. `components/dashboard/*` are hand-built composite components on top of these.
- Charts are **Recharts** (`leave-distribution-chart.tsx` — keep its fixed-height flex parent, `ResponsiveContainer` needs one); avatar cropping is **react-easy-crop** (`image-cropper.tsx`).
- **Tailwind v4** — no `tailwind.config.*`; theme lives in `app/globals.css` via `@theme inline`/CSS variables. Beyond the standard shadcn tokens there's a custom set: `surface-1/2/3`, `on-surface`, `on-surface-variant`, `accent-cyan`, `accent-violet` (both now **bordo/burgundy** — the names are historical), plus utilities `glass-panel`, `hand-drawn-border`, `custom-scrollbar`, `ubuntu-light/regular/medium/bold`. Reuse these rather than raw hex/gray classes.
- **Dark mode** is class-based: `globals.css` declares `@custom-variant dark (&:is(.dark *))` and a `.dark {}` block overriding the variables. `components/dashboard/theme-toggle.tsx` toggles `.dark` on `document.documentElement` and persists under localStorage key `theme` (falling back to `prefers-color-scheme`). Style with the `dark:` prefix; prefer semantic tokens, which already flip. Theme-dependent images use the paired `dark:hidden` / `hidden dark:block` `<img>` trick (see `Sidebar`).
- **Fonts**: Ubuntu is loaded with a plain `<link>` to Google Fonts in `app/layout.tsx` (not `next/font`), and `--font-sans`/`--font-serif`/`--font-mono` all map to it — so `font-serif` and `font-mono` are not actually serif/mono here.
- **Known dead tokens** — present in markup, undefined in the theme, therefore inert: `outline-variant` (~53 uses, e.g. `border-outline-variant/30`), `secondary-container`, and `font-label-mono` (its `--font-space-mono` is never defined). Harmless, but don't add more, and don't assume a border exists just because the class is there.
- Icons: `lucide-react`. `cn()` (`lib/utils.ts`) is the standard `clsx`+`tailwind-merge` helper — note it can't dedupe the custom utilities above.
- Path alias `@/*` → repo root, with shadcn aliases for `@/components`, `@/lib`, `@/components/ui`, `@/hooks`.
