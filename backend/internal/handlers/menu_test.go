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

func TestMenuHandler_GetMenu(t *testing.T) {
	tests := []struct {
		name           string
		queryParam     string
		setupMock      func(*mocks.MockMenuService)
		wantStatusCode int
		wantCount      int
	}{
		{
			name:       "Get all menu items",
			queryParam: "",
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("GetAll", mock.Anything).Return([]models.MenuItem{
					{ID: 1, Name: "French Fries S", Price: 40, Available: true},
					{ID: 2, Name: "French Fries M", Price: 60, Available: true},
					{ID: 3, Name: "French Fries L", Price: 80, Available: false},
				}, nil)
			},
			wantStatusCode: http.StatusOK,
			wantCount:      3,
		},
		{
			name:       "Get available items only",
			queryParam: "?available=true",
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("GetAvailable", mock.Anything).Return([]models.MenuItem{
					{ID: 1, Name: "French Fries S", Price: 40, Available: true},
					{ID: 2, Name: "French Fries M", Price: 60, Available: true},
				}, nil)
			},
			wantStatusCode: http.StatusOK,
			wantCount:      2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockMenuService)
			tt.setupMock(mockService)

			handler := NewMenuHandler(mockService)

			app := fiber.New()
			app.Get("/menu", handler.GetMenu)

			req := httptest.NewRequest(http.MethodGet, "/menu"+tt.queryParam, nil)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			var items []models.MenuItem
			respBody, _ := io.ReadAll(resp.Body)
			json.Unmarshal(respBody, &items)
			assert.Len(t, items, tt.wantCount)

			mockService.AssertExpectations(t)
		})
	}
}

func TestMenuHandler_GetMenuItem(t *testing.T) {
	tests := []struct {
		name           string
		itemID         string
		setupMock      func(*mocks.MockMenuService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name:   "Item found",
			itemID: "1",
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("GetByID", mock.Anything, 1).Return(&models.MenuItem{
					ID: 1, Name: "French Fries S", Price: 40, Available: true,
				}, nil)
			},
			wantStatusCode: http.StatusOK,
			wantBody:       "French Fries S",
		},
		{
			name:   "Item not found",
			itemID: "999",
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("GetByID", mock.Anything, 999).Return(nil, errors.New("menu item not found"))
			},
			wantStatusCode: http.StatusNotFound,
			wantBody:       "MENU_ITEM_NOT_FOUND",
		},
		{
			name:           "Invalid ID format",
			itemID:         "abc",
			setupMock:      func(svc *mocks.MockMenuService) {},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "Invalid menu item ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockMenuService)
			tt.setupMock(mockService)

			handler := NewMenuHandler(mockService)

			app := fiber.New()
			app.Get("/menu/:id", handler.GetMenuItem)

			req := httptest.NewRequest(http.MethodGet, "/menu/"+tt.itemID, nil)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			respBody, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(respBody), tt.wantBody)

			mockService.AssertExpectations(t)
		})
	}
}

func TestMenuHandler_CreateMenuItem(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    any
		setupMock      func(*mocks.MockMenuService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name: "Successful creation",
			requestBody: models.MenuItem{
				Name:      "Cheese Fries",
				Price:     70,
				Available: true,
			},
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("Create", mock.Anything, mock.AnythingOfType("*models.MenuItem")).Return(&models.MenuItem{
					ID:        4,
					Name:      "Cheese Fries",
					Price:     70,
					Available: true,
				}, nil)
			},
			wantStatusCode: http.StatusCreated,
			wantBody:       "Cheese Fries",
		},
		{
			name: "Duplicate name",
			requestBody: models.MenuItem{
				Name:      "French Fries S",
				Price:     40,
				Available: true,
			},
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("Create", mock.Anything, mock.AnythingOfType("*models.MenuItem")).
					Return(nil, errors.New("menu item with name 'French Fries S' already exists"))
			},
			wantStatusCode: http.StatusConflict,
			wantBody:       "DUPLICATE_NAME",
		},
		{
			name: "Validation error",
			requestBody: models.MenuItem{
				Name:      "X",
				Price:     40,
				Available: true,
			},
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("Create", mock.Anything, mock.AnythingOfType("*models.MenuItem")).
					Return(nil, errors.New("name must be 2-100 characters"))
			},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "VALIDATION_ERROR",
		},
		{
			name:           "Invalid JSON",
			requestBody:    "invalid",
			setupMock:      func(svc *mocks.MockMenuService) {},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "Invalid request format",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockMenuService)
			tt.setupMock(mockService)

			handler := NewMenuHandler(mockService)

			app := fiber.New()
			app.Post("/menu", handler.CreateMenuItem)

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			req := httptest.NewRequest(http.MethodPost, "/menu", bytes.NewReader(body))
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

func TestMenuHandler_UpdateMenuItem(t *testing.T) {
	tests := []struct {
		name           string
		itemID         string
		requestBody    any
		setupMock      func(*mocks.MockMenuService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name:   "Successful update",
			itemID: "1",
			requestBody: models.MenuItem{
				Name:      "French Fries Small",
				Price:     45,
				Available: true,
			},
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("Update", mock.Anything, mock.AnythingOfType("*models.MenuItem")).Return(&models.MenuItem{
					ID:        1,
					Name:      "French Fries Small",
					Price:     45,
					Available: true,
				}, nil)
			},
			wantStatusCode: http.StatusOK,
			wantBody:       "French Fries Small",
		},
		{
			name:   "Item not found",
			itemID: "999",
			requestBody: models.MenuItem{
				Name:      "Ghost Item",
				Price:     50,
				Available: true,
			},
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("Update", mock.Anything, mock.AnythingOfType("*models.MenuItem")).
					Return(nil, errors.New("menu item not found"))
			},
			wantStatusCode: http.StatusNotFound,
			wantBody:       "MENU_ITEM_NOT_FOUND",
		},
		{
			name:           "Invalid ID",
			itemID:         "abc",
			requestBody:    models.MenuItem{Name: "Test", Price: 50},
			setupMock:      func(svc *mocks.MockMenuService) {},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "Invalid menu item ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockMenuService)
			tt.setupMock(mockService)

			handler := NewMenuHandler(mockService)

			app := fiber.New()
			app.Put("/menu/:id", handler.UpdateMenuItem)

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			req := httptest.NewRequest(http.MethodPut, "/menu/"+tt.itemID, bytes.NewReader(body))
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

func TestMenuHandler_DeleteMenuItem(t *testing.T) {
	tests := []struct {
		name           string
		itemID         string
		setupMock      func(*mocks.MockMenuService)
		wantStatusCode int
		wantBody       string
	}{
		{
			name:   "Successful deletion",
			itemID: "1",
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("Delete", mock.Anything, 1).Return(nil)
			},
			wantStatusCode: http.StatusOK,
			wantBody:       "deleted successfully",
		},
		{
			name:   "Item not found",
			itemID: "999",
			setupMock: func(svc *mocks.MockMenuService) {
				svc.On("Delete", mock.Anything, 999).Return(errors.New("menu item not found"))
			},
			wantStatusCode: http.StatusNotFound,
			wantBody:       "MENU_ITEM_NOT_FOUND",
		},
		{
			name:           "Invalid ID",
			itemID:         "abc",
			setupMock:      func(svc *mocks.MockMenuService) {},
			wantStatusCode: http.StatusBadRequest,
			wantBody:       "Invalid menu item ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := new(mocks.MockMenuService)
			tt.setupMock(mockService)

			handler := NewMenuHandler(mockService)

			app := fiber.New()
			app.Delete("/menu/:id", handler.DeleteMenuItem)

			req := httptest.NewRequest(http.MethodDelete, "/menu/"+tt.itemID, nil)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			respBody, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(respBody), tt.wantBody)

			mockService.AssertExpectations(t)
		})
	}
}
