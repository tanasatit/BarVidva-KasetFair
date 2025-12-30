# CLAUDE.md - Kaset Fair Food Ordering System

## PROJECT OVERVIEW

You are building a **food ordering and queue management system** for the **Bar vidva booth** at **Kaset Fair 2026** - a 9-day event (dates TBD) with heavy foot traffic and unreliable internet connectivity.

**Student Context**: The developer is a software engineering student who already knows Go, TypeScript, and Docker. Prioritize production-grade patterns, type safety, and performance.

**Critical Success Factors**:
1. **Reliability over features**: System must work all 9 days without failure
2. **Offline-first**: Must function when internet is slow or unstable
3. **Simple manual workflows**: Staff verification preferred over complex automation
4. **Performance**: Handle peak loads (50+ concurrent users) gracefully

---

## SYSTEM ARCHITECTURE

### Core Philosophy
- **Offline-first PWA**: Customer actions don't block on network
- **Manual verification**: Staff verify payments vs. auto-integration
- **Stateless operations**: Minimize server-side session complexity
- **Goroutines for concurrency**: Leverage Go's concurrency model for network resilience
- **Type safety end-to-end**: Go backend + TypeScript frontend

### Tech Stack

**Backend**:
- **Go 1.21+** with **Fiber** web framework
  - Goroutines for handling concurrent requests
  - Type safety at compile time
  - Single binary deployment
  - Low memory footprint (~20-30MB)
- **PostgreSQL 16** for production
- **Redis 7** for caching and queue management
- **sqlx** for type-safe SQL queries
- **validator/v10** for request validation

**Frontend**:
- **TypeScript 5.3+** with **React 18**
- **Vite** for fast builds
- **TanStack Query (React Query)** for type-safe data fetching with retry logic
- **Zod** for runtime type validation
- **TailwindCSS** for styling
- **PWA** with Service Worker for offline capability
- **IndexedDB** for client-side order caching

**Infrastructure**:
- **Docker** for containerization
- **docker-compose** for local development
- **Fly.io** for production deployment (Docker-native)
- **GitHub Actions** for CI/CD (optional)

**Why this stack:**
- Go's goroutines handle unreliable network and concurrent requests better than async Python
- TypeScript prevents runtime type errors on frontend
- Docker ensures dev = production environment parity
- Fly.io has excellent Docker support and global edge network

---

## FEATURE SPECIFICATIONS

### Phase 1: MVP (Must Have Before Event)

#### 1. Customer Flow
```
QR Scan (printed A4 paper at booth)
  → View Menu (French Fries: S/M/L + future items)
  → Select Items + Enter Name
  → Confirm Order → Get Order ID (format: DXXX)
  → Show Amount to Pay + Instructions
  → Customer scans PromptPay QR (separate printed paper), pays
  → Customer shows slip to staff
  → Staff verifies → Order enters queue
  → Customer can view queue status on web
  → Staff calls queue → Customer picks up
  → Staff marks Complete
```

**Key Requirements**:
- QR code landing page must be lightweight (<100KB)
- Menu must cache aggressively (1 hour TTL)
- Order submission must work offline (queue locally, sync when online)
- Order ID format: `DXXX` where D = day (1-9), XXX = sequential order (001-999)
- Payment: Static PromptPay QR displayed at booth, customer enters amount manually
- Two printed QR codes: (1) Order website, (2) PromptPay payment

#### 2. Staff Dashboard
```
Pending Payments Tab:
  - List orders awaiting payment verification
  - Show: Order ID, Name, Items, Total
  - Actions: [✓ Verify Payment] [✗ Cancel]

Active Queue Tab:
  - List verified orders awaiting pickup
  - Show: Queue #, Name, Items, Time Waiting
  - Actions: [Complete Order]

Completed Tab:
  - Historical orders (today only, archive older)
```

#### 3. Admin Panel
```
Menu Management:
  - Add/Edit/Delete items
  - Fields: Name, Price, Available (true/false)
  - Category (optional for Phase 1)

Basic Dashboard:
  - Total orders today
  - Total revenue today
  - Current queue length
```

### Phase 2: Nice to Have (Post-MVP)

- Order tracking page for customers (barvidva.com/queue/DXXX)
- Receipt printer integration (Bluetooth/USB)
- n8n webhook → Google Sheets export
- Analytics dashboard (avg wait time, popular items, peak hours)
- Multi-day stats comparison

---

## DATA MODELS

### Order (Go struct)
```go
type OrderStatus string

const (
    OrderStatusPendingPayment OrderStatus = "PENDING_PAYMENT"
    OrderStatusPaid           OrderStatus = "PAID"
    OrderStatusReady          OrderStatus = "READY"
    OrderStatusCompleted      OrderStatus = "COMPLETED"
    OrderStatusCancelled      OrderStatus = "CANCELLED"
)

type Order struct {
    ID            string       `json:"id" db:"id"`                     // DXXX format
    CustomerName  string       `json:"customer_name" db:"customer_name" validate:"required,min=2,max=50"`
    Items         []OrderItem  `json:"items" validate:"required,min=1,dive"`
    TotalAmount   float64      `json:"total_amount" db:"total_amount" validate:"required,gt=0"`
    Status        OrderStatus  `json:"status" db:"status"`
    CreatedAt     time.Time    `json:"created_at" db:"created_at"`
    PaidAt        *time.Time   `json:"paid_at,omitempty" db:"paid_at"`
    CompletedAt   *time.Time   `json:"completed_at,omitempty" db:"completed_at"`
    QueueNumber   *int         `json:"queue_number,omitempty" db:"queue_number"`
    Day           int          `json:"day" db:"day" validate:"required,min=1,max=9"`
}
```

### OrderItem (Go struct)
```go
type OrderItem struct {
    MenuItemID int     `json:"menu_item_id" validate:"required"`
    Name       string  `json:"name" validate:"required"`
    Price      float64 `json:"price" validate:"required,gt=0"`
    Quantity   int     `json:"quantity" validate:"required,min=1,max=10"`
}
```

### MenuItem (Go struct)
```go
type MenuItem struct {
    ID        int       `json:"id" db:"id"`
    Name      string    `json:"name" db:"name" validate:"required,min=2,max=100"`
    Price     float64   `json:"price" db:"price" validate:"required,gt=0,lte=10000"`
    Category  *string   `json:"category,omitempty" db:"category"`
    Available bool      `json:"available" db:"available"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
    UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
```

### TypeScript Types (Frontend)
```typescript
// Generated from Go structs using typescriptify-golang-structs
export type OrderStatus = 
  | "PENDING_PAYMENT" 
  | "PAID" 
  | "READY" 
  | "COMPLETED" 
  | "CANCELLED";

export interface Order {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  paid_at?: string;
  completed_at?: string;
  queue_number?: number;
  day: number;
}

export interface OrderItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category?: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## IMPLEMENTATION RULES

### Code Organization

```
project-root/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go          # Entry point
│   ├── internal/
│   │   ├── handlers/            # HTTP handlers (Fiber)
│   │   │   ├── order.go
│   │   │   ├── menu.go
│   │   │   ├── queue.go
│   │   │   └── admin.go
│   │   ├── models/              # Domain models
│   │   │   ├── order.go
│   │   │   ├── menu.go
│   │   │   └── queue.go
│   │   ├── repository/          # Database layer
│   │   │   ├── order_repo.go
│   │   │   ├── menu_repo.go
│   │   │   └── queue_repo.go
│   │   ├── service/             # Business logic
│   │   │   ├── order_service.go
│   │   │   └── queue_service.go
│   │   └── utils/
│   │       ├── order_id.go      # Order ID generation
│   │       ├── validator.go     # Custom validators
│   │       └── cache.go         # Redis wrapper
│   ├── pkg/
│   │   └── database/
│   │       └── postgres.go      # DB connection
│   ├── migrations/              # SQL migrations
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CustomerOrder.tsx
│   │   │   ├── StaffDashboard.tsx
│   │   │   ├── AdminPanel.tsx
│   │   │   └── QueueTracker.tsx
│   │   ├── components/
│   │   │   ├── MenuSelector.tsx
│   │   │   ├── OrderSummary.tsx
│   │   │   ├── QueueBoard.tsx
│   │   │   └── PaymentVerification.tsx
│   │   ├── hooks/
│   │   │   ├── useOrders.ts
│   │   │   ├── useMenu.ts
│   │   │   └── useQueue.ts
│   │   ├── services/
│   │   │   ├── api.ts           # API client with types
│   │   │   └── offline.ts       # IndexedDB wrapper
│   │   ├── types/
│   │   │   └── api.ts           # Shared types (from Go)
│   │   └── utils/
│   ├── public/
│   │   └── service-worker.js
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD (optional)
├── .claude/
│   └── commands/
└── CLAUDE.md (this file)
```

### Coding Standards

**Go (Backend)**:
- **Package structure**: Follow standard Go layout (internal/ for private, pkg/ for public)
- **Error handling**: Always check errors explicitly, wrap with context
  ```go
  if err != nil {
      return fmt.Errorf("failed to create order: %w", err)
  }
  ```
- **Goroutines**: Use goroutines for I/O-bound operations, always handle errors in goroutines
  ```go
  errChan := make(chan error, 2)
  go func() {
      errChan <- db.SaveOrder(order)
  }()
  go func() {
      errChan <- cache.Set(order.ID, order)
  }()
  ```
- **Context**: Pass context.Context for cancellation and timeouts
- **Struct tags**: Use for JSON, DB, and validation
- **Comments**: Exported functions must have godoc comments
- **Naming**: Use Go conventions (OrderService not order_service)
- **Max function length**: 50 lines (split if longer)

**TypeScript (Frontend)**:
- **Functional components**: React functional components only
- **Hooks**: Custom hooks for business logic (keep components clean)
- **Types**: Explicit types for all props and state
  ```typescript
  interface OrderFormProps {
    items: OrderItem[];
    onSubmit: (order: Omit<Order, 'id' | 'created_at'>) => void;
  }
  ```
- **Error boundaries**: Wrap major sections in error boundaries
- **Max component size**: 200 lines (split into sub-components)
- **Imports**: Absolute imports with path aliases (`@/components`)
- **Constants**: Use `const` for all immutable values
- **Async**: Always handle promises with try-catch or .catch()

**Database**:
- All timestamps in UTC
- Use transactions for multi-step operations
- Indexes on: `orders.status`, `orders.created_at`, `orders.day`, `menu_items.available`
- Use prepared statements (sqlx handles this)
- No soft deletes (use `available=false` for menu items)

**API Design**:
- RESTful conventions: `/api/v1/orders`, `/api/v1/menu`, `/api/v1/queue`
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Use proper HTTP status codes (200, 201, 400, 404, 500)
- Consistent error format:
  ```json
  {
    "error": "Order not found",
    "code": "ORDER_NOT_FOUND",
    "details": {}
  }
  ```
- Pagination for lists: `?page=1&limit=50`
- Include request ID in responses for tracing

---

## CRITICAL OFFLINE-FIRST REQUIREMENTS

### Service Worker Must:
1. Cache menu data for 1 hour
2. Cache static assets (CSS, JS, images) indefinitely
3. Queue POST requests if offline, retry when online
4. Show user feedback: "Offline - order will be sent when connected"

### Order Submission Flow (Offline-First):
```typescript
// Frontend TypeScript
async function submitOrder(orderData: Omit<Order, 'id' | 'created_at'>) {
  // 1. Generate Order ID client-side (DXXX format)
  const orderId = generateOrderId();
  const order: Order = {
    ...orderData,
    id: orderId,
    created_at: new Date().toISOString(),
  };
  
  // 2. Save to IndexedDB immediately
  await saveToIndexedDB(orderId, order);
  
  // 3. Show success to user (don't wait for server)
  showSuccessMessage(orderId);
  
  // 4. Try to send to server (background)
  try {
    await api.post('/orders', order);
    await markAsSynced(orderId);
  } catch (error) {
    // Queue for retry (service worker handles)
    await queueForRetry(orderId, order);
  }
}
```

### Network Resilience:
- All fetch calls must have timeout (10 seconds max)
- Automatic retry with exponential backoff (max 3 retries)
- Use TanStack Query's built-in retry logic
- Show degraded UI when offline (don't hide features)
- Use goroutines on backend to handle slow queries without blocking

---

## PAYMENT VERIFICATION WORKFLOW

**Static PromptPay QR Code**:
- One QR code printed/displayed at booth (separate from order QR)
- Customer scans → opens banking app → enters amount manually
- Customer shows slip to staff

**Staff Verification**:
```
1. Staff sees order in "Pending Payment" tab
2. Customer shows payment slip on phone
3. Staff checks:
   - Amount matches order total
   - Transfer time is recent (within 10 min)
   - Slip looks legitimate (basic visual check)
4. Staff clicks [✓ Verify Payment]
5. System (Go backend with goroutines):
   - Changes order status: PENDING_PAYMENT → PAID
   - Assigns queue number (auto-increment for the day)
   - Sends to Redis cache
   - Moves to "Active Queue" tab (all in parallel)
6. Customer sees queue number (auto-updates via React Query polling)
```

**Auto-Expiry** (Go goroutine background job):
```go
// Background job runs every minute
func (s *OrderService) StartExpiryJob(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Minute)
    defer ticker.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            s.expireOldOrders()
        }
    }
}

func (s *OrderService) expireOldOrders() {
    cutoff := time.Now().Add(-10 * time.Minute)
    err := s.repo.UpdateExpiredOrders(cutoff, OrderStatusCancelled)
    if err != nil {
        log.Printf("Failed to expire orders: %v", err)
    }
}
```

---

## SECURITY & VALIDATION

### Order Submission:
- Validate menu item IDs exist and are available (database query)
- Validate quantities: positive integers, max 10 per item
- Validate customer name: 2-50 chars, Thai/English alphabet only
- Validate total amount matches sum of items (server-side recalculation)
- Rate limit: Max 10 orders per IP per minute (use Fiber middleware)

### Staff Dashboard:
- Simple password protection (environment variable)
- No JWT/sessions needed (stateless auth)
- Password in environment variable: `STAFF_PASSWORD=kasetfair2026`
- Check password on every request (HTTP Basic Auth or custom middleware)

### Admin Panel:
- Separate admin password: `ADMIN_PASSWORD=barvidva2026`
- Log all menu changes (who, when, what) to database
- Validate prices: 0.01 - 10000.00 THB
- Prevent duplicate menu item names

**Example Go Middleware**:
```go
func StaffAuth(password string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        auth := c.Get("Authorization")
        if auth != "Bearer "+password {
            return c.Status(401).JSON(fiber.Map{
                "error": "Unauthorized",
                "code": "UNAUTHORIZED",
            })
        }
        return c.Next()
    }
}

// Usage
staff := app.Group("/api/v1/staff", StaffAuth(os.Getenv("STAFF_PASSWORD")))
staff.Post("/verify-payment/:id", handlers.VerifyPayment)
```

---

## TESTING REQUIREMENTS

### Backend Tests (Go):
- **Unit tests** for business logic (services, utils)
- **Integration tests** for handlers (with test database)
- **Table-driven tests** (Go best practice)
- Use `testify` for assertions
- Mock database with interfaces

**Example**:
```go
func TestGenerateOrderID(t *testing.T) {
    tests := []struct {
        name     string
        day      int
        sequence int
        want     string
        wantErr  bool
    }{
        {"Day 1 Order 1", 1, 1, "1001", false},
        {"Day 9 Order 999", 9, 999, "9999", false},
        {"Invalid day", 10, 1, "", true},
        {"Invalid sequence", 1, 1000, "", true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := GenerateOrderID(tt.day, tt.sequence)
            if (err != nil) != tt.wantErr {
                t.Errorf("GenerateOrderID() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            if got != tt.want {
                t.Errorf("GenerateOrderID() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

### Frontend Tests (Vitest + React Testing Library):
- Component rendering tests
- User interaction tests (menu selection, order submission)
- Offline behavior tests (mock network failures with MSW)
- Error state tests
- Type checking with TypeScript (catches errors at compile time)

**Minimum Coverage**: 70% for MVP (85% for production)

**Test Commands**:
```bash
# Backend
cd backend && go test ./... -cover

# Frontend
cd frontend && npm test
```

---

## DEPLOYMENT & OPERATIONS

### Docker Setup

**Backend Dockerfile**:
```dockerfile
# Multi-stage build for minimal image size
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]
```

**Frontend Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml** (for local development):
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://barvidva:password@db:5432/barvidva?sslmode=disable
      REDIS_URL: redis://redis:6379
      STAFF_PASSWORD: kasetfair2026
      ADMIN_PASSWORD: barvidva2026
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
  
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:8080
  
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: barvidva
      POSTGRES_USER: barvidva
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables:
```bash
# Backend
DATABASE_URL=postgresql://user:pass@host/dbname
REDIS_URL=redis://host:6379
STAFF_PASSWORD=kasetfair2026
ADMIN_PASSWORD=barvidva2026
PROMPTPAY_NUMBER=0812345678  # For display purposes
PORT=8080

# Frontend
VITE_API_URL=https://api.barvidva.com
```

### Deployment to Fly.io:

**fly.toml** (Backend):
```toml
app = "barvidva-api"
primary_region = "sin"  # Singapore (closest to Thailand)

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[checks]
  [checks.alive]
    type = "http"
    path = "/health"
    interval = "30s"
    timeout = "5s"
```

**Deploy commands**:
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly launch --dockerfile backend/Dockerfile

# Create Postgres database
fly postgres create --name barvidva-db

# Attach database
fly postgres attach barvidva-db

# Set secrets
fly secrets set STAFF_PASSWORD=kasetfair2026 ADMIN_PASSWORD=barvidva2026

# Deploy
fly deploy
```

### Deployment Checklist:
- [ ] Database migrations applied (`go run migrations/*.sql`)
- [ ] Static assets deployed to CDN (optional)
- [ ] Service worker registered and working
- [ ] Environment variables set in Fly.io
- [ ] Health check endpoint responding: `GET /health`
- [ ] Sample menu items seeded (French Fries S/M/L)
- [ ] Test order flow end-to-end on production URL
- [ ] Test with throttled network (Chrome DevTools → Network → Slow 3G)
- [ ] Backup plan: Local PostgreSQL export script ready
- [ ] Monitor logs: `fly logs -a barvidva-api`

### Monitoring:
- Use Fly.io built-in metrics (CPU, memory, requests)
- Log all errors with structured logging (use `zerolog` or `zap`)
- Track metrics: orders/hour, avg completion time, error rate
- Daily backup: Export orders to CSV at midnight (cron job)
- Health check endpoint returns database connection status

---

## CONSTRAINTS & GOTCHAS

### Things to AVOID:
- ❌ WebSockets (use HTTP polling instead - more reliable on bad network)
- ❌ Payment gateway integration (too complex for 9-day event)
- ❌ User authentication for customers (anonymous orders only)
- ❌ Image uploads (menu items are text-only for MVP)
- ❌ Email/SMS notifications (manual only)
- ❌ ORM with migrations (use sqlx + manual migrations for simplicity)

### Things to PRIORITIZE:
- ✅ Fast load times (<3 seconds on 3G)
- ✅ Clear error messages in Thai and English
- ✅ Large touch targets for mobile (min 44x44px)
- ✅ Graceful degradation when offline
- ✅ Simple manual fallback (paper orders if system down)
- ✅ Type safety (Go + TypeScript catches bugs before production)
- ✅ Goroutines for concurrent operations (don't block on I/O)

### Known Edge Cases:
1. **Duplicate orders**: If customer hits submit twice
   - Solution: Disable button after first click, show loading spinner
   - Backend: Use idempotency key (order ID generated client-side)
   
2. **Queue number conflicts**: If day counter resets manually
   - Solution: Queue numbers are per-day, auto-reset at midnight (Go cron job)
   
3. **Menu price changes**: Mid-day price updates
   - Solution: Orders store item prices at time of order (historical record)
   
4. **Staff accidentally marks wrong order complete**:
   - Solution: Add "Undo" button (5 second window) - update status back to READY
   
5. **Database connection pool exhaustion**:
   - Solution: Limit max connections in sqlx: `db.SetMaxOpenConns(25)`

6. **Goroutine leaks**:
   - Solution: Always use context with timeout, close channels

---

## GO-SPECIFIC BEST PRACTICES

### Goroutines & Concurrency:
```go
// GOOD: Use errgroup for goroutines that can fail
g, ctx := errgroup.WithContext(context.Background())

g.Go(func() error {
    return saveToDatabase(ctx, order)
})

g.Go(func() error {
    return saveToCache(ctx, order)
})

if err := g.Wait(); err != nil {
    return fmt.Errorf("failed to save order: %w", err)
}
```

### Context Timeouts:
```go
// Always set timeout for database operations
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

err := db.CreateOrder(ctx, order)
if err != nil {
    if errors.Is(err, context.DeadlineExceeded) {
        return fmt.Errorf("database timeout")
    }
    return err
}
```

### Error Handling:
```go
// Use custom error types for business logic
type OrderNotFoundError struct {
    OrderID string
}

func (e *OrderNotFoundError) Error() string {
    return fmt.Sprintf("order %s not found", e.OrderID)
}

// Check error types
if errors.As(err, &OrderNotFoundError{}) {
    return c.Status(404).JSON(fiber.Map{"error": err.Error()})
}
```

### Structured Logging:
```go
import "github.com/rs/zerolog/log"

log.Info().
    Str("order_id", order.ID).
    Str("customer_name", order.CustomerName).
    Float64("total", order.TotalAmount).
    Msg("Order created successfully")
```

---

## COMMUNICATION STYLE

When implementing features:
1. **Always explain your reasoning**: Why you chose goroutines over sequential execution
2. **Highlight tradeoffs**: Go's strict typing vs Python's flexibility
3. **Suggest improvements**: What could be optimized with Go's concurrency
4. **Ask when uncertain**: Don't guess on critical decisions (payment flow, data model)
5. **Educational comments**: Explain Go patterns (channels, goroutines, context)

**Example**:
```go
// GenerateOrderID creates an order ID in DXXX format.
//
// Format explanation:
// - First digit: Day of event (1-9)
// - Next 3 digits: Sequential order number (001-999)
//
// Example: "1001" = Day 1, Order 1
//          "9999" = Day 9, Order 999
//
// We use this simple format instead of UUIDs because:
// 1. Staff need to read these numbers quickly during service
// 2. Easier to call out loud ("Queue one-zero-zero-one")
// 3. Max capacity: 999 orders per day (sufficient for this event)
//
// Thread-safety: This function is pure and can be called from multiple
// goroutines safely. The actual sequence number management happens in
// the database with atomic increments.
func GenerateOrderID(day, sequence int) (string, error) {
    if day < 1 || day > 9 {
        return "", fmt.Errorf("day must be 1-9, got %d", day)
    }
    if sequence < 1 || sequence > 999 {
        return "", fmt.Errorf("sequence must be 1-999, got %d", sequence)
    }
    
    return fmt.Sprintf("%d%03d", day, sequence), nil
}
```

---

## SUCCESS CRITERIA

Before considering the system "complete", verify:

### Functional Requirements:
- [ ] Customer can scan QR, view menu, place order (offline-capable)
- [ ] Order ID follows DXXX format correctly
- [ ] Payment instructions display with amount
- [ ] Staff can verify payments and assign queue numbers
- [ ] Queue displays in correct order (FIFO)
- [ ] Staff can mark orders complete
- [ ] Admin can add/edit menu items
- [ ] Orders persist across browser refresh/page reload
- [ ] Type safety: No runtime type errors (Go + TypeScript)

### Non-Functional Requirements:
- [ ] Page load <3 seconds on 3G (test with Chrome throttling)
- [ ] Works offline (menu + order submission queue)
- [ ] Mobile-responsive (viewport 375px to 1920px)
- [ ] No console errors in production
- [ ] Database handles 1000+ orders without slowdown
- [ ] System recovers gracefully from network failures
- [ ] Backend handles 50+ concurrent requests without blocking
- [ ] Docker containers build successfully and run

### Code Quality:
- [ ] Backend tests pass: `go test ./... -cover`
- [ ] Frontend tests pass: `npm test`
- [ ] No linter errors: `golangci-lint run`
- [ ] TypeScript compiles with no errors: `tsc --noEmit`
- [ ] Docker images < 50MB each

### Documentation:
- [ ] README.md with setup instructions
- [ ] API documentation (Swagger/OpenAPI) at `/docs`
- [ ] Deployment guide (how to launch on Fly.io)
- [ ] Manual fallback procedure (paper orders)
- [ ] Environment variables documented

---

## PHASE PLANNING

### Week 1: Core Backend + Database
- Database schema + migrations
- Order CRUD API endpoints (Fiber handlers)
- Menu CRUD API endpoints
- Order ID generation logic
- Basic validation and error handling
- Docker setup (docker-compose working locally)

### Week 2: Frontend + Integration
- React pages (CustomerOrder, StaffDashboard)
- TypeScript types (generate from Go structs)
- Order submission flow
- Menu display + selection
- API integration with TanStack Query
- Staff payment verification UI

### Week 3: Queue Management + Polish
- Queue assignment logic (background goroutine)
- Active queue display
- Order completion flow
- Queue tracking page
- Admin menu management
- Auto-expiry job

### Week 4: Offline + Testing + Deployment
- Service Worker implementation
- IndexedDB for offline orders
- Error handling + user feedback
- Load testing (k6 or hey: 50 concurrent requests)
- Deploy to Fly.io
- End-to-end testing on production URL
- Backup procedures (database export script)

---

## QUESTIONS TO ASK BEFORE STARTING

When you receive a feature request in `INITIAL.md`, always clarify:

1. **Data validation**: What are the exact constraints? (string length, number ranges)
2. **Concurrency**: Should this operation block or run in a goroutine?
3. **Error handling**: What should happen when X fails? (network, validation, database)
4. **Edge cases**: What happens when... (order canceled, menu deleted while ordering, etc.)
5. **Priority**: Is this blocking for MVP or nice-to-have?
6. **Testing**: What specific scenarios should be tested? (table-driven tests)

---

## FINAL NOTES

This system is designed for a **9-day event**, not a long-term SaaS product. Make decisions that prioritize:
1. **Reliability**: It must work all 9 days without failure
2. **Performance**: Go's goroutines handle concurrent load gracefully
3. **Type safety**: Go + TypeScript catch bugs before production
4. **Simplicity**: Staff can learn it in 30 minutes
5. **Speed**: Implementation in 3-4 weeks

**When in doubt, choose the solution that leverages Go's strengths:** goroutines for concurrency, type safety for reliability, and single binary for easy deployment.

Good luck building Bar vidva's ordering system!
