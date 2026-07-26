# Ashram ERP — Implementation Plan v2.0
## Architectural Review + Revised Roadmap
### Shri Gurudev Ashram — Production System

> **Plan Version**: 2.0  
> **Review Date**: 2026-07-26  
> **Status**: Awaiting Approval Before Phase 1 Begins  
> **Previous Version**: 1.0 (superseded)

---

## PART A — ARCHITECTURAL REVIEW

---

### A.1 — Architecture Review Findings

#### FINDING 1: The core workflow was modeled incorrectly
**Severity: CRITICAL**

Version 1.0 treated Expense as the primary entity and Cash Advance as a secondary feature.

The client's actual workflow is the opposite:

```
CORRECT WORKFLOW (from client conversation):

Ashram gives cash to a person  (Cash Advance created)
          ↓
Person makes purchases          (Settlement entries recorded)
          ↓
Person returns unused cash      (Return amount recorded)
          ↓
System auto-generates Voucher   (NOT manually created)
          ↓
Advance is marked CLOSED        (Voucher = proof of closure)
          ↓
Audit history updated
```

**The Cash Advance is the primary workflow. Expense is the settlement detail. Voucher is auto-generated output — not a manually created document.**

This changes the entire data model and UX.

---

#### FINDING 2: Two distinct payment scenarios were not differentiated
**Severity: HIGH**

The client described two very different payment types:

**Type A — Cash Advance with Return** (e.g., vegetables, groceries, kiryana):
- Give person ₹5,000 → They spend ₹3,000 → Return ₹2,000
- Voucher = ₹3,000 (the actual expense)
- Option: Voucher can be immediate OR deferred

**Type B — Direct Payment to Vendor** (e.g., electrician, construction):
- Vendor bills for ₹10,000 work
- Ashram pays by cheque/RTGS/NEFT directly
- Voucher = ₹10,000 with cheque number / RTGS reference
- No "return" concept

Version 1.0 did not differentiate between these. Both must be first-class citizens in the data model.

---

#### FINDING 3: Voucher was designed as manually created
**Severity: HIGH**

Version 1.0 had a separate "Create Voucher" flow where users manually linked expenses.

The client explicitly said vouchers auto-generate from the settlement:
> "3000 ka voucher ban jayega" — the voucher is an output, not an input.

**Vouchers should be auto-generated. The UI should allow viewing and printing, not creating.**

---

#### FINDING 4: Receipt numbering system was missing
**Severity: HIGH**

The client specifically requested distinct receipt prefixes:
- **CA** = Cash receipts
- **CH** = Cheque receipts  
- **OL** = Online receipts
- **UPI** = UPI receipts (implied)

Version 1.0 mentioned this in Q&A but never designed it. This must be a first-class design decision because receipt numbers are **immutable legal document identifiers**.

---

#### FINDING 5: TRUSTEE was read-only for donations — client wants write access
**Severity: HIGH**

Version 1.0 gave Trustee read-only access to donations.

The client said the admin panel should allow offline donation entry with immediate receipt generation:
> "abhi usko pura receipt karke acche se naya clean bana ke"

**Trustee must be able to enter offline donations and generate + print receipts.**

---

#### FINDING 6: Payment methods were incomplete
**Severity: MEDIUM**

Version 1.0 supported: CASH, UPI, CHEQUE, BANK_TRANSFER

The client explicitly mentioned: Cash, Cheque, UPI, **RTGS**, **NEFT**

RTGS and NEFT are distinct bank transfer methods used in India for high-value and standard transfers respectively. They require different reference number formats and should be tracked separately.

---

#### FINDING 7: Expense categories were defined but not connected to the advance workflow
**Severity: MEDIUM**

Version 1.0 had a standalone Expense model with categories. After the architectural correction (advance-first), the line items within a settlement are what track the category. The Expense model needs to be redesigned as `AdvanceSettlementItem` or restructured.

---

#### FINDING 8: Financial document numbering was not designed
**Severity: MEDIUM**

No design for:
- `ADV-000001` — Advance number
- `VCH-000001` — Voucher number
- `CA-000001` — Cash donation receipt
- `CH-000001` — Cheque donation receipt
- `OL-000001` — Online donation receipt
- `UPI-000001` — UPI donation receipt

These must be:
1. Sequential within each prefix
2. Immutable once created
3. Collision-proof (use database counter or timestamp fallback)

---

#### FINDING 9: Financial reports were not defined
**Severity: MEDIUM**

Version 1.0 mentioned "financial dashboard" but did not specify the actual financial reports the CA/audit requires at year-end:
- Cash Book
- Voucher Register
- Expense Register (by category)
- Outstanding Advances Report
- Settlement Register
- Donation Register (by payment method)
- Monthly Income vs Expense Summary
- Annual Audit Export

---

#### FINDING 10: Approval workflow was over-engineered
**Severity: LOW**

Version 1.0 proposed TRUSTEE creates → SYSTEM_ADMIN approves.

The client's context is a small ashram. The actual workflow is:
- Maharaj (Trustee) enters expenses
- Admin (Kaka/senior person) can review
- No formal multi-level approval needed for now

**Recommendation**: Single-level review. Admin can see and mark reviewed. No blocking approval gate on the advance entry itself.

---

#### FINDING 11: Phase ordering was wrong — settlement workflow was Phase 7 (too late)
**Severity: MEDIUM**

The core workflow (Advance → Settlement → Auto-voucher) was spread across Phases 2, 3, 4, and 7. This means the system would be deployed in an incomplete state with no usable workflow for 7 phases.

**Phases must be reordered so the core Advance → Settlement → Voucher flow is complete and usable by Phase 3.**

---

#### FINDING 12: No rate limiting for financial endpoints
**Severity: MEDIUM**

The existing system has rate limiters for donations and collector applications. New financial endpoints need their own rate limiter to prevent abuse.

---

#### FINDING 13: MongoDB transactions not discussed
**Severity: MEDIUM**

Settlement involves atomically:
1. Updating the CashAdvance status
2. Creating line items
3. Auto-generating the Voucher
4. Writing to AuditLog

All four must succeed or all must fail. Without MongoDB transactions, partial writes are possible. The existing system doesn't use transactions (single-document operations), but this workflow crosses multiple collections.

**Recommendation**: Use MongoDB session-based transactions for the settlement endpoint.

---

#### FINDING 14: Voucher PDF security was ambiguous
**Severity: MEDIUM**

Version 1.0 asked "should vouchers be public or auth-required?" but left it open.

**Decision**: Voucher PDFs must require authentication. They are internal financial documents. Donation receipts are public because donors need to share them with their tax advisors. Vouchers are not public.

---

### A.2 — Weaknesses Summary Table

| # | Weakness | Severity | Resolution |
|---|---|---|---|
| 1 | Workflow modeled backwards (Expense-first instead of Advance-first) | CRITICAL | Redesign data model: Advance is primary entity |
| 2 | Two payment scenarios not differentiated | HIGH | Type A (advance+return) and Type B (direct vendor payment) |
| 3 | Vouchers were manually created | HIGH | Vouchers auto-generate from settlement |
| 4 | Receipt numbering system missing | HIGH | Design CA/CH/OL/UPI/ADV/VCH prefixes |
| 5 | Trustee read-only on donations | HIGH | Trustee can enter offline donations + print receipts |
| 6 | RTGS and NEFT payment methods missing | MEDIUM | Add to payment method enum |
| 7 | Expense model disconnected from advance | MEDIUM | Redesign as settlement line items |
| 8 | Financial document numbering not designed | MEDIUM | Sequential counters per prefix |
| 9 | Financial reports not specified | MEDIUM | Define all required reports |
| 10 | Over-engineered approval workflow | LOW | Single-level review, no blocking gate |
| 11 | Phase ordering wrong | MEDIUM | Core workflow complete by Phase 3 |
| 12 | No rate limiting for financial endpoints | MEDIUM | Add `financialApiLimiter` |
| 13 | MongoDB transactions not planned | MEDIUM | Use sessions for multi-collection writes |
| 14 | Voucher PDF auth unresolved | MEDIUM | Auth-required, not public |

---

## PART B — REVISED DESIGN

---

### B.1 — Correct Financial Workflow

#### Workflow Type A: Cash Advance with Return (Vegetables, Groceries, Kiryana)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Create Cash Advance                                    │
│  Person: Krishna Vyas | Purpose: Vegetables | Amount: ₹5,000   │
│  Status: OPEN | AdvanceNo: ADV-000001                          │
└─────────────────────────────┬───────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Record Settlement (when Krishna returns)               │
│  Actual Expense: ₹3,000 (Vegetables)                           │
│  Returned Cash: ₹2,000                                         │
│  Payment Mode: CASH (advance was given in cash)                 │
│  Items: [{ description: "Vegetables", amount: 3000 }]          │
└─────────────────────────────┬───────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: System AUTO-GENERATES Voucher                          │
│  VoucherNo: VCH-000001                                          │
│  Title: Vegetables — Krishna Vyas                               │
│  Amount: ₹3,000                                                 │
│  Advance Given: ₹5,000 | Returned: ₹2,000 | Net: ₹3,000       │
│  Status: GENERATED (printable immediately)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Advance CLOSED                                         │
│  Status: SETTLED | VoucherId: VCH-000001                       │
│  AuditLog: who settled, when, amounts                          │
└─────────────────────────────────────────────────────────────────┘
```

#### Workflow Type B: Direct Vendor Payment (Electrician, Construction)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Create Direct Payment Voucher                          │
│  Vendor: Electrician | Work: Wiring repair                     │
│  Amount: ₹10,000 | Payment Mode: CHEQUE                        │
│  Cheque No: 123456 | Bank: SBI                                 │
│  VoucherNo: VCH-000002 (auto-generated immediately)            │
│  No Advance needed — paid directly                             │
└─────────────────────────────┬───────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Voucher immediately printable                                  │
│  AuditLog updated                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight**: Type B does not go through the advance system at all. It creates a voucher directly.

---

### B.2 — Revised Database Design

#### All new collections on `mainDb`

---

#### Collection: `counters` (NEW — Sequence Generator)

```javascript
{
  _id: String,        // e.g., "ADV", "VCH", "CA", "CH", "OL", "UPI"
  seq: Number         // auto-incremented
}
```

Used by a `getNextSequence(prefix)` utility function. Atomic increment via `$inc + findOneAndUpdate`. Guarantees no duplicate numbers across concurrent requests.

**Index**: `_id` (already primary key)

---

#### Collection: `cashadvances` (NEW)

```javascript
{
  _id: ObjectId,
  advanceNumber: String,     // "ADV-000001" — immutable, unique
  type: String,              // "ADVANCE" | "DIRECT_PAYMENT"
  
  // Who received the advance
  givenTo: {
    name: String,            // "Krishna Vyas" — snapshot
    userId: ObjectId,        // ref → User (if registered), else null
  },
  
  purpose: String,           // "Vegetables for kitchen"
  category: String,          // enum (see categories below)
  
  advanceAmount: Number,     // ₹5,000 — amount physically given
  
  // Filled on settlement (Type A only)
  settlement: {
    settledAt: Date,
    actualExpense: Number,   // ₹3,000 — what was actually spent
    returnedAmount: Number,  // ₹2,000 — cash returned to ashram
    variance: Number,        // computed: advanceAmount - actualExpense - returnedAmount (must be 0)
    paymentMode: String,     // how advance was given: CASH | UPI | CHEQUE | RTGS | NEFT
    paymentRef: String,      // cheque no / UTR / RTGS ref (if applicable)
    notes: String,
    items: [{                // itemized purchases
      description: String,
      amount: Number,
      category: String,
    }],
    settledBy: ObjectId,     // ref → User
  },
  
  // For Type B (direct payment) — filled at creation
  directPayment: {
    paymentMode: String,     // CASH | CHEQUE | UPI | RTGS | NEFT
    paymentRef: String,      // cheque no / UTR / RTGS ref
    paymentDate: Date,
    bankName: String,        // if cheque/RTGS
    accountNo: String,       // optional
  },
  
  voucherId: ObjectId,       // ref → vouchers (set after settlement/direct payment)
  voucherNumber: String,     // snapshot for quick display
  
  status: String,            // "OPEN" | "SETTLED" | "CANCELLED"
                             // Type B: created as "SETTLED" immediately
  
  addedBy: ObjectId,         // ref → User (who entered this in system)
  notes: String,
  timestamps: { createdAt, updatedAt }
}
```

**Validation rules (enforced in controller)**:
- `returnedAmount` cannot exceed `advanceAmount`
- `actualExpense + returnedAmount` must equal `advanceAmount` (variance = 0, OR allow small variance with note)
- Cannot settle a CANCELLED advance
- Cannot settle an already SETTLED advance
- `advanceNumber` is immutable once created
- `voucherId` is immutable once set

**Indexes**:
```javascript
{ advanceNumber: 1 }           // unique: true
{ status: 1, createdAt: -1 }  // list view with filter
{ "givenTo.userId": 1 }       // user-based lookup
{ voucherId: 1 }               // reverse lookup from voucher
{ category: 1 }                // category-based reports
{ createdAt: -1 }              // chronological reports
```

---

#### Collection: `vouchers` (NEW)

```javascript
{
  _id: ObjectId,
  voucherNumber: String,     // "VCH-000001" — immutable, unique
  
  sourceType: String,        // "ADVANCE_SETTLEMENT" | "DIRECT_PAYMENT"
  sourceId: ObjectId,        // ref → cashadvances._id
  
  title: String,             // e.g., "Vegetables — Krishna Vyas"
  category: String,          // expense category
  
  // Financial summary (denormalized for quick display)
  advanceAmount: Number,     // ₹5,000 (null for DIRECT_PAYMENT)
  actualAmount: Number,      // ₹3,000 — the voucher amount
  returnedAmount: Number,    // ₹2,000 (null for DIRECT_PAYMENT)
  
  paymentMode: String,       // CASH | CHEQUE | UPI | RTGS | NEFT
  paymentRef: String,        // cheque no / UTR / RTGS ref
  bankName: String,
  paymentDate: Date,
  
  items: [{                  // itemized line items (copied from settlement)
    description: String,
    amount: Number,
    category: String,
  }],
  
  // Person involved
  personName: String,        // "Krishna Vyas" — snapshot
  
  pdfPath: String,           // filesystem path (generated on demand)
  pdfGeneratedAt: Date,
  
  preparedBy: ObjectId,      // ref → User (who settled / created)
  
  date: Date,                // voucher date (settlement date or payment date)
  timestamps: { createdAt, updatedAt }
}
```

**Validation rules**:
- `voucherNumber` is immutable
- Cannot delete a voucher — only cancel its source advance
- PDF is generated on first download request (lazy generation)

**Indexes**:
```javascript
{ voucherNumber: 1 }           // unique: true
{ sourceId: 1 }                // lookup by advance
{ date: -1 }                   // voucher register chronological
{ category: 1, date: -1 }     // category report
{ createdAt: -1 }
```

---

#### Collection: `auditlogs` (NEW)

```javascript
{
  _id: ObjectId,
  
  // What happened
  action: String,            // "ADVANCE_CREATED" | "ADVANCE_SETTLED" | "ADVANCE_CANCELLED" |
                             // "VOUCHER_GENERATED" | "DONATION_ADDED" | "ROLE_CHANGED" | etc.
  entity: String,            // "CashAdvance" | "Voucher" | "Donation" | "User"
  entityId: ObjectId,        // the affected document's _id
  entityRef: String,         // human-readable ref: "ADV-000001" | "VCH-000001" | receipt no.
  
  // Who did it
  performedBy: ObjectId,     // ref → User
  performedByName: String,   // snapshot of user's name/mobile
  performedByRole: String,   // snapshot of role at time of action
  
  // Financial snapshot (for financial audit)
  financialDetails: {
    amount: Number,
    paymentMode: String,
    referenceNumber: String,
    previousStatus: String,
    newStatus: String,
  },
  
  // Technical details
  ipAddress: String,
  userAgent: String,
  
  // The actual change (before/after for edits)
  changes: {
    before: Mixed,           // previous value (for update operations)
    after: Mixed,            // new value
  },
  
  timestamps: { createdAt }  // no updatedAt — audit logs are immutable
}
```

**Critical rule**: AuditLog documents are **never updated or deleted**. Append-only.

**Indexes**:
```javascript
{ entity: 1, entityId: 1, createdAt: -1 }  // entity history
{ performedBy: 1, createdAt: -1 }           // user activity
{ action: 1, createdAt: -1 }               // action-based filter
{ createdAt: -1 }                           // chronological browse
{ "financialDetails.paymentMode": 1 }       // payment mode reports
```

---

#### Modify: `Donation` model — Receipt Number Prefix

Current: `receiptNumber: String` — no standardized format.

New: Receipt numbers will follow prefix format:
- `CA-000001` — Cash
- `CH-000001` — Cheque
- `UPI-000001` — UPI
- `OL-000001` — Online (Razorpay)

The `counters` collection tracks each prefix independently.

**Migration**: Existing receipt numbers without prefix remain as-is (legacy). New ones get the prefix format. The `receipt.service.js` generates the number based on payment method.

---

#### Expense Categories (shared enum)

Used in both `cashadvances.category` and `cashadvances.settlement.items[].category`:

```javascript
[
  "GROCERIES_PROVISIONS",     // Vegetables, kiryana, etc.
  "ELECTRICITY_UTILITIES",    // Electricity, water
  "MAINTENANCE_REPAIRS",      // Repairs, plumbing, carpentry
  "STAFF_WAGES",              // Daily wages, salaries
  "TRANSPORT",                // Vehicle fuel, auto-rickshaw
  "MEDICAL",                  // Medicines, doctor fees
  "STATIONERY_OFFICE",       // Paper, pens, printing
  "RELIGIOUS_CEREMONIES",     // Pooja samagri, flowers, etc.
  "CONSTRUCTION",             // Infrastructure
  "TELEPHONE_INTERNET",       // Phone bills, broadband
  "HOSPITALITY",              // Guest expenses, prasad
  "MISCELLANEOUS",            // Other
]
```

---

### B.3 — Receipt Numbering System Design

#### Counter-based, prefix-aware system

```
Prefix   | Scope                      | Example
---------|----------------------------|------------------
CA       | Cash donations             | CA-000001
CH       | Cheque donations           | CH-000001
UPI      | UPI donations              | UPI-000001
OL       | Online (Razorpay) dontions | OL-000001
ADV      | Cash advances              | ADV-000001
VCH      | Vouchers                   | VCH-000001
```

#### Counter utility (backend service)

```javascript
// backend/src/services/counter.service.js
async function getNextNumber(prefix) {
  // Atomic findOneAndUpdate with $inc
  // Returns padded string: "CA-000001"
}
```

#### Assignment rules:
- Receipt number assigned at the moment of **successful** donation/advance creation
- Never re-assigned, never reused, never changed
- If PDF generation fails, the receipt number is still valid and retained
- Sequence gaps are acceptable (cancelled actions leave gaps — this is normal accounting practice)

---

### B.4 — Revised Permission Matrix

| Capability | USER | COLLECTOR | TRUSTEE | WEBSITE_ADMIN | NITYA_ADMIN | SYSTEM_ADMIN |
|---|---|---|---|---|---|---|
| View public website | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Make online donation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View my donations | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Collector dashboard | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Enter offline donation** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| **Print donation receipt** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| **View all donations** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| **Create cash advance** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| **Settle advance** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| **View vouchers** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| **Print voucher PDF** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| **View financial reports** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| **View audit logs** | ❌ | ❌ | **✅** | ❌ | ❌ | ✅ |
| Manage CMS content | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Nitya Annadan admin | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage all donations | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Assign TRUSTEE role** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage collectors | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View system reports | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

> [!NOTE]
> TRUSTEE can do everything related to ashram financial operations. SYSTEM_ADMIN retains everything. The two roles effectively share financial features — no blocking approval gates between them in the simple workflow described by the client.

---

### B.5 — Financial Reports Required

| Report Name | Description | Export |
|---|---|---|
| **Cash Book** | Chronological list of all cash in (donations) and cash out (advances/expenses) | CSV/PDF |
| **Voucher Register** | All vouchers in date order with voucher no., person, amount, category | CSV/PDF |
| **Expense Register** | All expenses grouped by category with totals | CSV/PDF |
| **Outstanding Advances** | Advances in OPEN status (not yet settled) | CSV |
| **Settlement Register** | All settled advances with advance amount, actual, returned | CSV |
| **Donation Register** | All donations grouped by payment method | CSV/PDF |
| **Monthly Summary** | Income (donations) vs Expenditure (vouchers) per month | Chart + CSV |
| **Annual Audit Export** | Complete year dump for CA — all transactions | CSV |

---

### B.6 — API Design (Revised)

#### New Route Prefixes

| Prefix | Purpose | Roles |
|---|---|---|
| `/api/finance/advances` | Cash advance CRUD + settlement | TRUSTEE, SYSTEM_ADMIN |
| `/api/finance/vouchers` | Voucher view + PDF | TRUSTEE, SYSTEM_ADMIN |
| `/api/finance/reports` | Financial reports and exports | TRUSTEE, SYSTEM_ADMIN |
| `/api/admin/system/users` | User role management | SYSTEM_ADMIN only |

> [!NOTE]
> Using `/api/finance/` as the new namespace instead of `/api/admin/system/` for financial endpoints. This is cleaner and allows different rate limiting. TRUSTEE cannot access `/api/admin/system/` at all, preventing accidental access to existing system admin functions.

#### Revised Donation Routes (modification to existing)

Existing: `POST /api/admin/system/donations/cash` — SYSTEM_ADMIN only  
Revised: Also allow TRUSTEE — same endpoint, added to authorize() call

This is a one-line change in `admin.system.routes.js` and is backward-safe.

---

### B.7 — Business Validation Rules

| Rule | Enforcement |
|---|---|
| Returned amount ≤ Advance amount | Controller + model validator |
| actualExpense + returnedAmount = advanceAmount | Controller validation (allow ₹1 rounding) |
| Cannot settle SETTLED advance | Status state machine in controller |
| Cannot settle CANCELLED advance | Status state machine in controller |
| Cannot cancel SETTLED advance | Status state machine in controller |
| Receipt number immutable once issued | Never allow PUT on receiptNumber |
| Voucher number immutable once issued | Never allow PUT on voucherNumber |
| Advance number immutable once issued | Never allow PUT on advanceNumber |
| Cannot delete SETTLED advance | Hard block in delete handler |
| Cannot edit SETTLED advance | Status check before update |
| Cannot delete any voucher | Vouchers are permanent records |
| Role change requires re-login | JWT expiry not forced; document this |
| SYSTEM_ADMIN cannot demote themselves | Controller check: if req.user.id === targetUserId && newRole !== "SYSTEM_ADMIN" → 403 |
| Voucher PDF is auth-required | No public static serving for vouchers |

---

### B.8 — Security Review

| Concern | Design |
|---|---|
| Financial endpoints need rate limiting | `financialApiLimiter`: 60 req/min per IP |
| Voucher PDFs must not be publicly accessible | Serve through authenticated endpoint, not static |
| Role escalation prevention | Only SYSTEM_ADMIN can call `/users/:id/role` |
| Audit log tampering | No PUT/DELETE on auditlogs collection; controller enforces append-only |
| Settlement tampering | SETTLED advances are immutable; controller rejects updates |
| Receipt number collision | `counters` collection + `$inc` atomic operation |
| TRUSTEE seeing SYSTEM_ADMIN-only data | Finance routes (`/api/finance/*`) are separate from system routes (`/api/admin/system/*`) |
| Soft delete vs hard delete | Advances: soft delete (cancelled status). Vouchers: no delete. Donations: no delete (existing). AuditLog: no delete. |

---

### B.9 — MongoDB Transaction Plan

Settlement is a multi-document atomic operation:

```javascript
// In cashAdvance.controller.js — settleAdvance()
const session = await mainDb.startSession();
try {
  await session.withTransaction(async () => {
    // 1. Update advance status to SETTLED
    await CashAdvance.findByIdAndUpdate(id, { status: "SETTLED", settlement: {...} }, { session });
    
    // 2. Get next voucher number
    const voucherNo = await getNextNumber("VCH"); // counter operation (separate session-safe call)
    
    // 3. Create voucher document
    await Voucher.create([{ voucherNumber: voucherNo, ... }], { session });
    
    // 4. Update advance with voucherId
    await CashAdvance.findByIdAndUpdate(id, { voucherId: voucher._id }, { session });
    
    // 5. Create audit log
    await AuditLog.create([{ action: "ADVANCE_SETTLED", ... }], { session });
  });
} finally {
  await session.endSession();
}
```

> [!NOTE]
> The `counters` collection increment for voucher number must happen inside the transaction to guarantee no duplicate numbers. Use `findOneAndUpdate` with `session` option.

---

## PART C — REVISED PHASE ROADMAP

---

### PHASE 1 — Foundation Layer (Role + Auth + Counter Service)
**Goal**: Add TRUSTEE role, create counter service, create AuditLog model. Zero visible features yet — pure infrastructure.

**Scope**:
- Add `TRUSTEE` to User.role enum
- Create `backend/src/models/AuditLog.js`
- Create `backend/src/models/Counter.js`
- Create `backend/src/services/counter.service.js` (getNextNumber utility)
- Update `backend/src/middlewares/rateLimit.js` — add `financialApiLimiter`
- Update `frontend/src/context/AuthContext.jsx` — add TRUSTEE redirect → `/admin/trustee`
- Update `frontend/src/components/AdminRoute.jsx` — add TRUSTEE as valid admin role
- Create `frontend/src/components/TrusteeRoute.jsx`
- Create `frontend/src/layouts/TrusteeLayout.jsx` (sidebar with placeholder links)
- Create `frontend/src/pages/admin/trustee/TrusteeHome.jsx` (placeholder)
- Update `frontend/src/App.jsx` — add `/admin/trustee/*` routes
- Update `frontend/src/pages/admin/AdminHome.jsx` — add Trustee portal card

**APIs**: None new

**Database Changes**:
- User.role enum: add `TRUSTEE` (no migration)
- New collection stubs: `auditlogs`, `counters` (created on first document insert)

**Dependencies**: None

**Rollback**: All additive. Revert User.js enum, remove frontend files.

**Testing Checklist**:
- [ ] All existing roles (USER/COLLECTOR/WEBSITE_ADMIN/SYSTEM_ADMIN/NITYA_ANNADAN_ADMIN) login correctly
- [ ] TRUSTEE role assignable via DB and user can log in
- [ ] TRUSTEE sees `/admin/trustee` but NOT `/admin/system`
- [ ] WEBSITE_ADMIN still cannot see system routes
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] Server starts cleanly

---

### PHASE 2 — Receipt Number Upgrade
**Goal**: Implement the prefix-based receipt numbering (CA, CH, UPI, OL) for all new donations. This is a prerequisite before trustee enters any offline donations.

**Scope**:
- Update `backend/src/services/receipt.service.js` — `generateReceiptNumber(paymentMethod)` function using counter service
- Update `backend/src/controllers/admin.controller.js` — `createCashDonation` → assign prefixed receipt number
- Update `backend/src/controllers/donation.controller.js` — `createDonation` webhook handler → assign OL- prefix
- Update `backend/src/controllers/webhook.controller.js` — confirm OL- prefix assigned on webhook confirmation
- **Existing receipts are untouched** — old records keep their old format
- New donation flow test: CA-000001 for cash, CH-000001 for cheque, UPI-000001 for UPI, OL-000001 for online

**APIs**: No new endpoints. Internal logic change only.

**Database Changes**:
- `counters` collection gets initial documents for CA, CH, UPI, OL prefixes (seeded to 0)
- Existing `receiptNumber` values on Donation documents are unchanged

> [!WARNING]
> This phase touches `receipt.service.js` and `donation.controller.js` which handle live payments. Must be tested thoroughly on staging before deploying to production.

**Testing Checklist**:
- [ ] New cash donation gets `CA-XXXXXX` receipt number
- [ ] New cheque donation gets `CH-XXXXXX` receipt number
- [ ] New UPI donation gets `UPI-XXXXXX` receipt number
- [ ] New online (Razorpay) donation gets `OL-XXXXXX` receipt number
- [ ] Old donations with old receipt numbers: unchanged, still downloadable
- [ ] No duplicate receipt numbers possible under concurrent load
- [ ] Receipt PDF renders new number correctly
- [ ] Webhook handler correctly assigns OL- prefix

---

### PHASE 3 — Cash Advance + Settlement + Auto-Voucher (Core Workflow)
**Goal**: Implement the complete client-described workflow end-to-end. After this phase, the core ERP is functional.

**Scope**:
- Create `backend/src/models/CashAdvance.js`
- Create `backend/src/models/Voucher.js`
- Create `backend/src/controllers/cashAdvance.controller.js`
  - `createAdvance()` — Type A (advance with return)
  - `createDirectPayment()` — Type B (direct vendor payment)
  - `settleAdvance()` — records settlement, auto-generates voucher, uses MongoDB transaction
  - `cancelAdvance()` — soft cancel (OPEN only)
  - `listAdvances()` — with filters
  - `getAdvanceById()`
- Create `backend/src/controllers/voucher.controller.js`
  - `listVouchers()`
  - `getVoucherById()`
  - `downloadVoucherPdf()` — generates on demand, streams to client (auth-required)
- Create `backend/src/services/voucher.service.js` — PDF generation using PDFKit
- Create `backend/src/routes/finance.routes.js` — mount all advance + voucher endpoints
- Mount `/api/finance` in `backend/src/app.js`
- Create `frontend/src/pages/admin/trustee/AdvancesView.jsx`
- Create `frontend/src/pages/admin/trustee/AdvanceForm.jsx` (Type A + Type B)
- Create `frontend/src/pages/admin/trustee/SettleAdvanceForm.jsx`
- Create `frontend/src/pages/admin/trustee/VouchersView.jsx`
- Create `frontend/src/pages/admin/trustee/VoucherDetail.jsx` (with print button)
- Create `frontend/src/services/financeApi.js`
- Update `TrusteeLayout.jsx` — wire navigation links

**APIs (new)**:
```
POST   /api/finance/advances              — Create advance (Type A)
POST   /api/finance/advances/direct       — Create direct payment (Type B)
GET    /api/finance/advances              — List with filters
GET    /api/finance/advances/:id          — Single advance detail
POST   /api/finance/advances/:id/settle   — Settle advance (triggers auto-voucher)
PATCH  /api/finance/advances/:id/cancel   — Cancel advance (OPEN only)
GET    /api/finance/vouchers              — List vouchers
GET    /api/finance/vouchers/:id          — Single voucher
GET    /api/finance/vouchers/:id/pdf      — Stream voucher PDF (auth-required)
```

**Roles**: TRUSTEE + SYSTEM_ADMIN for all

**Database Changes**: New `cashadvances` collection, new `vouchers` collection

**MongoDB Transactions**: Used in `settleAdvance()` (advance update + voucher create + audit log)

**Business Validations**: Full list from B.7 enforced here

**Testing Checklist**:
- [ ] Type A: Create advance → settle → returned + actual amounts → voucher auto-generated
- [ ] Type A: `advanceAmount - actualExpense - returnedAmount = 0` validation enforced
- [ ] Type B: Direct payment → voucher created immediately
- [ ] Cannot settle already-settled advance
- [ ] Cannot cancel settled advance
- [ ] Voucher PDF generates correctly with logo, amounts, line items
- [ ] Voucher PDF is not accessible without auth token
- [ ] Advance number follows ADV-XXXXXX format
- [ ] Voucher number follows VCH-XXXXXX format
- [ ] AuditLog entry created for every action
- [ ] MongoDB transaction: if voucher creation fails, advance status NOT changed
- [ ] Existing donation flow unaffected

---

### PHASE 4 — Trustee Offline Donation Entry
**Goal**: Allow TRUSTEE to enter offline donations and generate receipts, just like SYSTEM_ADMIN.

**Scope**:
- Update `backend/src/routes/admin.system.routes.js`:
  - `POST /api/admin/system/donations/cash` — add TRUSTEE to authorize()
  - `GET /api/admin/system/donations` — add TRUSTEE to authorize()
- Create `frontend/src/pages/admin/trustee/OfflineDonationForm.jsx` — same form as `CashDonationForm.jsx` but in Trustee layout
  - **Fix**: Load donation heads from API (`/api/public/donation-heads`), not `dummyData.js`
- Create `frontend/src/pages/admin/trustee/DonationsView.jsx` — donation list (Trustee view)
- Update `TrusteeLayout.jsx` — add Donations section to sidebar
- Receipt shows correct prefix (CA/CH/UPI already done in Phase 2)

**APIs**: No new endpoints. TRUSTEE role added to existing endpoints via one-line change.

**Database Changes**: None. Existing Donation collection is used.

**Testing Checklist**:
- [ ] TRUSTEE can submit offline donation form
- [ ] Donation saved to DB with `addedBy` = TRUSTEE user
- [ ] Receipt generated with correct prefix (CA-, CH-, etc.)
- [ ] Receipt PDF renders correctly
- [ ] TRUSTEE can view donation list
- [ ] SYSTEM_ADMIN cash donation workflow unchanged
- [ ] dummyData.js no longer used in donation form — uses API

---

### PHASE 5 — Financial Reports + Dashboard
**Goal**: Trustee gets a usable financial dashboard and all required reports.

**Scope**:
- Create `backend/src/controllers/finance.reports.controller.js`
  - `getCashBook()` — chronological income + expense
  - `getVoucherRegister()` — all vouchers in date order
  - `getOutstandingAdvances()` — OPEN advances only
  - `getMonthlyComparison()` — donations vs expenses by month
  - `getAnnualExport()` — full year CSV dump
- Create `backend/src/routes/finance.reports.routes.js`
- Mount in `finance.routes.js`
- Create `frontend/src/pages/admin/trustee/TrusteeHome.jsx` (real dashboard — replaces placeholder)
  - Cards: Outstanding Advances, Today's Donations, This Month Vouchers, Open Advances Total
  - Quick actions: New Advance, Add Donation, View Reports
- Create `frontend/src/pages/admin/trustee/ReportsView.jsx`
  - Tabs: Cash Book | Voucher Register | Outstanding Advances | Monthly Summary | Annual Export
- Update `TrusteeLayout.jsx` navigation

**APIs (new)**:
```
GET /api/finance/reports/cash-book            — Date-range cash book
GET /api/finance/reports/voucher-register     — Date-range vouchers
GET /api/finance/reports/outstanding-advances — Open advances
GET /api/finance/reports/monthly-summary      — Month-wise income/expense
GET /api/finance/reports/annual-export        — Full year CSV
```

**Testing Checklist**:
- [ ] Cash book shows correct entries (donations in, vouchers out)
- [ ] Voucher register shows all vouchers in date order
- [ ] Outstanding advances shows only OPEN status
- [ ] Monthly summary figures match manual calculation
- [ ] Annual export CSV is complete and correct
- [ ] Dashboard cards show correct live figures
- [ ] Reports load with reasonable speed (< 3 seconds) for typical data volume

---

### PHASE 6 — Audit Log Viewer
**Goal**: Trustee can see the complete audit trail of all financial operations.

**Scope**:
- Create `backend/src/controllers/auditLog.controller.js`
  - `getAuditLogs()` — paginated, with filters: entity, action, date range, user
- Mount in `finance.routes.js`
- Create `frontend/src/pages/admin/trustee/AuditLogView.jsx`
  - Table: Date | Who | Role | Action | Entity | Reference | Amount | Details

**APIs (new)**:
```
GET /api/finance/audit-logs   — Paginated with filters
```

**Testing Checklist**:
- [ ] All financial actions appear in audit log
- [ ] Filter by date range works
- [ ] Filter by action type works
- [ ] Audit log is read-only (no delete/edit in UI or API)
- [ ] Pagination works correctly

---

### PHASE 7 — Role Management UI (System Admin)
**Goal**: SYSTEM_ADMIN can assign/change user roles from the admin panel. Currently requires DB access.

**Scope**:
- Create `backend/src/controllers/userManagement.controller.js`
  - `getAllUsers()` — list all users with roles (SYSTEM_ADMIN only)
  - `changeUserRole()` — change role, record in audit log
- Mount in `admin.system.routes.js`
- Create `frontend/src/pages/admin/UserManagementView.jsx` within System Admin layout
- Update `SystemAdminLayout.jsx` — add "Users" link to navigation
- Warning banner: "Role change requires user to log out and log back in"

**Safety Rules**:
- Cannot demote own account
- Cannot set role to SYSTEM_ADMIN via UI (must be done via DB — extra safety)
- Role change recorded in `AuditLog`
- Rate limited: max 10 role changes per hour per admin

**APIs (new)**:
```
GET   /api/admin/system/users              — List users with roles
PATCH /api/admin/system/users/:id/role     — Change role
```

**Testing Checklist**:
- [ ] SYSTEM_ADMIN can view all users
- [ ] SYSTEM_ADMIN can assign TRUSTEE role to a user
- [ ] SYSTEM_ADMIN cannot change their own role
- [ ] Role change shows in AuditLog
- [ ] TRUSTEE cannot access this endpoint (403)
- [ ] After role change, old JWT still works until expiry (expected behavior)

---

### PHASE 8 — Receipt PDF Improvements
**Goal**: Improve the existing donation receipt PDF to include payment-method-specific details. Currently UPI UTR and cheque numbers are stored but not printed.

**Scope**:
- Update `backend/src/services/receipt.service.js`:
  - Add payment reference row to receipt table: shows UTR/cheque no based on payment method
  - Add RTGS/NEFT reference support
  - No change to function signature — additive improvements inside `generateDonationReceipt()`
- Test all receipt types: CASH, UPI, CHEQUE, RTGS, NEFT, ONLINE

**Testing Checklist**:
- [ ] Cash receipt: no reference field shown (correct)
- [ ] UPI receipt: shows UTR number
- [ ] Cheque receipt: shows cheque number + bank name + cheque date
- [ ] RTGS receipt: shows RTGS reference number + bank
- [ ] Online receipt: shows Razorpay payment ID
- [ ] Old receipt PDFs already on disk: unchanged (they're already generated)
- [ ] New receipts for existing payment types: render correctly

---

### PHASE 9 — Payment Method Extension (RTGS + NEFT)
**Goal**: Add RTGS and NEFT as supported payment methods in the offline donation form.

**Scope**:
- Update `Donation.js` model — add RTGS, NEFT to payment.method enum
- Update `CashDonation.jsx` + `OfflineDonationForm.jsx` — add RTGS/NEFT options with UTR/reference fields
- Update receipt service — handle RTGS/NEFT display

**Testing Checklist**:
- [ ] RTGS donation can be entered and saved
- [ ] NEFT donation can be entered and saved
- [ ] Receipt generated with correct prefix and RTGS/NEFT details
- [ ] Existing CASH/UPI/CHEQUE/ONLINE unaffected

---

### PHASE 10 — Production Hardening + Annual Export
**Goal**: Production-ready hardening for all financial features.

**Scope**:
- Add missing indexes to all new collections
- Add rate limiting audit: verify all financial endpoints are rate-limited
- Add `RTGS`, `NEFT` references to the voucher PDF
- Test annual export for performance at scale (simulate 1,000+ transactions)
- Add server-side pagination to all financial list endpoints
- Optimize MongoDB aggregation for reports
- Document all new APIs in `API.md`
- Document database schema in `DATABASE.md`

---

## PART D — SUPPORTING DOCUMENTATION PLAN

The following documents will be created/updated throughout implementation:

| Document | Location | Purpose |
|---|---|---|
| `IMPLEMENTATION_AUDIT.md` | `/` (root) | Phase-by-phase development log |
| `CHANGELOG.md` | `/` (root) | Feature-level change tracking |
| `API.md` | `/docs/` | All new API endpoints with request/response |
| `DATABASE.md` | `/docs/` | Collection schemas, indexes, relationships |
| `ROLE_MATRIX.md` | `/docs/` | Complete permission matrix |
| `WORKFLOW.md` | `/docs/` | Cash advance workflow diagrams |
| `TEST_PLAN.md` | `/docs/` | All test cases per phase |
| `DEPLOYMENT_PLAN.md` | `/docs/` | Deployment sequence per phase |

---

## PART E — RISK ASSESSMENT

| Risk | Probability | Severity | Mitigation |
|---|---|---|---|
| Receipt number collision under concurrency | Low | HIGH | Atomic `$inc` on counters collection |
| Settlement partial write (advance updated, voucher not created) | Low | CRITICAL | MongoDB transactions in `settleAdvance()` |
| TRUSTEE accidentally seeing SYSTEM_ADMIN data | Low | HIGH | Separate `/api/finance/` namespace |
| Breaking existing Razorpay flow in Phase 2 | Medium | CRITICAL | Extensive testing; Phase 2 is internal logic only |
| Receipt number prefix breaking old PDF downloads | Low | HIGH | Old PDFs already on disk; old receipt numbers unchanged |
| DummyData.js removal causing CashDonationForm crash | Low | Medium | API fallback + loading state in Phase 4 |
| MongoDB Atlas not supporting transactions (requires replica set) | Low | CRITICAL | Verify Atlas tier supports transactions before Phase 3 |
| Voucher PDF directory permissions | Low | Low | Create `backend/vouchers/` at startup like `backend/receipts/` |
| Large annual export timing out | Medium | Medium | Background job or streaming CSV in Phase 5 |

---

## PART F — MIGRATION STRATEGY

### Phases 1-2: No data migration required
All changes are additive. Existing data is not touched.

### Phase 2 — Counter initialization
Before deploying Phase 2, seed the counters collection:
```javascript
// Run once before deploying Phase 2:
db.counters.insertMany([
  { _id: "CA", seq: 0 },
  { _id: "CH", seq: 0 },
  { _id: "UPI", seq: 0 },
  { _id: "OL", seq: 0 },
  { _id: "ADV", seq: 0 },
  { _id: "VCH", seq: 0 },
]);
```

### Phases 3-10: No migration required
All new collections. Existing data untouched.

---

## PART G — DEPLOYMENT STRATEGY

### Per-phase deployment order:
1. Deploy backend changes first
2. Run counter seed script (Phase 2 only)
3. Deploy frontend changes
4. Smoke-test critical paths:
   - Online donation → receipt download
   - Cash donation entry → receipt download
   - Collector login
5. Monitor error logs for 24 hours

### Feature flag approach:
New Trustee Portal is hidden behind role-based access. If TRUSTEE role is not assigned to any user, the entire new module is invisible in production. This is the safest possible feature flag.

### Rollback per phase:
| Phase | Rollback |
|---|---|
| 1 | Remove TRUSTEE from User.js enum; revert frontend files |
| 2 | Revert receipt.service.js + donation.controller.js; reset counters to 0 |
| 3 | Drop cashadvances + vouchers collections; remove finance routes from app.js |
| 4 | Revert admin.system.routes.js authorize() change |
| 5 | Remove finance report routes; drop nothing |
| 6 | Remove audit log routes; drop nothing |
| 7 | Remove user management routes |
| 8 | Revert receipt.service.js improvements |
| 9 | Revert Donation model enum + form changes |
| 10 | No data changes; revert index additions |

---

## PART H — TESTING STRATEGY

### 1. After every phase (non-negotiable):
```
cd frontend && npm run lint      → 0 errors
cd frontend && npm run build     → success
cd backend && node server.js     → starts cleanly, no crash
```

### 2. Regression checklist (after every phase):
- [ ] Public home page loads
- [ ] Online donation: select cause → form → Razorpay → receipt
- [ ] Cash donation entry by SYSTEM_ADMIN → receipt download
- [ ] Collector login → dashboard visible
- [ ] Gallery loads on public site
- [ ] Admin website CMS: gallery add/remove works
- [ ] Nitya Annadan booking works
- [ ] Receipts for old donations still downloadable by URL

### 3. Financial workflow tests (Phase 3+):
- [ ] **Scenario A**: ₹5,000 advance → ₹3,000 spent → ₹2,000 returned → voucher VCH-000001 generated → advance SETTLED
- [ ] **Scenario B**: ₹10,000 direct payment by cheque → voucher VCH-000002 generated immediately
- [ ] **Scenario C**: Try to settle already-settled advance → 400 error
- [ ] **Scenario D**: Try returned amount > advance amount → validation error
- [ ] **Scenario E**: Server crash mid-settlement → advance stays OPEN (transaction rolled back)
- [ ] **Scenario F**: TRUSTEE enters offline donation → CA-000001 receipt → printable

### 4. Security tests:
- [ ] TRUSTEE cannot access `/api/admin/system/` endpoints (expect 403)
- [ ] USER cannot access `/api/finance/` endpoints (expect 403)
- [ ] Voucher PDF URL returns 401 without auth token
- [ ] Rate limiting: 61st request in 1 minute gets 429

---

## PART I — FINAL ANSWERS TO OPEN QUESTIONS (v1.0)

| Question | Answer |
|---|---|
| Q1: Expense file attachments? | **No for now.** Notes field is sufficient. Can be added in Phase 10+ if needed. |
| Q2: Voucher PDF public or auth-required? | **Auth-required.** Financial documents are internal. |
| Q3: TRUSTEE read-only on donations? | **No. TRUSTEE can enter offline donations AND generate receipts.** (Phase 4) |
| Q4: Approval workflow? | **No blocking gate.** TRUSTEE creates, records are permanent. SYSTEM_ADMIN can review via reports and audit log. |
| Q5: Partial disbursements on cash advance? | **Yes, but handled via settlement.** Record actual amount spent. Returned amount records the difference. No pre-partial-disbursement concept needed. |

---

## PART J — PREREQUISITES BEFORE PHASE 3

> [!CAUTION]
> Before implementing Phase 3 (which uses MongoDB transactions), verify that the MongoDB Atlas cluster (or self-hosted replica set) supports transactions. Transactions require a **replica set** — they do NOT work on a standalone MongoDB instance.
>
> To verify: `db.adminCommand({ replSetGetStatus: 1 })` — if this returns an error, transactions will not work.
>
> MongoDB Atlas **M10 and above** support replica sets. The **free M0 tier** supports replica sets too as of recent Atlas versions. Verify before building.

---

*Plan version: 2.0 | Date: 2026-07-26 | Reviewed against client verbal workflow | Status: Awaiting Approval*
