# ERP Role & Route Permission Matrix

**Authoritative source:** route declarations and route guards in the current application. This is a point-in-time authorization inventory completed after Phase 7 and before Phase 8.

Role abbreviations: `U` USER, `CP` COLLECTOR_PENDING, `CA` COLLECTOR_APPROVED, `WA` WEBSITE_ADMIN, `NA` NITYA_ANNADAN_ADMIN, `T` TRUSTEE, `SA` SYSTEM_ADMIN. “All” includes anonymous callers; a public route accepts every role and anonymous callers. “All authenticated” excludes anonymous callers. A denied-role cell lists every application role not in the allowed-role cell; anonymous is also denied whenever `auth` is present.

Audit logging means a request creates an `AuditLog` event by the implemented controller. Read-only access is not logged unless stated. Rate limiting names are shown in middleware.

## API routes

### Authentication, public, donation, and user APIs

| Route | Method | Middleware | Allowed roles | Denied roles | Rate limited | Audit logged |
|---|---|---|---|---|---|---|
| `/api/auth/verify-firebase-token` | POST | — | All | — | No | No |
| `/api/auth/me` | GET | auth | All authenticated | — | No | No |
| `/api/auth/request-email-verification` | POST | auth, emailVerificationLimiter | All authenticated | — | Yes | No |
| `/api/auth/verify-email` | GET | — | All | — | No | No |
| `/api/auth/email-status` | GET | auth | All authenticated | — | No | No |
| `/api/donations/create` | POST | donationCreateLimiter, optionalAuth | All | — | Yes | No |
| `/api/donations/create-order` | POST | donationCreateLimiter, optionalAuth | All | — | Yes | No |
| `/api/donations/leaderboard` | GET | — | All | — | No | No |
| `/api/donations/my-collector-stats` | GET | auth | All authenticated | — | No | No |
| `/api/donations/me/last-profile` | GET | auth | All authenticated | — | No | No |
| `/api/donations/:id/status` | GET | validateObjectId | All | — | No | No |
| `/api/donations/:id/receipt` | GET | validateObjectId | All | — | No |
| `/api/public/donations/recent` | GET | — | All | — | No | No |
| `/api/public/donations/top` | GET | — | All | — | No | No |
| `/api/public/referral/:code` | GET | publicApiLimiter | All | — | Yes | No |
| `/api/public/site-config/live-link` | GET | — | All | — | No | No |
| `/api/public/announcements` | GET | lang | All | — | No | No |
| `/api/public/banners` | GET | lang | All | — | No | No |
| `/api/public/activities`, `/categories`, `/:id` | GET | lang | All | — | No | No |
| `/api/public/events`, `/upcoming`, `/featured`, `/:id` | GET | lang | All | — | No | No |
| `/api/public/testimonials` | GET | — | All | — | No | No |
| `/api/public/testimonials` | POST | optionalAuth | All | — | No | No |
| `/api/public/donation-heads`, `/featured`, `/:key`, `/:key/stats` | GET | lang | All | — | No | No |
| `/api/public/gallery`, `/categories`, `/all-images`, `/:slug` | GET | lang | All | — | No | No |
| `/api/public/products`, `/featured`, `/categories`, `/:slug` | GET | — | All | — | No | No |
| `/api/contact` | POST | contactLimiter | All | — | Yes | No |
| `/api/referral/validate/:code` | GET | publicApiLimiter | All | — | Yes | No |
| `/api/leaderboard/top` | GET | — | All | — | No | No |
| `/api/webhooks/razorpay` | POST | raw body/signature validation in controller | Razorpay only | All application roles | No | Yes (on captured payment) |
| `/api/user/donations` | GET | auth | All authenticated | — | No | No |
| `/api/user/profile` | GET, PUT | auth | All authenticated | — | No | No |
| `/api/user/generate-referral-code` | POST | auth | All authenticated | — | No | No |
| `/api/test/protected` | GET | auth | All authenticated | — | No | No |

### Collector and Nitya Annadan APIs

| Route | Method | Middleware | Allowed roles | Denied roles | Rate limited | Audit logged |
|---|---|---|---|---|---|---|
| `/api/collector/apply` | POST | collectorApplyLimiter, auth, KYC upload | All authenticated | — | Yes | No |
| `/api/collector/status`, `/dashboard` | GET | auth | All authenticated | — | No | No |
| `/api/collector/reapply` | POST | auth, KYC upload | All authenticated | — | No | No |
| `/api/nitya-annadan/pricing`, `/availability` | GET | — | All | — | No | No |
| `/api/nitya-annadan` | POST | optionalAuth | All | — | No | No |
| `/api/nitya-annadan/create-order`, `/verify-payment` | POST | auth | All authenticated | — | No | No |
| `/api/nitya-annadan/upcoming`, `/history` | GET | auth | All authenticated | — | No | No |
| `/api/admin/nitya-annadan/overview`, `/bookings`, `/bookings/:id`, `/calendar`, `/daily-sheet`, `/reports`, `/export` | GET | auth, authorize(SA, NA) | NA, SA | U, CP, CA, WA, T | No | No |
| `/api/admin/nitya-annadan/bookings/offline`, `/blocked-dates` | POST | auth, authorize(SA, NA) | NA, SA | U, CP, CA, WA, T | No | No |
| `/api/admin/nitya-annadan/bookings/:id/status`, `/bookings/:id/reschedule` | PATCH | auth, authorize(SA, NA) | NA, SA | U, CP, CA, WA, T | No | No |
| `/api/admin/nitya-annadan/blocked-dates/:date` | DELETE | auth, authorize(SA, NA) | NA, SA | U, CP, CA, WA, T | No | No |

### Website-admin APIs

All rows in this section use `auth, authorize(WA, SA)`; `:id` routes additionally use `validateObjectId`, and upload routes additionally use the listed upload middleware. Allowed: WA, SA. Denied: U, CP, CA, NA, T. None is rate limited or audit logged.

| Route | Method | Middleware extras |
|---|---|---|
| `/api/admin/website/announcements` | GET, POST | — |
| `/api/admin/website/announcements/:id` | GET, PUT, DELETE | validateObjectId |
| `/api/admin/website/announcements/:id/toggle` | PATCH | validateObjectId |
| `/api/admin/website/banners` | GET, POST | POST: uploadSingleImage, handleUploadError |
| `/api/admin/website/banners/:id` | GET, PUT, DELETE | validateObjectId; PUT: uploadSingleImage, handleUploadError |
| `/api/admin/website/banners/:id/toggle` | PATCH | validateObjectId |
| `/api/admin/website/banners/reorder` | PUT | — |
| `/api/admin/website/activities` | GET, POST | — |
| `/api/admin/website/activities/:id` | GET, PUT, DELETE | validateObjectId |
| `/api/admin/website/activities/:id/toggle` | PATCH | validateObjectId |
| `/api/admin/website/activities/reorder`, `/events/update-status` | PUT, POST | — |
| `/api/admin/website/activities/upload`, `/events/upload` | POST | uploadSingleImage, handleUploadError |
| `/api/admin/website/activities/:id/subitems` | POST | validateObjectId |
| `/api/admin/website/activities/:id/subitems/:subitemId` | PUT, DELETE | validateObjectId |
| `/api/admin/website/events` | GET, POST | — |
| `/api/admin/website/events/:id` | GET, PUT, DELETE | validateObjectId |
| `/api/admin/website/events/:id/publish`, `/:id/feature` | PATCH | validateObjectId |
| `/api/admin/website/testimonials` | GET, POST | — |
| `/api/admin/website/testimonials/pending` | GET | — |
| `/api/admin/website/testimonials/:id` | GET, PUT, DELETE | validateObjectId |
| `/api/admin/website/testimonials/:id/toggle`, `/:id/approve`, `/:id/reject`, `/:id/feature` | PATCH | validateObjectId |
| `/api/admin/website/testimonials/reorder` | PUT | — |
| `/api/admin/website/donation-heads/upload` | POST | uploadSingleImage, handleUploadError |
| `/api/admin/website/donation-heads` | GET, POST | — |
| `/api/admin/website/donation-heads/:id` | GET, PUT, DELETE | validateObjectId |
| `/api/admin/website/donation-heads/:id/toggle` | PATCH | validateObjectId |
| `/api/admin/website/donation-heads/reorder` | PUT | — |
| `/api/admin/website/donation-heads/:id/sub-causes` | POST | validateObjectId |
| `/api/admin/website/donation-heads/:id/sub-causes/:subCauseId` | DELETE | validateObjectId |
| `/api/admin/website/gallery` | GET, POST | — |
| `/api/admin/website/gallery/:id` | GET, PUT, DELETE | validateObjectId |
| `/api/admin/website/gallery/:id/toggle` | PATCH | validateObjectId |
| `/api/admin/website/gallery/reorder` | PUT | — |
| `/api/admin/website/gallery/upload`, `/gallery/upload/multiple` | POST | image upload, handleUploadError |
| `/api/admin/website/gallery/:id/upload` | POST | validateObjectId, uploadMultipleImages, handleUploadError |
| `/api/admin/website/gallery/:id/images` | POST | validateObjectId |
| `/api/admin/website/gallery/:id/images/:imageId` | PUT, DELETE | validateObjectId |
| `/api/admin/website/gallery/:id/images/:imageId/file` | DELETE | validateObjectId |
| `/api/admin/website/gallery/:id/images/reorder` | PUT | validateObjectId |
| `/api/admin/website/products` | GET, POST | — |
| `/api/admin/website/products/categories` | GET, POST | — |
| `/api/admin/website/products/:id` | GET, PUT, DELETE | validateObjectId |
| `/api/admin/website/products/:id/toggle`, `/:id/stock` | PATCH | validateObjectId |
| `/api/admin/website/products/categories/:id` | PUT, DELETE | validateObjectId |
| `/api/admin/website/site-config` | GET | — |
| `/api/admin/website/site-config/live-link` | PUT | — |

### System-admin and Finance APIs

| Route | Method | Middleware | Allowed roles | Denied roles | Rate limited | Audit logged |
|---|---|---|---|---|---|---|
| `/api/admin/system/donations` | GET | auth, authorize(SA, T) | T, SA | U, CP, CA, WA, NA | No | No |
| `/api/admin/system/donations/cash`, `/donations/offline` | POST | auth, authorize(SA, T) | T, SA | U, CP, CA, WA, NA | No | Yes |
| `/api/admin/system/donors`, `/reports`, `/collectors/summary`, `/collectors`, `/collectors/:id`, `/collector-applications`, `/collector/:userId/kyc/:type` | GET | auth, authorize(SA) | SA | U, CP, CA, WA, NA, T | No | No |
| `/api/admin/system/collectors/:id/toggle-status` | PATCH | auth, authorize(SA) | SA | U, CP, CA, WA, NA, T | No | No |
| `/api/admin/system/collector/:userId/approve`, `/reject`, `/revoke` | POST | auth, authorize(SA) | SA | U, CP, CA, WA, NA, T | No | No |
| `/api/admin/system/users` | GET | auth, authorize(SA) | SA | U, CP, CA, WA, NA, T | No | No |
| `/api/admin/system/users/:id/role` | PATCH | auth, authorize(SA), roleChangeLimiter | SA | U, CP, CA, WA, NA, T | Yes | Yes (`ROLE_CHANGED`) |
| `/api/finance/advances` | GET, POST | auth, authorize(T, SA), financialApiLimiter | T, SA | U, CP, CA, WA, NA | Yes | POST: Yes |
| `/api/finance/advances/direct` | POST | auth, authorize(T, SA), financialApiLimiter | T, SA | U, CP, CA, WA, NA | Yes | Yes |
| `/api/finance/advances/:id` | GET | auth, authorize(T, SA), financialApiLimiter | T, SA | U, CP, CA, WA, NA | Yes | No |
| `/api/finance/advances/:id/settle` | POST | auth, authorize(T, SA), financialApiLimiter | T, SA | U, CP, CA, WA, NA | Yes | Yes |
| `/api/finance/advances/:id/cancel` | PATCH | auth, authorize(T, SA), financialApiLimiter | T, SA | U, CP, CA, WA, NA | Yes | Yes |
| `/api/finance/vouchers`, `/vouchers/:id`, `/vouchers/:id/pdf` | GET | auth, authorize(T, SA), financialApiLimiter | T, SA | U, CP, CA, WA, NA | Yes | No |
| `/api/finance/reports/cash-book`, `/voucher-register`, `/outstanding-advances`, `/monthly-summary`, `/annual-export`, `/dashboard-stats` | GET | auth, authorize(T, SA), financialApiLimiter | T, SA | U, CP, CA, WA, NA | Yes | No |
| `/api/finance/audit-logs`, `/audit-logs/filters` | GET | auth, authorize(T, SA), financialApiLimiter | T, SA | U, CP, CA, WA, NA | Yes | No |

## Frontend routes

Frontend guards are navigation controls; API authorization remains authoritative. Public routes have no guard. `ProtectedRoute` allows all authenticated roles, `CollectorRoute` enforces approved collector access, `AdminRoute` supplies admin boundary/path isolation, and `TrusteeRoute` allows T/SA only.

| Route | Middleware/guard | Allowed roles | Denied roles | Rate limited | Audit logged |
|---|---|---|---|---|---|
| `/`, `/about`, `/gurudev`, `/activities`, `/activities/:id`, `/events`, `/gallery`, `/testimonials`, `/contact`, `/login`, `/verify-email`, `/donate`, `/leaderboard`, `/shop/*`, `/cart`, `/checkout`, `/order-confirmation/:orderId`, `/track-order/:orderId`, `/track-order` | None | All | — | No | No |
| `/my-donations`, `/collector/apply`, `/collector/reapply` | ProtectedRoute | All authenticated | Anonymous | No | No |
| `/collector` | CollectorRoute | CA, SA | U, CP, WA, NA, T, anonymous | No | No |
| `/admin` | AdminRoute | WA, NA, T, SA | U, CP, CA, anonymous | No | No |
| `/admin/website`, `/gallery`, `/events`, `/activities`, `/announcement`, `/banners`, `/testimonials`, `/donation-heads`, `/live-link` | AdminRoute path isolation | WA, SA | U, CP, CA, NA, T, anonymous | No | No |
| `/admin/system`, `/overview`, `/donations`, `/donors`, `/collectors`, `/collectors/:id`, `/collector-applications`, `/users`, `/reports`, `/exports`, `/cash-donation` | AdminRoute requiredRole=SA | SA | U, CP, CA, WA, NA, T, anonymous | No | No |
| `/admin/nitya-annadan`, `/overview`, `/calendar`, `/bookings`, `/add-offline`, `/reports`, `/print-sheet` | AdminRoute path isolation | NA, SA | U, CP, CA, WA, T, anonymous | No | No |
| `/admin/trustee`, `/overview`, `/advances`, `/advances/new`, `/advances/:id/settle`, `/vouchers`, `/vouchers/:id`, `/donations`, `/donations/new`, `/reports`, `/audit-logs` | TrusteeRoute | T, SA | U, CP, CA, WA, NA, anonymous | No | No |

## Permission-audit cross-check

`backend/tests/permission_audit.test.js` was reconciled with the Finance, trustee-donation, and Phase 7 system-user-management rows above. The historical discrepancy was that Phase 7's `GET /api/admin/system/users`, `PATCH /api/admin/system/users/:id/role`, and `/admin/system/users` were absent from that suite. The test now covers them with their correct `SYSTEM_ADMIN`-only authorization, including denial of all other audited personas.

The suite intentionally remains a focused ERP authorization regression suite; it is not a test inventory for every public, CMS, collector, or Nitya Annadan endpoint. Those routes are catalogued here from their source declarations. There are no remaining authorization mismatches within the suite's covered routes.
