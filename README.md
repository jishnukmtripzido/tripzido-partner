# Tripzido Partner

Mobile-only Next.js app for Tripzido's rental partners, built to export
as static files for a Capacitor wrapper.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in your real API URL
npm run dev                        # http://localhost:3000
```

## Building for Capacitor

```bash
npm run build      # runs `next build`, which (via next.config.ts'
                    # output: "export") writes static files to ./out
npx cap sync        # after you've added ios/android platforms
```

`next.config.ts` sets `output: "export"` and `images.unoptimized: true`,
so `next build` produces a plain `out/` folder of HTML/CSS/JS with no
Node server required — that's what `npx cap add ios` / `cap add android`
expect as `webDir`.

## Viewing every screen without logging in

Set this in `.env.local`:

```
NEXT_PUBLIC_SKIP_AUTH=true
```

Restart `npm run dev`. This bypasses the "must be logged in" guard, so
`/`, `/dashboard`, `/fleet`, `/fleet/block`, `/ledger`, `/bookings`,
and `/profile` are all reachable directly with no auth flow involved.
`/login` still works normally underneath. Set it back to `false` (or
remove it) once you're testing the real login flow or building for
release — see `lib/devFlags.ts`.

## What's real vs. mocked right now

- All 5 screens you provided (Login/Register, Dashboard, My Fleet,
  Block Bikes, Ledger) are fully built and pixel-matched to your HTML.
- Bookings and Profile are placeholder screens (linked from the bottom
  nav / sidebar, but no mockup was provided for them yet).
- `lib/mockData.ts` holds the sample numbers so every screen renders
  exactly like your HTML out of the box. Swap in real API calls behind
  `services/*.service.ts` when your partner endpoints exist — nothing
  else needs to change since components only receive data via props.
- `services/auth.service.ts` + `lib/api.ts` mirror the pattern from
  your customer-facing app, pointed at placeholder `/api/partners/...`
  endpoints. Update the paths once you have real ones.
- Login/Register OTP verification actually calls the (placeholder) API
  and stores the session in `localStorage` via `AuthContext`. Swap to
  the Capacitor `Preferences` plugin later if you want it to survive
  app reinstalls.

## Notable deviations from the HTML (with reasons)

- **Sidebar** — wasn't in any of the 5 files, so I designed one from
  scratch in the same visual language (brand-yellow accents, Nunito
  headings) since every screen's hamburger button needed somewhere to
  go. Links to all 6 sections + a logout button.
- **Desktop gate** — new, per your request: anything ≥768px width
  shows a "use the app on your phone" screen instead of the UI
  (`components/layout/DesktopGate.tsx`).
- **Fleet tab icon** — your 3 mockups used two different, mismatched
  icons for the Fleet tab (a paper-plane on Dashboard/Ledger, a
  filled photo icon on Fleet/Block). I standardized it to the
  motorcycle icon you already use for bike rows, and switched
  active/inactive purely via color + font-weight (which all 5 screens
  already do) instead of swapping SVGs.
- **Bottom nav "active" tab** — computed from the actual route
  (`usePathname`) instead of being hardcoded per file. Ledger — which
  isn't one of the 4 bottom-tab destinations — correctly shows no tab
  active, rather than the mockup's leftover "Home" highlight.
- **Orders Overview chart** — your HTML had 7 bars but only 4
  "Week N" labels. Fixed to one label per bar.
- **Login/Register "Send OTP" button** — the mockups stopped at that
  button with nowhere to go. Added an inline OTP-entry step so the
  flow actually completes and signs the partner in.

## Folder map

```
app/
  layout.tsx                     root shell: fonts, AuthProvider, DesktopGate
  page.tsx                       redirects to /login or /dashboard
  (auth)/
    layout.tsx                   redirects away if already logged in
    login/page.tsx                Login/Register screen
  (dashboard)/
    layout.tsx                   auth guard + Sidebar + BottomNav chrome
    dashboard/page.tsx
    fleet/page.tsx                My Fleet (vehicle-list.html)
    fleet/block/page.tsx           Block Bikes (block-list.html)
    ledger/page.tsx
    bookings/page.tsx             placeholder
    profile/page.tsx              placeholder

components/
  layout/    Header, BottomNav, Sidebar, MobileShell, DesktopGate
  ui/        Pagination, QuantityStepper, DesktopBlocker
  features/
    auth/       AuthTabs, LoginForm, RegisterForm, PhoneInput
    dashboard/  BalanceCard, StatCard, OrdersOverviewChart
    fleet/      VehicleListItem
    fleet/block/ BlockListItem
    ledger/     LedgerListItem

context/     AuthContext, SidebarContext
services/    auth.service.ts
lib/         api.ts, mockData.ts
types/       fleet.types.ts, ledger.types.ts, dashboard.types.ts, auth.types.ts
```

Everything under `app/` and `components/` is a Client Component
(`"use client"`) except the root `app/layout.tsx`, which has no state
or interactivity of its own — it only wires up fonts/providers and is
flattened to static HTML at build time along with everything else.
