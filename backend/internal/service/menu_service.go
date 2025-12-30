package service

import (
	"context"
	"fmt"

	"github.com/tanasatit/barvidva-kasetfair/internal/models"
	"github.com/tanasatit/barvidva-kasetfair/internal/repository"
)

type MenuService interface {
	GetAll(ctx context.Context) ([]models.MenuItem, error)
	GetAvailable(ctx context.Context) ([]models.MenuItem, error)
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
