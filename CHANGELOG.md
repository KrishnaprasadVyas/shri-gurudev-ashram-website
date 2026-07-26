# CHANGELOG — Shri Gurudev Ashram ERP Extension

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- **Payment-specific Donation Receipt Details (Phase 8)**: Newly generated donation PDFs now show UPI UTRs; cheque number, bank, and date; RTGS/NEFT references with bank; and Razorpay payment IDs for online donations. Cash receipts intentionally retain no payment-reference row. No endpoint, schema, payment-entry, or receipt-numbering change was made.

- **Role Management API (Phase 7)**: Secure endpoints (`GET /api/admin/system/users`, `PATCH /api/admin/system/users/:id/role`) in `userManagement.controller.js` for System Admins to manage ERP roles. Implemented strict safety rules preventing `SYSTEM_ADMIN` assignment via UI, self-demotion, or modification of peer `SYSTEM_ADMIN` accounts.
- **User Management Portal (Phase 7)**: Added `UserManagementView.jsx` UI to the System Admin interface for seamless role assignment with filterable/sortable lists, color-coded role badges, and local toast notifications.
- **Audit Logging for Roles (Phase 7)**: Role transitions automatically emit immutable `ROLE_CHANGED` events to the statutory Audit Log.

- **Statutory Audit Trail Viewer & Ledger Protection (Phase 6)**: Created `backend/src/controllers/auditLog.controller.js` and `backend/src/routes/auditLog.routes.js` with paginated read-only retrieval (`/api/finance/audit-logs`) and dynamic filter options (`/filters`). Enhanced `AuditLog.js` with structured metadata support (`details` field) and synchronous Mongoose 9 immutability hooks blocking any application-level modifications or deletions.
- **Trustee Statutory Audit Inspection UI (Phase 6)**: Created `frontend/src/pages/admin/trustee/AuditLogView.jsx` featuring multi-criteria filtering (by entity, action, date range, search query), Indian Rupee monetary formatting, status badges, and an interactive deep inspection modal showing before/after state comparison and JSON metadata. Added `getAuditLogs` and `getAuditLogFilters` to `financeApi.js` and activated the "Audit Trail" sidebar tab in `TrusteeLayout.jsx`.

- **Financial Reports & Dashboard Module (Phase 5)**: Created `backend/src/controllers/finance.reports.controller.js` and `backend/src/routes/finance.reports.routes.js` with aggregation endpoints for Cash Book (`/cash-book`), Voucher Register (`/voucher-register`), Outstanding Advances (`/outstanding-advances`), Monthly Summary (`/monthly-summary`), Annual CA Audit Dump (`/annual-export`), and real-time dashboard stats (`/dashboard-stats`). Added CSV export functionality with RFC 4180 quote-escaped streaming.
- **Trustee Financial Reports & Live Dashboard UI (Phase 5)**: Created `frontend/src/pages/admin/trustee/ReportsView.jsx` with tabbed views for all 5 statutory reports and CSV download triggers. Replaced `TrusteeHome.jsx` placeholder with a live summary dashboard featuring real-time financial metrics and quick actions.
- **Trustee Reports API Client & Route (Phase 5)**: Added reporting and CSV download methods to `frontend/src/services/financeApi.js` and mounted `/admin/trustee/reports` in `App.jsx` as `TrusteeReportsView`.

- **Trustee Offline Donation Entry UI & Views (Phase 4)**: Created `frontend/src/pages/admin/trustee/DonationsView.jsx` and `OfflineDonationForm.jsx` allowing TRUSTEE users to view all ashram donations and record counter seva deposits (`CASH`, `UPI`, `CHEQUE`) with automatic prefixed receipt numbering (`CA-`, `CH-`, `UPI-`), while replacing legacy static frontend dummy data with live server API queries (`/api/public/donation-heads`).

- **Cash Advance & Voucher Accounting Models (Phase 3)**: Created `backend/src/models/CashAdvance.js` and `backend/src/models/Voucher.js` on `mainDb` supporting Type A cash advances (with return expectation) and Type B direct vendor payments with strict immutability and variance accounting rules.
- **Voucher PDF Generation Service (Phase 3)**: Created `backend/src/services/voucher.service.js` using PDFKit to lazily generate printable official expense vouchers with itemized breakdowns and ashram branding.
- **Finance Controllers & Routes (Phase 3)**: Created `backend/src/controllers/cashAdvance.controller.js`, `backend/src/controllers/voucher.controller.js`, and `backend/src/routes/finance.routes.js` with multi-document transaction settlement (`/api/finance/advances/:id/settle`), rate limiting (`financialApiLimiter`), and role authorization.
- **Trustee Finance Portal UI & API Client (Phase 3)**: Created `frontend/src/services/financeApi.js`, `AdvancesView.jsx`, `AdvanceForm.jsx`, `SettleAdvanceForm.jsx`, `VouchersView.jsx`, and `VoucherDetail.jsx` enabling end-to-end accounting management.
- **Receipt Number Generation Service (Phase 2)**: Added `generateReceiptNumber(paymentMethod, session)` export in `backend/src/services/receipt.service.js` to generate atomic sequential receipt references (`CA-`, `CH-`, `UPI-`, `OL-`) using the ERP counter service.
- **TRUSTEE Role**: Added `TRUSTEE` to the user role enum in `backend/src/models/User.js` for ashram financial operations.
- **Audit Log Model**: Created `backend/src/models/AuditLog.js` with append-only schema and compound indexes for tracking all financial operations.
- **Counter Model & Service**: Created `backend/src/models/Counter.js` and `backend/src/services/counter.service.js` for atomic, collision-proof sequence generation (`ADV-`, `VCH-`, `CA-`, `CH-`, `UPI-`, `OL-`).
- **Trustee Route Guard**: Created `frontend/src/components/TrusteeRoute.jsx` protecting `/admin/trustee/*` routes for TRUSTEE and SYSTEM_ADMIN roles.
- **Trustee Portal Shell**: Created `frontend/src/layouts/TrusteeLayout.jsx` and `frontend/src/pages/admin/trustee/TrusteeHome.jsx` with sidebar navigation and system status overview.
- **Finance Portal Card**: Added conditional Finance Portal navigation card on `AdminHome.jsx` (visible only to SYSTEM_ADMIN and TRUSTEE users).

### Changed
- **Donation Route Authorization & Trustee Layout (Phase 4)**: Updated `backend/src/routes/admin.system.routes.js` to authorize `TRUSTEE` (alongside `SYSTEM_ADMIN`) on `/donations`, `/donations/cash`, and `/donations/offline`. Enabled the Donations navigation item in `TrusteeLayout.jsx` and registered Phase 4 routes in `App.jsx`.
- **App Router Integration (Phase 3)**: Mounted `/api/finance` router in `backend/src/app.js` and wired Phase 3 navigation links and routes in `TrusteeLayout.jsx` and `App.jsx`.
- **Offline Cash/Cheque/UPI Donation Receipt Numbering (Phase 2)**: Updated `createCashDonation` in `backend/src/controllers/admin.controller.js` to assign atomic prefixed receipt numbers (`CA-XXXXXX`, `CH-XXXXXX`, `UPI-XXXXXX`) instead of ad-hoc timestamp strings.
- **Online Razorpay Webhook Receipt Numbering (Phase 2)**: Updated `handleRazorpayWebhook` in `backend/src/controllers/webhook.controller.js` to assign atomic `OL-XXXXXX` receipt numbers upon payment capture.
- **Donation Receipt Fallback Numbering (Phase 2)**: Updated `downloadReceipt` in `backend/src/controllers/donation.controller.js` to assign atomic prefix-based receipt numbers when generating fallback numbers for donations missing a reference.
- **Auth Context**: Updated `getRedirectPath()` in `AuthContext.jsx` to route `TRUSTEE` users to `/admin/trustee`.
- **Admin Route Guard**: Extended `AdminRoute.jsx` to recognize `TRUSTEE` as an administrative role while enforcing strict path-based isolation (preventing TRUSTEE access to `/admin/system` or `/admin/website`).
- **Admin Layout Badge**: Updated `AdminLayout.jsx` header badge to display "Finance Portal" in emerald styling for TRUSTEE users.

### Fixed
- **Nitya Annadan Admin Routing**: Fixed missing `NITYA_ANNADAN_ADMIN` case in `getRedirectPath()` in `AuthContext.jsx` (previously fell through to root `/`), and added explicit path isolation in `AdminRoute.jsx`.

### Security
- **Financial Rate Limiter**: Added `financialApiLimiter` (60 requests/minute per IP) in `backend/src/middlewares/rateLimit.js` to protect upcoming ERP financial endpoints against abuse.
- **Path Isolation**: Enforced strict path-based boundary checks in `AdminRoute.jsx` so role privileges cannot bleed across admin modules (e.g., WEBSITE_ADMIN or TRUSTEE cannot reach SYSTEM_ADMIN routes).

### Database
- **User Collection**: Added `TRUSTEE` value to `role` enum in schema definition (no migration required; additive change).
- **New Collections**: Established Mongoose schema definitions for `auditlogs` and `counters` (collections will be initialized in MongoDB upon first document insert in Phase 2+).

### API
- No new public or admin API endpoints added in Phase 1 (pure infrastructure and auth foundation).

### Planned (Remaining ERP Phases)
- Cash Advance + Settlement + Auto-Voucher workflow (Phase 3)
- Trustee Offline Donation Entry & Receipt printing (Phase 4)
- Financial Reports & Dashboard (Phase 5)
- Audit Log Viewer (Phase 6)
- Role Management UI (Phase 7)
- Receipt PDF Improvements (Phase 8)
- Payment Method Extension — RTGS & NEFT (Phase 9)
- Production Hardening & CA Annual Export (Phase 10)

---

## [1.0.0-baseline] — 2026-07-26

### Existing (Pre-ERP Baseline)

This version represents the system state before ERP extension begins.

#### Features Present
- Public website (Home, About, Gurudev, Activities, Events, Gallery, Testimonials, Contact)
- Online donation system with Razorpay integration
- PDF receipt generation with PAN, amount in words, trust details
- Email receipt delivery via Brevo SMTP
- User authentication via Firebase Phone OTP + backend JWT
- Collector system: referral codes, KYC application, approval workflow, dashboard
- Leaderboard for top collectors
- Admin Panel:
  - Website Admin (CMS): Gallery, Events, Activities, Announcements, Banners, Testimonials, Donation Heads
  - System Admin: Donations ledger, Cash/UPI/Cheque donation entry, Donor management, Collector management, Reports, Data exports
  - Nitya Annadan Admin: Bookings, Calendar, Reports, Offline booking, Print sheet
- Role-based access control: USER, COLLECTOR_PENDING, COLLECTOR_APPROVED, WEBSITE_ADMIN, NITYA_ANNADAN_ADMIN, SYSTEM_ADMIN
- Multilingual support (English, Hindi, Marathi) for public-facing content
- Structured address support in donations (line, city, state, country, pincode)
- Payment method support: ONLINE (Razorpay), CASH, UPI (UTR), CHEQUE
- Razorpay webhook handler for payment verification
- Rate limiting on sensitive endpoints
- Graceful shutdown with MongoDB connection cleanup
- Firebase KYC document storage (Aadhar front/back)
- Email verification system
- Announcements system with auto-expiry
- Hero slider banner management
- Product/Shop module (disabled, coming soon)

#### Architecture
- Backend: Node.js + Express 5 + CommonJS + MongoDB (dual-connection)
- Frontend: React 19 + Vite 7 + TailwindCSS v4 + react-router-dom v7

---

*(Entries will be added here after each completed phase)*
