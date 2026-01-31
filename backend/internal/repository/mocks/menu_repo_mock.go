package mocks

import (
	"context"

	"github.com/stretchr/testify/mock"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
)

// MockMenuRepository is a mock implementation of MenuRepository
type MockMenuRepository struct {
	mock.Mock
}

func (m *MockMenuRepository) GetByID(ctx context.Context, id int) (*models.MenuItem, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.MenuItem), args.Error(1)
}

func (m *MockMenuRepository) GetAll(ctx context.Context) ([]models.MenuItem, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.MenuItem), args.Error(1)
}

func (m *MockMenuRepository) GetAvailable(ctx context.Context) ([]models.MenuItem, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.MenuItem), args.Error(1)
}

func (m *MockMenuRepository) Create(ctx context.Context, item *models.MenuItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockMenuRepository) Update(ctx context.Context, item *models.MenuItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockMenuRepository) Delete(ctx context.Context, id int) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockMenuRepository) CheckDuplicateName(ctx context.Context, name string, excludeID int) (bool, error) {
	args := m.Called(ctx, name, excludeID)
	return args.Bool(0), args.Error(1)
}

func (m *MockMenuRepository) GetCategories(ctx context.Context) ([]string, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]string), args.Error(1)
}
