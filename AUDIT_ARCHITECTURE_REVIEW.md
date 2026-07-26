# Statutory Audit Architecture Review

## 1. Audit Log Trust Model
The audit log assumes a zero-trust model at the application layer and a high-trust model at the database layer. Application components (controllers, services, and frontend UI) are treated as untrusted and are fundamentally incapable of modifying or deleting audit records. Trust is strictly delegated to the MongoDB engine and its role-based access control (RBAC). The ledger represents a cryptographically sequential timeline of operations; any gap in sequence or missing document indicates database-level tampering.

## 2. Application-Level Immutability Guarantees
- **Mongoose Middleware Hooks**: Synchronous pre-hooks on `save()`, `updateOne()`, `deleteOne()`, `findOneAndUpdate()`, and related query operations intercept and instantly reject any mutation attempt on existing `AuditLog` documents.
- **Strict Schema Enforcement**: The schema (`strict: true`) ignores unauthorized fields, and timestamps are configured as `{ createdAt: true, updatedAt: false }`, ensuring no record can feign an update.
- **No Mutation Endpoints**: The `auditLog.routes.js` router intentionally lacks `POST`, `PUT`, `PATCH`, and `DELETE` handlers, completely blocking mutation via HTTP.
- **UI Read-Only Enforcement**: The `AuditLogView.jsx` React component provides inspection capabilities only, with no action buttons mapped to mutation APIs.

## 3. Database-Level Assumptions
- **Direct Collection Access**: The immutability model assumes that only authorized automated tests or supreme database administrators can issue raw MongoDB driver commands (e.g., `mainDb.collection("auditlogs").deleteMany(...)`) to bypass Mongoose middleware.
- **Transaction Rollbacks**: If a MongoDB transaction is aborted (e.g., during advance settlement failure), the associated audit log insertion is also rolled back, ensuring the ledger only reflects committed financial realities.

## 4. Production Deployment Recommendations
- **MongoDB RBAC**: Deploy a dedicated MongoDB user account for the Node.js backend with `readWrite` privileges that explicitly deny `dropCollection` or direct document deletion capabilities for the `auditlogs` collection if supported by the MongoDB cluster configuration.
- **Network Isolation**: Ensure the database is hosted in a private subnet, accessible only by the backend application servers (and authorized bastion hosts) to prevent direct external connection attempts.

## 5. Backup and Retention Recommendations
- **Continuous Backups**: Enable Point-in-Time Recovery (PITR) or oplog trailing on the MongoDB cluster to capture changes continuously.
- **WORM Storage**: Export audit logs monthly to an immutable, Write-Once-Read-Many (WORM) storage vault (e.g., AWS S3 Object Lock) for compliance with CA and financial regulatory requirements.
- **Indefinite Retention**: Audit logs must never be purged from the primary database or archives, as they are statutory records.

## 6. Recovery Procedures
- **Ledger Corruption**: If an unauthorized direct database modification is suspected, compare the current collection against the most recent immutable WORM export.
- **Restoration**: Restore the exact state from the PITR snapshot immediately preceding the unauthorized access event.

## 7. Security Considerations
- **PII Exposure**: Audit logs capture historical names, roles, and references. Access must remain strictly restricted to `TRUSTEE` and `SYSTEM_ADMIN` roles.
- **Log Injection**: Free-text notes and reference fields are sanitized and constrained by maximum lengths (`maxlength: 1000`) to prevent injection attacks or payload bloat.

## 8. Known Limitations
- **External Tampering**: A malicious actor with root database credentials can bypass application-level hooks and alter the collection directly. This risk is mitigated entirely by infrastructure-level security and WORM backups, not application logic.
- **Document Size Limits**: Highly complex operations with massive `details` or `changes` JSON payloads could theoretically approach MongoDB's 16MB document limit, though this is practically impossible under the current Ashram ERP workflows.
