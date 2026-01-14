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
	ID           string      `json:"id" db:"id" validate:"required,len=7"`
	CustomerName string      `json:"customer_name" db:"customer_name" validate:"required,min=2,max=50"`
	Items        []OrderItem `json:"items" validate:"required,min=1,dive"`
	TotalAmount  float64     `json:"total_amount" db:"total_amount" validate:"required,gt=0"`
	Status       OrderStatus `json:"status" db:"status"`
	DateKey      int         `json:"date_key" db:"date_key" validate:"required,min=101,max=3112"`
	QueueNumber  *int        `json:"queue_number,omitempty" db:"queue_number"`
	CreatedAt    time.Time   `json:"created_at" db:"created_at"`
	PaidAt       *time.Time  `json:"paid_at,omitempty" db:"paid_at"`
	CompletedAt  *time.Time  `json:"completed_at,omitempty" db:"completed_at"`
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
// Note: ID is optional - server generates sequential ID if not provided
type CreateOrderRequest struct {
	ID           string      `json:"id,omitempty"`
	CustomerName string      `json:"customer_name" validate:"required,min=2,max=50"`
	Items        []OrderItem `json:"items" validate:"required,min=1,dive"`
	DateKey      int         `json:"date_key" validate:"required,min=101,max=3112"`
}
