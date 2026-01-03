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
	GetOrder(ctx context.Context, id string) (*models.Order, error)
	GetPendingPayment(ctx context.Context) ([]models.Order, error)
	GetQueue(ctx context.Context) ([]models.Order, error)
	VerifyPayment(ctx context.Context, id string) (*models.Order, error)
	CompleteOrder(ctx context.Context, id string) (*models.Order, error)
	CancelOrder(ctx context.Context, id string) error
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

// GetOrder retrieves an order by ID
func (s *orderService) GetOrder(ctx context.Context, id string) (*models.Order, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	return order, nil
}

// GetPendingPayment retrieves all orders waiting for payment verification
func (s *orderService) GetPendingPayment(ctx context.Context) ([]models.Order, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	orders, err := s.orderRepo.GetByStatus(ctx, models.OrderStatusPendingPayment)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending payment orders: %w", err)
	}

	return orders, nil
}

// GetQueue retrieves all orders in the active queue (paid but not completed)
func (s *orderService) GetQueue(ctx context.Context) ([]models.Order, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	orders, err := s.orderRepo.GetByStatus(ctx, models.OrderStatusPaid)
	if err != nil {
		return nil, fmt.Errorf("failed to get queue: %w", err)
	}

	return orders, nil
}

// VerifyPayment marks an order as paid and assigns a queue number
func (s *orderService) VerifyPayment(ctx context.Context, id string) (*models.Order, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Get the order to find its day
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	// Check if order is in pending payment status
	if order.Status != models.OrderStatusPendingPayment {
		return nil, fmt.Errorf("order is not in pending payment status")
	}

	// Get next queue number for the day
	queueNumber, err := s.orderRepo.GetNextQueueNumber(ctx, order.Day)
	if err != nil {
		return nil, fmt.Errorf("failed to get queue number: %w", err)
	}

	// Verify payment and assign queue number
	if err := s.orderRepo.VerifyPayment(ctx, id, queueNumber); err != nil {
		return nil, fmt.Errorf("failed to verify payment: %w", err)
	}

	// Get updated order
	updatedOrder, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated order: %w", err)
	}

	return updatedOrder, nil
}

// CompleteOrder marks an order as completed
func (s *orderService) CompleteOrder(ctx context.Context, id string) (*models.Order, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Check if order exists and is in paid status
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	if order.Status != models.OrderStatusPaid {
		return nil, fmt.Errorf("order is not in paid status")
	}

	// Complete the order
	if err := s.orderRepo.CompleteOrder(ctx, id); err != nil {
		return nil, fmt.Errorf("failed to complete order: %w", err)
	}

	// Get updated order
	updatedOrder, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated order: %w", err)
	}

	return updatedOrder, nil
}

// CancelOrder marks an order as cancelled
func (s *orderService) CancelOrder(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Check if order exists
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	// Only allow cancellation of pending payment orders
	if order.Status != models.OrderStatusPendingPayment {
		return fmt.Errorf("can only cancel orders with pending payment status")
	}

	if err := s.orderRepo.UpdateStatus(ctx, id, models.OrderStatusCancelled); err != nil {
		return fmt.Errorf("failed to cancel order: %w", err)
	}

	return nil
}
