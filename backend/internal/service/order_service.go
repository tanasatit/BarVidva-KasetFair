package service

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/tanasatit/barvidva-kasetfair/internal/models"
	"github.com/tanasatit/barvidva-kasetfair/internal/repository"
	"github.com/tanasatit/barvidva-kasetfair/internal/utils"
)

type OrderService interface {
	CreateOrder(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error)
	ValidateOrder(ctx context.Context, req *models.CreateOrderRequest) error
}

type orderService struct {
	orderRepo repository.OrderRepository
	menuRepo  repository.MenuRepository
	cache     utils.Cache
}

func NewOrderService(
	orderRepo repository.OrderRepository,
	menuRepo repository.MenuRepository,
	cache utils.Cache,
) OrderService {
	return &orderService{
		orderRepo: orderRepo,
		menuRepo:  menuRepo,
		cache:     cache,
	}
}

// CreateOrder creates a new order after validation
func (s *orderService) CreateOrder(ctx context.Context, req *models.CreateOrderRequest) (*models.Order, error) {
	// Set timeout for entire operation
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Validate order
	if err := s.ValidateOrder(ctx, req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Check for duplicate order ID
	exists, err := s.orderRepo.CheckDuplicateID(ctx, req.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check duplicate: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("order ID already exists: %s", req.ID)
	}

	// Calculate total amount (server-side verification)
	totalAmount := 0.0
	for _, item := range req.Items {
		totalAmount += item.Price * float64(item.Quantity)
	}

	// Create order object
	order := &models.Order{
		ID:           req.ID,
		CustomerName: req.CustomerName,
		Items:        req.Items,
		TotalAmount:  totalAmount,
		Status:       models.OrderStatusPendingPayment,
		Day:          req.Day,
		CreatedAt:    time.Now().UTC(),
	}

	// Use errgroup for concurrent operations
	g, gCtx := errgroup.WithContext(ctx)

	// Save to database
	g.Go(func() error {
		return s.orderRepo.Create(gCtx, order)
	})

	// Cache order for quick retrieval
	g.Go(func() error {
		return s.cache.SetOrder(gCtx, order)
	})

	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	return order, nil
}

// ValidateOrder validates the order request
func (s *orderService) ValidateOrder(ctx context.Context, req *models.CreateOrderRequest) error {
	// Validate customer name
	if len(req.CustomerName) < 2 || len(req.CustomerName) > 50 {
		return fmt.Errorf("customer name must be 2-50 characters")
	}

	// Validate day
	if req.Day < 1 || req.Day > 9 {
		return fmt.Errorf("day must be between 1 and 9")
	}

	// Validate order ID format
	if !utils.ValidateOrderIDFormat(req.ID, req.Day) {
		return fmt.Errorf("invalid order ID format")
	}

	// Validate items
	if len(req.Items) == 0 {
		return fmt.Errorf("order must contain at least one item")
	}

	// Validate each item exists and is available
	for i, item := range req.Items {
		// Check quantity
		if item.Quantity < 1 || item.Quantity > 10 {
			return fmt.Errorf("item %d: quantity must be 1-10", i)
		}

		// Verify menu item exists and is available
		menuItem, err := s.menuRepo.GetByID(ctx, item.MenuItemID)
		if err != nil {
			return fmt.Errorf("item %d: menu item not found", i)
		}

		if !menuItem.Available {
			return fmt.Errorf("item %d: menu item not available", i)
		}

		// Verify price matches (prevent client-side price manipulation)
		if item.Price != menuItem.Price {
			return fmt.Errorf("item %d: price mismatch", i)
		}
	}

	return nil
}
