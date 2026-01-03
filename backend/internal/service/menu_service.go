package service

import (
	"context"
	"fmt"
	"time"

	"github.com/tanasatit/barvidva-kasetfair/internal/models"
	"github.com/tanasatit/barvidva-kasetfair/internal/repository"
)

type MenuService interface {
	GetAll(ctx context.Context) ([]models.MenuItem, error)
	GetAvailable(ctx context.Context) ([]models.MenuItem, error)
	GetByID(ctx context.Context, id int) (*models.MenuItem, error)
	Create(ctx context.Context, item *models.MenuItem) (*models.MenuItem, error)
	Update(ctx context.Context, item *models.MenuItem) (*models.MenuItem, error)
	Delete(ctx context.Context, id int) error
}

type menuService struct {
	menuRepo repository.MenuRepository
}

func NewMenuService(menuRepo repository.MenuRepository) MenuService {
	return &menuService{
		menuRepo: menuRepo,
	}
}

// GetAll retrieves all menu items
func (s *menuService) GetAll(ctx context.Context) ([]models.MenuItem, error) {
	items, err := s.menuRepo.GetAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get all menu items: %w", err)
	}
	return items, nil
}

// GetAvailable retrieves only available menu items
func (s *menuService) GetAvailable(ctx context.Context) ([]models.MenuItem, error) {
	items, err := s.menuRepo.GetAvailable(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get available menu items: %w", err)
	}
	return items, nil
}

// GetByID retrieves a menu item by ID
func (s *menuService) GetByID(ctx context.Context, id int) (*models.MenuItem, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	item, err := s.menuRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get menu item: %w", err)
	}
	return item, nil
}

// Create creates a new menu item
func (s *menuService) Create(ctx context.Context, item *models.MenuItem) (*models.MenuItem, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Validate
	if err := s.validateMenuItem(item); err != nil {
		return nil, err
	}

	// Check for duplicate name
	exists, err := s.menuRepo.CheckDuplicateName(ctx, item.Name, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to check duplicate name: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("menu item with name '%s' already exists", item.Name)
	}

	if err := s.menuRepo.Create(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to create menu item: %w", err)
	}

	return item, nil
}

// Update modifies an existing menu item
func (s *menuService) Update(ctx context.Context, item *models.MenuItem) (*models.MenuItem, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Check if item exists
	if _, err := s.menuRepo.GetByID(ctx, item.ID); err != nil {
		return nil, fmt.Errorf("menu item not found: %w", err)
	}

	// Validate
	if err := s.validateMenuItem(item); err != nil {
		return nil, err
	}

	// Check for duplicate name (excluding current item)
	exists, err := s.menuRepo.CheckDuplicateName(ctx, item.Name, item.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check duplicate name: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("menu item with name '%s' already exists", item.Name)
	}

	if err := s.menuRepo.Update(ctx, item); err != nil {
		return nil, fmt.Errorf("failed to update menu item: %w", err)
	}

	return item, nil
}

// Delete removes a menu item
func (s *menuService) Delete(ctx context.Context, id int) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := s.menuRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete menu item: %w", err)
	}

	return nil
}

// validateMenuItem validates menu item fields
func (s *menuService) validateMenuItem(item *models.MenuItem) error {
	if len(item.Name) < 2 || len(item.Name) > 100 {
		return fmt.Errorf("name must be 2-100 characters")
	}
	if item.Price <= 0 || item.Price > 10000 {
		return fmt.Errorf("price must be between 0.01 and 10000")
	}
	return nil
}
