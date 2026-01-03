package mocks

import (
	"context"

	"github.com/stretchr/testify/mock"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
)

// MockOrderRepository is a mock implementation of OrderRepository
type MockOrderRepository struct {
	mock.Mock
}

func (m *MockOrderRepository) Create(ctx context.Context, order *models.Order) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockOrderRepository) GetByID(ctx context.Context, id string) (*models.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Order), args.Error(1)
}

func (m *MockOrderRepository) CheckDuplicateID(ctx context.Context, id string) (bool, error) {
	args := m.Called(ctx, id)
	return args.Bool(0), args.Error(1)
}

func (m *MockOrderRepository) GetNextSequence(ctx context.Context, day int) (int, error) {
	args := m.Called(ctx, day)
	return args.Int(0), args.Error(1)
}

func (m *MockOrderRepository) GetByStatus(ctx context.Context, status models.OrderStatus) ([]models.Order, error) {
	args := m.Called(ctx, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Order), args.Error(1)
}

func (m *MockOrderRepository) GetByStatuses(ctx context.Context, statuses []models.OrderStatus) ([]models.Order, error) {
	args := m.Called(ctx, statuses)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Order), args.Error(1)
}

func (m *MockOrderRepository) UpdateStatus(ctx context.Context, id string, status models.OrderStatus) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockOrderRepository) VerifyPayment(ctx context.Context, id string, queueNumber int) error {
	args := m.Called(ctx, id, queueNumber)
	return args.Error(0)
}

func (m *MockOrderRepository) CompleteOrder(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockOrderRepository) GetNextQueueNumber(ctx context.Context, day int) (int, error) {
	args := m.Called(ctx, day)
	return args.Int(0), args.Error(1)
}
