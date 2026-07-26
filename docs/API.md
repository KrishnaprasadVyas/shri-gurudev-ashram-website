# API.md — Shri Gurudev Ashram ERP API Reference

This document catalogs all REST API endpoints for the Shri Gurudev Ashram backend, focusing on the new ERP financial endpoints and authentication/authorization requirements.

---

## 1. Authentication & Security Layer

### 1.1 Authentication Header
All protected endpoints require a valid JSON Web Token (JWT) issued by `/api/auth/verify-firebase-token`, sent in the Authorization header:
```http
Authorization: Bearer <jwt_token>
```

### 1.2 Rate Limiting Policies (`backend/src/middlewares/rateLimit.js`)
| Limiter Name | Max Requests | Window | Purpose / Target |
|---|---|---|---|
| `donationCreateLimiter` | 10 req | 1 minute | Public donation submission endpoints |
| `publicApiLimiter` | 30 req | 1 minute | Referral code verification |
| `collectorApplyLimiter` | 3 req | 1 hour | Collector application submissions |
| **`financialApiLimiter`** (Phase 1) | **60 req** | **1 minute** | **All ERP financial endpoints (`/api/finance/*`)** |
| `emailVerificationLimiter` | 3 req | 15 minutes | Email verification requests |

---

## 2. Phase 1 API Implementations & Modifications

### 2.1 Route Guarding & Authorization
In Phase 1, no new public REST endpoints were introduced. Instead, the authentication and authorization middleware layer was upgraded to recognize the new `TRUSTEE` role.

#### Existing Endpoints Modified for Trustee Access
- **`GET /api/auth/me`**
  - **Returns**: Current authenticated user profile including `role: "TRUSTEE"`.
  - **Behavior Change**: None to payload structure; enum value `TRUSTEE` is now returned for assigned users.

---

## 3. Planned ERP API Endpoints (Future Phases)

### 3.1 Receipt Number Upgrade (Phase 2)
- Internal service upgrade; no new external HTTP endpoints. Existing donation endpoints (`POST /api/donations/initiate`, `POST /api/admin/system/donations/cash`) will begin outputting prefixed receipt numbers (`CA-`, `CH-`, `UPI-`, `OL-`).

### 3.2 Cash Advances & Vouchers (`/api/finance/*` — Phase 3)
All endpoints below will be protected by `auth`, `authorize("TRUSTEE", "SYSTEM_ADMIN")`, and `financialApiLimiter`:
- `POST /api/finance/advances` — Request/create a Type A cash advance
- `POST /api/finance/advances/direct` — Record a Type B direct vendor payment (auto-generates voucher)
- `GET /api/finance/advances` — List cash advances with status/date filters
- `GET /api/finance/advances/:id` — Get detailed cash advance view
- `POST /api/finance/advances/:id/settle` — Record settlement and auto-generate expense voucher
- `PATCH /api/finance/advances/:id/cancel` — Cancel an open advance
- `GET /api/finance/vouchers` — List generated expense vouchers
- `GET /api/finance/vouchers/:id` — Get detailed voucher view
- `GET /api/finance/vouchers/:id/pdf` — Stream authenticated voucher PDF document

### 3.3 Trustee Offline Donations (Phase 4)
- `POST /api/admin/system/donations/cash` — Will be updated in `authorize()` to allow `TRUSTEE` role alongside `SYSTEM_ADMIN`.
- `GET /api/admin/system/donations` — Will be updated in `authorize()` to allow `TRUSTEE` role alongside `SYSTEM_ADMIN`.

### 3.4 Financial Reports (`/api/finance/reports/*` — Phase 5)
- `GET /api/finance/reports/cash-book` — Chronological cash in/out ledger
- `GET /api/finance/reports/voucher-register` — Date-wise voucher list
- `GET /api/finance/reports/outstanding-advances` — Unsettled advances report
- `GET /api/finance/reports/monthly-summary` — Monthly income vs expenditure comparison
- `GET /api/finance/reports/annual-export` — Complete annual CA audit export (CSV)

### 3.5 Audit Log Explorer (`/api/finance/audit-logs` — Phase 6)
- `GET /api/finance/audit-logs` — Query persistent financial audit trail with entity, action, date, and user filters

### 3.6 User Role Management (`/api/admin/system/users` — Phase 7)
- `GET /api/admin/system/users` — List all registered users and their roles (`SYSTEM_ADMIN` only)
- `PATCH /api/admin/system/users/:id/role` — Update user role with mandatory audit logging (`SYSTEM_ADMIN` only)
