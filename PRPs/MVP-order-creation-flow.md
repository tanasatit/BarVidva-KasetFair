# PRP: MVP Order Creation Flow

**Status**: Ready for Implementation
**Priority**: P0 (Blocking for MVP)
**Created**: 2025-12-30
**Estimated Complexity**: High (Multi-component, full-stack)

---

## EXECUTIVE SUMMARY

Implement the complete customer-facing order creation flow for Bar vidva's food ordering system at Kaset Fair 2025. This is the core MVP feature that enables customers to scan a QR code, view the menu, select items, enter their name, and receive an order ID with payment instructions - all while supporting offline functionality for unreliable event network conditions.

**Key Success Metrics**:
- Order submission works offline with automatic retry
- Page loads in <3 seconds on 3G network
- Order ID generation follows DXXX format (Day + Sequence)
- No duplicate orders from double-submission
- Type-safe end-to-end (Go backend + TypeScript frontend)

---

## FEATURE REQUIREMENTS

### Functional Requirements

#### FR-1: QR Code Landing Page
- **User Story**: As a customer, I scan a printed QR code at the booth and land on the order page instantly
- **Acceptance Criteria**:
  - Page loads at route `/order` or root `/`
  - Total page weight < 100KB (excluding menu data)
  - Mobile-first responsive design (375px - 1920px)
  - No authentication required (anonymous ordering)
  - Displays Bar vidva branding and event information

#### FR-2: Menu Display
- **User Story**: As a customer, I see the available menu items with prices in Thai Baht
- **Acceptance Criteria**:
  - Display French Fries in 3 sizes: Small (฿40), Medium (฿60), Large (฿80)
  - Menu items cached for 1 hour (Service Worker)
  - Only show available items (where `available = true`)
  - Clear product names and prices
  - Visual indication of selection state
  - Supports future expansion to more menu items

#### FR-3: Item Selection with Quantity
- **User Story**: As a customer, I can select multiple items and specify quantities
- **Acceptance Criteria**:
  - Quantity controls: increment (+) and decrement (-) buttons
  - Minimum quantity: 1 per item
  - Maximum quantity: 10 per item (validation)
  - Touch targets minimum 44x44px for mobile
  - Selected items highlighted/distinguished from unselected
  - Real-time total amount calculation
  - Can add/remove items before final submission
  - Visual feedback on quantity changes

#### FR-4: Customer Name Input
- **User Story**: As a customer, I enter my name for order identification
- **Acceptance Criteria**:
  - Text input field with clear label (Thai/English)
  - Validation: 2-50 characters
  - Accepts Thai and English characters
  - Clear error messages for invalid input
  - Field is required (cannot submit without name)
  - Mobile keyboard optimized (text input type)

#### FR-5: Order Summary and Confirmation
- **User Story**: As a customer, I review my order before submitting
- **Acceptance Criteria**:
  - Display all selected items with quantities
  - Show unit price and subtotal per item
  - Display total amount in Thai Baht
  - Clear "Confirm Order" button
  - Option to go back and edit before confirmation
  - Button disabled after first click (prevent double submission)
  - Loading spinner during submission

#### FR-6: Order ID Generation
- **User Story**: As a customer, I receive a unique order ID immediately after submission
- **Acceptance Criteria**:
  - Format: DXXX (D = day 1-9, XXX = sequence 001-999)
  - Examples: "1001" (Day 1, Order 1), "9999" (Day 9, Order 999)
  - Generated client-side for offline support
  - Must be unique (idempotency check on backend)
  - Displayed prominently on success screen
  - Easy to read and communicate verbally to staff

#### FR-7: Payment Instructions
- **User Story**: As a customer, I see clear payment instructions with the exact amount to pay
- **Acceptance Criteria**:
  - Display total amount prominently
  - Instructions in Thai and English:
    - "Please scan the PromptPay QR code at the booth"
    - "Enter amount: ฿XX.XX"
    - "Show payment slip to staff for verification"
  - Clear next steps (where to go, what to do)
  - Order ID displayed for reference
  - Option to view order status (link to queue tracker)

#### FR-8: Offline Order Submission
- **User Story**: As a customer, my order is saved even when network is unavailable
- **Acceptance Criteria**:
  - Order saved to IndexedDB immediately upon submission
  - Success screen shown to user without waiting for network
  - Background sync attempts to send order to server
  - Retry logic with exponential backoff (max 3 retries)
  - Visual indicator when offline: "Order saved - will sync when connected"
  - Order persists across browser refresh/close
  - Sync status visible to user (synced/pending)

### Non-Functional Requirements

#### NFR-1: Performance
- Page load time < 3 seconds on 3G network
- Time to Interactive (TTI) < 5 seconds on 3G
- Menu API response < 500ms
- Order submission API < 1 second (when online)
- No blocking operations on main thread

#### NFR-2: Reliability
- Service Worker successfully caches menu data
- Order submission succeeds with 99% reliability
- Graceful fallback when JavaScript disabled
- No data loss during network interruptions
- Idempotent order submission (prevent duplicates)

#### NFR-3: Usability
- Mobile-friendly touch targets (min 44x44px)
- Clear visual feedback for all interactions
- Error messages in Thai and English
- Form validation with inline feedback
- Accessible to users with limited tech literacy
- Works on iOS Safari and Android Chrome

#### NFR-4: Security
- Input validation on client and server
- XSS prevention (sanitize inputs)
- Rate limiting: 10 orders per IP per minute
- No sensitive data stored client-side
- HTTPS only in production

---

## TECHNICAL ARCHITECTURE

### System Overview

```
Customer Browser
├── Service Worker (offline support)
├── IndexedDB (order queue)
└── React App (/order page)
    ├── MenuSelector Component
    ├── OrderSummary Component
    └── API Client (TanStack Query)
        ↓ HTTP POST
Backend (Go + Fiber)
├── POST /api/v1/orders handler
├── Order validation & processing
├── PostgreSQL (persist orders)
└── Redis (cache menu data)
```

### Component Breakdown

#### Backend Components

**1. Database Schema**

```sql
-- orders table
CREATE TABLE orders (
    id VARCHAR(4) PRIMARY KEY,           -- DXXX format
    customer_name VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT',
    day INTEGER NOT NULL CHECK (day >= 1 AND day <= 9),
    queue_number INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(day, id)
);

-- order_items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(4) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
    name VARCHAR(100) NOT NULL,         -- Historical record
    price DECIMAL(10,2) NOT NULL,       -- Historical record
    quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 10)
);

-- menu_items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0 AND price <= 10000),
    category VARCHAR(50),
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_day ON orders(day);
CREATE INDEX idx_menu_items_available ON menu_items(available);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

**2. Go Data Models** (`internal/models/order.go`)

```go
package models

import "time"

// OrderStatus represents the current state of an order
type OrderStatus string

const (
    OrderStatusPendingPayment OrderStatus = "PENDING_PAYMENT"
    OrderStatusPaid           OrderStatus = "PAID"
    OrderStatusReady          OrderStatus = "READY"
    OrderStatusCompleted      OrderStatus = "COMPLETED"
    OrderStatusCancelled      OrderStatus = "CANCELLED"
)

// Order represents a customer order
type Order struct {
    ID            string       `json:"id" db:"id" validate:"required,len=4"`
    CustomerName  string       `json:"customer_name" db:"customer_name" validate:"required,min=2,max=50"`
    Items         []OrderItem  `json:"items" validate:"required,min=1,dive"`
    TotalAmount   float64      `json:"total_amount" db:"total_amount" validate:"required,gt=0"`
    Status        OrderStatus  `json:"status" db:"status"`
    Day           int          `json:"day" db:"day" validate:"required,min=1,max=9"`
    QueueNumber   *int         `json:"queue_number,omitempty" db:"queue_number"`
    CreatedAt     time.Time    `json:"created_at" db:"created_at"`
    PaidAt        *time.Time   `json:"paid_at,omitempty" db:"paid_at"`
    CompletedAt   *time.Time   `json:"completed_at,omitempty" db:"completed_at"`
}

// OrderItem represents an item in an order
type OrderItem struct {
    ID         int     `json:"id,omitempty" db:"id"`
    OrderID    string  `json:"order_id,omitempty" db:"order_id"`
    MenuItemID int     `json:"menu_item_id" db:"menu_item_id" validate:"required"`
    Name       string  `json:"name" db:"name" validate:"required"`
    Price      float64 `json:"price" db:"price" validate:"required,gt=0"`
    Quantity   int     `json:"quantity" db:"quantity" validate:"required,min=1,max=10"`
}

// CreateOrderRequest represents the request body for creating an order
type CreateOrderRequest struct {
    ID           string      `json:"id" validate:"required,len=4"`
    CustomerName string      `json:"customer_name" validate:"required,min=2,max=50"`
    Items        []OrderItem `json:"items" validate:"required,min=1,dive"`
    Day          int         `json:"day" validate:"required,min=1,max=9"`
}
```

**3. Order Repository** (`internal/repository/order_repo.go`)

```go
package repository

import (
    "context"
    "database/sql"
    "fmt"

    "github.com/jmoiron/sqlx"
    "yourproject/internal/models"
)

type OrderRepository interface {
    Create(ctx context.Context, order *models.Order) error
    GetByID(ctx context.Context, id string) (*models.Order, error)
    CheckDuplicateID(ctx context.Context, id string) (bool, error)
    GetNextSequence(ctx context.Context, day int) (int, error)
}

type orderRepository struct {
    db *sqlx.DB
}

func NewOrderRepository(db *sqlx.DB) OrderRepository {
    return &orderRepository{db: db}
}

// Create inserts a new order with its items in a transaction
func (r *orderRepository) Create(ctx context.Context, order *models.Order) error {
    tx, err := r.db.BeginTxx(ctx, nil)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }
    defer tx.Rollback()

    // Insert order
    query := `
        INSERT INTO orders (id, customer_name, total_amount, status, day, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
    `
    _, err = tx.ExecContext(ctx, query,
        order.ID,
        order.CustomerName,
        order.TotalAmount,
        order.Status,
        order.Day,
        order.CreatedAt,
    )
    if err != nil {
        return fmt.Errorf("failed to insert order: %w", err)
    }

    // Insert order items
    itemQuery := `
        INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
        VALUES ($1, $2, $3, $4, $5)
    `
    for _, item := range order.Items {
        _, err = tx.ExecContext(ctx, itemQuery,
            order.ID,
            item.MenuItemID,
            item.Name,
            item.Price,
            item.Quantity,
        )
        if err != nil {
            return fmt.Errorf("failed to insert order item: %w", err)
        }
    }

    if err = tx.Commit(); err != nil {
        return fmt.Errorf("failed to commit transaction: %w", err)
    }

    return nil
}

// CheckDuplicateID checks if an order ID already exists
func (r *orderRepository) CheckDuplicateID(ctx context.Context, id string) (bool, error) {
    var exists bool
    query := `SELECT EXISTS(SELECT 1 FROM orders WHERE id = $1)`
    err := r.db.GetContext(ctx, &exists, query, id)
    if err != nil {
        return false, fmt.Errorf("failed to check duplicate ID: %w", err)
    }
    return exists, nil
}

// GetNextSequence gets the next sequence number for a given day
func (r *orderRepository) GetNextSequence(ctx context.Context, day int) (int, error) {
    var maxSeq int
    query := `
        SELECT COALESCE(MAX(CAST(SUBSTRING(id, 2) AS INTEGER)), 0)
        FROM orders
        WHERE day = $1
    `
    err := r.db.GetContext(ctx, &maxSeq, query, day)
    if err != nil && err != sql.ErrNoRows {
        return 0, fmt.Errorf("failed to get next sequence: %w", err)
    }
    return maxSeq + 1, nil
}

// GetByID retrieves an order with its items
func (r *orderRepository) GetByID(ctx context.Context, id string) (*models.Order, error) {
    var order models.Order
    query := `SELECT * FROM orders WHERE id = $1`
    err := r.db.GetContext(ctx, &order, query, id)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, fmt.Errorf("order not found: %s", id)
        }
        return nil, fmt.Errorf("failed to get order: %w", err)
    }

    // Get order items
    var items []models.OrderItem
    itemsQuery := `SELECT * FROM order_items WHERE order_id = $1`
    err = r.db.SelectContext(ctx, &items, itemsQuery, id)
    if err != nil {
        return nil, fmt.Errorf("failed to get order items: %w", err)
    }
    order.Items = items

    return &order, nil
}
```

**4. Order Service** (`internal/service/order_service.go`)

```go
package service

import (
    "context"
    "fmt"
    "time"

    "golang.org/x/sync/errgroup"
    "yourproject/internal/models"
    "yourproject/internal/repository"
    "yourproject/internal/utils"
)

type OrderService interface {
    CreateOrder(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error)
    ValidateOrder(ctx context.Context, req *models.CreateOrderRequest) error
}

type orderService struct {
    orderRepo repository.OrderRepository
    menuRepo  repository.MenuRepository
    cache     utils.Cache
}

func NewOrderService(
    orderRepo repository.OrderRepository,
    menuRepo repository.MenuRepository,
    cache utils.Cache,
) OrderService {
    return &orderService{
        orderRepo: orderRepo,
        menuRepo:  menuRepo,
        cache:     cache,
    }
}

// CreateOrder creates a new order after validation
func (s *orderService) CreateOrder(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error) {
    // Set timeout for entire operation
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    // Validate order
    if err := s.ValidateOrder(ctx, req); err != nil {
        return nil, fmt.Errorf("validation failed: %w", err)
    }

    // Check for duplicate order ID
    exists, err := s.orderRepo.CheckDuplicateID(ctx, req.ID)
    if err != nil {
        return nil, fmt.Errorf("failed to check duplicate: %w", err)
    }
    if exists {
        return nil, fmt.Errorf("order ID already exists: %s", req.ID)
    }

    // Calculate total amount (server-side verification)
    totalAmount := 0.0
    for _, item := range req.Items {
        totalAmount += item.Price * float64(item.Quantity)
    }

    // Create order object
    order := &models.Order{
        ID:           req.ID,
        CustomerName: req.CustomerName,
        Items:        req.Items,
        TotalAmount:  totalAmount,
        Status:       models.OrderStatusPendingPayment,
        Day:          req.Day,
        CreatedAt:    time.Now().UTC(),
    }

    // Use errgroup for concurrent operations
    g, gCtx := errgroup.WithContext(ctx)

    // Save to database
    g.Go(func() error {
        return s.orderRepo.Create(gCtx, order)
    })

    // Cache order for quick retrieval
    g.Go(func() error {
        return s.cache.SetOrder(gCtx, order)
    })

    if err := g.Wait(); err != nil {
        return nil, fmt.Errorf("failed to create order: %w", err)
    }

    return order, nil
}

// ValidateOrder validates the order request
func (s *orderService) ValidateOrder(ctx context.Context, req *models.CreateOrderRequest) error {
    // Validate customer name
    if len(req.CustomerName) < 2 || len(req.CustomerName) > 50 {
        return fmt.Errorf("customer name must be 2-50 characters")
    }

    // Validate day
    if req.Day < 1 || req.Day > 9 {
        return fmt.Errorf("day must be between 1 and 9")
    }

    // Validate order ID format
    if !utils.ValidateOrderIDFormat(req.ID, req.Day) {
        return fmt.Errorf("invalid order ID format")
    }

    // Validate items
    if len(req.Items) == 0 {
        return fmt.Errorf("order must contain at least one item")
    }

    // Validate each item exists and is available
    for i, item := range req.Items {
        // Check quantity
        if item.Quantity < 1 || item.Quantity > 10 {
            return fmt.Errorf("item %d: quantity must be 1-10", i)
        }

        // Verify menu item exists and is available
        menuItem, err := s.menuRepo.GetByID(ctx, item.MenuItemID)
        if err != nil {
            return fmt.Errorf("item %d: menu item not found", i)
        }

        if !menuItem.Available {
            return fmt.Errorf("item %d: menu item not available", i)
        }

        // Verify price matches (prevent client-side price manipulation)
        if item.Price != menuItem.Price {
            return fmt.Errorf("item %d: price mismatch", i)
        }
    }

    return nil
}
```

**5. Order Handler** (`internal/handlers/order.go`)

```go
package handlers

import (
    "errors"
    "net/http"

    "github.com/gofiber/fiber/v2"
    "github.com/rs/zerolog/log"
    "yourproject/internal/models"
    "yourproject/internal/service"
)

type OrderHandler struct {
    orderService service.OrderService
}

func NewOrderHandler(orderService service.OrderService) *OrderHandler {
    return &OrderHandler{
        orderService: orderService,
    }
}

// CreateOrder handles POST /api/v1/orders
func (h *OrderHandler) CreateOrder(c *fiber.Ctx) error {
    var req models.CreateOrderRequest

    // Parse request body
    if err := c.BodyParser(&req); err != nil {
        log.Error().Err(err).Msg("Failed to parse request body")
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{
            "error": "Invalid request format",
            "code":  "INVALID_REQUEST",
        })
    }

    // Create order
    order, err := h.orderService.CreateOrder(c.Context(), &req)
    if err != nil {
        log.Error().
            Err(err).
            Str("order_id", req.ID).
            Str("customer_name", req.CustomerName).
            Msg("Failed to create order")

        // Check for validation errors
        if errors.Is(err, errors.New("validation failed")) {
            return c.Status(http.StatusBadRequest).JSON(fiber.Map{
                "error": err.Error(),
                "code":  "VALIDATION_ERROR",
            })
        }

        // Check for duplicate order
        if errors.Is(err, errors.New("order ID already exists")) {
            return c.Status(http.StatusConflict).JSON(fiber.Map{
                "error": err.Error(),
                "code":  "DUPLICATE_ORDER",
            })
        }

        return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
            "error": "Failed to create order",
            "code":  "INTERNAL_ERROR",
        })
    }

    log.Info().
        Str("order_id", order.ID).
        Str("customer_name", order.CustomerName).
        Float64("total_amount", order.TotalAmount).
        Int("day", order.Day).
        Msg("Order created successfully")

    return c.Status(http.StatusCreated).JSON(order)
}
```

**6. Order ID Utility** (`internal/utils/order_id.go`)

```go
package utils

import (
    "fmt"
    "strconv"
)

// GenerateOrderID creates an order ID in DXXX format.
//
// Format explanation:
// - First digit: Day of event (1-9)
// - Next 3 digits: Sequential order number (001-999)
//
// Example: "1001" = Day 1, Order 1
//          "9999" = Day 9, Order 999
//
// This function is pure and can be called from multiple goroutines safely.
func GenerateOrderID(day, sequence int) (string, error) {
    if day < 1 || day > 9 {
        return "", fmt.Errorf("day must be 1-9, got %d", day)
    }
    if sequence < 1 || sequence > 999 {
        return "", fmt.Errorf("sequence must be 1-999, got %d", sequence)
    }

    return fmt.Sprintf("%d%03d", day, sequence), nil
}

// ValidateOrderIDFormat validates the order ID format
func ValidateOrderIDFormat(id string, expectedDay int) bool {
    if len(id) != 4 {
        return false
    }

    day, err := strconv.Atoi(id[0:1])
    if err != nil || day != expectedDay {
        return false
    }

    seq, err := strconv.Atoi(id[1:4])
    if err != nil || seq < 1 || seq > 999 {
        return false
    }

    return true
}

// ParseOrderID extracts day and sequence from order ID
func ParseOrderID(id string) (day int, sequence int, err error) {
    if len(id) != 4 {
        return 0, 0, fmt.Errorf("invalid order ID length")
    }

    day, err = strconv.Atoi(id[0:1])
    if err != nil {
        return 0, 0, fmt.Errorf("invalid day in order ID")
    }

    sequence, err = strconv.Atoi(id[1:4])
    if err != nil {
        return 0, 0, fmt.Errorf("invalid sequence in order ID")
    }

    return day, sequence, nil
}
```

#### Frontend Components

**1. TypeScript Types** (`frontend/src/types/api.ts`)

```typescript
// Auto-generated from Go structs
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
  day: number;
  queue_number?: number;
  created_at: string;
  paid_at?: string;
  completed_at?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: string;
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

export interface CreateOrderRequest {
  id: string;
  customer_name: string;
  items: OrderItem[];
  day: number;
}

export interface APIError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}
```

**2. API Client** (`frontend/src/services/api.ts`)

```typescript
import axios, { AxiosError } from 'axios';
import type { CreateOrderRequest, Order, MenuItem, APIError } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Configure axios with timeout and retry logic
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
export const handleAPIError = (error: unknown): APIError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIError>;
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    if (axiosError.code === 'ECONNABORTED') {
      return { error: 'Request timeout', code: 'TIMEOUT' };
    }
    if (!axiosError.response) {
      return { error: 'Network error', code: 'NETWORK_ERROR' };
    }
  }
  return { error: 'Unknown error', code: 'UNKNOWN' };
};

// Order API
export const orderAPI = {
  create: async (request: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', request);
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },
};

// Menu API
export const menuAPI = {
  getAll: async (): Promise<MenuItem[]> => {
    const response = await apiClient.get<MenuItem[]>('/menu');
    return response.data;
  },

  getAvailable: async (): Promise<MenuItem[]> => {
    const response = await apiClient.get<MenuItem[]>('/menu?available=true');
    return response.data;
  },
};
```

**3. Offline Storage** (`frontend/src/services/offline.ts`)

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Order } from '@/types/api';

interface OrderDB extends DBSchema {
  orders: {
    key: string;
    value: Order & { synced: boolean };
    indexes: { 'by-synced': boolean };
  };
}

let db: IDBPDatabase<OrderDB> | null = null;

// Initialize IndexedDB
export const initDB = async (): Promise<void> => {
  db = await openDB<OrderDB>('barvidva-orders', 1, {
    upgrade(db) {
      const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
      orderStore.createIndex('by-synced', 'synced');
    },
  });
};

// Save order to IndexedDB
export const saveOrderOffline = async (order: Order): Promise<void> => {
  if (!db) await initDB();
  await db!.put('orders', { ...order, synced: false });
};

// Mark order as synced
export const markOrderSynced = async (orderId: string): Promise<void> => {
  if (!db) await initDB();
  const order = await db!.get('orders', orderId);
  if (order) {
    await db!.put('orders', { ...order, synced: true });
  }
};

// Get unsynced orders
export const getUnsyncedOrders = async (): Promise<Order[]> => {
  if (!db) await initDB();
  const orders = await db!.getAllFromIndex('orders', 'by-synced', false);
  return orders;
};

// Get order by ID
export const getOrderOffline = async (orderId: string): Promise<Order | undefined> => {
  if (!db) await initDB();
  const order = await db!.get('orders', orderId);
  return order;
};
```

**4. Order ID Generator** (`frontend/src/utils/orderIdGenerator.ts`)

```typescript
/**
 * Generates a unique order ID in DXXX format
 *
 * Format: D (day 1-9) + XXX (sequence 001-999)
 * Examples: "1001", "9999"
 *
 * For offline support, we generate IDs client-side and verify server-side.
 * If ID conflicts, server will return 409 and client retries with new sequence.
 */

export const generateOrderID = (day: number): string => {
  if (day < 1 || day > 9) {
    throw new Error(`Day must be 1-9, got ${day}`);
  }

  // Generate random sequence (1-999) for offline support
  // Server will validate and reject duplicates
  const sequence = Math.floor(Math.random() * 999) + 1;
  const paddedSequence = sequence.toString().padStart(3, '0');

  return `${day}${paddedSequence}`;
};

export const parseOrderID = (id: string): { day: number; sequence: number } | null => {
  if (id.length !== 4) return null;

  const day = parseInt(id[0], 10);
  const sequence = parseInt(id.substring(1), 10);

  if (isNaN(day) || isNaN(sequence) || day < 1 || day > 9 || sequence < 1 || sequence > 999) {
    return null;
  }

  return { day, sequence };
};

export const validateOrderID = (id: string, expectedDay: number): boolean => {
  const parsed = parseOrderID(id);
  return parsed !== null && parsed.day === expectedDay;
};
```

**5. Custom Hook - useMenu** (`frontend/src/hooks/useMenu.ts`)

```typescript
import { useQuery } from '@tanstack/react-query';
import { menuAPI, handleAPIError } from '@/services/api';
import type { MenuItem } from '@/types/api';

export const useMenu = () => {
  return useQuery<MenuItem[], Error>({
    queryKey: ['menu', 'available'],
    queryFn: async () => {
      try {
        return await menuAPI.getAvailable();
      } catch (error) {
        const apiError = handleAPIError(error);
        throw new Error(apiError.error);
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

**6. Custom Hook - useCreateOrder** (`frontend/src/hooks/useCreateOrder.ts`)

```typescript
import { useMutation } from '@tanstack/react-query';
import { orderAPI, handleAPIError } from '@/services/api';
import { saveOrderOffline, markOrderSynced } from '@/services/offline';
import type { CreateOrderRequest, Order } from '@/types/api';

export const useCreateOrder = () => {
  return useMutation<Order, Error, CreateOrderRequest>({
    mutationFn: async (request: CreateOrderRequest) => {
      try {
        // Create order on server
        const order = await orderAPI.create(request);

        // Save to IndexedDB
        await saveOrderOffline(order);

        // Mark as synced
        await markOrderSynced(order.id);

        return order;
      } catch (error) {
        const apiError = handleAPIError(error);

        // If network error, save offline
        if (apiError.code === 'NETWORK_ERROR' || apiError.code === 'TIMEOUT') {
          const offlineOrder: Order = {
            ...request,
            status: 'PENDING_PAYMENT',
            total_amount: request.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            created_at: new Date().toISOString(),
          };

          await saveOrderOffline(offlineOrder);

          // Return offline order (will sync later)
          return offlineOrder;
        }

        throw new Error(apiError.error);
      }
    },
    retry: false, // Don't retry mutations automatically
  });
};
```

**7. MenuSelector Component** (`frontend/src/components/MenuSelector.tsx`)

```typescript
import React, { useState } from 'react';
import type { MenuItem, OrderItem } from '@/types/api';

interface MenuSelectorProps {
  menuItems: MenuItem[];
  onSelectionChange: (items: OrderItem[]) => void;
}

export const MenuSelector: React.FC<MenuSelectorProps> = ({
  menuItems,
  onSelectionChange,
}) => {
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map());

  const handleQuantityChange = (item: MenuItem, delta: number) => {
    const currentQty = selectedItems.get(item.id) || 0;
    const newQty = Math.max(0, Math.min(10, currentQty + delta));

    const updated = new Map(selectedItems);
    if (newQty === 0) {
      updated.delete(item.id);
    } else {
      updated.set(item.id, newQty);
    }

    setSelectedItems(updated);

    // Convert to OrderItem array
    const orderItems: OrderItem[] = Array.from(updated.entries()).map(([id, quantity]) => {
      const menuItem = menuItems.find((m) => m.id === id)!;
      return {
        menu_item_id: id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
      };
    });

    onSelectionChange(orderItems);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">เมนู / Menu</h2>

      {menuItems.map((item) => {
        const quantity = selectedItems.get(item.id) || 0;
        const isSelected = quantity > 0;

        return (
          <div
            key={item.id}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-lg">{item.name}</h3>
                <p className="text-gray-600">฿{item.price.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, -1)}
                  disabled={quantity === 0}
                  className="
                    w-11 h-11 rounded-full bg-gray-200
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:bg-gray-300 active:bg-gray-400
                    flex items-center justify-center text-xl font-bold
                  "
                  aria-label="ลดจำนวน / Decrease"
                >
                  -
                </button>

                <span className="w-12 text-center font-semibold text-lg">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, 1)}
                  disabled={quantity >= 10}
                  className="
                    w-11 h-11 rounded-full bg-blue-500 text-white
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:bg-blue-600 active:bg-blue-700
                    flex items-center justify-center text-xl font-bold
                  "
                  aria-label="เพิ่มจำนวน / Increase"
                >
                  +
                </button>
              </div>
            </div>

            {isSelected && (
              <div className="mt-2 text-sm text-gray-600">
                รวม / Subtotal: ฿{(item.price * quantity).toFixed(2)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

**8. OrderSummary Component** (`frontend/src/components/OrderSummary.tsx`)

```typescript
import React from 'react';
import type { OrderItem } from '@/types/api';

interface OrderSummaryProps {
  items: OrderItem[];
  customerName: string;
  onEdit: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  customerName,
  onEdit,
}) => {
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">สรุปคำสั่งซื้อ / Order Summary</h3>

      <div className="space-y-3 mb-4">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span className="font-medium">
              ฿{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 mb-4">
        <div className="flex justify-between font-semibold text-lg">
          <span>รวมทั้งหมด / Total</span>
          <span className="text-blue-600">฿{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <div>ชื่อ / Name: <span className="font-medium">{customerName || '-'}</span></div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="
          w-full py-2 px-4 rounded-lg border border-gray-300
          hover:bg-gray-50 active:bg-gray-100
          text-sm font-medium
        "
      >
        แก้ไข / Edit
      </button>
    </div>
  );
};
```

**9. CustomerOrder Page** (`frontend/src/pages/CustomerOrder.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import { MenuSelector } from '@/components/MenuSelector';
import { OrderSummary } from '@/components/OrderSummary';
import { useMenu } from '@/hooks/useMenu';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { generateOrderID } from '@/utils/orderIdGenerator';
import type { OrderItem } from '@/types/api';

const getCurrentDay = (): number => {
  // In production, this would be calculated based on event dates
  // For now, hardcode to Day 1
  // TODO: Implement actual day calculation based on event start date
  return 1;
};

export const CustomerOrder: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [step, setStep] = useState<'order' | 'confirm' | 'success'>('order');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const { data: menuItems, isLoading, error } = useMenu();
  const createOrder = useCreateOrder();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'order') {
      // Move to confirmation
      setStep('confirm');
    } else if (step === 'confirm') {
      // Submit order
      const day = getCurrentDay();
      const id = generateOrderID(day);
      setOrderId(id);

      try {
        await createOrder.mutateAsync({
          id,
          customer_name: customerName,
          items: selectedItems,
          day,
        });

        setStep('success');
      } catch (error) {
        // Even if error, if saved offline, show success
        if (isOffline) {
          setStep('success');
        } else {
          alert('เกิดข้อผิดพลาด / Error occurred');
        }
      }
    }
  };

  const handleEdit = () => {
    setStep('order');
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isFormValid = customerName.trim().length >= 2 && selectedItems.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด / Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">ไม่สามารถโหลดเมนูได้ / Cannot load menu</p>
          <p className="text-red-600 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-2">สั่งซื้อสำเร็จ!</h2>
          <h3 className="text-xl text-gray-600 mb-6">Order Received!</h3>

          {isOffline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                บันทึกออฟไลน์ - จะส่งเมื่อมีอินเทอร์เน็ต<br />
                Saved offline - will sync when connected
              </p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">หมายเลขคำสั่งซื้อ / Order ID</p>
            <p className="text-4xl font-bold text-blue-600">{orderId}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="font-semibold mb-2">ขั้นตอนการชำระเงิน / Payment Steps:</p>
            <ol className="text-sm space-y-2 text-gray-700">
              <li>1. สแกน QR Code PromptPay ที่ร้าน</li>
              <li>2. โอนเงิน ฿{totalAmount.toFixed(2)}</li>
              <li>3. แสดงสลิปให้พนักงาน</li>
            </ol>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 font-medium"
          >
            สั่งอีกครั้ง / Order Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline indicator */}
      {isOffline && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm">
          ออฟไลน์ / Offline - คำสั่งซื้อจะถูกบันทึก / Orders will be saved
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Bar vidva</h1>
          <p className="text-gray-600">Kaset Fair 2025</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main order form */}
            <div className="lg:col-span-2 space-y-6">
              {step === 'order' ? (
                <>
                  {/* Customer name input */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <label className="block mb-2 font-medium">
                      ชื่อของคุณ / Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="กรอกชื่อ / Enter name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      minLength={2}
                      maxLength={50}
                      required
                    />
                    {customerName && customerName.length < 2 && (
                      <p className="text-red-500 text-sm mt-1">
                        ชื่อต้องมีอย่างน้อย 2 ตัวอักษร / Name must be at least 2 characters
                      </p>
                    )}
                  </div>

                  {/* Menu selector */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <MenuSelector
                      menuItems={menuItems || []}
                      onSelectionChange={setSelectedItems}
                    />
                  </div>
                </>
              ) : (
                /* Confirmation view */
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">ยืนยันคำสั่งซื้อ / Confirm Order</h2>

                  <div className="mb-6">
                    <div className="mb-4">
                      <span className="text-gray-600">ชื่อ / Name: </span>
                      <span className="font-medium">{customerName}</span>
                    </div>

                    <div className="space-y-2">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="flex justify-between py-2 border-b">
                          <span>{item.name} x {item.quantity}</span>
                          <span className="font-medium">฿{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between pt-4 text-lg font-semibold">
                      <span>รวมทั้งหมด / Total</span>
                      <span className="text-blue-600">฿{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="flex-1 py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium"
                    >
                      แก้ไข / Edit
                    </button>
                    <button
                      type="submit"
                      disabled={createOrder.isLoading}
                      className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {createOrder.isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          กำลังส่ง...
                        </span>
                      ) : (
                        'ยืนยัน / Confirm'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar summary */}
            <div className="lg:col-span-1">
              {step === 'order' && (
                <OrderSummary
                  items={selectedItems}
                  customerName={customerName}
                  onEdit={() => {}}
                />
              )}
            </div>
          </div>

          {/* Bottom action button for mobile */}
          {step === 'order' && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full py-4 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                ดำเนินการต่อ / Continue
              </button>
              {selectedItems.length > 0 && (
                <p className="text-center mt-2 text-sm text-gray-600">
                  รวม / Total: ฿{totalAmount.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
```

---

## IMPLEMENTATION PLAN

### Phase 1: Backend Foundation (Days 1-3)

#### Day 1: Database & Models
- [ ] Create database schema (SQL migrations)
- [ ] Seed menu items (French Fries S/M/L)
- [ ] Create Go models (Order, OrderItem, MenuItem)
- [ ] Set up PostgreSQL connection
- [ ] Create repository interfaces

**Acceptance Criteria**:
- Database schema created with all indexes
- Can manually insert and query orders
- Menu items seeded successfully

#### Day 2: Repository Layer
- [ ] Implement OrderRepository
- [ ] Implement MenuRepository
- [ ] Add transaction support
- [ ] Write repository unit tests
- [ ] Test with mock data

**Acceptance Criteria**:
- All repository methods work correctly
- Unit tests pass (>70% coverage)
- Transactions commit/rollback properly

#### Day 3: Service Layer & Handler
- [ ] Implement OrderService with validation
- [ ] Implement order ID generation utility
- [ ] Create order handler (POST /api/v1/orders)
- [ ] Add error handling and logging
- [ ] Write integration tests

**Acceptance Criteria**:
- Can create order via API endpoint
- Validation works correctly
- Errors return proper HTTP status codes
- Integration tests pass

### Phase 2: Frontend Implementation (Days 4-6)

#### Day 4: Project Setup & API Integration
- [ ] Create Vite + React + TypeScript project
- [ ] Set up TailwindCSS
- [ ] Create TypeScript types from Go models
- [ ] Implement API client with axios
- [ ] Set up TanStack Query
- [ ] Configure environment variables

**Acceptance Criteria**:
- Project builds successfully
- Can fetch menu from backend API
- Types match backend models exactly

#### Day 5: Core Components
- [ ] Implement MenuSelector component
- [ ] Implement OrderSummary component
- [ ] Create custom hooks (useMenu, useCreateOrder)
- [ ] Add form validation
- [ ] Test components in isolation

**Acceptance Criteria**:
- Components render correctly
- User can select items and quantities
- Form validation works
- Component tests pass

#### Day 6: Main Page & Integration
- [ ] Implement CustomerOrder page
- [ ] Integrate all components
- [ ] Add order ID generator
- [ ] Implement success screen
- [ ] Add loading and error states
- [ ] Mobile responsive design

**Acceptance Criteria**:
- Complete order flow works end-to-end
- Mobile responsive (375px+)
- Error messages display correctly
- Success screen shows order ID

### Phase 3: Offline Support (Days 7-8)

#### Day 7: IndexedDB Integration
- [ ] Set up idb library
- [ ] Implement offline storage service
- [ ] Save orders to IndexedDB
- [ ] Mark orders as synced
- [ ] Query unsynced orders

**Acceptance Criteria**:
- Orders saved to IndexedDB
- Can retrieve orders from IndexedDB
- Sync status tracked correctly

#### Day 8: Service Worker
- [ ] Create Service Worker
- [ ] Cache menu data (1 hour)
- [ ] Cache static assets
- [ ] Implement background sync
- [ ] Add offline indicator UI
- [ ] Test offline behavior

**Acceptance Criteria**:
- Service Worker registers successfully
- Menu cached for 1 hour
- Orders submit when back online
- Offline indicator shows correctly
- Works on 3G network

### Phase 4: Testing & Polish (Days 9-10)

#### Day 9: Testing
- [ ] Backend unit tests (>70% coverage)
- [ ] Frontend component tests
- [ ] Integration tests (E2E flow)
- [ ] Test offline scenarios
- [ ] Test on slow network (3G throttling)
- [ ] Test on mobile devices (iOS/Android)

**Acceptance Criteria**:
- All tests pass
- Coverage >70%
- Works on slow network
- Mobile experience smooth

#### Day 10: Polish & Documentation
- [ ] Add Thai/English error messages
- [ ] Optimize bundle size (<100KB)
- [ ] Add loading skeletons
- [ ] Improve accessibility
- [ ] Write README
- [ ] Document API endpoints
- [ ] Create deployment guide

**Acceptance Criteria**:
- Page weight <100KB
- Load time <3s on 3G
- Accessibility score >90
- Documentation complete

---

## TESTING STRATEGY

### Backend Tests

#### Unit Tests

**Order ID Generator** (`internal/utils/order_id_test.go`):
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
        {"Invalid day 0", 0, 1, "", true},
        {"Invalid day 10", 10, 1, "", true},
        {"Invalid sequence 0", 1, 0, "", true},
        {"Invalid sequence 1000", 1, 1000, "", true},
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

**Order Validation**:
```go
func TestValidateOrder(t *testing.T) {
    tests := []struct {
        name    string
        request CreateOrderRequest
        wantErr bool
        errMsg  string
    }{
        {
            name: "Valid order",
            request: CreateOrderRequest{
                ID: "1001",
                CustomerName: "John Doe",
                Items: []OrderItem{{MenuItemID: 1, Quantity: 2, Price: 40.0, Name: "French Fries S"}},
                Day: 1,
            },
            wantErr: false,
        },
        {
            name: "Customer name too short",
            request: CreateOrderRequest{
                ID: "1001",
                CustomerName: "A",
                Items: []OrderItem{{MenuItemID: 1, Quantity: 2}},
                Day: 1,
            },
            wantErr: true,
            errMsg: "customer name must be 2-50 characters",
        },
        // More test cases...
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := service.ValidateOrder(ctx, &tt.request)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateOrder() error = %v, wantErr %v", err, tt.wantErr)
            }
            if err != nil && tt.errMsg != "" {
                if !strings.Contains(err.Error(), tt.errMsg) {
                    t.Errorf("error message = %v, want to contain %v", err.Error(), tt.errMsg)
                }
            }
        })
    }
}
```

#### Integration Tests

**Create Order Endpoint**:
```go
func TestCreateOrderHandler(t *testing.T) {
    // Set up test database
    db := setupTestDB(t)
    defer db.Close()

    // Set up test server
    app := setupTestServer(db)

    tests := []struct {
        name       string
        request    CreateOrderRequest
        wantStatus int
    }{
        {
            name: "Successful order creation",
            request: CreateOrderRequest{
                ID: "1001",
                CustomerName: "Test User",
                Items: []OrderItem{{MenuItemID: 1, Quantity: 1, Price: 40.0, Name: "French Fries S"}},
                Day: 1,
            },
            wantStatus: 201,
        },
        {
            name: "Duplicate order ID",
            request: CreateOrderRequest{
                ID: "1001",
                CustomerName: "Test User 2",
                Items: []OrderItem{{MenuItemID: 1, Quantity: 1}},
                Day: 1,
            },
            wantStatus: 409,
        },
        // More test cases...
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            body, _ := json.Marshal(tt.request)
            req := httptest.NewRequest("POST", "/api/v1/orders", bytes.NewReader(body))
            req.Header.Set("Content-Type", "application/json")

            resp, _ := app.Test(req)

            if resp.StatusCode != tt.wantStatus {
                t.Errorf("status = %v, want %v", resp.StatusCode, tt.wantStatus)
            }
        })
    }
}
```

### Frontend Tests

#### Component Tests

**MenuSelector** (`MenuSelector.test.tsx`):
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuSelector } from './MenuSelector';

describe('MenuSelector', () => {
  const mockMenuItems = [
    { id: 1, name: 'French Fries S', price: 40, available: true },
    { id: 2, name: 'French Fries M', price: 60, available: true },
  ];

  it('renders menu items', () => {
    render(<MenuSelector menuItems={mockMenuItems} onSelectionChange={() => {}} />);
    expect(screen.getByText('French Fries S')).toBeInTheDocument();
    expect(screen.getByText('French Fries M')).toBeInTheDocument();
  });

  it('increments quantity on plus button click', () => {
    const onSelectionChange = jest.fn();
    render(<MenuSelector menuItems={mockMenuItems} onSelectionChange={onSelectionChange} />);

    const plusButtons = screen.getAllByLabelText(/increase/i);
    fireEvent.click(plusButtons[0]);

    expect(onSelectionChange).toHaveBeenCalledWith([
      { menu_item_id: 1, name: 'French Fries S', price: 40, quantity: 1 },
    ]);
  });

  it('limits quantity to max 10', () => {
    render(<MenuSelector menuItems={mockMenuItems} onSelectionChange={() => {}} />);

    const plusButton = screen.getAllByLabelText(/increase/i)[0];

    // Click 11 times
    for (let i = 0; i < 11; i++) {
      fireEvent.click(plusButton);
    }

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(plusButton).toBeDisabled();
  });
});
```

#### Integration Tests (E2E with MSW)

**Order Flow**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { CustomerOrder } from './CustomerOrder';

const server = setupServer(
  rest.get('/api/v1/menu', (req, res, ctx) => {
    return res(ctx.json([
      { id: 1, name: 'French Fries S', price: 40, available: true },
    ]));
  }),
  rest.post('/api/v1/orders', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: '1001', ...req.body }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Order Flow', () => {
  it('completes full order flow', async () => {
    render(<CustomerOrder />);

    // Wait for menu to load
    await waitFor(() => {
      expect(screen.getByText('French Fries S')).toBeInTheDocument();
    });

    // Enter name
    const nameInput = screen.getByPlaceholderText(/enter name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // Select item
    const plusButton = screen.getByLabelText(/increase/i);
    fireEvent.click(plusButton);

    // Continue
    const continueButton = screen.getByText(/continue/i);
    fireEvent.click(continueButton);

    // Confirm
    const confirmButton = screen.getByText(/confirm/i);
    fireEvent.click(confirmButton);

    // Check success screen
    await waitFor(() => {
      expect(screen.getByText(/order received/i)).toBeInTheDocument();
      expect(screen.getByText('1001')).toBeInTheDocument();
    });
  });

  it('handles offline scenario', async () => {
    // Mock network error
    server.use(
      rest.post('/api/v1/orders', (req, res, ctx) => {
        return res.networkError('Network error');
      })
    );

    render(<CustomerOrder />);

    // Complete order flow
    // ... (same as above)

    // Should still show success with offline indicator
    await waitFor(() => {
      expect(screen.getByText(/saved offline/i)).toBeInTheDocument();
    });
  });
});
```

### Manual Testing Checklist

**Desktop (Chrome, Firefox, Safari)**:
- [ ] Menu loads correctly
- [ ] Can select items and adjust quantities
- [ ] Form validation works
- [ ] Order submission succeeds
- [ ] Success screen displays order ID
- [ ] Offline mode saves order to IndexedDB

**Mobile (iOS Safari, Android Chrome)**:
- [ ] Touch targets are 44x44px
- [ ] Keyboard appears for name input
- [ ] Scrolling is smooth
- [ ] Bottom action button accessible
- [ ] Order flow completes successfully

**Network Conditions** (Chrome DevTools):
- [ ] Fast 3G: Page loads <3s
- [ ] Slow 3G: Page loads <5s
- [ ] Offline: Order saves to IndexedDB
- [ ] Intermittent: Order retries automatically

---

## VALIDATION CRITERIA

### Functional Validation

- [ ] QR code landing page loads at /order
- [ ] Menu displays French Fries (S/M/L) with correct prices
- [ ] Quantity controls work (min 1, max 10)
- [ ] Customer name input validates (2-50 chars, Thai/English)
- [ ] Order summary calculates total correctly
- [ ] Order ID generates in DXXX format
- [ ] Success screen shows order ID and payment instructions
- [ ] Offline orders save to IndexedDB
- [ ] Orders sync when back online

### Non-Functional Validation

**Performance**:
- [ ] Page weight <100KB (excluding menu data)
- [ ] Time to Interactive <5s on 3G
- [ ] Menu API response <500ms
- [ ] Order submission <1s (when online)

**Reliability**:
- [ ] Service Worker caches menu for 1 hour
- [ ] No duplicate orders from double-click
- [ ] Orders persist across browser refresh
- [ ] Idempotent order submission

**Usability**:
- [ ] Touch targets ≥44x44px
- [ ] Clear error messages (Thai/English)
- [ ] Loading states visible
- [ ] Works on iOS Safari and Android Chrome

**Security**:
- [ ] XSS prevention (sanitized inputs)
- [ ] Rate limiting (10 orders/IP/min)
- [ ] Server-side validation
- [ ] HTTPS only (production)

---

## ROLLOUT PLAN

### Pre-Launch

**Week Before Event**:
1. Deploy to production (Fly.io)
2. Run load tests (50+ concurrent users)
3. Test on real devices (staff phones)
4. Print QR codes (order + PromptPay)
5. Train staff on order flow
6. Set up monitoring (logs, metrics)

**Day Before Event**:
1. Verify database backups
2. Test end-to-end flow
3. Check offline mode
4. Confirm environment variables
5. Test with throttled network

### Launch Day (Day 1)

**Morning Setup**:
- [ ] Verify backend is running
- [ ] Check database connection
- [ ] Seed menu items if needed
- [ ] Test order submission
- [ ] Display QR codes at booth
- [ ] Brief staff on workflow

**During Event**:
- [ ] Monitor error logs
- [ ] Check database capacity
- [ ] Track order volume
- [ ] Collect staff feedback
- [ ] Note any issues

**End of Day**:
- [ ] Export orders to CSV (backup)
- [ ] Review error logs
- [ ] Fix critical issues
- [ ] Update documentation

### Post-Launch (Days 2-9)

**Daily Routine**:
1. Morning: Check system health
2. Noon: Monitor peak load
3. Evening: Export daily orders
4. Fix bugs as needed
5. Optimize based on usage patterns

**Metrics to Track**:
- Total orders per day
- Average order submission time
- Error rate
- Peak concurrent users
- Offline order rate

---

## EDGE CASES & ERROR HANDLING

### Duplicate Order Submissions

**Scenario**: Customer clicks "Confirm" twice rapidly

**Solution**:
- Frontend: Disable button after first click
- Backend: Check order ID uniqueness
- Return 409 Conflict if duplicate
- Frontend: Retry with new order ID

### Menu Price Changes Mid-Day

**Scenario**: Admin changes menu price while customers are ordering

**Solution**:
- Orders store historical prices
- Customer sees old price if menu cached
- Backend validates against current price
- If mismatch, return error with new price
- Frontend refetches menu and shows updated price

### Network Interruption During Submission

**Scenario**: Network drops mid-request

**Solution**:
- Order saved to IndexedDB immediately
- Show success to user
- Background sync retries automatically
- Service Worker handles retry logic
- User can check sync status

### Invalid Menu Item ID

**Scenario**: Menu item deleted while customer ordering

**Solution**:
- Backend validates menu item exists
- Return 400 Bad Request with error
- Frontend refetches menu
- Show message: "Menu updated, please reselect"
- Clear invalid items from cart

### Order ID Collision

**Scenario**: Client-side generates duplicate order ID

**Solution**:
- Backend checks uniqueness in database
- Return 409 Conflict
- Frontend generates new order ID
- Retry submission automatically (max 3 attempts)
- If all fail, show error message

### Database Connection Lost

**Scenario**: PostgreSQL connection drops

**Solution**:
- Backend retries with exponential backoff
- Context timeout prevents hanging
- Return 503 Service Unavailable
- Frontend shows retry option
- Logs error for investigation

### Rate Limit Exceeded

**Scenario**: Same IP submits >10 orders per minute

**Solution**:
- Fiber middleware blocks request
- Return 429 Too Many Requests
- Include Retry-After header
- Frontend shows cooldown timer
- User waits before retrying

---

## DEPLOYMENT & INFRASTRUCTURE

### Environment Configuration

**Backend (.env)**:
```bash
# Database
DATABASE_URL=postgresql://barvidva:password@db:5432/barvidva?sslmode=disable

# Redis
REDIS_URL=redis://redis:6379

# Server
PORT=8080
ENV=production

# Authentication (Phase 2)
STAFF_PASSWORD=kasetfair2025
ADMIN_PASSWORD=barvidva2025

# PromptPay (for display)
PROMPTPAY_NUMBER=0812345678

# Logging
LOG_LEVEL=info
```

**Frontend (.env)**:
```bash
VITE_API_URL=https://api.barvidva.com
```

### Docker Configuration

**Backend Dockerfile**:
```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Runtime
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
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

### Fly.io Deployment

**Deploy Steps**:
```bash
# Backend
cd backend
fly launch --name barvidva-api --region sin
fly postgres create --name barvidva-db --region sin
fly postgres attach barvidva-db
fly secrets set STAFF_PASSWORD=kasetfair2025 ADMIN_PASSWORD=barvidva2025
fly deploy

# Frontend
cd ../frontend
fly launch --name barvidva-web --region sin
fly secrets set VITE_API_URL=https://barvidva-api.fly.dev
fly deploy
```

### Monitoring & Logging

**Health Check Endpoint** (`/health`):
```go
func HealthCheck(c *fiber.Ctx) error {
    // Check database
    if err := db.Ping(); err != nil {
        return c.Status(503).JSON(fiber.Map{
            "status": "unhealthy",
            "database": "disconnected",
        })
    }

    return c.JSON(fiber.Map{
        "status": "healthy",
        "database": "connected",
        "timestamp": time.Now().UTC(),
    })
}
```

**Logging** (using zerolog):
```go
log.Info().
    Str("order_id", order.ID).
    Str("customer_name", order.CustomerName).
    Float64("total_amount", order.TotalAmount).
    Msg("Order created")
```

**Metrics to Track**:
- Orders per hour
- Average order value
- API response times
- Error rate
- Database query performance

---

## KNOWN LIMITATIONS & FUTURE WORK

### MVP Limitations

1. **Manual Day Selection**: Currently hardcoded to Day 1
   - Future: Calculate from event start date

2. **Static PromptPay QR**: Not dynamic per order
   - Future: Generate unique QR with order ID

3. **No Receipt Printer**: Manual order tracking only
   - Future: Bluetooth/USB printer integration

4. **Basic Analytics**: Limited to daily totals
   - Future: Hourly trends, peak hours, popular items

5. **No Multi-Language Toggle**: Mixed Thai/English UI
   - Future: Language switcher

### Technical Debt

1. **Client-Side Order ID**: Random generation may cause collisions
   - Future: Server-side sequence with atomic increment

2. **No Request Deduplication**: Relies on idempotency check
   - Future: Request ID in headers

3. **Basic Rate Limiting**: IP-based only
   - Future: Token bucket algorithm

4. **No Metrics Dashboard**: Manual log analysis
   - Future: Grafana dashboards

### Post-MVP Features

See Phase 2 in CLAUDE.md:
- Order tracking page (/queue/DXXX)
- Receipt printer integration
- Google Sheets export (n8n webhook)
- Analytics dashboard
- Multi-day statistics

---

## SUCCESS METRICS

### Launch Day Targets

- [ ] Zero downtime during operating hours
- [ ] <5% error rate on order submissions
- [ ] <3s average page load time
- [ ] 100% of orders captured (offline + online)
- [ ] Staff comfortable with system after 30min training

### 9-Day Event Targets

- [ ] 1000+ orders processed successfully
- [ ] 99% uptime across all days
- [ ] <1% duplicate orders
- [ ] <10% offline order rate
- [ ] Positive staff feedback on ease of use

### Technical Targets

- [ ] Backend test coverage >70%
- [ ] Frontend test coverage >70%
- [ ] API response time p95 <1s
- [ ] Database query time p95 <100ms
- [ ] Zero data loss incidents

---

## APPENDIX

### Related Documentation

- INITIAL.md: Original feature request
- CLAUDE.md: Full project documentation
- README.md: Setup instructions
- API.md: API documentation (to be created)

### Reference Links

- [Go Fiber Documentation](https://docs.gofiber.io/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [PostgreSQL sqlx](https://github.com/jmoiron/sqlx)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-30 | 1.0 | Initial PRP created |

---

## APPROVAL & SIGN-OFF

**Created By**: Claude AI
**Review Required**: Product Owner, Tech Lead
**Status**: Ready for Implementation

**Estimated Timeline**: 10 days
**Complexity**: High
**Priority**: P0 (Blocking for MVP)

**Dependencies**:
- PostgreSQL database setup
- Redis instance
- Fly.io account
- QR code printing
- Event dates confirmed

**Risks**:
- Network unreliability at event (mitigated by offline-first design)
- Order ID collisions (mitigated by backend validation)
- High concurrent load (mitigated by Go goroutines + load testing)

---

**END OF PRP**
