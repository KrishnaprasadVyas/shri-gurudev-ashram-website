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
