# WORKFLOW.md — Shri Gurudev Ashram ERP Core Financial Workflows

This document illustrates the core accounting and administrative workflows designed for the Shri Gurudev Ashram ERP extension, highlighting how the Phase 1 infrastructure supports upcoming operational modules.

---

## 1. Cash Advance & Settlement Workflow (Type A vs Type B)

The primary financial workflow in the Ashram revolves around issuing operational funds and reconciling expenditures. To maintain strict accounting correctness and prevent manual bookkeeping errors, all expenses MUST be tied to an underlying `CashAdvance` document, and expense vouchers are generated automatically upon settlement.

### 1.1 Type A: Standard Cash Advance (Multi-Day Event / Bulk Seva)
Used when a Trustee or staff member takes cash in advance for an upcoming ashram event (e.g., Mahashivratri festival, kitchen grocery stock).

```mermaid
sequenceDiagram
    autonumber
    actor T as Trustee / Admin
    participant ADV as CashAdvance (mainDb)
    participant VCH as Voucher (mainDb)
    participant CS as CounterService
    participant AUD as AuditLog (mainDb)

    Note over T,AUD: Step 1: Advance Issuance (Status: OPEN)
    T->>ADV: Create Type A Advance (Amount, Recipient, Purpose)
    ADV->>CS: getNextNumber("ADV")
    CS-->>ADV: Returns "ADV-000001"
    ADV-->>T: Advance created (Status: OPEN)
    ADV->>AUD: Record ADVANCE_CREATED (Append-Only)

    Note over T,AUD: Step 2: Physical Spending (Days Later)
    T->>T: Purchases groceries, pays decorators, collects bills

    Note over T,AUD: Step 3: Settlement & Auto-Voucher (Status: SETTLED)
    T->>ADV: Submit Settlement (Line items, bills, unspent cash return)
    activate ADV
    ADV->>VCH: Auto-Generate Expense Voucher (Total Spent Amount)
    VCH->>CS: getNextNumber("VCH")
    CS-->>VCH: Returns "VCH-000001"
    VCH-->>ADV: Voucher created and linked
    ADV->>ADV: Update Status to SETTLED
    ADV->>AUD: Record ADVANCE_SETTLED (Total Spent, Returned Cash)
    deactivate ADV
    ADV-->>T: Settlement complete. Print Voucher VCH-000001.
```

---

### 1.2 Type B: Direct Vendor Payment (Immediate Expense)
Used for immediate spot expenses where no prior cash advance was issued (e.g., emergency plumbing repair, direct electricity bill payment).

```mermaid
sequenceDiagram
    autonumber
    actor T as Trustee / Admin
    participant ADV as CashAdvance (mainDb)
    participant VCH as Voucher (mainDb)
    participant CS as CounterService
    participant AUD as AuditLog (mainDb)

    Note over T,AUD: Single Atomic Transaction (Status: DIRECT_PAID)
    T->>ADV: Submit Direct Expense (Vendor bill, payment mode)
    activate ADV
    ADV->>CS: getNextNumber("ADV")
    CS-->>ADV: Returns "ADV-000002"
    ADV->>VCH: Auto-Generate Expense Voucher (Exact Bill Amount)
    VCH->>CS: getNextNumber("VCH")
    CS-->>VCH: Returns "VCH-000002"
    ADV->>ADV: Save Advance as DIRECT_PAID (advanceAmount == expenseAmount)
    ADV->>AUD: Record ADVANCE_DIRECT_PAID (with linked Voucher ID)
    deactivate ADV
    ADV-->>T: Direct payment recorded. Print Voucher VCH-000002.
```

---

## 2. Document Sequence Number Generation Workflow

All financial reference numbers (`ADV-`, `VCH-`, `CA-`, `CH-`, `UPI-`, `OL-`) are governed by the `Counter` service established in Phase 1 (`backend/src/services/counter.service.js`).

```mermaid
flowchart TD
    A[Service Requests New Number] --> B{Valid Prefix?}
    B -- No --> C[Throw Error: Invalid Prefix]
    B -- Yes --> D[MongoDB findOneAndUpdate with $inc: 1]
    D --> E{Counter Document Exists?}
    E -- No (Upsert: true) --> F[Create { _id: prefix, seq: 1 }]
    E -- Yes --> G[Atomically Increment seq by 1]
    F --> H[Format Number: PREFIX-PADDED_SEQ]
    G --> H
    H --> I[Return Formatted String e.g. ADV-000001]
```

---

## 3. Persistent Audit Logging Workflow

Every financial state transition or security event triggers an immutable append-only record in the `AuditLog` collection established in Phase 1.

```mermaid
flowchart LR
    A[Action: Create / Settle / Role Change] --> B[Controller / Service Layer]
    B --> C[Execute Core DB Operation]
    C --> D[Construct AuditLog Document]
    D --> E[Insert into auditlogs collection on mainDb]
    E --> F[Audit Log Stored Immutable & Timestamped]
```
