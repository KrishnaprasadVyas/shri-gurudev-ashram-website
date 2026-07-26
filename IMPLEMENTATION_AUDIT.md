# IMPLEMENTATION AUDIT — Shri Gurudev Ashram ERP Extension

This document tracks every change made during the ERP extension of the Shri Gurudev Ashram website.
It is production documentation and must be updated after every phase.

---

## System Baseline (Pre-ERP)

**Date**: 2026-07-26  
**Status**: Stable, production-live  
**Version**: Pre-ERP (v1.x)

### Existing System Inventory

#### Backend
- Node.js + Express 5 + CommonJS
- MongoDB: two connections (mainDb, sharedDb)
- Razorpay payment gateway
- Firebase Admin SDK (phone OTP)
- PDFKit (donation receipts)
- Nodemailer/Brevo (email)
- Multer + Sharp (image upload)

#### Frontend
- React 19 + Vite 7 + TailwindCSS v4
- react-router-dom v7
- i18next (en/hi/mr)
- lucide-react icons
- Firebase SDK (phone auth)

#### Roles (Pre-ERP)
| Role | Access |
|---|---|
| USER | Public donor |
| COLLECTOR_PENDING | Applied, awaiting approval |
| COLLECTOR_APPROVED | Collector dashboard |
| WEBSITE_ADMIN | CMS (content management) |
| NITYA_ANNADAN_ADMIN | Nitya Annadan seva bookings |
| SYSTEM_ADMIN | Full system access |

#### Existing Collections (mainDb)
- `users`
- `donations`
- `nityaannadanbookings`
- `nityaannadanblockeddates`
- `activities`
- `announcements`
- `banners`
- `events`
- `gallerycategories`
- `testimonials`
- `products`
- `productcategories`
- `siteconfigs`

#### Existing Collections (sharedDb)
- `donationheads`

#### Existing API Route Prefixes
- `/api/auth`
- `/api/donations`
- `/api/public`
- `/api/webhooks`
- `/api/contact`
- `/api/user`
- `/api/collector`
- `/api/referral`
- `/api/leaderboard`
- `/api/admin/website`
- `/api/admin/system`
- `/api/nitya-annadan`
- `/api/admin/nitya-annadan`
- `/api/test`

---

## Phase Log

---

### PHASE 1 — Foundation Layer (Role + Auth + Counter Service)

**Date**: 2026-07-26  
**Status**: ✅ COMPLETED  

**Objective**: Add TRUSTEE role to the system. Create AuditLog model, Counter model, and Counter service as foundational ERP infrastructure. Establish frontend route guards, layout, and portal entry point. Zero user-visible financial features — pure infrastructure.

---

**Files Created**:

| File | Type | Description |
|---|---|---|
| `backend/src/models/AuditLog.js` | Backend Model | Append-only financial audit trail. Uses mainDb. Compound indexes for entity history, user activity, and financial queries. |
| `backend/src/models/Counter.js` | Backend Model | Atomic sequential counter for document reference numbers. Uses mainDb. _id is the prefix key. |
| `backend/src/services/counter.service.js` | Backend Service | `getNextNumber(prefix, session)` — atomic $inc with session support for transactions. `peekCurrentSeq(prefix)` for reporting. |
| `frontend/src/components/TrusteeRoute.jsx` | Frontend Component | Route guard allowing TRUSTEE + SYSTEM_ADMIN. Redirects others to /admin. |
| `frontend/src/layouts/TrusteeLayout.jsx` | Frontend Layout | Finance Portal shell. Emerald color scheme. Sidebar with placeholder nav items (Phase 3-6 coming soon). |
| `frontend/src/pages/admin/trustee/TrusteeHome.jsx` | Frontend Page | Phase 1 placeholder showing system status. Will be replaced with real dashboard in Phase 5. |

---

**Files Modified**:

| File | Change | Risk |
|---|---|---|
| `backend/src/models/User.js` | Added `TRUSTEE` to role enum (line 29) | LOW — additive, no migration |
| `backend/src/middlewares/rateLimit.js` | Added `financialApiLimiter` export (60 req/min) | LOW — new export, no existing change |
| `frontend/src/context/AuthContext.jsx` | Added TRUSTEE → /admin/trustee and NITYA_ANNADAN_ADMIN → /admin/nitya-annadan to getRedirectPath() | LOW — additive switch cases |
| `frontend/src/components/AdminRoute.jsx` | Added TRUSTEE, NITYA_ANNADAN_ADMIN to isAdmin check; added path-based protection for each role | LOW — no existing role behavior changed |
| `frontend/src/layouts/AdminLayout.jsx` | Added "Finance Portal" label for TRUSTEE role in header badge | LOW — cosmetic, conditional rendering |
| `frontend/src/pages/admin/AdminHome.jsx` | Added Finance Portal card (visible to TRUSTEE + SYSTEM_ADMIN only) | LOW — conditional render, no existing card modified |
| `frontend/src/App.jsx` | Added TrusteeRoute + TrusteeLayout + TrusteeHome imports; added /admin/trustee/* route block | LOW — new route only, no existing routes touched |

---

**Database Changes**:
- `User.role` enum: Added `TRUSTEE` value. No migration needed. Existing documents unaffected.
- New collection `auditlogs`: Will be created on first document insert (Phase 3+).
- New collection `counters`: Will be created on first document insert (Phase 2+).

**API Changes**: None

**Frontend Changes**:
- `/admin/trustee` route is now live
- `/admin/trustee/overview` route is now live  
- Finance Portal card appears on AdminHome for SYSTEM_ADMIN and TRUSTEE users
- NITYA_ANNADAN_ADMIN is now correctly protected from accessing /admin/system and /admin/trustee
- TRUSTEE is correctly protected from accessing /admin/system and /admin/website

---

**Testing Completed**:

| Test | Result |
|---|---|
| `npm run build` (frontend) | ✅ PASSED — 1,123 KB bundle, 7.25s |
| All Phase 1 backend modules load | ✅ PASSED — No require errors |
| Lint on Phase 1 modified files | ✅ CLEAN — One pre-existing error in AuthContext.jsx (react-refresh/only-export-components on useAuth export, line existed before Phase 1) |
| Pre-existing lint errors baseline | ✅ CONFIRMED — 65 pre-existing issues, zero introduced by Phase 1 |
| git diff confirms only expected files changed | ✅ CONFIRMED |

---

**Breaking Changes**: None

**Migration Required**: No

**Rollback**:
1. Revert `User.js` — remove TRUSTEE from enum
2. Revert `rateLimit.js` — remove financialApiLimiter
3. Revert `AuthContext.jsx` — remove TRUSTEE/NITYA_ANNADAN_ADMIN switch cases
4. Revert `AdminRoute.jsx` — remove isTrustee/isNityaAnnadanAdmin variables and path checks
5. Revert `AdminLayout.jsx` — remove TRUSTEE label case
6. Revert `AdminHome.jsx` — remove Finance Portal card and useAuth import
7. Revert `App.jsx` — remove TrusteeRoute import and /admin/trustee route block
8. Delete: `AuditLog.js`, `Counter.js`, `counter.service.js`, `TrusteeRoute.jsx`, `TrusteeLayout.jsx`, `pages/admin/trustee/` directory

**Known Issues**: None

**Notes**:
- NITYA_ANNADAN_ADMIN getRedirectPath() was previously missing (fell through to default "/"). Now correctly redirects to /admin/nitya-annadan. This is a bug fix, not a breaking change.
- Counter service validates prefixes eagerly to prevent typos creating phantom counter documents.
- AuditLog uses `{ timestamps: { createdAt: true, updatedAt: false } }` — deliberately no updatedAt to reinforce append-only semantics.



---

### PHASE 2 — Expense Management

**Date**: TBD  
**Status**: PENDING  

**Objective**: Allow admin/trustee to record, categorize, and approve ashram expenses.

**Files to Create**:
- `backend/src/models/Expense.js`
- `backend/src/controllers/expense.controller.js`
- `backend/src/routes/expense.routes.js`
- `frontend/src/pages/admin/trustee/ExpensesView.jsx`
- `frontend/src/pages/admin/trustee/ExpenseForm.jsx`
- `frontend/src/services/trusteeApi.js`

**Files to Modify**:
- `backend/src/app.js` — Mount expense routes

**Database Changes**:
- New collection: `expenses`
- New collection: `auditlogs` (if not created in Phase 1)

**API Changes**:
- `GET /api/admin/system/expenses`
- `POST /api/admin/system/expenses`
- `GET /api/admin/system/expenses/:id`
- `PUT /api/admin/system/expenses/:id`
- `DELETE /api/admin/system/expenses/:id`
- `PATCH /api/admin/system/expenses/:id/approve`
- `PATCH /api/admin/system/expenses/:id/reject`

**Breaking Changes**: None

**Migration Required**: No

**Testing Performed**: TBD

**Known Issues**: None

**Completed Tasks**: None yet

**Pending Tasks**:
- [ ] Create Expense model
- [ ] Create expense controller
- [ ] Create expense routes
- [ ] Mount in app.js
- [ ] Create ExpensesView page
- [ ] Create ExpenseForm page
- [ ] Create trusteeApi.js
- [ ] Wire to TrusteeLayout navigation
- [ ] Run regression test

---

### PHASE 3 — Cash Advance System

**Date**: TBD  
**Status**: PENDING  

*(Details to be filled upon phase start)*

---

### PHASE 4 — Voucher Generation

**Date**: TBD  
**Status**: PENDING  

*(Details to be filled upon phase start)*

---

### PHASE 5 — Offline Donation Integration + Receipt Improvements

**Date**: TBD  
**Status**: PENDING  

*(Details to be filled upon phase start)*

---

### PHASE 6 — Audit Reports + Financial Dashboard

**Date**: TBD  
**Status**: PENDING  

*(Details to be filled upon phase start)*

---

### PHASE 7 — Settlement Workflow

**Date**: TBD  
**Status**: PENDING  

*(Details to be filled upon phase start)*

---

### PHASE 8 — Role Management UI

**Date**: TBD  
**Status**: PENDING  

*(Details to be filled upon phase start)*
