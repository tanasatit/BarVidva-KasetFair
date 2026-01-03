package mocks

import (
	"context"

	"github.com/stretchr/testify/mock"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
)

// MockOrderService is a mock implementation of OrderService
type MockOrderService struct {
	mock.Mock
}

func (m *MockOrderService) CreateOrder(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Order), args.Error(1)
}

func (m *MockOrderService) ValidateOrder(ctx context.Context, req *models.CreateOrderRequest) error {
	args := m.Called(ctx, req)
	return args.Error(0)
}

func (m *MockOrderService) GetOrder(ctx context.Context, id string) (*models.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Order), args.Error(1)
}

func (m *MockOrderService) GetPendingPayment(ctx context.Context) ([]models.Order, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Order), args.Error(1)
}

func (m *MockOrderService) GetQueue(ctx context.Context) ([]models.Order, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Order), args.Error(1)
}

func (m *MockOrderService) VerifyPayment(ctx context.Context, id string) (*models.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Order), args.Error(1)
}

func (m *MockOrderService) CompleteOrder(ctx context.Context, id string) (*models.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Order), args.Error(1)
}

func (m *MockOrderService) CancelOrder(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
