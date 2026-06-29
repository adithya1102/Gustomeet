# Gusto Meets Admin — AI Studio Build Prompts
**Tool:** Google AI Studio (or Claude Code CLI on personal laptop)  
**App:** gusto-meets-admin (Next.js 14 web dashboard)  
**Auth:** Custom Employee ID + Password + DOB → httpOnly JWT cookie

Paste one Session block at a time. Wait for full output before moving to next.

---

## ═══════════════════════════════════════════
## ADMIN SESSION 1 — Scaffold + Auth System
## ═══════════════════════════════════════════

```
CONTEXT:
I am building "Gusto Meets Admin" — an internal web dashboard for managing
the Gusto Meets terrace rental marketplace. This is a Next.js 14 web app
that connects to the same Supabase database as the consumer Android app.

Admins are platform employees who log in with:
  - Employee ID (e.g., GMT-001)
  - Password (bcrypt hashed in DB)
  - Date of Birth (secondary verification)

Auth uses a custom httpOnly JWT cookie — NOT Supabase Auth.
Admin roles: SUPER_ADMIN | REVIEWER | SUPPORT | FINANCE

TASK: Scaffold the project and build the complete auth system.

══════════════════════════════════════════
SECTION A — Project setup
══════════════════════════════════════════

This is a fresh Next.js 14 project with App Router, TypeScript, and Tailwind.
Run: npx create-next-app@latest gusto-meets-admin --typescript --tailwind --app

Install these packages after scaffolding:
  @supabase/supabase-js
  @supabase/ssr
  jose                         ← JWT signing and verification (Edge-compatible)
  bcryptjs @types/bcryptjs     ← password hashing
  @tanstack/react-query        ← data fetching and caching
  recharts                     ← charts for analytics
  @tanstack/react-table        ← data tables
  react-pdf                    ← PDF viewer in dispute/agreement review modals
  sonner                       ← toast notifications
  lucide-react                 ← icons
  clsx tailwind-merge          ← conditional classnames

Install shadcn/ui components:
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button input label card badge table
      dialog sheet tabs select separator skeleton avatar
      dropdown-menu alert-dialog progress toast

══════════════════════════════════════════
SECTION B — Environment variables
══════════════════════════════════════════

Create .env.local with these placeholders:

SUPABASE_URL=TODO_REPLACE_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=TODO_REPLACE_SERVICE_ROLE_KEY
ADMIN_JWT_SECRET=TODO_REPLACE_64_CHAR_RANDOM_STRING
NEXT_PUBLIC_SUPABASE_URL=TODO_REPLACE_SUPABASE_URL
NEXT_PUBLIC_MAPS_API_KEY=TODO_REPLACE_GOOGLE_MAPS_KEY

IMPORTANT: SUPABASE_SERVICE_ROLE_KEY is NEVER exposed to the browser.
It only appears in server-side code (Server Components and API routes).
NEXT_PUBLIC_* variables ARE visible in browser — only non-sensitive values.

══════════════════════════════════════════
SECTION C — TypeScript types
══════════════════════════════════════════

Create src/lib/types.ts with:

export type AdminRole = 'SUPER_ADMIN' | 'REVIEWER' | 'SUPPORT' | 'FINANCE'

export interface AdminUser {
  id: string
  employeeId: string
  fullName: string
  email: string
  role: AdminRole
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminJwtPayload {
  adminId: string
  employeeId: string
  role: AdminRole
  exp: number
}

export type VerificationStatus =
  'UNVERIFIED' | 'PENDING_INSPECTION' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED'

export type BookingStatus =
  'PENDING_PAYMENT' | 'CONFIRMED' | 'ACTIVE' | 'EXTENDED' |
  'COMPLETED' | 'OVERSTAYED' | 'DISPUTED' | 'CANCELLED'

export interface Terrace {
  id: string
  hostId: string
  title: string
  area: string | null
  city: string
  addressLine: string
  geoLat: number | null
  geoLng: number | null
  constructionYear: number | null
  maxCapacity: number
  photos: string[]
  virtualApprovalVideoUrl: string | null
  parapetConfirmed: boolean
  floorSafe: boolean
  lightingAvailable: boolean
  staircaseSafe: boolean
  liabilityAccepted: boolean
  ownershipCategory: string
  ownershipDocUrl: string | null
  ownerNocUrl: string | null
  flatUnitCount: number | null
  flatNocCategory: string
  flatNocUrl: string | null
  agreementPdfUrl: string | null
  agreementAccepted: boolean
  agreementAcceptedAt: string | null
  agreementAcceptedIp: string | null
  verification: VerificationStatus
  adminReviewNote: string | null
  isActive: boolean
  createdAt: string
}

export interface Booking {
  id: string
  guestId: string
  terraceId: string
  durationType: string
  startTime: string
  endTime: string
  actualCheckoutTime: string | null
  purpose: string
  purposeDescription: string | null
  guestCount: number
  status: BookingStatus
  totalCharged: number
  securityDeposit: number
  platformFee: number
  overstayPenalty: number
  damagePenalty: number
  createdAt: string
}

export interface PlatformUser {
  id: string
  phoneNumber: string
  fullName: string | null
  activeRole: string
  hasHostProfile: boolean
  kycVerified: boolean
  walletBalance: number
  completedBookings: number
  createdAt: string
}

export interface DamageReport {
  id: string
  bookingId: string
  hostId: string
  description: string
  photos: string[]
  claimedAmount: number | null
  resolvedAmount: number | null
  adminNotes: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  resolvedAt: string | null
}

export interface AuditLog {
  id: string
  adminId: string
  employeeId: string
  actionType: string
  targetType: string | null
  targetId: string | null
  actionDetail: Record<string, unknown>
  ipAddress: string | null
  createdAt: string
}

export interface PromoCode {
  id: string
  code: string
  discountType: 'FLAT' | 'PERCENT'
  discountValue: number
  maxUses: number | null
  usedCount: number
  validFrom: string
  validUntil: string | null
  isActive: boolean
  createdAt: string
}

export interface HostPayout {
  id: string
  hostId: string
  bookingId: string
  grossAmount: number
  platformFee: number
  netAmount: number
  status: 'PENDING' | 'PROCESSED' | 'FAILED'
  razorpayPayoutId: string | null
  processedAt: string | null
  failureReason: string | null
  createdAt: string
}

══════════════════════════════════════════
SECTION D — Supabase server-side client
══════════════════════════════════════════

Create src/lib/supabase-server.ts

This client uses the SERVICE ROLE KEY — it bypasses Row Level Security
and has full DB access. ONLY use in Server Components and API Routes.
NEVER import this in any client component (files with 'use client').

import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

══════════════════════════════════════════
SECTION E — JWT utility functions
══════════════════════════════════════════

Create src/lib/admin-jwt.ts using the 'jose' library (not jsonwebtoken —
jose works in Next.js Edge Runtime which middleware uses):

Functions to implement:
  signAdminJwt(payload: AdminJwtPayload): Promise<string>
    - Uses HS256 algorithm
    - Secret: TextEncoder().encode(process.env.ADMIN_JWT_SECRET)
    - Expiry: 8 hours from now

  verifyAdminJwt(token: string): Promise<AdminJwtPayload | null>
    - Returns payload if valid, null if expired or invalid
    - Never throws — catches all errors and returns null

  COOKIE_NAME = 'gusto_admin_session' (constant)

══════════════════════════════════════════
SECTION F — Middleware (route protection + RBAC)
══════════════════════════════════════════

Create src/middleware.ts

This runs on EVERY request to /dashboard/* before the page loads.
It is the security gate — if this is wrong, the admin is insecure.

Logic:
  1. If request path starts with /dashboard:
     a. Read cookie named COOKIE_NAME from request
     b. Call verifyAdminJwt(cookieValue)
     c. If null (invalid/expired): redirect to /login
     d. If valid: attach admin role to request headers
        (x-admin-id, x-admin-role, x-employee-id)
        so Server Components can read role without re-verifying JWT
  2. If request path is /login and cookie is valid: redirect to /dashboard
  3. All other paths: pass through

matcher config: ['/((?!_next|api|favicon).*)']
(applies middleware to all routes except Next.js internals)

══════════════════════════════════════════
SECTION G — Login page + auth action
══════════════════════════════════════════

Create src/app/(auth)/login/page.tsx

UI:
- Centered card (max-w-md, mx-auto, mt-20)
- Gusto Meets logo + "Admin Portal" subtitle in muted text
- Employee ID input: placeholder "GMT-001", monospace font
- Password input: type=password, show/hide toggle button
- Date of Birth input: type=date
- "Sign In" button: full width, primary variant
- Below button: small muted text "Internal access only.
  Contact your Super Admin if you need a password reset."
- On failed login: inline red error alert showing specific message
  (use sonner toast for success, inline alert for errors)
- On 5 failed attempts: show "Account locked. Contact Super Admin." permanently

Create src/app/actions/auth.ts (Server Action):

'use server'
async function loginAction(formData: FormData)
  Steps:
  1. Extract employeeId, password, dateOfBirth from formData
  2. Basic validation: all fields non-empty
  3. Call the Supabase admin-auth Edge Function via fetch:
     POST to process.env.SUPABASE_URL + '/functions/v1/admin-auth'
     Body: { employeeId, password, dateOfBirth }
     Headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY }
  4. If response.ok: extract jwt from response
     Set httpOnly cookie: name=COOKIE_NAME, value=jwt,
     httpOnly=true, secure=true, sameSite='lax', maxAge=28800 (8 hours)
     Redirect to /dashboard
  5. If response 401: return { error: 'Invalid credentials' }
  6. If response 423: return { error: 'Account locked. Contact Super Admin.' }
  7. If other error: return { error: 'Authentication service unavailable' }

Create src/app/actions/logout.ts (Server Action):
  Clears the COOKIE_NAME cookie and redirects to /login

══════════════════════════════════════════
SECTION H — Dashboard layout shell
══════════════════════════════════════════

Create src/app/(dashboard)/layout.tsx

This is the shell for all admin pages. It shows:
- Left sidebar navigation (240px wide, sticky)
- Main content area (flex-1, overflow-y-auto)

SIDEBAR items (show/hide based on role from x-admin-role header):
  Home (all roles)
  Terraces (SUPER_ADMIN, REVIEWER)
  Users (SUPER_ADMIN, REVIEWER, SUPPORT)
  Bookings (all roles)
  Disputes (SUPER_ADMIN, REVIEWER)
  Finance (SUPER_ADMIN, FINANCE)
  Config (SUPER_ADMIN only)
  Audit Log (SUPER_ADMIN only)
  Admins (SUPER_ADMIN only)

Each sidebar item: lucide icon + label + active state (solid left border, bg-accent)
Bottom of sidebar: logged-in admin info (name, employee ID, role badge) + Logout button

Header bar (top of main content):
- Page title (h1, 20px)
- Admin name + role badge (top right)
- Breadcrumb below title

OUTPUT REQUIRED:
Full file content for:
  package.json (with all dependencies)
  .env.local (with placeholders)
  src/lib/types.ts
  src/lib/supabase-server.ts
  src/lib/admin-jwt.ts
  src/middleware.ts
  src/app/(auth)/login/page.tsx
  src/app/actions/auth.ts
  src/app/actions/logout.ts
  src/app/(dashboard)/layout.tsx

Also create: src/app/(auth)/login/LoginForm.tsx as a client component
('use client') that handles the form state and calls loginAction.
The page.tsx itself should be a server component.
```

---

## ═══════════════════════════════════════════
## ADMIN SESSION 2 — Dashboard + Terrace Verification
## ═══════════════════════════════════════════

```
CONTEXT:
Continuing Gusto Meets Admin. Auth is built. Now building the home dashboard
and the most critical admin feature: verifying terrace listings.

TASK A — Dashboard home: src/app/(dashboard)/page.tsx

This is a Server Component. It fetches live stats from Supabase on every
request (using createServiceClient). No client-side fetching on this page.

Stats to show (6 metric cards in a 3-column grid):

Card 1 — Terraces
  Primary number: count of VERIFIED terraces
  Secondary: "X pending review" in amber if pending > 0

Card 2 — Users
  Primary: total user count
  Secondary: "X hosts · Y guests"

Card 3 — Bookings today
  Primary: count where DATE(created_at) = today
  Secondary: "X active now" in green

Card 4 — Open disputes
  Primary: count of damage_reports WHERE status = 'PENDING'
  Secondary: "X resolved this week" in muted

Card 5 — Revenue today
  Primary: SUM(platform_fee) WHERE DATE(created_at) = today, formatted ₹X,XXX
  Secondary: "₹X,XXX this month"

Card 6 — Payout queue
  Primary: count of host_payouts WHERE status = 'PENDING'
  Secondary: "₹X,XXX pending transfer" in amber if > 0

Below the metric cards: a simple bar chart (Recharts) showing
bookings per day for the last 7 days. Data fetched server-side.
Chart is a client component ('use client') receiving data as props.

TASK B — Terrace verification: src/app/(dashboard)/terraces/page.tsx

Two tabs: "Pending review" | "All terraces"

PENDING REVIEW TAB:
Server component. Fetches terraces WHERE verification = 'PENDING_INSPECTION'
ordered by created_at ASC (oldest first — FIFO queue).

Each listing shown as a compact table row:
  | Photo (48px thumbnail) | Title | Area | Host name | Submitted | Status badge | Review button |

"Review" button opens a full-screen modal (or navigates to detail page).

Create: src/app/(dashboard)/terraces/[terraceId]/page.tsx
This is the FULL REVIEW PAGE for a single terrace.
Sections (all in one scrollable page, no tabs):

Section 1 — LOCATION:
  Google Maps embed showing the declared GPS coordinates as a pin.
  Address text below the map.
  Construction year.
  Parapet declared height (flag in red if < 4ft).

Section 2 — PHOTOS (5-column masonry grid of all uploaded photos).
  Click any photo to open full-size in a dialog.

Section 3 — APPROVAL VIDEO:
  HTML5 video player with controls.
  Source: Supabase Storage signed URL (call createServiceClient().storage
  .from('approval-videos').createSignedUrl(..., 3600))
  Below: GPS coordinates extracted from video metadata (if available).
  Show "✓ GPS match" in green or "⚠ GPS mismatch — verify manually" in amber.

Section 4 — LEGAL DOCUMENTS:
  For each document (ownershipDocUrl, ownerNocUrl, flatNocUrl):
    If it's a PDF: embed react-pdf <Document> viewer (max 3 pages shown, "Show all" toggle)
    If it's an image: show at full width in a card.
  Ownership type badge: "Sole owner" | "Tenant with NOC"
  Flat unit count if applicable.

Section 5 — SAFETY DECLARATIONS:
  5-row checklist showing which boxes the host ticked.
  Each row: icon (✓ or ✗) + declaration text.
  Any unchecked item highlighted in red → auto-reject in this case.

Section 6 — AGREEMENT:
  "Accepted" badge with timestamp and IP address.
  Link to view the generated PDF (signed URL, opens in new tab).

Section 7 — VERDICT (sticky at bottom of page, always visible):
  Two large buttons: 
  [Approve listing ✓]    [Reject listing ✗]
  
  Approve: calls Server Action approveTerraceAction(terraceId, adminId)
    - Updates terraces SET verification='VERIFIED', is_active=TRUE
    - Sends notification to host (stub: console.log for now)
    - Writes to admin_audit_log: actionType='TERRACE_APPROVED'
    - Redirects back to /dashboard/terraces

  Reject: opens a Sheet (shadcn) from the right side:
    - Textarea: "Reason for rejection (sent to host)" — required
    - Button: "Confirm rejection"
    - Calls rejectTerraceAction(terraceId, reason, adminId)
    - Updates terraces SET verification='REJECTED', admin_review_note=reason
    - Writes audit log
    - Redirects back to queue

ALL TERRACES TAB:
Client component (uses TanStack Table for sort/filter).
Columns: Photo | Title | City/Area | Host | Submitted | Status | Actions

Filter bar above table:
  - Search input (filters by title or address client-side)
  - Status filter dropdown: All / Pending / Verified / Rejected / Suspended
  - City filter dropdown

Row actions (three-dot menu per row):
  View details | Suspend listing | Reinstate listing

Suspended listings show with a dimmed background and "SUSPENDED" badge.

OUTPUT REQUIRED:
Full file content for:
  src/app/(dashboard)/page.tsx (dashboard home)
  src/components/dashboard/StatsCard.tsx
  src/components/dashboard/BookingsChart.tsx (client component)
  src/app/(dashboard)/terraces/page.tsx
  src/app/(dashboard)/terraces/[terraceId]/page.tsx
  src/app/actions/terraces.ts (approveTerraceAction, rejectTerraceAction, 
                                suspendTerraceAction)
```

---

## ═══════════════════════════════════════════
## ADMIN SESSION 3 — User Management + Booking Oversight
## ═══════════════════════════════════════════

```
CONTEXT:
Continuing Gusto Meets Admin. Dashboard and terrace verification are built.

TASK A — User management: src/app/(dashboard)/users/page.tsx

Server Component with a client-side DataTable below.
Fetches all users from Supabase (joined with booking count).

TABLE COLUMNS:
  | Avatar (initials circle) | Name | Phone | Role badge | KYC badge |
  | Bookings | Wallet balance | Joined | Actions |

Phone masking: if the requesting admin's role is SUPPORT (from x-admin-role header),
  show phone as "+91 XXXXXX{last4}" instead of full number.
  SUPER_ADMIN and REVIEWER see the full number.

Row click → User Detail Sheet (shadcn Sheet from right side, 480px wide):
  
  Header: Avatar circle, name, role badge, KYC status badge
  
  Tabs inside the sheet: "Profile" | "Bookings" | "Reviews" | "Reports"
  
  Profile tab:
    Phone number (masked or full per role)
    KYC: verified status, reference token (never show Aadhaar number)
    Wallet balance
    Account created date
    Last seen (if available)
    Active role (Guest / Host)
  
  Bookings tab:
    Last 10 bookings as compact rows:
    Date | Terrace name | Duration | Amount | Status badge
  
  Reviews tab:
    Reviews this user has given and received (alternating)
  
  Reports tab:
    Any damage reports where this user is involved (as guest or host)

  Actions footer:
    [Suspend account] [Ban account] [Add internal note]
    Suspend → account marked inactive for 7 days, show confirmation dialog
    Ban → permanent, requires typed confirmation "BAN {employeeId}" (misuse prevention)
    Note → text field, saved to a user_notes table (create this in SQL comment)
  
  All actions → write to admin_audit_log.

TASK B — Booking oversight: src/app/(dashboard)/bookings/page.tsx

Server Component with TanStack Table.
Fetches all bookings with joined guest + terrace name.

TABLE COLUMNS:
  | Booking ID (short: first 8 chars) | Guest name | Terrace | Purpose |
  | Duration type | Start → End | Amount | Status | Created |

HIGHLIGHT RULES:
  OVERSTAYED rows: amber row background
  DISPUTED rows: red row background
  ACTIVE rows: green left border

FILTER BAR:
  Status filter (multi-select chips)
  Date range picker (booking start date)
  Search by booking ID or guest name

ROW CLICK → Booking Detail Sheet:
  
  Section: Booking summary
    Guest avatar + name + KYC badge
    Terrace title + area + host name
    Duration: "3 hours · Hourly"
    Times: "14 June 2026, 2:00 PM → 5:00 PM"
    Purpose + purpose description
    Guest count
  
  Section: Financials
    Base cost, purpose multiplier, platform fee, deposit
    Overstay penalty (if any), damage penalty (if any)
    Total charged
    Payment ID (Razorpay)
  
  Section: Status timeline
    Created → Payment confirmed → Host checked in → Completed
    (show each stage with timestamp and checkmark)
  
  Admin actions:
    [Force-cancel booking] — opens confirmation dialog with reason field
      Force-cancel sets status=CANCELLED, triggers refund of time cost to guest
      (does NOT refund deposit if damage report exists)
    [Override penalty] — edits overstay_penalty or damage_penalty directly
    [Extend deadline by 30 min] — useful for technical delays

OUTPUT REQUIRED:
Full file content for:
  src/app/(dashboard)/users/page.tsx
  src/components/users/UserDetailSheet.tsx
  src/app/(dashboard)/bookings/page.tsx
  src/components/bookings/BookingDetailSheet.tsx
  src/app/actions/users.ts (suspendUserAction, banUserAction)
  src/app/actions/bookings.ts (forceCancelAction, overridePenaltyAction)
```

---

## ═══════════════════════════════════════════
## ADMIN SESSION 4 — Dispute Resolution
## ═══════════════════════════════════════════

```
CONTEXT:
Continuing Gusto Meets Admin. Building the dispute resolution interface.
This is the most consequential page — admin decisions here move real money.

TASK — Disputes: src/app/(dashboard)/disputes/page.tsx

Two tabs: "Open disputes" | "Resolved"

OPEN DISPUTES TAB:
Fetches damage_reports WHERE status = 'PENDING'
Ordered by created_at ASC (oldest dispute first).

Each dispute shown as a card (not a table — cards give more visual space):
  
  DisputeCard layout:
    Left: Booking summary (terrace name, guest name, booking date, amount at stake)
    Right: Host's claim summary (claimed ₹X,XXX · submitted N days ago)
    Bottom: "Review dispute" button → navigates to dispute detail page

Create: src/app/(dashboard)/disputes/[disputeId]/page.tsx

This is the FULL DISPUTE REVIEW PAGE. Layout is side-by-side on desktop.

LEFT COLUMN — Evidence:
  
  Panel 1: "Before — Listing photos"
    The terrace's listing photos (from terraces.photos array)
    These are the reference state before any booking
  
  Panel 2: "After — Damage photos (host submitted)"
    The photos from damage_reports.photos array
    Same grid layout as listing photos for easy comparison
  
  Panel 3: Host's description
    damage_reports.description in a styled blockquote
    Claimed amount: ₹X,XXX
    Submitted: timestamp

RIGHT COLUMN — Context + Verdict:
  
  Booking context card:
    Guest name + KYC verified badge
    Booking purpose + description ("Guest said: 'birthday party for 12 people...'")
    Duration and time
    Guest count
    Total charged / deposit held
  
  Guest's booking history (compact):
    "This guest has completed X bookings. Previous disputes: Y."
  
  Host's listing history:
    "This host has X completed bookings. Previous damage claims: Y."
  
  VERDICT SECTION (highlighted card, prominent):
    
    Three radio options:
    ○ "Approve full claim" — Capture full claimed amount from deposit
    ○ "Approve partial claim" — Number input for approved amount ≤ claimed
    ○ "Reject claim" — Full deposit returned to guest
    
    Required: "Verdict reasoning" textarea (sent to both guest and host via notification)
    
    "Confirm verdict" button:
      Disabled until reasoning is filled and a verdict is selected.
      Opens a final confirmation dialog:
        "You are about to:
         - Transfer ₹X,XXX to [host name]
         - Return ₹Y,YYY to [guest name]
         This action cannot be undone."
      On confirm: calls resolveDisputeAction(disputeId, verdictType, approvedAmount, reasoning)
      
      resolveDisputeAction Server Action:
        1. Update damage_reports: status='APPROVED' or 'REJECTED', resolved_amount, admin_notes
        2. If approved: deduct approvedAmount from guest's wallet (already in escrow)
                        credit approvedAmount to host's wallet
        3. Refund remaining deposit to guest: (depositHeld - approvedAmount) credited back
        4. Update booking: damage_penalty = approvedAmount
        5. Write to admin_audit_log:
             actionType: 'DISPUTE_RESOLVED'
             actionDetail: { verdict, approvedAmount, bookingId, guestId, hostId }
        6. Send notification to both guest and host (stub: console.log)

RESOLVED TAB:
Table of all resolved disputes.
Columns: Date | Terrace | Guest | Host | Claimed | Approved | Verdict | Resolved by
Read-only. No actions.

OUTPUT REQUIRED:
Full file content for:
  src/app/(dashboard)/disputes/page.tsx
  src/app/(dashboard)/disputes/[disputeId]/page.tsx
  src/components/disputes/DisputeCard.tsx
  src/components/disputes/EvidencePanel.tsx
  src/app/actions/disputes.ts (resolveDisputeAction)
```

---

## ═══════════════════════════════════════════
## ADMIN SESSION 5 — Finance
## ═══════════════════════════════════════════

```
CONTEXT:
Continuing Gusto Meets Admin. Building the finance management interface.
FINANCE and SUPER_ADMIN roles only — enforced in middleware.

TASK — Finance: src/app/(dashboard)/finance/page.tsx

Three tabs: "Payouts" | "Commission" | "Promo codes"

══════════════════
PAYOUTS TAB
══════════════════

Server Component. Fetches host_payouts WHERE status = 'PENDING'.

Summary bar at top:
  "X payouts pending · Total: ₹X,XXX to transfer"

Table columns:
  | Host name | Booking date | Gross | Platform fee | Net (to transfer) |
  | Status | Razorpay payout ID | Actions |

Bulk action: checkbox to select multiple rows + "Process selected payouts" button.
  Triggers processPayoutsAction(payoutIds[])
  Each payout: Razorpay Payout API call (stub — log the call, mark as PROCESSED)
  Note in code: // TODO: integrate Razorpay Payout API when Keys available

Manual payout: "Add manual payout" button.
  Form: host phone number, amount, reason
  Creates a host_payouts record and marks as PROCESSED immediately
  Written to audit log

Payout history tab: table of all processed payouts with Razorpay IDs.

══════════════════
COMMISSION TAB
══════════════════

Fetches platform_config WHERE key = 'platform_fee_percent'.

Shows current rate prominently: "15%" in a large stat card.
Small note: "Applied to all new bookings. Existing bookings are unaffected."

Edit form:
  Number input (0–50, step 0.5)
  "Update commission" button → opens confirmation:
    "Change platform commission from 15% to X%?
     This affects all new bookings immediately."
  On confirm: calls updateConfigAction('platform_fee_percent', newValue)
  Written to audit log with previous value and new value.

Commission history: a log of recent changes fetched from audit_log WHERE
  action_type = 'CONFIG_UPDATED' AND action_detail->>'key' = 'platform_fee_percent'

══════════════════
PROMO CODES TAB
══════════════════

Table of all promo codes:
  | Code | Type | Value | Uses | Valid until | Status | Actions |

"Create promo code" button → Sheet form:
  - Code string (autogenerate random or custom input)
  - Discount type: radio FLAT / PERCENT
  - Discount value: number input
    (if FLAT: "₹ off" label; if PERCENT: "% off" label, max 100)
  - Max uses: number input, "Unlimited" toggle
  - Valid from: date picker (default today)
  - Valid until: date picker (optional)
  - Submit: calls createPromoCodeAction(formData)
    Validates: code is unique, value > 0
    Written to audit log

Row actions per promo:
  Deactivate / Reactivate (toggle is_active)

OUTPUT REQUIRED:
Full file content for:
  src/app/(dashboard)/finance/page.tsx
  src/components/finance/PayoutsTable.tsx
  src/components/finance/CommissionEditor.tsx
  src/components/finance/PromoCodesTable.tsx
  src/app/actions/finance.ts (processPayoutsAction, updateConfigAction,
                              createPromoCodeAction)
```

---

## ═══════════════════════════════════════════
## ADMIN SESSION 6 — Config + Audit Log + Admin Management
## ═══════════════════════════════════════════

```
CONTEXT:
Final admin session. Building platform configuration, the immutable audit log,
and admin user management. All SUPER_ADMIN only.

TASK A — Platform config: src/app/(dashboard)/config/page.tsx

Fetches all rows from platform_config table.
Each config row shown as an editable card:

  ConfigCard layout:
    Key (monospace, e.g., "platform_fee_percent")
    Description (from description column)
    Current value (shown prominently)
    "Edit" button → inline edit (replaces current value with an input field)
    "Save" + "Cancel" buttons appear when editing
  
  On save: calls updateConfigAction(key, newValue)
  Validation: numeric configs must be positive numbers
  Written to audit_log: { key, previousValue, newValue }
  
  Display the last updated timestamp and which admin changed it.

TASK B — Audit log: src/app/(dashboard)/audit/page.tsx

Read-only, paginated table. Cannot edit or delete any row.

TABLE COLUMNS:
  | Timestamp | Admin name | Employee ID | Action type | Target | Details |

Action type shown as a color-coded badge:
  TERRACE_APPROVED → green
  TERRACE_REJECTED → amber
  USER_SUSPENDED → amber
  USER_BANNED → red
  DISPUTE_RESOLVED → blue
  CONFIG_UPDATED → purple
  BOOKING_FORCE_CANCELLED → red
  PROMO_CODE_CREATED → teal

Details column: expandable — click to see full action_detail JSON in a
  code block (monospace, formatted).

FILTER BAR:
  Admin name search
  Action type multi-select
  Date range picker
  Target type filter: Terrace / User / Booking / Config / Finance

Pagination: 50 rows per page with previous/next and page number display.

"Export CSV" button: downloads audit log as CSV for a selected date range.
  This is a sensitive operation — log it to audit_log itself:
  actionType: 'AUDIT_LOG_EXPORTED', actionDetail: { dateRange, rowCount }

TASK C — Admin management: src/app/(dashboard)/admins/page.tsx
(SUPER_ADMIN only — middleware enforces, also check in Server Component)

TABLE:
  | Employee ID | Name | Role badge | Status | Last login | Actions |

"Add admin" button → Sheet form:
  Employee ID (e.g., GMT-009)
  Full name
  Email
  Date of birth
  Role (dropdown: SUPER_ADMIN / REVIEWER / SUPPORT / FINANCE)
  Temporary password (auto-generated, shown once, must change on first login)
  Submit: calls createAdminUserAction(formData)
    Password hashed with bcrypt(password, 12) before storing
    Written to audit log

Row actions:
  Change role (cannot change your own role)
  Deactivate account (cannot deactivate yourself)
  Reset password (generates new temp password, emails them)

TASK D — Edge Functions for Admin Auth
══════════════════════════════════════

Create: supabase/functions/admin-auth/index.ts

This Edge Function is called by the Next.js login action.
It is the ONLY way to authenticate as an admin.

Logic:
  1. Parse request body: { employeeId, password, dateOfBirth }
  2. Query admin_users: SELECT * WHERE employee_id = employeeId AND is_active = TRUE
  3. If not found: return 401 { error: 'Invalid credentials' }
  4. Check locked_until: if NOW() < locked_until: return 423 { error: 'Account locked' }
  5. Verify password: await bcrypt.compare(password, row.password_hash)
  6. Verify DOB: dateOfBirth === row.date_of_birth.toISOString().split('T')[0]
  7. If step 5 OR 6 fails:
       Increment failed_login_count
       If failed_login_count >= 5: set locked_until = NOW() + interval '30 minutes'
       return 401 { error: 'Invalid credentials' }
  8. If both pass:
       Reset failed_login_count = 0, update last_login_at = NOW()
       Build JWT payload: { adminId: row.id, employeeId: row.employee_id, role: row.role }
       Sign with ADMIN_JWT_SECRET, exp 8 hours
       return 200 { jwt, adminId: row.id, role: row.role, fullName: row.full_name }

Create: supabase/functions/admin-action/index.ts

This Edge Function wraps ALL admin mutations with atomic audit logging.

Request body: {
  adminJwt: string,
  actionType: string,
  targetType: string,
  targetId: string,
  payload: Record<string, unknown>
}

Logic:
  1. Verify adminJwt using ADMIN_JWT_SECRET (jose library)
  2. If invalid: return 401
  3. Extract adminId, role from JWT
  4. Route to correct mutation based on actionType:
     'TERRACE_APPROVE' → UPDATE terraces SET verification='VERIFIED', is_active=TRUE
     'TERRACE_REJECT'  → UPDATE terraces SET verification='REJECTED', admin_review_note
     'USER_SUSPEND'    → UPDATE users SET is_active=FALSE (add is_active column to users)
     'USER_BAN'        → UPDATE users SET is_active=FALSE, ban_reason=payload.reason
     'BOOKING_CANCEL'  → UPDATE bookings SET status='CANCELLED'
     'DISPUTE_RESOLVE' → Multiple updates (damage_report + wallet transactions)
     'CONFIG_UPDATE'   → UPDATE platform_config SET value=payload.value
  5. After mutation: INSERT INTO admin_audit_log (adminId, employeeId, actionType,
     targetType, targetId, actionDetail, ipAddress) VALUES (...)
  6. Both mutation and audit log insert happen in the same Postgres transaction
     (use supabase.rpc('atomic_admin_action', {...}) — create this PG function)
     OR: use the service role client which auto-commits.
     If either fails: rollback and return 500.
  7. Return { success: true, data: updatedRecord }

OUTPUT REQUIRED:
Full file content for:
  src/app/(dashboard)/config/page.tsx
  src/components/config/ConfigCard.tsx
  src/app/(dashboard)/audit/page.tsx
  src/components/audit/AuditLogTable.tsx
  src/app/(dashboard)/admins/page.tsx
  src/components/admins/AdminFormSheet.tsx
  src/app/actions/admins.ts (createAdminUserAction, deactivateAdminAction)
  supabase/functions/admin-auth/index.ts
  supabase/functions/admin-action/index.ts
```
