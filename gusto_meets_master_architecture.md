# Gusto Meets — Master Architecture Document
**Version:** 3.0 · June 2026  
**Classification:** Source of truth. Do not deviate without updating this document first.  
**Author:** Sr. SWE Architect perspective — compiled for Adithya Narayanan C.

---

## ⚠ READ THIS BEFORE TOUCHING ANY CODE

Every rework in software happens because someone built before they decided.
This document makes every architectural decision upfront.
If a question arises during development that is not answered here — stop, update this document, then build.

---

## 1. What We Are Building (Three Deliverables)

| Deliverable | What it is | Who uses it | Tech | Where it runs |
|-------------|-----------|------------|------|---------------|
| **gusto-meets-android** | Consumer mobile app | Guests + Hosts | Kotlin / Jetpack Compose | User's Android phone |
| **gusto-meets-admin** | Internal web dashboard | Platform team | Next.js 14 / React | Browser on laptop/desktop |
| **gusto-meets-backend** | Shared data + logic layer | Both apps connect here | Supabase (Postgres + Auth + Storage + Edge Functions) | Supabase Cloud |

These are **three separate codebases** that share **one database**.
They do not share code. They do not share auth tokens. They share only the Supabase project.

---

## 2. Why the Admin is a Web App (Not Android) — Final Decision

```
DECISION: Admin panel = Next.js web application deployed on Vercel.
RATIONALE:
  1. Admin tasks (reviewing videos, scanning PDFs, managing disputes, 
     reading analytics) require a large screen and keyboard. 
     These are desktop workflows, not mobile.
  2. Web apps have no app store distribution friction. Admins access 
     via a private URL + credentials. No APK installs, no Play Store.
  3. Rich data tables, charts, and document viewers are trivially built 
     in web (shadcn/ui DataTable, Recharts). Equivalent Android UI 
     takes 3× longer to build and maintain.
  4. Read-replica isolation (for heavy admin queries) is a server-side 
     concern — handled in Next.js API routes / Edge functions, 
     completely transparent to the Android app.
  5. RBAC enforcement via Next.js middleware is simpler and more 
     auditable than Android intent-level permission checks.
CONSEQUENCE: 
  Any future admin feature is built in gusto-meets-admin (web), 
  never in the Android app. The Android app has zero admin functionality.
```

---

## 3. Repository Structure

```
gusto-meets/                     ← monorepo root (or 3 separate repos)
├── android/                     ← Consumer app
│   ├── app/src/main/java/
│   │   com/gustomeets/app/
│   │   ├── core/                ← Constants, utils, base classes
│   │   ├── data/                ← Repository impls, Room, Supabase sources
│   │   ├── di/                  ← Hilt modules
│   │   ├── domain/              ← Entities, enums, repo interfaces, use cases
│   │   └── presentation/        ← Screens, ViewModels, components
│   └── build.gradle.kts
│
├── admin-web/                   ← Admin dashboard
│   ├── src/
│   │   ├── app/                 ← Next.js App Router pages
│   │   │   ├── (auth)/          ← Login page (outside main layout)
│   │   │   ├── (dashboard)/     ← Protected pages (inside main layout)
│   │   │   │   ├── terraces/    ← Listing verification queue
│   │   │   │   ├── users/       ← User management
│   │   │   │   ├── bookings/    ← Booking oversight
│   │   │   │   ├── disputes/    ← Damage + dispute resolution
│   │   │   │   ├── finance/     ← Payouts, commissions, promo codes
│   │   │   │   ├── config/      ← Platform settings
│   │   │   │   └── audit/       ← Immutable audit log viewer
│   │   ├── components/          ← Reusable UI components
│   │   ├── lib/                 ← Supabase client, auth helpers, API utils
│   │   └── middleware.ts        ← Route protection + RBAC enforcement
│   ├── next.config.js
│   └── package.json
│
└── supabase/                    ← Backend (shared)
    ├── migrations/
    │   ├── 001_gusto_meets_schema.sql      ← All tables (from Session 1)
    │   ├── 002_admin_audit_log.sql         ← Audit trail (append-only)
    │   └── 003_rls_policies.sql            ← Row Level Security rules
    ├── functions/
    │   ├── admin-auth/          ← Custom JWT for admin login
    │   ├── verify-aadhaar/      ← Setu KYC gateway
    │   ├── generate-agreement/  ← PDF generation (pdf-lib)
    │   ├── check-overstays/     ← Cron: penalty calculation
    │   └── admin-action/        ← Audit-logged admin mutations
    └── seed.sql
```

---

## 4. Authentication Architecture (Three Separate Systems)

This is the most critical thing to understand before building. There are THREE completely different auth systems.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION MAP                               │
├──────────────────┬──────────────────┬───────────────────────────────┤
│ App              │ Auth method      │ Token type                    │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Android (Guest)  │ Firebase Phone   │ Firebase ID token             │
│                  │ OTP → Supabase   │ → exchanged for Supabase JWT  │
│                  │ Google OAuth     │                               │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Android (Host)   │ Same as Guest    │ Same Supabase JWT             │
│                  │ Role = HOST in   │ active_role stored in         │
│                  │ users table      │ DataStore                     │
├──────────────────┼──────────────────┼───────────────────────────────┤
│ Admin Web        │ Custom internal  │ Custom JWT (NOT Supabase Auth)│
│                  │ Employee ID +    │ Issued by admin-auth Edge Fn  │
│                  │ Password + DOB   │ Stored in httpOnly cookie     │
│                  │ TOTP (Phase 2)   │ 8-hour expiry                 │
└──────────────────┴──────────────────┴───────────────────────────────┘
```

**Admin login flow (step by step):**
1. Admin goes to `admin.gustomeets.com/login`
2. Enters: Employee ID (e.g., GMT-001) + Password + Date of Birth
3. Next.js API route calls Supabase Edge Function `admin-auth`
4. Edge Function:
   a. Queries `admin_users` table: find by `employee_id`
   b. Validates `bcrypt.verify(password, password_hash)`
   c. Validates `dob` matches stored `date_of_birth`
   d. If all pass: issues a signed JWT with `{adminId, employeeId, role, exp: 8h}`
5. JWT stored in `httpOnly` cookie (cannot be accessed by JavaScript — XSS protection)
6. Next.js `middleware.ts` validates this cookie on every request to `/dashboard/*`
7. Role is read from the JWT payload — UI adapts based on `SUPER_ADMIN` / `REVIEWER` / `SUPPORT` / `FINANCE`

**Why httpOnly cookie and not localStorage?**
Because admin has access to sensitive PII. If an XSS attack injects malicious JS into the admin page, it cannot steal a httpOnly cookie. It CAN steal from localStorage. For consumer apps this tradeoff is acceptable; for admin it is not.

---

## 5. RBAC Matrix (Who Can Do What)

| Action | SUPER_ADMIN | REVIEWER | SUPPORT | FINANCE |
|--------|:-----------:|:--------:|:-------:|:-------:|
| View all terrace listings | ✓ | ✓ | ✓ | ✓ |
| Approve / reject listings | ✓ | ✓ | — | — |
| Suspend / ban users | ✓ | — | — | — |
| View all user PII | ✓ | ✓ | ✓ (masked) | — |
| View booking history | ✓ | ✓ | ✓ | ✓ |
| Force-cancel a booking | ✓ | — | ✓ | — |
| Resolve disputes | ✓ | ✓ | — | — |
| Process manual refunds | ✓ | — | — | ✓ |
| Manage payout holds | ✓ | — | — | ✓ |
| Change commission rates | ✓ | — | — | ✓ |
| Create promo codes | ✓ | — | — | ✓ |
| View audit log | ✓ | — | — | — |
| Add / remove admin users | ✓ | — | — | — |
| View platform analytics | ✓ | ✓ | — | ✓ |
| Configure platform settings | ✓ | — | — | — |

**PII masking rule for SUPPORT role:**
- Phone number: show last 4 digits only → `+91 XXXXXX4532`
- Aadhaar token: show reference token only, never the number
- Full name: visible
- Address: visible (needed for dispute context)

---

## 6. Admin Database Additions

Add these to the migration files:

```sql
-- ── MIGRATION 002: AUDIT LOG ──────────────────────────────────────────
-- This table is APPEND-ONLY. No UPDATE. No DELETE. Ever.
-- Enforced via Supabase RLS: only INSERT allowed, never UPDATE/DELETE.

CREATE TABLE admin_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID NOT NULL REFERENCES admin_users(id),
  employee_id     VARCHAR(20) NOT NULL,   -- denormalised for fast read
  action_type     VARCHAR(100) NOT NULL,  -- e.g. 'TERRACE_APPROVED'
  target_type     VARCHAR(50),            -- 'TERRACE' | 'USER' | 'BOOKING' | 'DISPUTE'
  target_id       UUID,                   -- the ID of the affected record
  action_detail   JSONB,                  -- snapshot of what changed
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- No UPDATE or DELETE permitted on audit_log (enforced in RLS)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_insert_only"
  ON admin_audit_log FOR INSERT
  WITH CHECK (TRUE);
-- No SELECT policy for non-admins. Only the Edge Function can write to it.

-- ── MIGRATION 002: ADMIN USER TABLE ADDITIONS ─────────────────────────
ALTER TABLE admin_users
  ADD COLUMN date_of_birth DATE NOT NULL DEFAULT '1990-01-01',
  ADD COLUMN totp_secret VARCHAR(100),        -- Phase 2: TOTP/2FA
  ADD COLUMN failed_login_count INT DEFAULT 0,
  ADD COLUMN locked_until TIMESTAMPTZ;        -- lockout after 5 failed attempts

-- ── MIGRATION 002: PLATFORM CONFIG TABLE ─────────────────────────────
CREATE TABLE platform_config (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES admin_users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_config (key, value, description) VALUES
  ('platform_fee_percent',      '15',     'Platform commission on each booking (%)'),
  ('overstay_multiplier',       '2.0',    'Penalty rate multiplier for overstay'),
  ('payment_timeout_minutes',   '15',     'Minutes before PENDING_PAYMENT is auto-cancelled'),
  ('booking_buffer_minutes',    '30',     'Gap enforced between consecutive bookings'),
  ('min_parapet_height_ft',     '4.0',    'Minimum terrace parapet height in feet'),
  ('max_photos_per_listing',    '15',     'Maximum photos a host can upload'),
  ('payout_delay_days',         '2',      'Business days after checkout before host payout'),
  ('max_guests_per_booking',    '50',     'Platform-wide guest count cap');

-- ── MIGRATION 002: PROMO CODES TABLE ─────────────────────────────────
CREATE TABLE promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) UNIQUE NOT NULL,
  discount_type   VARCHAR(10) NOT NULL CHECK (discount_type IN ('FLAT','PERCENT')),
  discount_value  DECIMAL(10,2) NOT NULL,
  max_uses        INT,
  used_count      INT DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_until     TIMESTAMPTZ,
  created_by      UUID REFERENCES admin_users(id),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── MIGRATION 002: PAYOUT TRACKING ────────────────────────────────────
CREATE TABLE host_payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id             UUID NOT NULL REFERENCES users(id),
  booking_id          UUID NOT NULL REFERENCES bookings(id),
  gross_amount        DECIMAL(10,2) NOT NULL,
  platform_fee        DECIMAL(10,2) NOT NULL,
  net_amount          DECIMAL(10,2) NOT NULL,
  status              VARCHAR(20) DEFAULT 'PENDING',
  razorpay_payout_id  VARCHAR(100),
  processed_at        TIMESTAMPTZ,
  processed_by        UUID REFERENCES admin_users(id),
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Admin Web App — Feature Breakdown by Page

### 7.1 Login Page `/login`
- Employee ID field
- Password field
- Date of Birth field (date picker)
- "Sign In" button
- Failed login counter — lockout after 5 attempts for 30 minutes
- No "Forgot password" self-serve — password reset via Super Admin only

### 7.2 Dashboard Home `/dashboard`
Live stats (auto-refreshing every 60 seconds):
- Total terraces: verified / pending / suspended
- Total users: guests / hosts
- Bookings today: active / completed / cancelled
- Disputes: open / resolved this week
- Revenue today / this month (platform fee collected)
- Payout queue: payouts pending processing

### 7.3 Terrace Verification `/dashboard/terraces`
**Pending queue tab:**
- Table: listing title, host name, area, submitted date, status badge
- Click a row → Terrace Detail Review modal:
  - Photo carousel (all uploaded photos)
  - 30-second approval video (embedded HTML5 video player)
  - GPS coordinates vs declared address (Google Maps embed showing the pin)
  - All legal documents (PDF/image viewer for ownership doc, NOC)
  - Safety declarations summary (which boxes were checked)
  - Agreement PDF acceptance timestamp + IP
  - Parapet height declared
- Two action buttons: "Approve" | "Reject"
  - Reject opens a text field for rejection reason (sent to host via notification)
  - Every action writes to `admin_audit_log`

**All terraces tab:**
- Full searchable, filterable table of all terraces
- Filters: city, verification status, host name, date range
- Bulk actions: suspend multiple, export CSV

### 7.4 User Management `/dashboard/users`
- Combined table of all users (guests + hosts)
- Search by name, phone, employee ID (won't exist here — wrong table)
- Role filter: GUEST / HOST / both
- Click a user → User Detail modal:
  - Profile info (name, phone, KYC status, wallet balance)
  - Phone number shown based on role (masked for SUPPORT)
  - Booking history (paginated list)
  - Reviews given and received
  - Any damage reports involving this user
- Actions: Suspend account / Ban account / Reinstate / Add note
- All actions written to audit log

### 7.5 Booking Oversight `/dashboard/bookings`
- All bookings with status filter
- Highlight overstayed bookings in amber
- Click a booking → Booking Detail:
  - Guest and host info
  - Terrace details
  - Payment breakdown
  - Timeline (created → confirmed → active → completed)
- Admin actions: Force-cancel (reason required) / Override penalty / Extend deadline
- Force-cancel triggers refund flow and notifies both parties

### 7.6 Dispute Resolution `/dashboard/disputes`
- Open disputes queue (damage reports with status = PENDING)
- Each dispute card shows: booking summary, host's claim, claimed amount, damage photos
- Click to open full dispute view:
  - Side-by-side: pre-booking terrace photos (from listing) vs post-booking damage photos
  - Guest's booking purpose and description
  - Timeline of events
  - Host's damage description
- Admin verdict form:
  - Approve claim fully / Approve partial amount / Reject claim
  - Text field: verdict reasoning (sent to both parties)
  - "Confirm verdict" → triggers Razorpay deposit capture or refund via Edge Function
  - Written to audit log

### 7.7 Finance `/dashboard/finance`
Three sub-tabs:

**Payouts tab:**
- Table of pending payouts (booking completed, net amount calculated, not yet transferred)
- Bulk "Process payouts" → triggers Razorpay payout API for selected rows
- Manual payout override: enter host's bank details + amount manually
- Payout history with Razorpay transaction IDs

**Commission tab:**
- Edit `platform_fee_percent` in `platform_config`
- Effective immediately for new bookings
- Historical commission rates shown (audit trail)

**Promo codes tab:**
- Create new promo code: code string, FLAT or PERCENT discount, value, validity dates, max uses
- Table of all promo codes with usage count / max uses / status
- Deactivate / reactivate a code

### 7.8 Platform Config `/dashboard/config`
- Edit any value in `platform_config` table
- Each edit requires confirmation ("Are you sure? This affects all future bookings")
- Written to audit log with previous and new value

### 7.9 Audit Log `/dashboard/audit` (SUPER_ADMIN only)
- Immutable, read-only table
- Columns: timestamp, admin name, employee ID, action type, target, details
- Filters: admin name, action type, date range, target type
- Export to CSV
- Cannot be edited or deleted by anyone — not even Super Admin

### 7.10 Admin Management `/dashboard/admins` (SUPER_ADMIN only)
- List of all admin users
- Add new admin: form with employee ID, full name, email, DOB, role, temp password
- Edit role (cannot demote yourself)
- Deactivate account
- Reset password (sends temp password to their email)

---

## 8. Admin Web — Tech Stack (Locked)

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 14 (App Router) | Server Components for secure data fetching, middleware for auth |
| Styling | Tailwind CSS | Same as Android team knows, consistent |
| UI components | shadcn/ui | Production-grade data tables, forms, dialogs |
| Auth | Custom httpOnly cookie JWT | More secure than NextAuth for internal tools |
| Data fetching | React Query (TanStack) | Caching, background refresh for live dashboard stats |
| Charts | Recharts | Booking volume, revenue trends |
| Tables | TanStack Table (via shadcn) | Sortable, filterable, paginated data tables |
| PDF viewer | react-pdf | Show agreement PDFs inline in the admin review modal |
| Maps | Google Maps JS API | Show terrace GPS pin in verification flow |
| Video player | HTML5 `<video>` tag | Native browser video for approval video playback |
| Backend calls | Supabase JS SDK (server-side) | Queries run from Server Components using service role key |
| Deployment | Vercel | Private deployment, env vars protected |

---

## 9. Admin Supabase Edge Functions Needed

```
supabase/functions/
├── admin-auth/
│   └── index.ts       ← Employee ID + password + DOB → custom JWT
│
└── admin-action/
    └── index.ts       ← Wrapper for all destructive admin mutations.
                          Accepts: {actionType, targetId, payload, adminJwt}
                          Validates JWT, checks RBAC, executes mutation,
                          writes to admin_audit_log in one atomic transaction.
                          
                          Why this exists: 
                          Admin mutations (approve listing, ban user, force-cancel
                          booking) must ALWAYS be paired with an audit log entry.
                          If the mutation succeeds but the log fails, we have 
                          invisible actions. Doing both in one Edge Function 
                          transaction guarantees atomicity.
```

---

## 10. Complete Build Sequence (No Rework Guarantee)

Follow this exact order. Each phase builds on the previous. Never jump ahead.

```
PHASE 0 — Foundation (do once, never touch again)
  ✓ Supabase project created
  ✓ Migration 001 run (all consumer tables)
  → Run Migration 002 (admin tables: audit_log, platform_config, payouts, promo_codes)
  → Set up Supabase Storage buckets (terrace-photos, approval-videos, etc.)
  → Deploy admin-auth Edge Function
  → Deploy admin-action Edge Function
  → Test both Edge Functions with Postman/curl before touching UI

PHASE 1 — Android consumer app (Sessions 1–7 from master prompt pack)
  → Session 1: Scaffold + schema (updated with Migration 002 entities)
  → Session 2: Auth (OTP + Google OAuth + role switching)
  → Session 2.5: Host onboarding wizard (8 steps)
  → Session 3: Aadhaar KYC
  → Session 4: Core booking flow (strategy pattern)
  → Session 5: Razorpay + active booking + timer
  → Session 6: Host dashboard + wallet + admin stubs
  → Session 7: Error handling + security + README
  
  CHECKPOINT: Android app must have at least 3 test bookings in the DB
  before moving to Phase 2.

PHASE 2 — Admin web dashboard
  → Admin Session 1: Scaffold + auth
  → Admin Session 2: Dashboard home + terrace verification
  → Admin Session 3: User management + booking oversight
  → Admin Session 4: Dispute resolution
  → Admin Session 5: Finance tab (payouts + commissions + promo codes)
  → Admin Session 6: Config + audit log + admin management
  
PHASE 3 — Integration testing
  → Test full flow: Host lists terrace → Admin approves → Guest books
    → Active session → Checkout → Host payout
  → Test dispute flow: Host reports damage → Admin resolves → Deposit captured
  → Test overstay flow: WorkManager fires → Penalty deducted → Audit logged

PHASE 4 — Deploy
  → Android: signed APK → Google Play internal testing track
  → Admin: Vercel deployment with env vars, private access
  → Supabase: Production project (not free tier)
```

---

## 11. What NOT to Build Yet (Phase 2 List)

Do not build these in Phase 1. Putting them in now causes scope creep and rework.

- Elasticsearch for fuzzy search (use simple Supabase `ilike` query for now)
- TOTP / 2FA for admin login (password + DOB is sufficient for Phase 1)
- WhatsApp Business API (use Firebase Cloud Messaging push notifications)
- Peak-hour dynamic pricing (1.2× on Friday evenings)
- Self-serve host onboarding (admin manually approves all Phase 1 listings)
- Revenue sharing automation (manually handled by Finance admin in Phase 1)
- Referral program
- Multi-city rollout (Chennai only in Phase 1)
- Analytics data warehouse (Supabase dashboard is sufficient for Phase 1)

---

## 12. Security Checklist (Non-Negotiable Before Launch)

**Database:**
- [ ] RLS enabled on ALL tables
- [ ] No table allows `SELECT *` without a user JWT
- [ ] `admin_audit_log` has no UPDATE or DELETE policy
- [ ] `admin_users.password_hash` is never returned in any query response
- [ ] Sensitive columns (kyc_reference_token, password_hash) excluded from default SELECT

**Android app:**
- [ ] `google-services.json` is in `.gitignore`
- [ ] All TODO API keys replaced before any public repo
- [ ] `android:debuggable="false"` in release manifest
- [ ] ProGuard rules applied for Razorpay, Hilt, Room

**Admin web:**
- [ ] JWT stored in httpOnly cookie only
- [ ] All admin mutations go through `admin-action` Edge Function (never direct Supabase client)
- [ ] Supabase service role key used only in server-side code, never in browser
- [ ] CORS restricted to admin domain only
- [ ] Rate limiting on `/login` endpoint (max 5 attempts per IP per 15 minutes)

**Supabase:**
- [ ] Supabase anon key cannot write to `admin_users`, `admin_audit_log`, `platform_config`
- [ ] Storage buckets: `approval-videos` and `legal-documents` are NOT public — require signed URLs
- [ ] `terrace-photos` can be public (listing photos are fine to be public)
- [ ] Supabase service role key stored only in Edge Function env vars and Next.js server env

---

## 13. Environment Variables Reference

### Android app (local.properties — never commit)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
RAZORPAY_KEY_ID=
MAPS_API_KEY=
SETU_CLIENT_ID=
SETU_CLIENT_SECRET=
```

### Admin web (.env.local — never commit)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=      # ← different from anon key. Never in Android app.
ADMIN_JWT_SECRET=               # ← random 64-char string for signing admin JWTs
NEXT_PUBLIC_SUPABASE_URL=       # ← same as SUPABASE_URL (used in browser for storage)
NEXT_PUBLIC_MAPS_API_KEY=       # ← for Google Maps in verification modal
```

### Supabase Edge Functions
```
ADMIN_JWT_SECRET=               # same as admin web
SETU_CLIENT_ID=
SETU_CLIENT_SECRET=
RAZORPAY_KEY_SECRET=            # ← only here. Never anywhere else.
INTERAKT_API_KEY=
```

---

## 14. One-Line Summary of Every File's Purpose

### Android (key files only)
| File | Purpose |
|------|---------|
| `Constants.kt` | All placeholder API keys — one file to update before launch |
| `AppModule.kt` | Hilt wiring — provides Supabase client, DataStore, WorkManager |
| `NavGraph.kt` | Every screen and route — single source of navigation truth |
| `HostOnboardingViewModel.kt` | Entire 8-step wizard state — all in one ViewModel |
| `BookingService.kt` | Mutex-protected booking logic — prevents double-booking |
| `PaymentTimeoutWorker.kt` | WorkManager — cancels unpaid bookings after 15 min |
| `OverstayCheckWorker.kt` | WorkManager cron — applies penalties to overstayed bookings |

### Admin Web (key files only)
| File | Purpose |
|------|---------|
| `middleware.ts` | Intercepts every `/dashboard/*` request — validates JWT, enforces RBAC |
| `lib/admin-auth.ts` | Calls `admin-auth` Edge Function, manages httpOnly cookie |
| `lib/admin-action.ts` | Wrapper for all mutations — ensures audit log is always written |
| `lib/supabase-server.ts` | Server-side Supabase client using service role key |

### Supabase Edge Functions
| Function | Purpose |
|----------|---------|
| `admin-auth` | Validates employee credentials → returns JWT |
| `admin-action` | Executes mutation + audit log atomically |
| `verify-aadhaar` | Calls Setu API → returns KYC result |
| `generate-agreement` | Generates host agreement PDF with pdf-lib |
| `check-overstays` | Runs every 5 min — finds and penalises overstayed bookings |
