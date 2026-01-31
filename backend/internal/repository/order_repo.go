package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
)

type OrderRepository interface {
	Create(ctx context.Context, order *models.Order) error
	GetByID(ctx context.Context, id string) (*models.Order, error)
	CheckDuplicateID(ctx context.Context, id string) (bool, error)
	GetNextSequence(ctx context.Context, dateKey int) (int, error)
	GetByStatus(ctx context.Context, status models.OrderStatus) ([]models.Order, error)
	GetByStatusAndCategory(ctx context.Context, status models.OrderStatus, category string) ([]models.Order, error)
	GetByStatuses(ctx context.Context, statuses []models.OrderStatus) ([]models.Order, error)
	UpdateStatus(ctx context.Context, id string, status models.OrderStatus) error
	VerifyPayment(ctx context.Context, id string, queueNumber int, paymentMethod *models.PaymentMethod) error
	CompleteOrder(ctx context.Context, id string) error
	GetNextQueueNumber(ctx context.Context, dateKey int) (int, error)
	ExpireOldOrders(ctx context.Context, cutoff time.Time) (int64, error)
	DeleteOrders(ctx context.Context, orderIDs []string) (int64, error)
	DeleteAllOrders(ctx context.Context) (int64, error)
	GetCategories(ctx context.Context) ([]string, error)
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
	defer func() {
		if err := tx.Rollback(); err != nil && err != sql.ErrTxDone {
			log.Println("rollback failed:", err)
		}
	}()

	// Insert order
	query := `
		INSERT INTO orders (id, customer_name, total_amount, status, date_key, category, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = tx.ExecContext(ctx, query,
		order.ID,
		order.CustomerName,
		order.TotalAmount,
		order.Status,
		order.DateKey,
		order.Category,
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

// GetNextSequence gets the next sequence number for a given date key (DDMM format)
func (r *orderRepository) GetNextSequence(ctx context.Context, dateKey int) (int, error) {
	var maxSeq sql.NullInt64
	query := `
		SELECT MAX(CAST(SUBSTRING(id, 5) AS INTEGER))
		FROM orders
		WHERE date_key = $1
	`
	err := r.db.GetContext(ctx, &maxSeq, query, dateKey)
	if err != nil && err != sql.ErrNoRows {
		return 0, fmt.Errorf("failed to get next sequence: %w", err)
	}

	if !maxSeq.Valid {
		return 1, nil
	}

	return int(maxSeq.Int64) + 1, nil
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

// GetByStatus retrieves all orders with a specific status
func (r *orderRepository) GetByStatus(ctx context.Context, status models.OrderStatus) ([]models.Order, error) {
	var orders []models.Order
	query := `SELECT * FROM orders WHERE status = $1 ORDER BY created_at ASC`
	err := r.db.SelectContext(ctx, &orders, query, status)
	if err != nil {
		return nil, fmt.Errorf("failed to get orders by status: %w", err)
	}

	// Get items for each order
	for i := range orders {
		var items []models.OrderItem
		itemsQuery := `SELECT * FROM order_items WHERE order_id = $1`
		err = r.db.SelectContext(ctx, &items, itemsQuery, orders[i].ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get order items: %w", err)
		}
		orders[i].Items = items
	}

	return orders, nil
}

// GetByStatuses retrieves all orders with any of the specified statuses
// If statuses is nil or empty, returns all orders
func (r *orderRepository) GetByStatuses(ctx context.Context, statuses []models.OrderStatus) ([]models.Order, error) {
	var orders []models.Order
	var err error

	if len(statuses) == 0 {
		// Get all orders
		query := `SELECT * FROM orders ORDER BY created_at DESC`
		err = r.db.SelectContext(ctx, &orders, query)
	} else {
		query, args, buildErr := sqlx.In(`SELECT * FROM orders WHERE status IN (?) ORDER BY created_at ASC`, statuses)
		if buildErr != nil {
			return nil, fmt.Errorf("failed to build query: %w", buildErr)
		}
		query = r.db.Rebind(query)
		err = r.db.SelectContext(ctx, &orders, query, args...)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get orders by statuses: %w", err)
	}

	// Get items for each order
	for i := range orders {
		var items []models.OrderItem
		itemsQuery := `SELECT * FROM order_items WHERE order_id = $1`
		err = r.db.SelectContext(ctx, &items, itemsQuery, orders[i].ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get order items: %w", err)
		}
		orders[i].Items = items
	}

	return orders, nil
}

// UpdateStatus updates the status of an order
func (r *orderRepository) UpdateStatus(ctx context.Context, id string, status models.OrderStatus) error {
	query := `UPDATE orders SET status = $1 WHERE id = $2`
	result, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("order not found: %s", id)
	}

	return nil
}

// VerifyPayment marks an order as paid and assigns a queue number
func (r *orderRepository) VerifyPayment(ctx context.Context, id string, queueNumber int, paymentMethod *models.PaymentMethod) error {
	query := `
		UPDATE orders
		SET status = $1, queue_number = $2, paid_at = NOW(), payment_method = $3
		WHERE id = $4 AND status = $5
	`
	result, err := r.db.ExecContext(ctx, query, models.OrderStatusPaid, queueNumber, paymentMethod, id, models.OrderStatusPendingPayment)
	if err != nil {
		return fmt.Errorf("failed to verify payment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("order not found or not in pending payment status: %s", id)
	}

	return nil
}

// CompleteOrder marks an order as completed
func (r *orderRepository) CompleteOrder(ctx context.Context, id string) error {
	query := `
		UPDATE orders
		SET status = $1, completed_at = NOW()
		WHERE id = $2 AND status = $3
	`
	result, err := r.db.ExecContext(ctx, query, models.OrderStatusCompleted, id, models.OrderStatusPaid)
	if err != nil {
		return fmt.Errorf("failed to complete order: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("order not found or not in paid status: %s", id)
	}

	return nil
}

// GetNextQueueNumber gets the next queue number for a given date key (DDMM format)
func (r *orderRepository) GetNextQueueNumber(ctx context.Context, dateKey int) (int, error) {
	var maxQueue sql.NullInt64
	query := `
		SELECT MAX(queue_number)
		FROM orders
		WHERE date_key = $1 AND queue_number IS NOT NULL
	`
	err := r.db.GetContext(ctx, &maxQueue, query, dateKey)
	if err != nil && err != sql.ErrNoRows {
		return 0, fmt.Errorf("failed to get next queue number: %w", err)
	}

	if !maxQueue.Valid {
		return 1, nil
	}

	return int(maxQueue.Int64) + 1, nil
}

// ExpireOldOrders cancels all orders in PENDING_PAYMENT status that were created before the cutoff time.
// Returns the number of orders that were expired.
func (r *orderRepository) ExpireOldOrders(ctx context.Context, cutoff time.Time) (int64, error) {
	query := `
		UPDATE orders
		SET status = $1
		WHERE status = $2 AND created_at < $3
	`
	result, err := r.db.ExecContext(ctx, query, models.OrderStatusCancelled, models.OrderStatusPendingPayment, cutoff)
	if err != nil {
		return 0, fmt.Errorf("failed to expire old orders: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rowsAffected, nil
}

// DeleteOrders deletes orders by their IDs
func (r *orderRepository) DeleteOrders(ctx context.Context, orderIDs []string) (int64, error) {
	if len(orderIDs) == 0 {
		return 0, nil
	}

	query, args, err := sqlx.In(`DELETE FROM orders WHERE id IN (?)`, orderIDs)
	if err != nil {
		return 0, fmt.Errorf("failed to build query: %w", err)
	}
	query = r.db.Rebind(query)

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to delete orders: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rowsAffected, nil
}

// DeleteAllOrders deletes all orders from the database
func (r *orderRepository) DeleteAllOrders(ctx context.Context) (int64, error) {
	result, err := r.db.ExecContext(ctx, `DELETE FROM orders`)
	if err != nil {
		return 0, fmt.Errorf("failed to delete all orders: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rowsAffected, nil
}

// GetByStatusAndCategory retrieves all orders with a specific status and category
func (r *orderRepository) GetByStatusAndCategory(ctx context.Context, status models.OrderStatus, category string) ([]models.Order, error) {
	var orders []models.Order
	query := `SELECT * FROM orders WHERE status = $1 AND category = $2 ORDER BY created_at ASC`
	err := r.db.SelectContext(ctx, &orders, query, status, category)
	if err != nil {
		return nil, fmt.Errorf("failed to get orders by status and category: %w", err)
	}

	// Get items for each order
	for i := range orders {
		var items []models.OrderItem
		itemsQuery := `SELECT * FROM order_items WHERE order_id = $1`
		err = r.db.SelectContext(ctx, &items, itemsQuery, orders[i].ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get order items: %w", err)
		}
		orders[i].Items = items
	}

	return orders, nil
}

// GetCategories retrieves all unique categories from orders
func (r *orderRepository) GetCategories(ctx context.Context) ([]string, error) {
	var categories []string
	query := `SELECT DISTINCT category FROM orders WHERE category IS NOT NULL AND category != '' ORDER BY category`
	err := r.db.SelectContext(ctx, &categories, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}
	return categories, nil
}
