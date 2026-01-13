# Task: MVP Order Creation Flow

**Status**: Phase 1 Complete ✅ | Phase 2 Complete ✅ | Phase 3 Complete ✅
**Priority**: P0 (Blocking for MVP)
**Last Updated**: 2026-01-14

---

## Overview

Complete customer-facing order creation flow for Bar vidva's Kaset Fair 2026 food ordering system. Customers scan QR code → view menu → select items → submit order → receive order ID and payment instructions.

**Critical Requirements**:
- Offline-first functionality for unreliable network
- Order ID format: DXXX (Day 1-9 + Sequence 001-999)
- Page load < 3 seconds on 3G
- No duplicate orders from double-submission
- Type-safe end-to-end (Go + TypeScript)

---

## Implementation Status

### ✅ Phase 1: Backend Complete
- [x] Database schema and migrations
- [x] Go models with validation
- [x] Repository layer with transactions
- [x] Service layer with business logic
- [x] API handlers (Orders, Menu, Health)
- [x] Order ID generation utility
- [x] Docker setup with PostgreSQL
- [x] Environment variable management
- [x] Security: All credentials in .env files
- [x] Unit tests for handlers, services, utils

### ✅ Phase 2: Frontend & Analytics Complete
- [x] Vite + React + TypeScript project setup
- [x] TailwindCSS configured
- [x] CustomerOrder page (menu, name input, order summary)
- [x] MenuSelector component with +/- controls
- [x] NameInput with validation (2-50 chars)
- [x] OrderSummary component
- [x] PaymentInfo component
- [x] Integration with backend API
- [x] Loading and error states
- [x] StaffDashboard (pending orders, queue, completed)
- [x] AdminDashboard with menu management
- [x] QueueTracker page (`/queue/:orderId`)
- [x] Analytics dashboard:
  - [x] Total orders & revenue stats
  - [x] Orders by hour chart
  - [x] Popular items ranking
  - [x] Average completion time
- [x] Multi-day stats comparison:
  - [x] Date range picker (Today, Yesterday, Last 7 days, All event, Custom)
  - [x] Daily breakdown chart
  - [x] Stats filtered by date range
- [x] Admin & Staff authentication (password-based)

### ✅ Phase 3: Offline Support Complete
- [x] Configure Service Worker (vite-plugin-pwa + Workbox)
- [x] Setup IndexedDB for order queue (idb library)
- [x] Implement background sync (auto-sync on reconnect)
- [x] Add offline status indicator (header + banner)
- [x] Test offline submission flow
- [x] Cache menu data (1 hour TTL, NetworkFirst strategy)
- [x] Cache static assets (CacheFirst strategy)

### 🚧 Phase 4: Testing & Polish (Pending)
- [x] Backend unit tests (Go) - handlers, services, utils
- [x] PWA manifest configuration (via vite-plugin-pwa)
- [ ] Frontend component tests (Vitest)
- [ ] Integration tests
- [ ] Manual testing on 3G network
- [ ] Load testing (50+ concurrent users)

---

## Feature Requirements

### 1. QR Code Landing Page ✅
- Route: `/` (CustomerOrder)
- Mobile-responsive (375px - 1920px)
- No authentication required

### 2. Menu Display ✅
- Show available items only (`available = true`)
- Clear pricing in Thai Baht
- TanStack Query with caching

### 3. Item Selection ✅
- Quantity controls: +/- buttons
- Min quantity: 1, Max: 10 per item
- Touch targets: minimum 44x44px
- Real-time total calculation

### 4. Customer Name Input ✅
- Validation: 2-50 characters
- Support Thai and English characters
- Clear error messages

### 5. Order Summary ✅
- Show all items with quantities and subtotals
- Display total amount
- Confirm button with loading state
- Disable after first click

### 6. Order ID Generation ✅
- Format: DXXX (e.g., "1001" = Day 1, Order 1)
- Client-side generation
- Server validates uniqueness

### 7. Payment Instructions ✅
- Display total amount prominently
- Instructions (Thai + English)
- Next steps clearly explained

### 8. Queue Tracking ✅
- Route: `/queue/:orderId`
- Real-time polling (5 seconds)
- Queue position display
- Status updates

### 9. Staff Dashboard ✅
- Pending payment orders list
- Active queue management
- Complete order functionality
- Cancel order functionality

### 10. Admin Dashboard ✅
- Menu management (CRUD)
- Sales statistics
- Orders by hour chart
- Popular items ranking
- Multi-day comparison

### 11. Offline Support ✅
- [x] Queue orders when offline
- [x] Auto-sync when back online
- [x] Show offline status to user
- [x] Store in IndexedDB temporarily

---

## Technical Architecture

### Backend (Go + Fiber + PostgreSQL) ✅

**API Endpoints**:
- `GET /health` - Health check with DB status
- `GET /api/v1/menu` - Get all menu items
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/:id` - Get order by ID
- `GET /api/v1/queue` - Get active queue

**Staff Endpoints** (protected):
- `GET /api/v1/staff/orders/pending` - Pending payment orders
- `GET /api/v1/staff/orders/completed` - Completed orders
- `PUT /api/v1/staff/orders/:id/verify` - Verify payment
- `PUT /api/v1/staff/orders/:id/complete` - Complete order
- `DELETE /api/v1/staff/orders/:id` - Cancel order

**Admin Endpoints** (protected):
- `GET /api/v1/admin/stats` - Dashboard stats (with date range)
- `GET /api/v1/admin/stats/orders-by-hour` - Hourly breakdown
- `GET /api/v1/admin/stats/popular-items` - Top selling items
- `GET /api/v1/admin/stats/daily-breakdown` - Multi-day comparison
- `GET /api/v1/admin/menu` - Menu management
- `POST /api/v1/admin/menu` - Create menu item
- `PUT /api/v1/admin/menu/:id` - Update menu item
- `DELETE /api/v1/admin/menu/:id` - Delete menu item

### Frontend (React + TypeScript + Vite) ✅

**Pages**:
- `CustomerOrder` - Order creation flow
- `StaffDashboard` - Staff operations
- `AdminDashboard` - Admin management
- `QueueTracker` - Order tracking

**Components**:
- MenuSelector, NameInput, OrderSummary, PaymentInfo
- StaffLogin, AdminLogin

---

## Next Steps (Phase 4: Testing & Polish)

1. **Frontend Testing**
   - Add Vitest component tests
   - Test offline functionality
   - Integration tests

2. **Load Testing**
   - Test 50+ concurrent users
   - Verify database performance

3. **Manual Testing**
   - Test on 3G network throttling
   - Test offline/online transitions
   - Verify PWA install experience

4. **Deployment Preparation**
   - Review production configuration
   - Prepare deployment scripts

---

## Performance Targets

### Page Load ✅
- Initial load: < 3 seconds on 3G
- Menu fetch: < 1 second
- Order submission: < 2 seconds (when online)

### Concurrent Load
- Support 50+ simultaneous orders
- Database response: < 100ms avg
- API response: < 200ms avg

### Offline (Phase 3) ✅
- Menu cached: 1 hour TTL (NetworkFirst)
- Order queued: Unlimited time (IndexedDB)
- Auto-sync: Immediate on reconnect

---

## Event Details

- **Event**: Kaset Fair 2026
- **Dates**: January 30 - February 7, 2026 (9 days)
- **Booth**: Bar Vidva

---

**Document Version**: 4.0
**Last Review**: 2026-01-14
**Status**: Phase 1, 2 & 3 Complete, Phase 4 (Testing & Polish) Pending
