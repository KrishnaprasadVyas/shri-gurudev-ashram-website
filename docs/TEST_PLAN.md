# TEST_PLAN.md — Shri Gurudev Ashram ERP Verification & Test Strategy

This document outlines the systematic testing protocol applied to the Shri Gurudev Ashram ERP extension. Every implementation phase must pass all designated phase verification tests before being marked complete.

---

## 1. General Verification Rules

1. **Zero Regression Guarantee**: Existing public donation flows, collector referral tools, Nitya Annadan bookings, and website CMS operations must continue functioning without modification or degradation.
2. **Mandatory Build & Lint Verification**:
   - Frontend production build (`npm run build` in `frontend/`) must pass cleanly without Vite bundle errors.
   - ESLint check (`npm run lint` in `frontend/`) must introduce zero new lint warnings or errors above the baseline of 65 pre-existing repository issues.
3. **Backend Module Integrity**:
   - All backend model schemas, middleware, and service modules must load into the Node.js runtime without syntax errors, missing dependencies, or unhandled rejections.

---

## 2. Phase 1 Verification Checklist — Foundation Layer

### 2.1 Backend Unit & Integration Checks
- [x] **Role Enum Verification**:
  - Load `backend/src/models/User.js`.
  - Verify `schema.path('role').enumValues` includes `"TRUSTEE"` after `"NITYA_ANNADAN_ADMIN"`.
- [x] **AuditLog Schema Verification**:
  - Load `backend/src/models/AuditLog.js`.
  - Verify model initializes cleanly on `mainDb`.
  - Verify schema strictness (`auditLogSchema.options.strict === true`).
  - Verify timestamps configuration (`createdAt: true, updatedAt: false`).
- [x] **Counter Model & Service Verification**:
  - Load `backend/src/models/Counter.js` and `backend/src/services/counter.service.js`.
  - Verify `VALID_PREFIXES` array contains exactly `["CA", "CH", "UPI", "OL", "ADV", "VCH"]`.
  - Test calling `getNextNumber("INVALID")` throws an immediate validation error without querying MongoDB.
- [x] **Rate Limit Middleware Verification**:
  - Load `backend/src/middlewares/rateLimit.js`.
  - Verify `financialApiLimiter` is exported and configured for 60 requests per minute.

---

### 2.2 Frontend Route Guard & UI Checks
- [x] **Auth Context Routing**:
  - Verify `getRedirectPath("TRUSTEE")` returns `"/admin/trustee"`.
  - Verify `getRedirectPath("NITYA_ANNADAN_ADMIN")` returns `"/admin/nitya-annadan"`.
- [x] **AdminRoute Isolation Checks**:
  - Verify user with role `TRUSTEE` is permitted past the general `isAdmin` check.
  - Verify `TRUSTEE` attempting to access `/admin/system/*` is redirected to `/admin/trustee`.
  - Verify `TRUSTEE` attempting to access `/admin/website/*` is redirected to `/admin/trustee`.
  - Verify `WEBSITE_ADMIN` attempting to access `/admin/trustee/*` is redirected to `/admin/website`.
  - Verify `NITYA_ANNADAN_ADMIN` attempting to access `/admin/trustee/*` is redirected to `/admin/nitya-annadan`.
- [x] **TrusteeRoute Verification**:
  - Verify unauthenticated user navigating to `/admin/trustee` is redirected to `/login`.
  - Verify user with role `USER` or `WEBSITE_ADMIN` navigating to `/admin/trustee` is redirected to `/admin` with an error state.
  - Verify user with role `TRUSTEE` or `SYSTEM_ADMIN` successfully renders `TrusteeLayout`.
- [x] **UI Rendering & Layout Checks**:
  - Verify `AdminHome.jsx` renders the new emerald-styled **Finance Portal** card ONLY when logged in as `TRUSTEE` or `SYSTEM_ADMIN`.
  - Verify clicking "Enter Finance Portal" navigates to `/admin/trustee`.
  - Verify `TrusteeLayout.jsx` renders sidebar with active "Overview" link and disabled "Coming Soon" badges for Phase 3-6 modules.
  - Verify `TrusteeHome.jsx` renders system status checklist cleanly.

---

## 3. Test Results Summary — Phase 1

| Verification Item | Command / Method | Status | Notes |
|---|---|:---:|---|
| Backend Module Integrity | `node -e "require(...)"` | ✅ PASSED | All 5 Phase 1 backend modules loaded cleanly |
| Frontend Production Build | `npm run build` | ✅ PASSED | 1,123 KB JS bundle generated in 7.32s |
| Frontend Lint Verification | `npx eslint ...` | ✅ PASSED | Zero new errors introduced; 65 pre-existing issues confirmed unchanged |
| Route Isolation Logic | Code review & path tree audit | ✅ PASSED | Strict role boundaries enforced in `AdminRoute.jsx` & `TrusteeRoute.jsx` |
