# CHANGELOG — Shri Gurudev Ashram ERP Extension

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- **TRUSTEE Role**: Added `TRUSTEE` to the user role enum in `backend/src/models/User.js` for ashram financial operations.
- **Audit Log Model**: Created `backend/src/models/AuditLog.js` with append-only schema and compound indexes for tracking all financial operations.
- **Counter Model & Service**: Created `backend/src/models/Counter.js` and `backend/src/services/counter.service.js` for atomic, collision-proof sequence generation (`ADV-`, `VCH-`, `CA-`, `CH-`, `UPI-`, `OL-`).
- **Trustee Route Guard**: Created `frontend/src/components/TrusteeRoute.jsx` protecting `/admin/trustee/*` routes for TRUSTEE and SYSTEM_ADMIN roles.
- **Trustee Portal Shell**: Created `frontend/src/layouts/TrusteeLayout.jsx` and `frontend/src/pages/admin/trustee/TrusteeHome.jsx` with sidebar navigation and system status overview.
- **Finance Portal Card**: Added conditional Finance Portal navigation card on `AdminHome.jsx` (visible only to SYSTEM_ADMIN and TRUSTEE users).

### Changed
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
- Receipt Number Upgrade — `CA-`, `CH-`, `UPI-`, `OL-` prefixes (Phase 2)
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
