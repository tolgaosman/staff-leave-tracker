# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

`izin-takip-projesi` — a leave/time-off tracking app with an all-Turkish UI, statically exported (`output: "export"`) and deployed to GitHub Pages. It began as a client-only app with all domain data in `localStorage`; **that migration is now complete and committed** — the app is fully API-backed by a separate Laravel 12 + Sanctum backend repo (`../staff-leave-tracker-backend`; PHP 8.2, all-Turkish domain code, its own CLAUDE.md). `lib/data/store.ts` and `lib/data/seed.ts` **no longer exist** — `lib/data/` only holds `types.ts` and `balance.ts` (pure domain logic, no localStorage). All user-facing copy is Turkish — match that when adding UI. There is **no i18n layer**; `project description.txt` holds the original assignment brief.

There's a working login flow, a guarded dashboard (overview/personnel/leave-requests/calendar/profile), CRUD dialogs, a light/dark theme toggle, a **4-tier role model** (see below), and a mobile layout.

## API layer & auth

- **`lib/api.ts`** — `apiFetch<T>(endpoint, options)`: prepends `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api`), attaches `Authorization: Bearer <token>` from `localStorage["token"]`. On a non-2xx response it throws `Error(message)` (parses the JSON error body, falls back to `İstek başarısız: {status}`). On a **401** specifically, it clears `localStorage["token"]` + `["izin-takip-auth"]` and redirects to `${NEXT_PUBLIC_BASE_PATH}/login` (skipped if already on `/login`, so a bad-password 401 doesn't loop) — this is what actually catches server-side session loss, since `AuthGuard` only checks the stored user object. Also exports `getDepartments()` → `GET /departments` and `getLeaveTypes()` → `GET /leave-types` (read-only reference lists, typed `ApiDepartment`/`ApiLeaveType`).
- **`components/auth/auth-provider.tsx`** (`AuthProvider` + `useAuth()`, key `izin-takip-auth`) — all actions are real API calls now, not local-only: `login` POSTs `/login` and stores the returned Sanctum token (a Bearer token, not a JWT); `logout` POSTs `/logout`; `updateUser` PUTs `/me`. There is intentionally **no `signup`** (see the endpoint note below). `mapApiUser()` translates the API's snake_case (`birth_date`, `avatar_url`, `emergency_name`, …) into the camelCase `User` type, which now carries a real `role: "super_admin" | "hr_admin" | "manager" | "employee"` field driven by the backend.
- **Pages fetch directly, per-page** (`personnel`, `leave-requests`, `personnel/detail`, `calendar`, `page.tsx`): local `useState` + a `fetchData()`/`fetchPersonnel()` refetch-after-mutation pattern, not reactive store hooks. Each page maps raw snake_case API rows (`department.name`, `leave_type.slug`, `user.email`, `start_date`, …) into the camelCase domain types from `lib/data/types.ts` inline, typing the raw rows as `any[]` (this is the source of most `no-explicit-any` lint errors — see Commands below).
- **Dialogs write through the API.** `personnel-dialog.tsx` (`POST`/`PUT /personnel/:id`) and `leave-dialog.tsx` (`POST`/`PUT /leave-requests/:id`) both take an `onSaved` callback the parent wires to its refetch. `personnel-dialog` populates a department `<select>` via `getDepartments()` and submits `department_id`; it also only shows/sends a "Sistem Rolü" select when `canAssignRoles` (`super_admin`/`hr_admin`) — a manager editing personnel can't reassign roles. `leave-dialog` resolves the selected type slug to `leave_type_id` via `getLeaveTypes()`, sends `total_days` computed by `workingDayCount` (holiday-aware), and has no status field in edit mode — status only changes through the approve/reject endpoints.
- **Endpoint surface:** `POST /login` (rate-limited), `POST /logout`, `GET /me`, `PUT /me`, `GET /dashboard`, `GET /departments`, `GET /leave-types`, `GET /personnel`, `GET /personnel/:id`, `POST /personnel`, `PUT /personnel/:id`, `DELETE /personnel/:id`, `GET /leave-requests`, `POST /leave-requests`, `PUT /leave-requests/:id`, `PATCH /leave-requests/:id/approve`, `PATCH /leave-requests/:id/reject` (body `{ rejection_reason }`), `DELETE /leave-requests/:id`. There is **no public `POST /register`** — it was removed deliberately (internal HR app; accounts are provisioned by HR via `POST /personnel`, which also creates a `User` with a random password, and the user sets their own password through `/forgot-password`). `AuthProvider` therefore exposes **no `signup`**.
- **Authorization is enforced server-side — do NOT weaken the client checks assuming otherwise.** `routes/api.php` puts personnel/leave-management/dashboard behind `role:super_admin,hr_admin,manager`, and the controllers add per-role rules (managers are scoped to their own department and cannot create/update/delete personnel or delete leave requests; employees can only read their own leave requests; only `super_admin` may approve a manager's own leave). The frontend's `useIsAdmin()`/`useHasDashboardAccess()` gating is a **UX mirror** of those server rules, not the enforcement point. (An earlier version of this file claimed the backend enforced no roles — that was wrong.)
- **Day-count agreement:** keep `lib/date/holidays.ts` (`publicHolidays2026`/`holidaySet2026`) byte-for-byte identical to the backend's `app/Support/WorkingDays.php` `HOLIDAYS_2026` — both sides compute `total_days` independently (frontend via `workingDayCount`, backend via `WorkingDays::count()`) and must agree. Religious (Ramazan/Kurban) dates are approximate — verify against the Resmî Gazete before changing either list.
- **`GET /me` also resolves employee identity.** `use-current-employee.ts` no longer fetches the whole personnel list and matches by email client-side — it calls `GET /me` and reads `data.personnel` directly (backend does the identity match); `me` is `undefined` if the response has no linked personnel record.
- **Deploy config:** `NEXT_PUBLIC_API_URL` is wired into `next.config.ts`'s `env` block, with a committed `.env.example` (default `http://localhost:8000/api`). **`.github/workflows/deploy.yml` does not currently set `NEXT_PUBLIC_API_URL`** — if it isn't set as a CI/repo secret elsewhere, the deployed GitHub Pages site falls back to `localhost:8000` and can't reach any real API. Check this before assuming the live site works.

## Security invariants (don't regress these)

- **Attachments are untrusted user uploads.** `components/dashboard/attachment-dialog.tsx` must keep both guards: `isSafeUrl()` (allows only `http(s):` and a fixed set of `data:` image/pdf types — never `data:text/html` or `data:image/svg+xml`, which execute script) and `sandbox=""` on the PDF `<iframe>`. Never render an attachment URL through an unsandboxed frame or an anchor the user can click through to. The backend independently enforces `mimes:pdf,jpg,jpeg,png` — the `accept` attribute on the file input is a picker hint only and is trivially bypassed.
- **CSP lives in `app/layout.tsx`** as a `<meta http-equiv>` (static export can't send headers). `connect-src`/`img-src`/`frame-src` are built from `NEXT_PUBLIC_API_URL` **at build time**, so that variable must be set in CI or the deployed app is blocked from reaching its own API. `script-src` needs `'unsafe-inline'` because Next emits inline hydration scripts and static export can't use nonces — so CSP here is defense-in-depth, not an XSS cure. Keep the codebase free of `dangerouslySetInnerHTML`/`eval`, which is the actual XSS defense. `frame-ancestors` is ignored in a meta tag; clickjacking protection needs a real header from the host.
- **The Sanctum token sits in `localStorage`** (`token`) because a static SPA has no server to hold an httpOnly cookie. That is only safe while the XSS surface stays at zero — treat any new HTML-injection sink as a token-theft bug.

## Commands

- `npm run dev` — start dev server (`next dev`), served at `/` (no basePath locally)
- `npm run build` — production build; `output: "export"` emits a static site to `out/`. This is also the only full typecheck (`next build` runs `tsc`); `npx tsc --noEmit` is the faster standalone check.
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)

No test runner is configured. `npm run start` exists but is meaningless for a static export — use `npm run build` to validate.

**Lint baseline:** `npm run lint` currently exits non-zero with ~31 pre-existing errors — the bulk (~28) are `@typescript-eslint/no-explicit-any` from the inline `apiFetch<any[]>` row-mapping pattern described above, plus 3 `react-hooks/set-state-in-effect` (`personnel/detail/page.tsx`, `leave-dialog.tsx`, `top-nav.tsx`) — plus assorted unused-var/`no-img-element` warnings. Compare against that baseline rather than expecting a clean run, and **don't introduce new `setState`-inside-`useEffect`** — that rule is an error here (close dialogs/drawers from event handlers instead).

**Deployment:** `.github/workflows/deploy.yml` builds on every push to `main` and publishes `out/` to GitHub Pages.

## Static-export constraints (these shape the whole architecture)

`next.config.ts` sets `output: "export"` and deploys to GitHub Pages under `basePath` `/staff-leave-tracker-frontend` (production only; empty in dev). Consequences you must respect:

- **No server runtime.** No server middleware/`proxy.ts`, no route handlers, no server actions, no dynamic server rendering. Effectively everything is a client component (`"use client"`).
- **No dynamic route segments.** Detail views use query params instead, e.g. `personnel/detail/page.tsx` reads `?id=` via `useSearchParams` (wrapped in `<Suspense>`), linked as `/personnel/detail?id=${p.id}`.
- **basePath-aware asset URLs.** Build `<img>`/icon URLs from `process.env.NEXT_PUBLIC_BASE_PATH` (exposed via `next.config.ts` `env`) — don't hardcode `/`.
- **Images are `unoptimized`**, so components use plain `<img>` with an `eslint-disable-next-line @next/next/no-img-element` comment rather than `next/image`.

## Client-side stores (the core pattern)

State lives in **module-level stores synced through `useSyncExternalStore`**, hydration-safe by construction. Follow this exact pattern for any new persisted state — don't reach for Context-only state, Zustand, etc. Each has a `getServerSnapshot()` returning a stable constant so SSR/first-paint matches, and an `ensureInit()` that lazily reads `localStorage` on first client read.

There are two:

- `components/auth/auth-provider.tsx` — `AuthProvider` + `useAuth()`. Key `izin-takip-auth`. `User` carries `name`, `email`, `role` plus optional profile fields (`avatarUrl`, `title`, `phone`, `birthDate`, `location`, `bio`, emergency contact) edited from `/profile`. `login`/`signup`/`logout`/`updateUser` are all real async API calls (see "API layer & auth" above).
- `components/auth/role-store.ts` — `useRoleStore()` (key `izin-takip-role`) holds an optional **simulated** role. `useRole()` is the actual role resolver used everywhere else: returns `"employee"` if logged out; if the real `user.role === "super_admin"` and a simulation is set, returns the simulated value; otherwise returns `user.role` verbatim. This is purely a **view-level** simulation for `super_admin` (see Roles below), not security — the backend enforces its own authorization independently.

`components/auth/auth-guard.tsx` wraps the `(dashboard)` group and client-side-redirects to `/login` when unauthenticated (there's no server to gate routes). It uses a `useSyncExternalStore` "mounted" flag rather than `useState`-in-effect to avoid hydration mismatch.

## Roles (4-tier: super_admin / hr_admin / manager / employee)

Roles come from the backend-driven `user.role` field, not a simple boolean — `super_admin` can additionally *simulate* viewing as another role. Two derived helpers do the real gating (`components/auth/role-store.ts`):

- **`useIsAdmin()`** → `role === "super_admin" || "hr_admin"` — full CRUD rights (create/edit/delete personnel, reassign roles in `personnel-dialog`). Gates `/personnel/detail` entirely (managers can't open it) and the add/edit/delete controls on `/personnel`.
- **`useHasDashboardAccess()`** → `useIsAdmin()` **or** `role.startsWith("manager")` — gates sidebar/nav visibility and the admin-vs-employee dashboard split. `manager` roles get read/approve access to `/personnel`, `/leave-requests`, `/calendar` but not personnel CRUD.

Wiring:
- `components/dashboard/dashboard-shell.tsx`: shows `Sidebar` + `md:ml-64` offset only when `useHasDashboardAccess()`; otherwise full-width, no sidebar (employee chrome).
- `components/dashboard/nav-items.ts` still names its gating flag `adminOnly` (a naming leftover — it's really "requires dashboard access"); `Sidebar`/`MobileTopBar` filter with `hasAccess || !item.adminOnly`.
- `app/(dashboard)/page.tsx` renders `AdminOverview` when `useHasDashboardAccess()`, else `EmployeeDashboard`.
- `/personnel`, `/leave-requests`, `/calendar` each redirect non-dashboard-access users to `/`; `/personnel/detail` additionally requires `useIsAdmin()` (managers redirected too).
- **Manager department scoping is client-side only, and only reachable via simulation**: pages check `simulatedRole?.startsWith("manager:")`, parse the `:<departmentId>` suffix, and filter fetched personnel/requests by `departmentId` in `AdminOverview`, `/personnel`, `/leave-requests`, `/calendar`. A *real* logged-in manager (not simulated) gets no client-side department filter — the assumption (per a code comment in `role-store.ts`) is that the backend already scopes `/personnel`/`/leave-requests` responses for that role; this is unverified from the frontend alone.
- `components/dashboard/role-switcher.tsx` is rendered only for real `super_admin` users (checked via `top-nav.tsx`'s `user?.role === 'super_admin'`) and lets them simulate `super_admin` (clear) or `manager:<departmentId>` for any department from `GET /departments`. There's no simulated `hr_admin`/`employee` option.
- `components/auth/use-current-employee.ts` resolves "me" via `GET /me` (see above); `EmployeeDashboard` renders an explanatory notice when there's no linked personnel record.
- **Known bug/dead code:** `app/(dashboard)/profile/page.tsx` still checks `role === "admin"` (3 spots) to pick the badge icon/label — `useRole()` can never return the literal string `"admin"` anymore, so this always falls through to the "Çalışan" (employee) branch, even for `super_admin`. Fix by switching to `useIsAdmin()`/`useHasDashboardAccess()` when touching that file.

## Domain model

`lib/data/types.ts` is the single source of truth: `Personnel` (includes `role: "super_admin"|"hr_admin"|"manager"|"employee"` and `departmentId?`, but no dedicated manager-department-scope field — see Roles above), `LeaveRequest`, their status/type unions, the **Turkish display-label maps** (`leaveTypeLabels`, `leaveStatusLabels`, `personnelStatusLabels`), and `attachmentConfig` (which leave types require a document — `sick` → "Doktor Raporu", `excuse` → "Dilekçe"). `LeaveType` is `annual | excuse | sick | unpaid`. Store internal values as the English union keys; render via these label maps — never hardcode Turkish strings for enum values.

Note `leaveDayCount()` in that file is now just a re-export of `workingDayCount` (business days), despite the name suggesting calendar days.

## Business-logic layer (`lib/date/`, `lib/data/balance.ts`, `lib/utils/`)

Pure, framework-free functions that encode the actual leave rules — keep them free of React/localStorage so they stay testable:

- `lib/date/business-days.ts` — `workingDayCount(start, end)` counts days **excluding weekends and public holidays**. Always parse `yyyy-mm-dd` with `parseLocalDate` (constructs a *local* Date) — never `new Date(iso)`, which is UTC and shifts `getDay()`/`getDate()` by a day.
- `lib/date/holidays.ts` — 2026 Turkish holidays as `publicHolidays2026` + `holidaySet2026` (O(1) lookup). National dates are fixed; **religious (Ramazan/Kurban) dates are approximate** and flagged to verify. No other year is covered.
- `lib/data/balance.ts` — `annualEntitlement(startDate)` derives yearly entitlement from seniority (Turkish Labour Law tiers: 14/20/26 days). `computeLeaveBalance(person, leaves)` returns a **derived, never-stored** `LeaveBalance`; only `type === "annual"` leaves deduct (sick/excuse/unpaid don't). Callers (e.g. `employee-dashboard.tsx`, `leave-dialog.tsx`) fetch the person + their leaves via `apiFetch` and call `computeLeaveBalance` directly — there's no store wrapper anymore.
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
