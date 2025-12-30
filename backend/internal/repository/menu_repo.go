package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
)

type MenuRepository interface {
	GetByID(ctx context.Context, id int) (*models.MenuItem, error)
	GetAll(ctx context.Context) ([]models.MenuItem, error)
	GetAvailable(ctx context.Context) ([]models.MenuItem, error)
}

type menuRepository struct {
	db *sqlx.DB
}

func NewMenuRepository(db *sqlx.DB) MenuRepository {
	return &menuRepository{db: db}
}

// GetByID retrieves a menu item by ID
func (r *menuRepository) GetByID(ctx context.Context, id int) (*models.MenuItem, error) {
	var item models.MenuItem
	query := `SELECT * FROM menu_items WHERE id = $1`
	err := r.db.GetContext(ctx, &item, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("menu item not found: %d", id)
		}
		return nil, fmt.Errorf("failed to get menu item: %w", err)
	}
	return &item, nil
}

// GetAll retrieves all menu items
func (r *menuRepository) GetAll(ctx context.Context) ([]models.MenuItem, error) {
	var items []models.MenuItem
	query := `SELECT * FROM menu_items ORDER BY id`
	err := r.db.SelectContext(ctx, &items, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all menu items: %w", err)
	}
	return items, nil
}

// GetAvailable retrieves only available menu items
func (r *menuRepository) GetAvailable(ctx context.Context) ([]models.MenuItem, error) {
	var items []models.MenuItem
	query := `SELECT * FROM menu_items WHERE available = true ORDER BY id`
	err := r.db.SelectContext(ctx, &items, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get available menu items: %w", err)
	}
	return items, nil
}
