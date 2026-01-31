package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
	"github.com/tanasatit/barvidva-kasetfair/internal/repository/mocks"
	"github.com/tanasatit/barvidva-kasetfair/internal/utils"
)

func TestOrderService_CreateOrder(t *testing.T) {
	tests := []struct {
		name      string
		req       *models.CreateOrderRequest
		setupMock func(*mocks.MockOrderRepository, *mocks.MockMenuRepository)
		wantErr   bool
		errMsg    string
	}{
		{
			name: "Successful order creation",
			req: &models.CreateOrderRequest{
				CustomerName: "John Doe",
				DateKey:      1401,
				Items: []models.OrderItem{
					{MenuItemID: 1, Name: "French Fries S", Price: 40, Quantity: 2},
				},
			},
			setupMock: func(orderRepo *mocks.MockOrderRepository, menuRepo *mocks.MockMenuRepository) {
				menuRepo.On("GetByID", mock.Anything, 1).Return(&models.MenuItem{
					ID: 1, Name: "French Fries S", Price: 40, Available: true,
				}, nil)
				orderRepo.On("GetNextSequence", mock.Anything, 1401).Return(1, nil)
				orderRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.Order")).Return(nil)
			},
			wantErr: false,
		},
		{
			name: "Invalid customer name - too short",
			req: &models.CreateOrderRequest{
				CustomerName: "J",
				DateKey:      1401,
				Items: []models.OrderItem{
					{MenuItemID: 1, Name: "French Fries S", Price: 40, Quantity: 1},
				},
			},
			setupMock: func(orderRepo *mocks.MockOrderRepository, menuRepo *mocks.MockMenuRepository) {},
			wantErr:   true,
			errMsg:    "customer name must be 2-50 characters",
		},
		{
			name: "Invalid date_key",
			req: &models.CreateOrderRequest{
				CustomerName: "John Doe",
				DateKey:      5000,
				Items: []models.OrderItem{
					{MenuItemID: 1, Name: "French Fries S", Price: 40, Quantity: 1},
				},
			},
			setupMock: func(orderRepo *mocks.MockOrderRepository, menuRepo *mocks.MockMenuRepository) {},
			wantErr:   true,
			errMsg:    "date_key must be in DDMM format",
		},
		{
			name: "Empty items",
			req: &models.CreateOrderRequest{
				CustomerName: "John Doe",
				DateKey:      1401,
				Items:        []models.OrderItem{},
			},
			setupMock: func(orderRepo *mocks.MockOrderRepository, menuRepo *mocks.MockMenuRepository) {},
			wantErr:   true,
			errMsg:    "order must contain at least one item",
		},
		{
			name: "Menu item not available",
			req: &models.CreateOrderRequest{
				CustomerName: "John Doe",
				DateKey:      1401,
				Items: []models.OrderItem{
					{MenuItemID: 1, Name: "French Fries S", Price: 40, Quantity: 1},
				},
			},
			setupMock: func(orderRepo *mocks.MockOrderRepository, menuRepo *mocks.MockMenuRepository) {
				menuRepo.On("GetByID", mock.Anything, 1).Return(&models.MenuItem{
					ID: 1, Name: "French Fries S", Price: 40, Available: false,
				}, nil)
			},
			wantErr: true,
			errMsg:  "menu item not available",
		},
		{
			name: "Price mismatch",
			req: &models.CreateOrderRequest{
				CustomerName: "John Doe",
				DateKey:      1401,
				Items: []models.OrderItem{
					{MenuItemID: 1, Name: "French Fries S", Price: 50, Quantity: 1},
				},
			},
			setupMock: func(orderRepo *mocks.MockOrderRepository, menuRepo *mocks.MockMenuRepository) {
				menuRepo.On("GetByID", mock.Anything, 1).Return(&models.MenuItem{
					ID: 1, Name: "French Fries S", Price: 40, Available: true,
				}, nil)
			},
			wantErr: true,
			errMsg:  "price mismatch",
		},
		{
			name: "Invalid quantity",
			req: &models.CreateOrderRequest{
				CustomerName: "John Doe",
				DateKey:      1401,
				Items: []models.OrderItem{
					{MenuItemID: 1, Name: "French Fries S", Price: 40, Quantity: 101},
				},
			},
			setupMock: func(orderRepo *mocks.MockOrderRepository, menuRepo *mocks.MockMenuRepository) {},
			wantErr:   true,
			errMsg:    "quantity must be 1-100",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			orderRepo := new(mocks.MockOrderRepository)
			menuRepo := new(mocks.MockMenuRepository)
			cache := utils.NewNoOpCache()

			tt.setupMock(orderRepo, menuRepo)

			svc := NewOrderService(orderRepo, menuRepo, cache)
			order, err := svc.CreateOrder(context.Background(), tt.req)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
				assert.Nil(t, order)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, order)
				// ID is generated server-side, verify format
				assert.Len(t, order.ID, 7)
				assert.Equal(t, tt.req.CustomerName, order.CustomerName)
				assert.Equal(t, models.OrderStatusPendingPayment, order.Status)
			}

			orderRepo.AssertExpectations(t)
			menuRepo.AssertExpectations(t)
		})
	}
}

func TestOrderService_GetOrder(t *testing.T) {
	tests := []struct {
		name      string
		orderID   string
		setupMock func(*mocks.MockOrderRepository)
		wantErr   bool
	}{
		{
			name:    "Order found",
			orderID: "1401001",
			setupMock: func(repo *mocks.MockOrderRepository) {
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:           "1401001",
					CustomerName: "John Doe",
					Status:       models.OrderStatusPendingPayment,
				}, nil)
			},
			wantErr: false,
		},
		{
			name:    "Order not found",
			orderID: "9999999",
			setupMock: func(repo *mocks.MockOrderRepository) {
				repo.On("GetByID", mock.Anything, "9999999").Return(nil, errors.New("order not found"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			orderRepo := new(mocks.MockOrderRepository)
			menuRepo := new(mocks.MockMenuRepository)
			cache := utils.NewNoOpCache()

			tt.setupMock(orderRepo)

			svc := NewOrderService(orderRepo, menuRepo, cache)
			order, err := svc.GetOrder(context.Background(), tt.orderID)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, order)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, order)
				assert.Equal(t, tt.orderID, order.ID)
			}

			orderRepo.AssertExpectations(t)
		})
	}
}

func TestOrderService_VerifyPayment(t *testing.T) {
	tests := []struct {
		name      string
		orderID   string
		setupMock func(*mocks.MockOrderRepository)
		wantErr   bool
		errMsg    string
	}{
		{
			name:    "Successful payment verification",
			orderID: "1401001",
			setupMock: func(repo *mocks.MockOrderRepository) {
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:      "1401001",
					DateKey: 1401,
					Status:  models.OrderStatusPendingPayment,
				}, nil).Once()
				repo.On("GetNextQueueNumber", mock.Anything, 1401).Return(1, nil)
				repo.On("VerifyPayment", mock.Anything, "1401001", 1, mock.Anything).Return(nil)
				queueNum := 1
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:          "1401001",
					DateKey:     1401,
					Status:      models.OrderStatusPaid,
					QueueNumber: &queueNum,
				}, nil).Once()
			},
			wantErr: false,
		},
		{
			name:    "Order not in pending payment status",
			orderID: "1401001",
			setupMock: func(repo *mocks.MockOrderRepository) {
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:      "1401001",
					DateKey: 1401,
					Status:  models.OrderStatusPaid,
				}, nil)
			},
			wantErr: true,
			errMsg:  "not in pending payment status",
		},
		{
			name:    "Order not found",
			orderID: "9999999",
			setupMock: func(repo *mocks.MockOrderRepository) {
				repo.On("GetByID", mock.Anything, "9999999").Return(nil, errors.New("order not found"))
			},
			wantErr: true,
			errMsg:  "order not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			orderRepo := new(mocks.MockOrderRepository)
			menuRepo := new(mocks.MockMenuRepository)
			cache := utils.NewNoOpCache()

			tt.setupMock(orderRepo)

			svc := NewOrderService(orderRepo, menuRepo, cache)
			order, err := svc.VerifyPayment(context.Background(), tt.orderID, nil)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, order)
				assert.Equal(t, models.OrderStatusPaid, order.Status)
				assert.NotNil(t, order.QueueNumber)
			}

			orderRepo.AssertExpectations(t)
		})
	}
}

func TestOrderService_CompleteOrder(t *testing.T) {
	tests := []struct {
		name      string
		orderID   string
		setupMock func(*mocks.MockOrderRepository)
		wantErr   bool
		errMsg    string
	}{
		{
			name:    "Successful order completion",
			orderID: "1401001",
			setupMock: func(repo *mocks.MockOrderRepository) {
				queueNum := 1
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:          "1401001",
					Status:      models.OrderStatusPaid,
					QueueNumber: &queueNum,
				}, nil).Once()
				repo.On("CompleteOrder", mock.Anything, "1401001").Return(nil)
				completedAt := time.Now()
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:          "1401001",
					Status:      models.OrderStatusCompleted,
					QueueNumber: &queueNum,
					CompletedAt: &completedAt,
				}, nil).Once()
			},
			wantErr: false,
		},
		{
			name:    "Order not in paid status",
			orderID: "1401001",
			setupMock: func(repo *mocks.MockOrderRepository) {
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:     "1401001",
					Status: models.OrderStatusPendingPayment,
				}, nil)
			},
			wantErr: true,
			errMsg:  "not in paid status",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			orderRepo := new(mocks.MockOrderRepository)
			menuRepo := new(mocks.MockMenuRepository)
			cache := utils.NewNoOpCache()

			tt.setupMock(orderRepo)

			svc := NewOrderService(orderRepo, menuRepo, cache)
			order, err := svc.CompleteOrder(context.Background(), tt.orderID)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, order)
				assert.Equal(t, models.OrderStatusCompleted, order.Status)
			}

			orderRepo.AssertExpectations(t)
		})
	}
}

func TestOrderService_CancelOrder(t *testing.T) {
	tests := []struct {
		name      string
		orderID   string
		setupMock func(*mocks.MockOrderRepository)
		wantErr   bool
		errMsg    string
	}{
		{
			name:    "Successful order cancellation",
			orderID: "1401001",
			setupMock: func(repo *mocks.MockOrderRepository) {
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:     "1401001",
					Status: models.OrderStatusPendingPayment,
				}, nil)
				repo.On("UpdateStatus", mock.Anything, "1401001", models.OrderStatusCancelled).Return(nil)
			},
			wantErr: false,
		},
		{
			name:    "Cannot cancel paid order",
			orderID: "1401001",
			setupMock: func(repo *mocks.MockOrderRepository) {
				repo.On("GetByID", mock.Anything, "1401001").Return(&models.Order{
					ID:     "1401001",
					Status: models.OrderStatusPaid,
				}, nil)
			},
			wantErr: true,
			errMsg:  "can only cancel orders with pending payment status",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			orderRepo := new(mocks.MockOrderRepository)
			menuRepo := new(mocks.MockMenuRepository)
			cache := utils.NewNoOpCache()

			tt.setupMock(orderRepo)

			svc := NewOrderService(orderRepo, menuRepo, cache)
			err := svc.CancelOrder(context.Background(), tt.orderID)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
			}

			orderRepo.AssertExpectations(t)
		})
	}
}

func TestOrderService_GetPendingPayment(t *testing.T) {
	orderRepo := new(mocks.MockOrderRepository)
	menuRepo := new(mocks.MockMenuRepository)
	cache := utils.NewNoOpCache()

	expectedOrders := []models.Order{
		{ID: "1401001", Status: models.OrderStatusPendingPayment},
		{ID: "1401002", Status: models.OrderStatusPendingPayment},
	}

	orderRepo.On("GetByStatus", mock.Anything, models.OrderStatusPendingPayment).Return(expectedOrders, nil)

	svc := NewOrderService(orderRepo, menuRepo, cache)
	orders, err := svc.GetPendingPayment(context.Background())

	assert.NoError(t, err)
	assert.Len(t, orders, 2)
	orderRepo.AssertExpectations(t)
}

func TestOrderService_GetQueue(t *testing.T) {
	orderRepo := new(mocks.MockOrderRepository)
	menuRepo := new(mocks.MockMenuRepository)
	cache := utils.NewNoOpCache()

	queueNum1, queueNum2 := 1, 2
	expectedOrders := []models.Order{
		{ID: "1401001", Status: models.OrderStatusPaid, QueueNumber: &queueNum1},
		{ID: "1401002", Status: models.OrderStatusPaid, QueueNumber: &queueNum2},
	}

	orderRepo.On("GetByStatus", mock.Anything, models.OrderStatusPaid).Return(expectedOrders, nil)

	svc := NewOrderService(orderRepo, menuRepo, cache)
	orders, err := svc.GetQueue(context.Background())

	assert.NoError(t, err)
	assert.Len(t, orders, 2)
	orderRepo.AssertExpectations(t)
}
