# Changelog

All notable changes to the Cyprus Tourist Pass plugin will be documented in this file.

## [2.0.0] - 2026-03-16

### Added
- **RentalAgency model**: Proper registry for car rental companies (Sixt, GeoDrive, Hertz) with per-agency API config and mock/real toggle
- **AuditLog model**: Tracks admin actions (merchant approvals, fee changes, refunds) for accountability
- **User fields**: `phone`, `isActive` (soft-disable), `lastLoginAt`
- **MerchantProfile fields**: `websiteUrl`, `phoneNumber`, `postalCode`, `operatingHours` (JSON), `stripeOnboardingComplete`, new business types (SHOP, BAR)
- **QrToken fields**: `amount` (pre-fill bill), `usedAt` timestamp, direct Transaction relation
- **Transaction fields**: `currency`, `stripeTransferId`, `paymentMethod`, `refundedAt`, `refundReason`
- **RentalContract fields**: `pickupLocation`, `returnLocation`, RentalAgency foreign key relation
- **PlatformSettings**: `description` field for admin UI context
- `ARCHITECTURE.md` — Full monorepo structure and implementation roadmap
- `CHANGELOG.md` — Version tracking (this file)

### Changed
- Upgraded Prisma schema from flat agency string to relational RentalAgency model
- Expanded Transaction status options: added PROCESSING state
- Merchant discount rate cap raised from 25% to 50% for flexibility

## [1.2.0] - Previous

### Features
- JWT authentication with 3 roles (Customer, Merchant, Admin)
- 20 REST API endpoints
- Vanilla JS SPA frontend
- WordPress admin dashboard
- QR-based discount tokens
- Transaction tracking with financial split
- 6 demo merchants with seed data
- Database reset tool in admin
