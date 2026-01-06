package service

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/tanasatit/barvidva-kasetfair/internal/models"
	"github.com/tanasatit/barvidva-kasetfair/internal/repository/mocks"
)

func TestMenuService_GetAll(t *testing.T) {
	menuRepo := new(mocks.MockMenuRepository)

	expectedItems := []models.MenuItem{
		{ID: 1, Name: "French Fries S", Price: 40, Available: true},
		{ID: 2, Name: "French Fries M", Price: 60, Available: true},
		{ID: 3, Name: "French Fries L", Price: 80, Available: false},
	}

	menuRepo.On("GetAll", mock.Anything).Return(expectedItems, nil)

	svc := NewMenuService(menuRepo)
	items, err := svc.GetAll(context.Background())

	assert.NoError(t, err)
	assert.Len(t, items, 3)
	assert.Equal(t, "French Fries S", items[0].Name)
	menuRepo.AssertExpectations(t)
}

func TestMenuService_GetAvailable(t *testing.T) {
	menuRepo := new(mocks.MockMenuRepository)

	expectedItems := []models.MenuItem{
		{ID: 1, Name: "French Fries S", Price: 40, Available: true},
		{ID: 2, Name: "French Fries M", Price: 60, Available: true},
	}

	menuRepo.On("GetAvailable", mock.Anything).Return(expectedItems, nil)

	svc := NewMenuService(menuRepo)
	items, err := svc.GetAvailable(context.Background())

	assert.NoError(t, err)
	assert.Len(t, items, 2)
	menuRepo.AssertExpectations(t)
}

func TestMenuService_GetByID(t *testing.T) {
	tests := []struct {
		name      string
		id        int
		setupMock func(*mocks.MockMenuRepository)
		wantErr   bool
	}{
		{
			name: "Item found",
			id:   1,
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("GetByID", mock.Anything, 1).Return(&models.MenuItem{
					ID: 1, Name: "French Fries S", Price: 40, Available: true,
				}, nil)
			},
			wantErr: false,
		},
		{
			name: "Item not found",
			id:   999,
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("GetByID", mock.Anything, 999).Return(nil, errors.New("menu item not found"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			menuRepo := new(mocks.MockMenuRepository)
			tt.setupMock(menuRepo)

			svc := NewMenuService(menuRepo)
			item, err := svc.GetByID(context.Background(), tt.id)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, item)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, item)
				assert.Equal(t, tt.id, item.ID)
			}

			menuRepo.AssertExpectations(t)
		})
	}
}

func TestMenuService_Create(t *testing.T) {
	tests := []struct {
		name      string
		item      *models.MenuItem
		setupMock func(*mocks.MockMenuRepository)
		wantErr   bool
		errMsg    string
	}{
		{
			name: "Successful creation",
			item: &models.MenuItem{
				Name:      "Cheese Fries",
				Price:     70,
				Available: true,
			},
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("CheckDuplicateName", mock.Anything, "Cheese Fries", 0).Return(false, nil)
				repo.On("Create", mock.Anything, mock.AnythingOfType("*models.MenuItem")).Return(nil)
			},
			wantErr: false,
		},
		{
			name: "Duplicate name",
			item: &models.MenuItem{
				Name:      "French Fries S",
				Price:     40,
				Available: true,
			},
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("CheckDuplicateName", mock.Anything, "French Fries S", 0).Return(true, nil)
			},
			wantErr: true,
			errMsg:  "already exists",
		},
		{
			name: "Name too short",
			item: &models.MenuItem{
				Name:      "X",
				Price:     40,
				Available: true,
			},
			setupMock: func(repo *mocks.MockMenuRepository) {},
			wantErr:   true,
			errMsg:    "name must be 2-100 characters",
		},
		{
			name: "Invalid price - zero",
			item: &models.MenuItem{
				Name:      "Free Item",
				Price:     0,
				Available: true,
			},
			setupMock: func(repo *mocks.MockMenuRepository) {},
			wantErr:   true,
			errMsg:    "price must be between 0.01 and 10000",
		},
		{
			name: "Invalid price - too high",
			item: &models.MenuItem{
				Name:      "Expensive Item",
				Price:     10001,
				Available: true,
			},
			setupMock: func(repo *mocks.MockMenuRepository) {},
			wantErr:   true,
			errMsg:    "price must be between 0.01 and 10000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			menuRepo := new(mocks.MockMenuRepository)
			tt.setupMock(menuRepo)

			svc := NewMenuService(menuRepo)
			item, err := svc.Create(context.Background(), tt.item)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, item)
				assert.Equal(t, tt.item.Name, item.Name)
			}

			menuRepo.AssertExpectations(t)
		})
	}
}

func TestMenuService_Update(t *testing.T) {
	tests := []struct {
		name      string
		item      *models.MenuItem
		setupMock func(*mocks.MockMenuRepository)
		wantErr   bool
		errMsg    string
	}{
		{
			name: "Successful update",
			item: &models.MenuItem{
				ID:        1,
				Name:      "French Fries Small",
				Price:     45,
				Available: true,
			},
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("GetByID", mock.Anything, 1).Return(&models.MenuItem{
					ID: 1, Name: "French Fries S", Price: 40, Available: true,
				}, nil)
				repo.On("CheckDuplicateName", mock.Anything, "French Fries Small", 1).Return(false, nil)
				repo.On("Update", mock.Anything, mock.AnythingOfType("*models.MenuItem")).Return(nil)
			},
			wantErr: false,
		},
		{
			name: "Item not found",
			item: &models.MenuItem{
				ID:        999,
				Name:      "Ghost Item",
				Price:     50,
				Available: true,
			},
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("GetByID", mock.Anything, 999).Return(nil, errors.New("menu item not found"))
			},
			wantErr: true,
			errMsg:  "not found",
		},
		{
			name: "Duplicate name on update",
			item: &models.MenuItem{
				ID:        1,
				Name:      "French Fries M",
				Price:     40,
				Available: true,
			},
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("GetByID", mock.Anything, 1).Return(&models.MenuItem{
					ID: 1, Name: "French Fries S", Price: 40, Available: true,
				}, nil)
				repo.On("CheckDuplicateName", mock.Anything, "French Fries M", 1).Return(true, nil)
			},
			wantErr: true,
			errMsg:  "already exists",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			menuRepo := new(mocks.MockMenuRepository)
			tt.setupMock(menuRepo)

			svc := NewMenuService(menuRepo)
			item, err := svc.Update(context.Background(), tt.item)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, item)
			}

			menuRepo.AssertExpectations(t)
		})
	}
}

func TestMenuService_Delete(t *testing.T) {
	tests := []struct {
		name      string
		id        int
		setupMock func(*mocks.MockMenuRepository)
		wantErr   bool
	}{
		{
			name: "Successful deletion",
			id:   1,
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("Delete", mock.Anything, 1).Return(nil)
			},
			wantErr: false,
		},
		{
			name: "Item not found",
			id:   999,
			setupMock: func(repo *mocks.MockMenuRepository) {
				repo.On("Delete", mock.Anything, 999).Return(errors.New("menu item not found"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			menuRepo := new(mocks.MockMenuRepository)
			tt.setupMock(menuRepo)

			svc := NewMenuService(menuRepo)
			err := svc.Delete(context.Background(), tt.id)

			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			menuRepo.AssertExpectations(t)
		})
	}
}
