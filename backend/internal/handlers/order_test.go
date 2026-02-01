package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
	"github.com/tanasatit/barvidva-kasetfair/internal/service/mocks"
)

func TestOrderHandler_CreateOrder(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    interface{}
		setupMock      func(*mocks.MockOrderService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name: "Successful order creation",
			requestBody: models.CreateOrderRequest{
				ID:           "14010001",
				CustomerName: "John Doe",
				DateKey:      1401,
				Items: []models.OrderItem{
					{MenuItemID: 1, Name: "French Fries S", Price: 40, Quantity: 2},
				},
			},
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("CreateOrder", mock.Anything, mock.AnythingOfType("*models.CreateOrderRequest")).Return(&models.Order{
					ID:           "14010001",
					CustomerName: "John Doe",
					TotalAmount:  80,
					Status:       models.OrderStatusPendingPayment,
					DateKey:      1401,
				}, nil)
			},
			wantStatusCode: http.StatusCreated,
			wantBody:       "14010001",
		},
		{
			name:           "Invalid JSON",
			requestBody:    "invalid json",
			setupMock:      func(svc *mocks.MockOrderService) {},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "Invalid request format",
		},
		{
			name: "Validation error",
			requestBody: models.CreateOrderRequest{
				ID:           "14010001",
				CustomerName: "J",
				DateKey:      1401,
				Items:        []models.OrderItem{},
			},
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("CreateOrder", mock.Anything, mock.AnythingOfType("*models.CreateOrderRequest")).
					Return(nil, errors.New("validation failed: customer name must be 2-50 characters"))
			},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "VALIDATION_ERROR",
		},
		{
			name: "Duplicate order",
			requestBody: models.CreateOrderRequest{
				ID:           "14010001",
				CustomerName: "John Doe",
				DateKey:      1401,
				Items: []models.OrderItem{
					{MenuItemID: 1, Name: "French Fries S", Price: 40, Quantity: 1},
				},
			},
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("CreateOrder", mock.Anything, mock.AnythingOfType("*models.CreateOrderRequest")).
					Return(nil, errors.New("order ID already exists: 14010001"))
			},
			wantStatusCode: http.StatusConflict,
			wantBody:       "DUPLICATE_ORDER",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockOrderService)
			tt.setupMock(mockService)

			handler := NewOrderHandler(mockService)

			app := fiber.New()
			app.Post("/orders", handler.CreateOrder)

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			req := httptest.NewRequest(http.MethodPost, "/orders", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			respBody, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(respBody), tt.wantBody)

			mockService.AssertExpectations(t)
		})
	}
}

func TestOrderHandler_GetOrder(t *testing.T) {
	tests := []struct {
		name           string
		orderID        string
		setupMock      func(*mocks.MockOrderService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name:    "Order found",
			orderID: "14010001",
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("GetOrder", mock.Anything, "14010001").Return(&models.Order{
					ID:           "14010001",
					CustomerName: "John Doe",
					Status:       models.OrderStatusPendingPayment,
				}, nil)
			},
			wantStatusCode: http.StatusOK,
			wantBody:       "14010001",
		},
		{
			name:    "Order not found",
			orderID: "9999",
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("GetOrder", mock.Anything, "9999").Return(nil, errors.New("order not found"))
			},
			wantStatusCode: http.StatusNotFound,
			wantBody:       "ORDER_NOT_FOUND",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockOrderService)
			tt.setupMock(mockService)

			handler := NewOrderHandler(mockService)

			app := fiber.New()
			app.Get("/orders/:id", handler.GetOrder)

			req := httptest.NewRequest(http.MethodGet, "/orders/"+tt.orderID, nil)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			respBody, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(respBody), tt.wantBody)

			mockService.AssertExpectations(t)
		})
	}
}

func TestOrderHandler_VerifyPayment(t *testing.T) {
	tests := []struct {
		name           string
		orderID        string
		setupMock      func(*mocks.MockOrderService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name:    "Successful verification",
			orderID: "14010001",
			setupMock: func(svc *mocks.MockOrderService) {
				queueNum := 1
				svc.On("VerifyPayment", mock.Anything, "14010001", mock.Anything).Return(&models.Order{
					ID:          "14010001",
					Status:      models.OrderStatusPaid,
					QueueNumber: &queueNum,
				}, nil)
			},
			wantStatusCode: http.StatusOK,
			wantBody:       "PAID",
		},
		{
			name:    "Order not found",
			orderID: "9999",
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("VerifyPayment", mock.Anything, "9999", mock.Anything).Return(nil, errors.New("order not found"))
			},
			wantStatusCode: http.StatusNotFound,
			wantBody:       "ORDER_NOT_FOUND",
		},
		{
			name:    "Invalid status",
			orderID: "14010001",
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("VerifyPayment", mock.Anything, "14010001", mock.Anything).Return(nil, errors.New("not in pending payment status"))
			},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "INVALID_STATUS",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockOrderService)
			tt.setupMock(mockService)

			handler := NewOrderHandler(mockService)

			app := fiber.New()
			app.Put("/orders/:id/verify", handler.VerifyPayment)

			req := httptest.NewRequest(http.MethodPut, "/orders/"+tt.orderID+"/verify", nil)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			respBody, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(respBody), tt.wantBody)

			mockService.AssertExpectations(t)
		})
	}
}

func TestOrderHandler_CompleteOrder(t *testing.T) {
	tests := []struct {
		name           string
		orderID        string
		setupMock      func(*mocks.MockOrderService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name:    "Successful completion",
			orderID: "14010001",
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("CompleteOrder", mock.Anything, "14010001").Return(&models.Order{
					ID:     "14010001",
					Status: models.OrderStatusCompleted,
				}, nil)
			},
			wantStatusCode: http.StatusOK,
			wantBody:       "COMPLETED",
		},
		{
			name:    "Not in paid status",
			orderID: "14010001",
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("CompleteOrder", mock.Anything, "14010001").Return(nil, errors.New("not in paid status"))
			},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "INVALID_STATUS",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockOrderService)
			tt.setupMock(mockService)

			handler := NewOrderHandler(mockService)

			app := fiber.New()
			app.Put("/orders/:id/complete", handler.CompleteOrder)

			req := httptest.NewRequest(http.MethodPut, "/orders/"+tt.orderID+"/complete", nil)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			respBody, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(respBody), tt.wantBody)

			mockService.AssertExpectations(t)
		})
	}
}

func TestOrderHandler_CancelOrder(t *testing.T) {
	tests := []struct {
		name           string
		orderID        string
		setupMock      func(*mocks.MockOrderService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name:    "Successful cancellation",
			orderID: "14010001",
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("CancelOrder", mock.Anything, "14010001").Return(nil)
			},
			wantStatusCode: http.StatusOK,
			wantBody:       "cancelled successfully",
		},
		{
			name:    "Cannot cancel paid order",
			orderID: "14010001",
			setupMock: func(svc *mocks.MockOrderService) {
				svc.On("CancelOrder", mock.Anything, "14010001").Return(errors.New("can only cancel orders with pending payment status"))
			},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "INVALID_STATUS",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockOrderService)
			tt.setupMock(mockService)

			handler := NewOrderHandler(mockService)

			app := fiber.New()
			app.Delete("/orders/:id", handler.CancelOrder)

			req := httptest.NewRequest(http.MethodDelete, "/orders/"+tt.orderID, nil)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			respBody, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(respBody), tt.wantBody)

			mockService.AssertExpectations(t)
		})
	}
}

func TestOrderHandler_GetQueue(t *testing.T) {
	mockService := new(mocks.MockOrderService)

	queueNum1, queueNum2 := 1, 2
	mockService.On("GetQueue", mock.Anything).Return([]models.Order{
		{ID: "14010001", Status: models.OrderStatusPaid, QueueNumber: &queueNum1},
		{ID: "14010002", Status: models.OrderStatusPaid, QueueNumber: &queueNum2},
	}, nil)

	handler := NewOrderHandler(mockService)

	app := fiber.New()
	app.Get("/queue", handler.GetQueue)

	req := httptest.NewRequest(http.MethodGet, "/queue", nil)

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	respBody, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(respBody), "14010001")
	assert.Contains(t, string(respBody), "14010002")

	mockService.AssertExpectations(t)
}

func TestOrderHandler_GetPendingPayment(t *testing.T) {
	mockService := new(mocks.MockOrderService)

	mockService.On("GetPendingPayment", mock.Anything).Return([]models.Order{
		{ID: "14010001", Status: models.OrderStatusPendingPayment},
		{ID: "14010002", Status: models.OrderStatusPendingPayment},
	}, nil)

	handler := NewOrderHandler(mockService)

	app := fiber.New()
	app.Get("/pending", handler.GetPendingPayment)

	req := httptest.NewRequest(http.MethodGet, "/pending", nil)

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	respBody, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(respBody), "PENDING_PAYMENT")

	mockService.AssertExpectations(t)
}
