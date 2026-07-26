# Nitya Annadan System Audit — Website Admin Portal Integration

An exhaustive analysis of how the Shri Gurudev Ashram mobile application manages **Nitya Annadan Seva** bookings, data flow, MongoDB schemas, Razorpay payments, calendar availability, and administrative capabilities.

---

## 1. Complete Booking Lifecycle

```
 Devotee (App)                  Donation Backend (Express)             MongoDB & Razorpay
       │                                     │                                  │
  1. Opens Annadan screen ───────────────────► GET /api/annadan/pricing ───────────► Returns price (₹2,100)
       │                                     │                                  │
  2. Views Month Availability ───────────────► GET /api/annadan/availability?month=YYYY-MM
       │                                     │ ────────────────────────────────► Queries booked counts by date
       │                                     │ ◄─────────────────────────────── Returns daily availability map
  3. Selects Date & Checks Avail ────────────► GET /api/annadan/availability?date=YYYY-MM-DD
       │                                     │ ────────────────────────────────► Count documents for date
       │                                     │ ◄─────────────────────────────── Returns remaining capacity
  4. Fills Devotee Name & Phone              │                                  │
       │                                     │                                  │
  5. Taps "Confirm & Pay" ───────────────────► POST /api/annadan (requireAuth) ────► Inserts NityaAnnadanBooking
       │                                     │                                  │ (status: 'payment_pending',
       │                                     │ ◄───────────────────────────────   ref: 'ANN-XXXXXX')
  6. Opens Payment Screen ───────────────────► POST /api/annadan/create-order ────► Creates Razorpay Order
       │                                     │ ◄─────────────────────────────── Returns order ID & paise amount
  7. Completes Razorpay Checkout             │                                  │
       │                                     │                                  │
  8. Submits Payment Verification ───────────► POST /api/annadan/verify-payment ──► Validates HMAC SHA256 signature
       │                                     │ ────────────────────────────────► Updates status = 'paid',
       │                                     │                                  │ saves razorpayPaymentId
       │ ◄─────────────────────────────────── Returns success                   │
  9. Webhook Listener (Fallback) ────────────► POST /api/payments/webhook ─────────► Idempotent status update to 'paid'
       │                                     │                                  │
 10. Displays Receipt & Stores ──────────────► App displays SevaReceipt card     │
       │                                     │                                  │
 11. Views History ("My Activity") ──────────► GET /api/annadan/history ──────────► NityaAnnadanBooking.find({userId})
```

---

## 2. MongoDB Schema: `NityaAnnadanBooking`

- **Database Connection**: `mainDb`
- **Collection Name**: `nityaannadanbookings`
- **Model File**: `backend/src/models/nityaAnnadan.ts`

### Complete Field Inventory

| Field Name | BSON Type | Required | Default | Indexes & Constraints | Description / Purpose |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Auto | Generated | Primary Key | MongoDB unique document identifier. |
| `bookingReference` | `String` | **Yes** | Generated | `unique: true`, `index: true` | Public reference number (e.g. `ANN-A1B2C3`). Generated via `generateBookingReference()`. |
| `userId` | `String` | No | `null` | `index: true` | Supabase User UUID of the authenticated devotee. |
| `sevaType` | `String` | No | `'annadan'` | None | Categorizes seva type (`'annadan'`). |
| `sevaDate` | `String` | **Yes** | None | `index: true` | Calendar date sponsored in strict ISO format (`YYYY-MM-DD`). |
| `fullName` | `String` | **Yes** | None | None | Full name of patron/devotee in whose name seva is performed. |
| `phoneNumber` | `String` | **Yes** | None | None | Contact 10-digit mobile number of the devotee. |
| `totalAmount` | `Number` | **Yes** | None | None | Total sponsorship amount in INR (e.g., `2100`). |
| `status` | `String` | No | `'payment_pending'` | `index: true`, `enum: ['payment_pending', 'paid', 'cancelled']` | Lifecycle status of booking. |
| `notes` | `String` | No | `null` | None | Optional dedication message or family member names. |
| `razorpayOrderId` | `String` | No | `null` | None | Razorpay order ID (e.g. `order_N123456`). |
| `razorpayPaymentId` | `String` | No | `null` | None | Razorpay transaction payment ID (e.g. `pay_P789012`). |
| `razorpaySignature` | `String` | No | `null` | None | Razorpay HMAC SHA256 signature string. |
| `createdAt` | `Date` | Auto | `Date.now` | Compound Index | System timestamp when booking draft was created. |
| `updatedAt` | `Date` | Auto | `Date.now` | None | System timestamp when document was last modified. |

### Indexes
1. `{ bookingReference: 1 }` (Unique)
2. `{ userId: 1 }`
3. `{ sevaDate: 1 }`
4. `{ status: 1 }`
5. `{ userId: 1, createdAt: -1 }` (Optimizes user history queries)
6. `{ sevaDate: 1, status: 1 }` (Optimizes availability and capacity queries)

---

## 3. API Inventory

All Nitya Annadan endpoints are mounted under `/api/annadan` on the Donation Backend Express server.

### 1. `GET /api/annadan/pricing`
- **Auth**: None (Public)
- **Params**: None
- **Response**: `{ "success": true, "pricing": { "annadan": 2100 } }`
- **Logic**: Reads `process.env.ANNADAN_SEVA_PRICE` (defaults to `2100`).

### 2. `GET /api/annadan/availability`
- **Auth**: None (Public)
- **Query Params**: `?month=YYYY-MM` OR `?date=YYYY-MM-DD`
- **Response (Date)**: `{ "available": true, "remainingSeats": 95 }`
- **Response (Month)**:
  ```json
  {
    "success": true,
    "type": "annadan",
    "month": "2026-08",
    "availability": {
      "2026-08-01": { "booked": 2, "capacity": 100, "remaining": 98, "available": true }
    }
  }
  ```
- **Logic**: Reads `process.env.SEVA_CAPACITY_ANNADAN` (defaults to `100`). Counts documents with `status: { $in: ['paid', 'payment_pending'] }`.

### 3. `POST /api/annadan`
- **Auth**: `requireAuth` (JWT Header)
- **Request Body**:
  ```json
  {
    "sevaType": "annadan",
    "sevaDate": "2026-08-15",
    "fullName": "Anjali Deshmukh",
    "phoneNumber": "9876543210",
    "totalAmount": 2100,
    "notes": "In memory of Shri Deshmukh"
  }
  ```
- **Response**: `201 Created` with formatted booking document.
- **Validation**: Checks required fields, validates `totalAmount > 0`, assigns `ANN-XXXXXX` reference, sets `status = 'payment_pending'`.

### 4. `POST /api/annadan/create-order`
- **Auth**: `requireAuth` (JWT Header)
- **Request Body**: `{ "bookingId": "6680a1b2c3d4e5f678901234" }`
- **Response**: `{ "order": { "id": "order_M12345", "amount": 210000, "currency": "INR" }, "booking": { ... } }`
- **Logic**: Validates user ownership. Converts `totalAmount` to paise. Calls Razorpay API `razorpay.orders.create()`. Stores `razorpayOrderId`.

### 5. `POST /api/annadan/verify-payment`
- **Auth**: `requireAuth` (JWT Header)
- **Request Body**:
  ```json
  {
    "bookingId": "6680a1b2c3d4e5f678901234",
    "razorpay_order_id": "order_M12345",
    "razorpay_payment_id": "pay_N67890",
    "razorpay_signature": "a1b2c3d4..."
  }
  ```
- **Response**: `{ "success": true }`
- **Logic**: Validates HMAC SHA256 signature using `razorpayKeySecret`. Updates `status = 'paid'`, `razorpayPaymentId`, `razorpaySignature`.

### 6. `GET /api/annadan/upcoming`
- **Auth**: `requireAuth` (JWT Header)
- **Response**: Array of active upcoming bookings (`sevaDate >= today`, `status IN ['paid', 'payment_pending']`).

### 7. `GET /api/annadan/history`
- **Auth**: `requireAuth` (JWT Header)
- **Response**: Array of all user bookings sorted by `createdAt` descending.

---

## 4. Booking Status Flow

```
                      ┌───────────────────┐
                      │  createBooking    │
                      └─────────┬─────────┘
                                │
                                ▼
                       'payment_pending'
                                │
          ┌─────────────────────┴─────────────────────┐
          │ (Payment Verified / Webhook Captured)     │ (Cancelled / Expired)
          ▼                                           ▼
       'paid'                                    'cancelled'
```

- **`payment_pending`**: Default state assigned upon initial submission. Included in capacity calculations to hold spots during payment attempts.
- **`paid`**: Assigned when Razorpay signature is verified or `payment.captured` webhook fires.
- **`cancelled`**: Defined in Mongoose schema enum. Reserved for cancelled/failed bookings.

---

## 5. Current Admin Capabilities (What Website Admin Can Already Display)

Without making any database schema changes, the website admin backend can query `NityaAnnadanBooking` and render:

1. **Daily Patron List & Aarti Announcement Sheet**:
   - Filter by date (`sevaDate == selectedDate` AND `status == 'paid'`).
   - Displays patron full name, phone number, dedication notes, and booking reference for Ashram kitchen prep and morning Aarti announcements.
2. **Revenue & Financial Reports**:
   - Total funds raised from Annadan (`$sum: "$totalAmount"` where `status: "paid"`).
   - Date range revenue breakdown (Daily/Monthly/Yearly).
3. **Capacity & Booking Volume Analytics**:
   - Occupancy rates per date vs daily capacity (100).
   - Peak sponsorship days (festivals, holidays).
4. **Devotee Search & Lookup**:
   - Search by devotee name (`fullName`), mobile number (`phoneNumber`), or reference (`bookingReference`).
5. **Payment Audit Ledger**:
   - Cross-reference Razorpay Order ID (`razorpayOrderId`) and Payment ID (`razorpayPaymentId`).

---

## 6. Missing Admin Capabilities & Integration Requirements

| Admin Feature Needed | Supported by Existing Model? | Requires New Admin APIs? | Requires DB Schema Changes? | Description |
|---|---|---|---|---|
| **Admin Booking Search & Filter API** | Yes | **Yes** | No | `GET /api/admin/annadan/bookings?search=...&status=...&page=1` |
| **Manual Status Override** | Yes | **Yes** | No | `PATCH /api/admin/annadan/bookings/:id/status` (e.g. mark offline cash paid). |
| **Reschedule Sponsored Date** | Yes | **Yes** | No | `PATCH /api/admin/annadan/bookings/:id/reschedule` (update `sevaDate`). |
| **Block / Unblock Dates** | No | **Yes** | **Yes** | Needs a new model `AnnadanBlockedDate` or capacity override table. |
| **Razorpay Refund Trigger** | Partial | **Yes** | **Yes** | Add `refundId`, `refundAmount`, `refundedAt` fields to `NityaAnnadanBooking`. |
| **Export to Excel / CSV** | Yes | **Yes** | No | `GET /api/admin/annadan/export?month=YYYY-MM`. |
| **Daily Printable Announcement Sheet** | Yes | **Yes** | No | `GET /api/admin/annadan/print-sheet?date=YYYY-MM-DD`. |

---

## 7. Recommended Website Admin Panel Modules

Based strictly on existing app capabilities, the website admin portal should include:

1. **Annadan Dashboard Overview**:
   - Today's sponsored count, remaining capacity, total monthly revenue, pending payments count.
2. **Daily Mahaprasad Patron Manager**:
   - Interactive calendar showing sponsored dates, patron list for selected date, and 1-click "Print Daily Aarti Sheet".
3. **Bookings Master Table**:
   - Searchable table with filters for `status` (`paid`, `payment_pending`, `cancelled`), date pickers, and export to CSV.
4. **Devotee Verification & Transaction Detail View**:
   - Full audit card showing Razorpay payment IDs, timestamps, user ID link, and status timeline.
