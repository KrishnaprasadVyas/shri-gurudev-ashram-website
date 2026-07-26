# DEPLOYMENT_PLAN.md — Shri Gurudev Ashram ERP Deployment Sequence

This document governs the production deployment procedures for the Shri Gurudev Ashram platform during and after the implementation of the Ashram ERP extensions.

---

## 1. Production Environment Prerequisites

Before deploying any ERP phase to the live production server, the following infrastructure requirements must be verified:
1. **MongoDB Replica Set**:
   - The production MongoDB cluster (`mainDb`) MUST run as a Replica Set (standard on MongoDB Atlas or multi-node self-hosted deployments).
   - *Why*: Upcoming ERP phases (Phase 3+) rely on Mongoose multi-document transactions (`mainDb.startSession()`, `session.withTransaction()`) to guarantee atomicity across Cash Advance, Voucher, and Audit Log creations. Transactions fail on standalone MongoDB instances.
2. **Dual Database Configuration**:
   - Verify environment variables `MONGO_URI` (`mainDb`) and `MONGO_URI_SHARED` (`sharedDb`) are configured and reachable.
3. **Backup Protocol**:
   - Take a snapshot backup of `mainDb` prior to deploying any phase that introduces new collection structures or sequence seeds.

---

## 2. Phase 1 Deployment Protocol (Foundation Layer)

### 2.1 Deployment Sequence
Phase 1 is a pure infrastructure and authorization upgrade with zero breaking changes or database data migrations.

1. **Code Deployment**:
   - Pull latest `master` branch onto the production server.
   - Install dependencies if updated (`npm ci` in both `backend/` and `frontend/`).
2. **Frontend Build**:
   - Execute production build:
     ```bash
     cd frontend
     npm run build
     ```
   - Verify static bundle generation in `frontend/dist/`.
3. **Backend Restart**:
   - Perform graceful restart of the backend Node.js process (via PM2, systemd, or container orchestrator):
     ```bash
     pm2 reload ashram-backend
     ```
4. **Post-Deployment Verification**:
   - Verify backend logs indicate successful connection to both `mainDb` and `sharedDb`.
   - Log into the admin panel as a `SYSTEM_ADMIN` user and verify the new **Finance Portal** card appears on the admin dashboard.
   - Click into the Finance Portal and verify the `/admin/trustee/overview` page loads cleanly.

---

### 2.2 Rollback Procedure — Phase 1
In the unlikely event of an unexpected runtime issue following Phase 1 deployment:
1. **Code Rollback**:
   - Revert git checkout to the pre-ERP baseline tag (`1.0.0-baseline` or previous commit hash).
2. **Rebuild & Restart**:
   - Rebuild frontend static assets (`npm run build`).
   - Reload backend server process (`pm2 reload ashram-backend`).
3. **Database Cleanups (Optional)**:
   - Since Phase 1 made no data modifications or migrations, existing user documents remain untouched. Any test documents created in `auditlogs` or `counters` during verification can be left in place or dropped without affecting existing system behavior.

---

## 3. Phase 2 Deployment Protocol (Receipt Number Upgrade)

### 3.1 Deployment Sequence
Phase 2 modifies internal receipt generation logic across `admin.controller.js`, `webhook.controller.js`, and `donation.controller.js` to output atomic prefixes (`CA-`, `CH-`, `UPI-`, `OL-`).

1. **Code Deployment**:
   - Pull latest `master` branch onto the staging/production server.
   - Verify zero package dependency changes (`npm ci` or standard pull).
2. **Backend Restart**:
   - Perform graceful restart of the backend Node.js process:
     ```bash
     pm2 reload ashram-backend
     ```
3. **Post-Deployment Verification**:
   - Make a test cash donation in the Admin Portal (`/admin/system/donations/cash`) and verify the returned `receiptNumber` begins with `CA-000001` (or next sequence).
   - Verify that downloading a receipt PDF for a pre-existing donation returns the legacy receipt number without error or alteration.

---

### 3.2 Rollback Procedure — Phase 2
In the event of an issue with receipt number sequence generation or webhook capture in production:
1. **Code Rollback**:
   - Revert git checkout to the Phase 1 completion tag (`feat(finance): Phase 1` commit hash).
2. **Restart Backend**:
   - Reload server process (`pm2 reload ashram-backend`).
3. **Database State & Cleanup**:
   - During Phase 2, MongoDB will have seeded counter documents in `counters` (`CA`, `CH`, `UPI`, `OL`). These do NOT need to be dropped upon rollback; if Phase 2 is re-deployed later, numbering will resume safely from the highest sequence recorded without risk of duplicate IDs.

---

## 4. Phase 3 Deployment Protocol (Cash Advance & Voucher System)

### 4.1 Deployment Sequence
Phase 3 introduces the core accounting models (`CashAdvance`, `Voucher`), PDF generation via `PDFKit`, and new UI views in the Trustee Portal (`/admin/trustee/advances`, `/admin/trustee/vouchers`).

1. **Code Deployment**:
   - Pull latest `master` branch onto the staging/production server.
   - Verify all dependencies are installed (`npm ci`). Note: `pdfkit` is already part of project dependencies.
2. **Build Frontend**:
   - Rebuild production static bundle for the frontend:
     ```bash
     cd frontend && npm run build
     ```
3. **Backend Restart**:
   - Perform graceful restart of the backend Node.js process:
     ```bash
     pm2 reload ashram-backend
     ```
4. **Post-Deployment Verification**:
   - Log into the Trustee Portal (`/admin/trustee`) as a `TRUSTEE` or `SYSTEM_ADMIN` user.
   - Click "Cash Advances" and create a test Type A cash advance. Confirm atomic sequence numbering (`ADV-000001`).
   - Click "Settle" on the open advance, enter actual expense and return amounts, and submit.
   - Confirm the transaction settles and navigates to the newly generated Voucher detail view (`VCH-000001`).
   - Test "Download Official PDF" button and verify a clean PDF stream is downloaded.

---

### 4.2 Rollback Procedure — Phase 3
In the event of an unexpected issue with accounting workflows in production:
1. **Code Rollback**:
   - Revert git checkout to the Phase 2 completion commit hash.
2. **Rebuild & Restart**:
   - Rebuild frontend static assets (`npm run build`).
   - Reload backend server process (`pm2 reload ashram-backend`).
3. **Database State & Cleanup**:
   - The `cashadvances` and `vouchers` collections created in `mainDb` during Phase 3 can remain intact without impacting pre-existing modules (Donations, Collectors, CMS). If desired, test documents created during verification can be cleared using administrative database scripts.
