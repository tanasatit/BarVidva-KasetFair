package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
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
	var maxSeq sql.NullInt64
	query := `
		SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER))
		FROM orders
		WHERE day = $1
	`
	err := r.db.GetContext(ctx, &maxSeq, query, day)
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
