# DATABASE.md — Shri Gurudev Ashram ERP Database Architecture

This document tracks all Mongoose models, collections, indexes, and relationships in the Shri Gurudev Ashram production database, specifically documenting extensions made for the Ashram ERP.

---

## 1. Connection Architecture

The application utilizes two separate MongoDB connections managed in `backend/src/config/db.js`:
- **`mainDb` (`MONGO_URI`)**: Houses all Ashram-specific operational data (Users, Donations, Seva Bookings, Content, and all ERP Financial Collections).
- **`sharedDb` (`MONGO_URI_SHARED`)**: Houses cross-application/shared data (specifically `DonationHead` causes).

> **CRITICAL RULE**: All ERP financial collections (`AuditLog`, `Counter`, `CashAdvance`, `Voucher`) MUST reside on `mainDb`. Never place financial data on `sharedDb`.

---

## 2. Phase 1 Database Additions & Modifications

### 2.1 `User` Model (Modified)
- **Collection**: `users` (on `mainDb`)
- **Modification**: Added `"TRUSTEE"` to the `role` enum field.
- **Role Enum**: `["USER", "COLLECTOR_PENDING", "COLLECTOR_APPROVED", "WEBSITE_ADMIN", "SYSTEM_ADMIN", "NITYA_ANNADAN_ADMIN", "TRUSTEE"]`
- **Migration Required**: None. MongoDB schemas allow new enum additions without data migration. Existing user documents are unaffected.

---

### 2.2 `AuditLog` Model (New)
- **Collection**: `auditlogs` (on `mainDb`)
- **Purpose**: Persistent, append-only financial audit trail tracking every significant action across the ERP.
- **Design Constraints**:
  - Immutable: No update (`PUT`/`PATCH`) or delete (`DELETE`) operations are permitted at the controller or repository layer.
  - Timestamps: Configured with `{ timestamps: { createdAt: true, updatedAt: false } }` to enforce append-only semantics.
  - Mongoose Strictness: `auditLogSchema.set("strict", true)`.

#### Schema Definition
```javascript
{
  action: { type: String, required: true, index: true },           // e.g., "ADVANCE_CREATED", "ROLE_CHANGED"
  entity: { type: String, required: true, index: true },           // e.g., "CashAdvance", "Voucher", "Donation", "User"
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // Affected document ID
  entityRef: { type: String, default: null },                      // Human-readable ref: "ADV-000001", "CA-000001"
  performedBy: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // User who performed action
  performedByName: { type: String, default: null },                // Snapshot of user name/mobile at action time
  performedByRole: { type: String, default: null },                // Snapshot of user role at action time
  financialDetails: {
    amount: { type: Number, default: null },
    paymentMode: { type: String, default: null },                  // CASH, CHEQUE, UPI, RTGS, NEFT, ONLINE
    referenceNumber: { type: String, default: null },              // UTR, Cheque No, RTGS Ref
    previousStatus: { type: String, default: null },
    newStatus: { type: String, default: null }
  },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed, default: null },  // State before change
    after: { type: mongoose.Schema.Types.Mixed, default: null }    // State after change
  },
  notes: { type: String, default: null, maxlength: 1000 },
  createdAt: { type: Date }                                        // Auto-generated timestamp
}
```

#### Indexes
| Index | Type | Purpose |
|---|---|---|
| `{ entity: 1, entityId: 1, createdAt: -1 }` | Compound | Fast lookup of complete history for a specific document |
| `{ performedBy: 1, createdAt: -1 }` | Compound | Fast lookup of activity feed by a specific admin/trustee |
| `{ action: 1, createdAt: -1 }` | Compound | Filtering logs by action type (e.g., all settlements) |
| `{ createdAt: -1 }` | Single | Chronological browse of all system audit events |
| `{ "financialDetails.paymentMode": 1, createdAt: -1 }` | Compound | Filtering transactions by payment mode for financial audits |

---

### 2.3 `Counter` Model (New)
- **Collection**: `counters` (on `mainDb`)
- **Purpose**: Atomic sequential number generator for all financial reference numbers.
- **Design Constraints**:
  - Uses `_id` as the primary key string matching the sequence prefix (`"CA"`, `"CH"`, `"UPI"`, `"OL"`, `"ADV"`, `"VCH"`).
  - Uses MongoDB's atomic `$inc` operator via `findOneAndUpdate` to prevent number collisions under concurrency.
  - Supports MongoDB ClientSession for execution within multi-document transactions.
  - **Intentional Design Decision on Sequence Gaps & Rollbacks**: When sequence generation occurs outside a transaction (or during concurrent transaction rollbacks), reference number gaps may occur if a subsequent operation fails. Once an integer sequence is incremented by `$inc`, it is never recycled or rolled back across concurrent workers. This is an intentional architectural requirement for production accounting compliance: guaranteeing zero duplicate IDs and preserving chronological integrity without serializing transactions or causing database lock contention.

#### Schema Definition
```javascript
{
  _id: { type: String, required: true }, // Prefix identifier: "CA", "CH", "UPI", "OL", "ADV", "VCH"
  seq: { type: Number, default: 0, min: 0 } // Sequence integer, auto-incremented atomically
}
```

#### Indexes
- Primary Key on `_id` (default MongoDB index). No additional indexes required as all queries perform O(1) primary key lookups.

#### Phase 2 Integration Note
In Phase 2, `receipt.service.js` was upgraded to export `generateReceiptNumber(paymentMethod, session)`, which queries this `counters` collection to issue atomic reference numbers for offline cash/cheque/UPI donations (`createCashDonation`), confirmed Razorpay webhooks (`handleRazorpayWebhook`), and legacy fallback downloads (`downloadReceipt`). Existing donation records in `donations` preserve their original receipt number string untouched.

---

### 2.4 `CashAdvance` Model (Phase 3 New)
- **Collection**: `cashadvances` (on `mainDb`)
- **Purpose**: Manages Type A cash advances (awaiting settlement/return) and Type B direct vendor payments.
- **Design Constraints**:
  - Immutability on `advanceNumber` and `voucherId` after creation/settlement.
  - Strict accounting validation: `returnedAmount <= advanceAmount`.
  - Multi-document transaction support during settlement (`status` transition to `"SETTLED"` coupled with `Voucher` creation and `AuditLog` entry).

#### Schema Definition
```javascript
{
  advanceNumber: { type: String, required: true, unique: true, immutable: true }, // "ADV-000001"
  type: { type: String, enum: ["ADVANCE", "DIRECT_PAYMENT"], required: true },
  givenTo: { name: { type: String, required: true }, userId: { type: ObjectId, ref: "User", default: null } },
  purpose: { type: String, required: true },
  category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
  advanceAmount: { type: Number, required: true, min: 0 },
  settlement: {
    settledAt: Date, actualExpense: Number, returnedAmount: Number, variance: Number,
    paymentMode: String, paymentRef: String, notes: String, items: [lineItemSchema], settledBy: ObjectId
  },
  directPayment: { paymentMode: String, paymentRef: String, paymentDate: Date, bankName: String, accountNo: String },
  voucherId: { type: ObjectId, ref: "Voucher", default: null, immutable: true },
  voucherNumber: { type: String, default: null },
  status: { type: String, enum: ["OPEN", "SETTLED", "CANCELLED"], default: "OPEN" },
  addedBy: { type: ObjectId, ref: "User", required: true },
  notes: String,
  timestamps: true
}
```

#### Indexes
| Index | Type | Purpose |
|---|---|---|
| `{ advanceNumber: 1 }` | Unique | Fast lookup and unique guarantee on advance references |
| `{ status: 1, createdAt: -1 }` | Compound | Fast filtering of register view by status and date |
| `{ "givenTo.userId": 1 }` | Single | Lookup advances by user |
| `{ voucherId: 1 }` | Single | Reverse lookup from generated voucher |
| `{ category: 1 }` | Single | Accounting reports by expense category |
| `{ createdAt: -1 }` | Single | Chronological listing |

---

### 2.5 `Voucher` Model (Phase 3 New)
- **Collection**: `vouchers` (on `mainDb`)
- **Purpose**: Permanent financial audit record generated from settled cash advances and direct vendor payments.
- **Design Constraints**:
  - Total immutability: once created, vouchers cannot be edited, modified, or deleted. Only cache metadata (`pdfPath`, `pdfGeneratedAt`) can be updated during lazy PDF generation.
  - Links to source transaction (`CashAdvance`) via `sourceId`.

#### Schema Definition
```javascript
{
  voucherNumber: { type: String, required: true, unique: true, immutable: true }, // "VCH-000001"
  sourceType: { type: String, enum: ["ADVANCE_SETTLEMENT", "DIRECT_PAYMENT"], required: true },
  sourceId: { type: ObjectId, ref: "CashAdvance", required: true },
  title: { type: String, required: true },
  category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
  advanceAmount: Number, actualAmount: { type: Number, required: true }, returnedAmount: Number,
  paymentMode: String, paymentRef: String, bankName: String, paymentDate: Date,
  items: [voucherLineItemSchema], personName: { type: String, required: true },
  pdfPath: String, pdfGeneratedAt: Date,
  preparedBy: { type: ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  timestamps: true
}
```

#### Indexes
| Index | Type | Purpose |
|---|---|---|
| `{ voucherNumber: 1 }` | Unique | Fast lookup and unique guarantee on voucher references |
| `{ sourceId: 1 }` | Single | Direct association with source advance |
| `{ date: -1 }` | Single | Chronological register ordering |
| `{ category: 1, date: -1 }` | Compound | Category accounting reports over time |
| `{ createdAt: -1 }` | Single | Chronological listing |
