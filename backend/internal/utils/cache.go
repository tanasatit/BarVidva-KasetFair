package utils

import (
	"context"

	"github.com/tanasatit/barvidva-kasetfair/internal/models"
)

// Cache is a simple in-memory cache interface
// For MVP, we use a no-op implementation. Redis will be added in Phase 2.
type Cache interface {
	SetOrder(ctx context.Context, order *models.Order) error
	GetOrder(ctx context.Context, id string) (*models.Order, error)
}

// NoOpCache is a no-op cache implementation for MVP
type NoOpCache struct{}

func NewNoOpCache() Cache {
	return &NoOpCache{}
}

func (c *NoOpCache) SetOrder(ctx context.Context, order *models.Order) error {
	// No-op for MVP
	return nil
}

func (c *NoOpCache) GetOrder(ctx context.Context, id string) (*models.Order, error) {
	// No-op for MVP
	return nil, nil
}
