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
	Create(ctx context.Context, item *models.MenuItem) error
	Update(ctx context.Context, item *models.MenuItem) error
	Delete(ctx context.Context, id int) error
	CheckDuplicateName(ctx context.Context, name string, excludeID int) (bool, error)
	GetCategories(ctx context.Context) ([]string, error)
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

// Create inserts a new menu item
func (r *menuRepository) Create(ctx context.Context, item *models.MenuItem) error {
	query := `
		INSERT INTO menu_items (name, price, category, image_url, available, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		item.Name,
		item.Price,
		item.Category,
		item.ImageURL,
		item.Available,
	).Scan(&item.ID, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create menu item: %w", err)
	}
	return nil
}

// Update modifies an existing menu item
func (r *menuRepository) Update(ctx context.Context, item *models.MenuItem) error {
	query := `
		UPDATE menu_items
		SET name = $1, price = $2, category = $3, image_url = $4, available = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		item.Name,
		item.Price,
		item.Category,
		item.ImageURL,
		item.Available,
		item.ID,
	).Scan(&item.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("menu item not found: %d", item.ID)
		}
		return fmt.Errorf("failed to update menu item: %w", err)
	}
	return nil
}

// Delete removes a menu item by ID
func (r *menuRepository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM menu_items WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete menu item: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("menu item not found: %d", id)
	}

	return nil
}

// CheckDuplicateName checks if a menu item with the same name exists
// excludeID is used to exclude the current item when updating
func (r *menuRepository) CheckDuplicateName(ctx context.Context, name string, excludeID int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM menu_items WHERE name = $1 AND id != $2)`
	err := r.db.GetContext(ctx, &exists, query, name, excludeID)
	if err != nil {
		return false, fmt.Errorf("failed to check duplicate name: %w", err)
	}
	return exists, nil
}

// GetCategories retrieves all unique categories from menu items
func (r *menuRepository) GetCategories(ctx context.Context) ([]string, error) {
	var categories []string
	query := `SELECT DISTINCT category FROM menu_items WHERE category IS NOT NULL AND category != '' ORDER BY category`
	err := r.db.SelectContext(ctx, &categories, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}
	return categories, nil
}
