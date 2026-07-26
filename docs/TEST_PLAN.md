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

## 3. Phase 2 Verification Checklist — Receipt Number Upgrade

### 3.1 Backend Receipt Number Generation Checks
- [x] **Prefix Mapping Verification**:
  - Test `generateReceiptNumber("CASH")` returns `CA-XXXXXX`.
  - Test `generateReceiptNumber("CHEQUE")` returns `CH-XXXXXX`.
  - Test `generateReceiptNumber("UPI")` returns `UPI-XXXXXX`.
  - Test `generateReceiptNumber("ONLINE")` returns `OL-XXXXXX`.
- [x] **Controller Integration Checks**:
  - Verify `createCashDonation` in `admin.controller.js` invokes `generateReceiptNumber(effectiveMethod)` and sets `donation.receiptNumber`.
  - Verify `handleRazorpayWebhook` in `webhook.controller.js` invokes `generateReceiptNumber("ONLINE")` prior to atomic update.
  - Verify `downloadReceipt` in `donation.controller.js` invokes `generateReceiptNumber` only when `!donation.receiptNumber` (legacy fallback).
- [x] **Backward Compatibility Verification**:
  - Confirm existing donation records with old formats (e.g., `GDA-`, `GRD-`) bypass fallback generation and retain immutable reference strings.

---

## 4. Phase 3 Verification Checklist — Cash Advance & Voucher Workflow

### 4.1 Backend Accounting & Transaction Checks
- [x] **Type A Cash Advance Creation**: Verify `POST /api/finance/advances` creates an advance with `status: "OPEN"`, immutable `advanceNumber` (`ADV-XXXXXX`), and logs an `ADVANCE_CREATED` audit event.
- [x] **Type B Direct Vendor Payment**: Verify `POST /api/finance/advances/direct` atomically creates an advance marked as `status: "SETTLED"` AND an immutable expense voucher (`VCH-XXXXXX`), logging a `DIRECT_PAYMENT_RECORDED` audit event.
- [x] **Multi-Document Settlement**: Verify `POST /api/finance/advances/:id/settle` transitions an open advance to `SETTLED`, records `actualExpense` and `returnedAmount`, computes `variance`, and auto-generates a linked `Voucher`.
- [x] **Variance Enforcement**: Verify settlement rejects transactions where `returnedAmount > advanceAmount` or where `Math.abs(variance) > 1` without explanatory notes.
- [x] **Voucher Immutability**: Verify Mongoose pre-save and update middleware block any attempt to modify or delete a voucher after creation.
- [x] **PDF Generation & Streaming**: Verify `GET /api/finance/vouchers/:id/pdf` lazily generates a printable PDF using PDFKit and streams it only to authenticated administrative users.

---

## 5. Automated Regression Test Suite (Phase 3 Business Scenarios)

To ensure ongoing architectural integrity and prevent regressions across future implementation phases, the six verified business workflow scenarios from Phase 3 have been codified into a permanent automated regression test suite located at `backend/tests/finance_regression.test.js`.

### 5.1 Executing the Regression Suite
The suite can be executed from the root or backend directory at any time after future modifications:
```bash
# From within the backend directory:
cd backend
npm test
# Or directly via node:
node tests/finance_regression.test.js
```

### 5.2 Test Coverage & Verification Scope
The automated suite connects to MongoDB and validates:
1. **Scenario 1**: Normal Type A cash advance creation (`ADV-XXXXXX`) and settlement with partial cash return and zero variance. Verifies linked Voucher (`VCH-XXXXXX`), audit logs, and transaction commit.
2. **Scenario 2**: Exact Type A advance settlement with zero return and zero variance.
3. **Scenario 3**: Variance enforcement (Rule B.7). Verifies rejection (HTTP 400) and **complete database rollback** when settling without notes, and acceptance with variance `-1000` when notes are provided.
4. **Scenario 4**: Invalid return amount exceeding advance amount. Verifies immediate rejection (HTTP 400) and **complete database rollback** preserving clean `OPEN` advance status.
5. **Scenario 5**: Direct Vendor Payment (Type B). Verifies atomic simultaneous creation of settled `CashAdvance` and linked `Voucher` inside a multi-document transaction.
6. **Scenario 6**: Voucher Immutability. Attempts `.save()`, `findOneAndUpdate()`, `updateOne()`, and `deleteOne()` on permanent voucher records and verifies all 4 attempts are intercepted and blocked by Mongoose pre-hooks without altering DB records.

---

## 6. Test Results Summary — Phase 1, Phase 2 & Phase 3

| Verification Item | Command / Method | Status | Notes |
|---|---|:---:|---|
| Phase 1 Backend Integrity | `node -e "require(...)"` | ✅ PASSED | All 5 Phase 1 backend modules loaded cleanly |
| Phase 2 Backend Integrity | `node -e "require(...)"` | ✅ PASSED | All 4 Phase 2 modified modules loaded cleanly without syntax/runtime errors |
| Phase 3 Backend Integrity | `node --check` | ✅ PASSED | All 6 Phase 3 created and modified modules validated cleanly |
| Phase 3 Regression Suite | `npm test` (in `/backend`) | ✅ PASSED | 6/6 automated business scenarios passed (100% assertions met) |
| Prefix & Counter Mapping | Code execution mock test | ✅ PASSED | Confirmed `CA-`, `CH-`, `UPI-`, `OL-`, `ADV-`, `VCH-` generation |
| Frontend Production Build | `npm run build` | ✅ PASSED | 1,172 KB JS bundle generated cleanly in 7.31s |
| Frontend Lint Verification | `npx eslint ...` | ✅ PASSED | Zero new errors introduced; pre-existing codebase baseline unchanged |
