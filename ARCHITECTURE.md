# Cyprus Tourist Pass — Architecture & Folder Structure

## Version: 2.0.0 (Proposed)

---

## Monorepo Folder Structure

```
Cyprus-Turist-Pass/
│
├── cyprus-tourist-pass-plugin/          # ★ WordPress Plugin (PRIMARY deliverable)
│   ├── cyprus-tourist-pass.php          # Main plugin file (header, bootstrap, hooks)
│   │
│   ├── includes/                       # PHP backend classes
│   │   ├── class-ctp-database.php      # DB schema creation, migrations, seeding
│   │   ├── class-ctp-auth.php          # JWT authentication (issue/verify tokens)
│   │   ├── class-ctp-rest-api.php      # All WP REST API endpoints
│   │   ├── class-ctp-shortcode.php     # [cyprus_tourist_pass] and other shortcodes
│   │   ├── class-ctp-admin.php         # WP Admin dashboard pages
│   │   ├── class-ctp-mock-rental.php   # Mock Car Rental API (Sixt/GeoDrive simulator)
│   │   ├── class-ctp-stripe.php        # Stripe Connect integration (split payments)
│   │   └── class-ctp-qr.php           # QR token generation & validation logic
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   ├── frontend.css            # Main SPA styles (customer/merchant/admin)
│   │   │   └── admin.css               # WP Admin panel styles
│   │   ├── js/
│   │   │   └── frontend.js             # Vanilla JS SPA (all interfaces)
│   │   └── images/                     # Plugin icons, logos, placeholder images
│   │       ├── logo.svg
│   │       └── marker-icon.png
│   │
│   ├── templates/                      # PHP template partials (if needed)
│   │   └── email-receipt.php           # Transaction receipt email template
│   │
│   └── languages/                      # i18n translation files
│       └── cyprus-tourist-pass.pot
│
├── prisma/                             # Database schema (reference/documentation)
│   ├── schema.prisma                   # Canonical data model definition
│   └── seed.ts                         # Seeding script (Node.js stack)
│
├── src/                                # React/TypeScript SPA (SECONDARY — future PWA)
│   ├── App.tsx                         # Main router
│   ├── AuthScreen.tsx                  # Login/register
│   ├── CustomerApp.tsx                 # Tourist interface
│   ├── MerchantApp.tsx                 # Merchant POS
│   ├── AdminApp.tsx                    # Admin dashboard
│   ├── main.tsx                        # React entry
│   ├── index.css                       # Tailwind styles
│   ├── hooks/
│   │   └── useAuth.tsx                 # Auth hook
│   └── server/                         # Express API (mirrors WP REST API)
│       ├── db.ts
│       ├── middleware/
│       │   └── auth.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── rental.ts
│       │   ├── payment.ts
│       │   ├── merchants.ts
│       │   └── admin.ts
│       └── services/
│           └── mockRentalApi.ts
│
├── docs/                               # Documentation (for team reference)
│   └── API.md                          # REST API endpoint documentation
│
├── server.ts                           # Express entry (Node.js stack)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── .gitignore
├── ARCHITECTURE.md                     # ← This file
├── CHANGELOG.md                        # Version history
└── README.md
```

---

## Database Schema Summary (v2.0.0)

### Tables (8 total)

| # | Table | Purpose |
|---|-------|---------|
| 1 | **User** | All users (Customer, Merchant, Admin). JWT auth, soft-disable. |
| 2 | **CustomerProfile** | Links customer to their active rental contract. |
| 3 | **MerchantProfile** | Business details, discount rate, approval status, Stripe Connect account. |
| 4 | **RentalAgency** | **NEW** — Registry of car rental companies (Sixt, GeoDrive, etc.) with API config. |
| 5 | **RentalContract** | Validated contracts with date range (access window). Now linked to RentalAgency. |
| 6 | **QrToken** | Dynamic discount QR codes (15-min expiry). Links to customer + merchant. |
| 7 | **Transaction** | Full payment split: original → discount → platform fee → merchant payout. Stripe IDs. |
| 8 | **PlatformSettings** | Global config (fees, rates, Stripe mode, etc.). Key-value store. |
| 9 | **AuditLog** | **NEW** — Tracks admin actions (approvals, fee changes, refunds) for accountability. |

### Key Schema Changes from v1.2.0 → v2.0.0

1. **RentalAgency table (NEW)**: Proper agency registry with API endpoint config. Supports both mock and real API integrations per agency.
2. **AuditLog table (NEW)**: Tracks all admin/system actions for accountability and debugging.
3. **User enhancements**: Added `phone`, `isActive` (soft-disable), `lastLoginAt`.
4. **MerchantProfile enhancements**: Added `websiteUrl`, `phoneNumber`, `postalCode`, `operatingHours` (JSON), `stripeOnboardingComplete` flag. Expanded `businessType` to include SHOP and BAR.
5. **QrToken enhancements**: Added `amount` (pre-fill), `usedAt` timestamp, relation to Transaction.
6. **Transaction enhancements**: Added `currency`, `stripeTransferId`, `paymentMethod`, `refundedAt`, `refundReason`. Better Stripe Connect tracking.
7. **RentalContract enhancements**: Now linked to RentalAgency via foreign key. Added `pickupLocation`, `returnLocation`.
8. **PlatformSettings**: Added `description` field for admin UI.

---

## Architecture Decisions

### Why WordPress Plugin First?
- The client's site runs on WordPress
- Shortcode-based embedding = zero migration friction
- WP REST API provides a solid foundation
- The vanilla JS SPA (frontend.js) works without build tools

### Why Keep the Node.js/React Stack?
- Future PWA / mobile app target
- Better developer experience for complex UI
- Prisma schema serves as canonical data model documentation
- Can share business logic between stacks

### Payment Architecture: Stripe Connect
- **Platform account**: Cyprus Tourist Pass (you)
- **Connected accounts**: Each approved merchant
- **Flow**: Customer pays → Stripe splits → Platform fee to you, remainder to merchant
- **Why not JCC?**: Stripe Connect has native split-payment support. JCC can be added later as a secondary processor.

### Mock Rental API Strategy
- Any contract number starting with `TEST` → auto-approved, 7-day validity
- Any contract starting with `SIXT` → simulates Sixt validation
- Any contract starting with `GEO` → simulates GeoDrive validation
- Invalid prefix → rejected
- This allows full app testing without real API access

---

## Implementation Phases

### Phase 1: Database & Architecture ← WE ARE HERE
- [x] Prisma schema design
- [x] Folder structure
- [ ] WordPress DB migration (class-ctp-database.php update)
- [ ] Seed data update

### Phase 2: Mock Rental API
- [ ] class-ctp-mock-rental.php
- [ ] Agency registry seeding (Sixt, GeoDrive, Hertz)
- [ ] Contract validation endpoint update

### Phase 3: Authentication & Roles
- [ ] Customer registration with contract validation
- [ ] Merchant registration with approval workflow
- [ ] Admin login
- [ ] JWT improvements (refresh tokens, role guards)

### Phase 4: Payment Split Flow (Stripe Connect)
- [ ] class-ctp-stripe.php
- [ ] Merchant onboarding (Stripe Connect OAuth)
- [ ] Payment intent creation with automatic split
- [ ] Webhook handling (payment confirmation, refunds)

### Phase 5: Frontend Polish
- [ ] Map integration (Leaflet/Google Maps)
- [ ] QR code improvements
- [ ] Mobile-responsive refinements
- [ ] Admin dashboard analytics
