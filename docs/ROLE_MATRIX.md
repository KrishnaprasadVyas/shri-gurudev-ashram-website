# ROLE_MATRIX.md — Shri Gurudev Ashram ERP Permission Matrix

This document defines the complete role hierarchy and access control matrix for the Shri Gurudev Ashram platform, incorporating the new `TRUSTEE` role introduced in ERP Phase 1.

---

## 1. Role Definitions

| Role | Code | Primary Responsibility | Access Scope |
|---|---|---|---|
| **Public User / Donor** | `USER` | General public donor, Seva patron, regular authenticated user. | Public pages, personal donation history, referral code sharing. |
| **Pending Collector** | `COLLECTOR_PENDING` | Submitted KYC verification to become an authorized collector. | Same as `USER` until KYC approval. |
| **Approved Collector** | `COLLECTOR_APPROVED` | Verified collector authorized to collect donations on behalf of Ashram. | Collector dashboard, leaderboard, referral statistics, personal donation links. |
| **Website Admin** | `WEBSITE_ADMIN` | Content Management System (CMS) administrator. | `/admin/website/*`: Gallery, Events, Activities, Banners, Announcements, Testimonials. |
| **Nitya Annadan Admin** | `NITYA_ANNADAN_ADMIN` | Daily Mahaprasad Seva coordinator. | `/admin/nitya-annadan/*`: Calendar capacity, bookings roster, offline seva entry, daily aarti sheet. |
| **Trustee (ERP Phase 1)** | `TRUSTEE` | **Ashram financial controller and operational manager.** | `/admin/trustee/*`: Cash advances, expense settlements, voucher printing, offline donation entry, financial reports, audit logs. |
| **System Admin** | `SYSTEM_ADMIN` | Full super-user access across all technical, operational, and financial modules. | Full access to all routes (`/admin/*`, `/admin/system/*`, `/admin/website/*`, `/admin/nitya-annadan/*`, `/admin/trustee/*`). Can assign user roles. |

---

## 2. Detailed Capability Matrix

| Capability / Feature | USER | COLLECTOR | WEBSITE_ADMIN | NITYA_ADMIN | TRUSTEE | SYSTEM_ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Public Website & Auth** | | | | | | |
| View public website & donate online | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View personal donation history (`/my-donations`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Apply for Collector KYC | ✅ | ❌ (Already) | ✅ | ✅ | ✅ | ✅ |
| **Collector System** | | | | | | |
| Access Collector Dashboard (`/collector`) | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| View referral leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CMS / Website Admin Portal (`/admin/website`)** | | | | | | |
| Manage Gallery & Categories | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Manage Events & Activities | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Manage Hero Banners & Sliders | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Manage Announcements & Testimonials | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Manage Donation Cause Heads | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Nitya Annadan Portal (`/admin/nitya-annadan`)** | | | | | | |
| Manage patron calendar & daily booking capacity | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Add offline Nitya Annadan seva sponsorships | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Print daily Aarti patron sheet & reports | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Finance Portal (`/admin/trustee`) — ERP Extension** | | | | | | |
| View Finance Portal overview | ❌ | ❌ | ❌ | ❌ | **✅ (Phase 1)** | **✅ (Phase 1)** |
| Create cash advances & direct vendor payments | ❌ | ❌ | ❌ | ❌ | 🔜 (Phase 3) | 🔜 (Phase 3) |
| Settle advances & auto-generate vouchers | ❌ | ❌ | ❌ | ❌ | 🔜 (Phase 3) | 🔜 (Phase 3) |
| View & print expense voucher PDFs | ❌ | ❌ | ❌ | ❌ | 🔜 (Phase 3) | 🔜 (Phase 3) |
| Enter offline cash/cheque/UPI/RTGS donations | ❌ | ❌ | ❌ | ❌ | 🔜 (Phase 4) | ✅ (Existing) |
| Print formatted legal donation receipt PDFs | ❌ | ❌ | ❌ | ❌ | 🔜 (Phase 4) | ✅ (Existing) |
| View financial reports (Cash Book, Registers) | ❌ | ❌ | ❌ | ❌ | 🔜 (Phase 5) | 🔜 (Phase 5) |
| View persistent financial audit logs | ❌ | ❌ | ❌ | ❌ | 🔜 (Phase 6) | 🔜 (Phase 6) |
| **System Admin Portal (`/admin/system`)** | | | | | | |
| Manage general donations ledger | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View & manage donor profiles | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve/reject Collector KYC applications | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage user roles & assign `TRUSTEE` role | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 (Phase 7) |
| System overview & data exports | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Frontend Route Guard Enforcement

The frontend enforces this matrix through specialized route guard components in `frontend/src/components/`:

### 3.1 `AdminRoute.jsx`
- Guards `/admin/*`, `/admin/website/*`, and `/admin/system/*`.
- **Phase 1 Upgrades**:
  - Recognized `TRUSTEE` and `NITYA_ANNADAN_ADMIN` as administrative roles (allowing entry to `/admin` landing hub).
  - Enforced strict path isolation:
    - `WEBSITE_ADMIN` attempting access to `/admin/system` or `/admin/trustee` is redirected to `/admin/website`.
    - `TRUSTEE` attempting access to `/admin/system` or `/admin/website` is redirected to `/admin/trustee`.
    - `NITYA_ANNADAN_ADMIN` attempting access to other admin modules is redirected to `/admin/nitya-annadan`.

### 3.2 `TrusteeRoute.jsx` (New in Phase 1)
- Dedicated guard for `/admin/trustee/*`.
- Strictly allows ONLY `TRUSTEE` and `SYSTEM_ADMIN` roles.
- Redirects any other authenticated role (including other admins) back to `/admin` with an access denial notice.
