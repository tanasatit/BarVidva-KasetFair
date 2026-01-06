# Task: MVP Order Creation Flow

**Status**: Phase 1 Complete ✅ | Unit Tests Complete ✅
**Priority**: P0 (Blocking for MVP)
**Last Updated**: 2026-01-07

---

## Overview

Complete customer-facing order creation flow for Bar vidva's Kaset Fair 2025 food ordering system. Customers scan QR code → view menu → select items → submit order → receive order ID and payment instructions.

**Critical Requirements**:
- Offline-first functionality for unreliable network
- Order ID format: DXXX (Day 1-9 + Sequence 001-999)
- Page load < 3 seconds on 3G
- No duplicate orders from double-submission
- Type-safe end-to-end (Go + TypeScript)

---

## Feature Requirements

### 1. QR Code Landing Page
- Route: `/order` or `/`
- Page weight: < 100KB (excluding menu data)
- Mobile-responsive (375px - 1920px)
- No authentication required

### 2. Menu Display
- Show available items only (`available = true`)
- Initial items: French Fries S (฿40), M (฿60), L (฿80)
- Cache menu for 1 hour
- Clear pricing in Thai Baht

### 3. Item Selection
- Quantity controls: +/- buttons
- Min quantity: 1, Max: 10 per item
- Touch targets: minimum 44x44px
- Real-time total calculation
- Visual selection feedback

### 4. Customer Name Input
- Validation: 2-50 characters
- Support Thai and English characters
- Clear error messages
- Required field

### 5. Order Summary
- Show all items with quantities and subtotals
- Display total amount
- Confirm button with loading state
- Disable after first click (prevent double submit)

### 6. Order ID Generation
- Format: DXXX (e.g., "1001" = Day 1, Order 1)
- Client-side generation for offline support
- Server validates uniqueness
- Easy to read/communicate verbally

### 7. Payment Instructions
- Display total amount prominently
- Instructions (Thai + English):
  - Scan PromptPay QR at booth
  - Enter amount manually
  - Show slip to staff
- Next steps clearly explained

### 8. Offline Support
- Queue orders when offline
- Auto-sync when back online
- Show offline status to user
- Store in IndexedDB temporarily

---

## Technical Architecture

### Backend (Go + Fiber + PostgreSQL)

**Stack**:
- Go 1.21+ with Fiber framework
- PostgreSQL 16
- sqlx for type-safe queries
- godotenv for environment variables
- zerolog for logging

**Layers**:
1. **Models** (`internal/models/`)
   - Order, OrderItem, MenuItem structs
   - OrderStatus enum: PENDING_PAYMENT, PAID, READY, COMPLETED, CANCELLED
   - Validation tags (required, min, max)

2. **Repository** (`internal/repository/`)
   - OrderRepository: Create, GetByID, CheckDuplicate, GetNextSequence
   - MenuRepository: GetAll, GetAvailable, GetByID
   - Transaction-based order creation

3. **Service** (`internal/service/`)
   - OrderService: Business logic, validation, price verification
   - MenuService: Menu management
   - Use errgroup for concurrent operations

4. **Handlers** (`internal/handlers/`)
   - OrderHandler: POST /api/v1/orders, GET /api/v1/orders/:id
   - MenuHandler: GET /api/v1/menu
   - Health: GET /health

5. **Utils** (`internal/utils/`)
   - Order ID generation/validation/parsing
   - Custom validators
   - Cache wrapper (future: Redis)

**Database Schema**:
```
orders:
  - id (VARCHAR(4) PRIMARY KEY)
  - customer_name (VARCHAR(50))
  - total_amount (DECIMAL(10,2))
  - status (VARCHAR(20))
  - day (INTEGER 1-9)
  - queue_number (INTEGER, nullable)
  - created_at, paid_at, completed_at (TIMESTAMP)

order_items:
  - id (SERIAL PRIMARY KEY)
  - order_id (FK to orders)
  - menu_item_id (FK to menu_items)
  - name, price (historical)
  - quantity (INTEGER 1-10)

menu_items:
  - id (SERIAL PRIMARY KEY)
  - name, price, category
  - available (BOOLEAN)
  - created_at, updated_at
```

**API Endpoints**:
- `GET /health` - Health check with DB status
- `GET /api/v1/menu` - Get all menu items
- `GET /api/v1/menu?available=true` - Get available items only
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/:id` - Get order by ID

### Frontend (React + TypeScript + Vite)

**Stack**:
- TypeScript 5.3+ with React 18
- Vite for builds
- TanStack Query for data fetching with retry
- Zod for runtime validation
- TailwindCSS for styling
- PWA with Service Worker

**Pages**:
1. **CustomerOrder** (`/order` or `/`)
   - Menu display
   - Item selection
   - Customer name input
   - Order summary
   - Submit order

2. **OrderConfirmation** (`/order/:id`)
   - Order ID display
   - Payment instructions
   - Total amount
   - Link to queue tracker

**Components**:
- MenuSelector: Display menu items with +/- controls
- OrderSummary: Show selected items and total
- NameInput: Customer name field with validation
- ConfirmButton: Submit with loading state
- PaymentInfo: Instructions after order creation

**Offline Support**:
- Service Worker caches menu and static assets
- IndexedDB stores pending orders
- Background sync for retry
- TanStack Query automatic retry (3 attempts, exponential backoff)

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

**Verified**:
- Health check: `{"status":"healthy","database":"connected"}`
- Menu API: Returns 3 French Fries items
- Order creation: Successfully creates DXXX format IDs
- No .env files in git (properly gitignored)

### 🚧 Phase 2: Frontend (Pending)
- [ ] Create Vite + React + TypeScript project
- [ ] Setup TailwindCSS
- [ ] Implement CustomerOrder page
- [ ] Create MenuSelector component
- [ ] Add NameInput with validation
- [ ] Build OrderSummary component
- [ ] Integrate with backend API
- [ ] Add loading and error states

### 🚧 Phase 3: Offline Support (Pending)
- [ ] Configure Service Worker
- [ ] Setup IndexedDB for order queue
- [ ] Implement background sync
- [ ] Add offline status indicator
- [ ] Test offline submission flow

### 🚧 Phase 4: Testing (In Progress)
- [x] Backend unit tests (Go) - handlers, services, utils
- [x] Mock implementations for repositories and services
- [x] CI/CD pipeline with GitHub Actions
- [ ] Frontend component tests (Vitest)
- [ ] Integration tests
- [ ] Manual testing on 3G network
- [ ] Load testing (50+ concurrent users)

---

## Validation Rules

### Backend Validation
- **Order ID**: Exactly 4 characters, format DXXX
- **Customer Name**: 2-50 chars, required
- **Items**: At least 1 item required
- **Quantity**: 1-10 per item
- **Day**: 1-9 (event days)
- **Total Amount**: Must match server-calculated sum
- **Menu Item**: Must exist and be available

### Frontend Validation
- Customer name: Non-empty, 2-50 chars
- At least one item selected
- Quantities within 1-10 range
- Form validation before submit
- Prevent double submission

---

## Error Handling

### Common Scenarios

**Duplicate Order ID**:
- Backend checks for existing ID before insert
- Returns 409 Conflict if duplicate
- Frontend retries with new sequence number

**Menu Item Unavailable**:
- Validate item availability on backend
- Return 400 Bad Request with clear error
- Frontend refreshes menu

**Network Timeout**:
- Frontend: 10 second timeout
- Retry 3 times with exponential backoff
- Queue locally if all retries fail
- Show offline message to user

**Database Connection Lost**:
- Backend: Context timeout (5 seconds)
- Return 503 Service Unavailable
- Frontend queues order for retry

**Invalid Input**:
- Validate on both frontend and backend
- Return 400 with specific field errors
- Display user-friendly messages

---

## Security

### Environment Variables

**Required in .env files** (never commit these!):
```
# Database
DATABASE_URL=postgres://user:password@host:port/database
POSTGRES_DB=dbname
POSTGRES_USER=username
POSTGRES_PASSWORD=password

# Authentication (future phases)
STAFF_PASSWORD=secure_password_here
ADMIN_PASSWORD=secure_password_here

# Server
PORT=8080
ENV=development
LOG_LEVEL=info
```

**Setup**:
1. Copy `.env.example` to `.env`
2. Set secure passwords (different for dev/prod)
3. Never commit `.env` files
4. Use `${VAR}` syntax in docker-compose.yml

### Validation & Rate Limiting
- Server-side price calculation (prevent manipulation)
- Rate limit: 10 orders per IP per minute
- Validate menu item IDs exist
- Sanitize customer name input
- Check order total matches items

---

## Testing Requirements

### Backend Tests (Go)
```bash
cd backend && go test ./... -cover
```

**Minimum Coverage**: 70%

**Test Areas**:
- Order ID generation (table-driven tests)
- Order creation with validation
- Duplicate detection
- Menu availability checks
- Price calculation accuracy

### Frontend Tests (Vitest)
```bash
cd frontend && npm test
```

**Test Areas**:
- Component rendering
- User interactions (menu selection, form submit)
- Offline behavior (mock network failures)
- Error state handling
- Form validation

---

## Deployment

### Local Development
```bash
# Start database
docker-compose up -d db

# Run backend
cd backend
go build -o server ./cmd/server
./server

# Frontend (when ready)
cd frontend
npm run dev
```

### Docker Compose
```bash
docker-compose up -d
```

### Production (Fly.io)
```bash
# Deploy backend
fly deploy

# Set secrets
fly secrets set STAFF_PASSWORD=xxx ADMIN_PASSWORD=xxx
```

---

## Performance Targets

### Page Load
- Initial load: < 3 seconds on 3G
- Menu fetch: < 1 second
- Order submission: < 2 seconds (when online)

### Concurrent Load
- Support 50+ simultaneous orders
- Database response: < 100ms avg
- API response: < 200ms avg

### Offline
- Menu cached: 1 hour TTL
- Order queued: Unlimited time
- Auto-sync: Within 30 seconds of reconnect

---

## Success Metrics

### Launch Day
- 0 critical bugs requiring immediate fix
- Order submission success rate > 95%
- Average page load < 3 seconds
- All offline orders eventually synced

### 9-Day Event
- 0 system downtime
- Process 500+ orders successfully
- Customer satisfaction (manual survey)
- Staff can operate system with < 30 min training

---

## Next Steps

**Immediate** (Phase 2):
1. Create frontend Vite project
2. Build CustomerOrder page
3. Implement menu selection UI
4. Integrate with backend API
5. Add form validation

**After Frontend** (Phase 3):
1. Configure Service Worker
2. Implement offline queue
3. Add background sync
4. Test offline flow end-to-end

**Before Launch** (Phase 4):
1. Write comprehensive tests
2. Load test with 50+ concurrent users
3. Test on real 3G network
4. Create manual testing checklist
5. Deploy to Fly.io staging
6. Get user acceptance sign-off

---

## Additional Features (Post-MVP)

Client-requested features to implement after core MVP is stable.

### 1. PromptPay QR Payment Page

**Description**: After customer confirms order, display a dedicated payment page with PromptPay QR code and total amount.

**Requirements**:
- Route: `/order/:id/payment` or modal after order confirmation
- Display static PromptPay QR code (same image for all orders)
- Show total amount prominently (large font)
- Instructions in Thai and English
- "Show slip to staff" reminder
- Auto-redirect to order status page after 60 seconds (optional)

**Implementation**:
- Frontend: New PaymentPage component or PaymentModal
- Store PromptPay QR image in `/frontend/public/images/promptpay-qr.png`
- No backend changes needed (static QR)

### 2. Admin Sales Dashboard

**Description**: Dashboard showing sales statistics for admin management.

**Requirements**:
- Route: `/admin/dashboard` (protected by admin auth)
- Display:
  - Total sales per menu item (quantity sold)
  - Total revenue (sum of all completed orders)
  - Optional: Filter by day (1-9)
- Real-time updates (polling every 30 seconds)

**Implementation**:
- Backend: New endpoints
  - `GET /api/v1/admin/stats/sales` - Sales per menu item
  - `GET /api/v1/admin/stats/revenue` - Total revenue
- Frontend: AdminDashboard component with charts (optional: use Chart.js)
- Database queries aggregate from `orders` and `order_items` tables

**API Response Examples**:
```json
// GET /api/v1/admin/stats/sales
{
  "sales": [
    {"menu_item_id": 1, "name": "French Fries S", "quantity_sold": 45, "revenue": 1800},
    {"menu_item_id": 2, "name": "French Fries M", "quantity_sold": 32, "revenue": 1920},
    {"menu_item_id": 3, "name": "French Fries L", "quantity_sold": 28, "revenue": 2240}
  ],
  "total_orders": 105,
  "total_revenue": 5960
}
```

### 3. Menu Images

**Description**: Display images for menu items to help customers visualize products.

**Requirements**:
- Each menu item can have an optional image
- Images stored in repository (not cloud) - suitable for 9-day event
- Supported formats: JPG, PNG
- Max file size: 500KB per image
- Display size: 200x200px (thumbnail)

**Implementation**:
- Store images in `/frontend/public/images/menu/`
- Naming convention: `{menu_item_id}.jpg` (e.g., `1.jpg`, `2.jpg`)
- Add `image_url` field to MenuItem model (optional, nullable)
- Frontend: Display image in MenuSelector component
- Fallback: Show placeholder image if no image exists

**Storage Decision**:
Repository storage is acceptable for this project because:
- Limited number of menu items (< 20 expected)
- Short event duration (9 days)
- Simpler deployment (no external image hosting needed)
- Images can be optimized before adding to repo

**Alternative** (if images become large):
- Use Cloudinary or Imgur for free image hosting
- Store only URLs in database

---

## Known Limitations

### MVP Scope
- Manual payment verification (no PromptPay integration)
- No receipt printing (future phase)
- No SMS notifications (manual only)
- Anonymous orders (no customer accounts)
- Single-booth operation (no multi-location)

### Technical Debt
- Redis not yet implemented (in-memory cache only)
- Service Worker not configured (planned Phase 3)
- No monitoring/alerting (rely on Fly.io built-in)

---

## References

- **CLAUDE.md** - Complete project specifications
- **INITIAL.md** - Original requirements
- **SECURITY.md** - Security best practices
- **README.md** - Quick start guide

---

**Document Version**: 2.1
**Last Review**: 2026-01-07
**Status**: Backend Phase 1 Complete, Unit Tests Complete, Frontend Pending
