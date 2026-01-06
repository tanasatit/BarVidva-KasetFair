package mocks

import (
	"context"

	"github.com/stretchr/testify/mock"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
)

// MockMenuService is a mock implementation of MenuService
type MockMenuService struct {
	mock.Mock
}

func (m *MockMenuService) GetAll(ctx context.Context) ([]models.MenuItem, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.MenuItem), args.Error(1)
}

func (m *MockMenuService) GetAvailable(ctx context.Context) ([]models.MenuItem, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.MenuItem), args.Error(1)
}

func (m *MockMenuService) GetByID(ctx context.Context, id int) (*models.MenuItem, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.MenuItem), args.Error(1)
}

func (m *MockMenuService) Create(ctx context.Context, item *models.MenuItem) (*models.MenuItem, error) {
	args := m.Called(ctx, item)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.MenuItem), args.Error(1)
}

func (m *MockMenuService) Update(ctx context.Context, item *models.MenuItem) (*models.MenuItem, error) {
	args := m.Called(ctx, item)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.MenuItem), args.Error(1)
}

func (m *MockMenuService) Delete(ctx context.Context, id int) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
