package service

import (
	"context"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/tanasatit/barvidva-kasetfair/internal/repository"
)

// ExpiryService handles automatic order expiration
type ExpiryService struct {
	orderRepo     repository.OrderRepository
	expiryMinutes int
	checkInterval time.Duration
}

// NewExpiryService creates a new expiry service with configurable timeouts
func NewExpiryService(orderRepo repository.OrderRepository, expiryMinutes int, checkInterval time.Duration) *ExpiryService {
	return &ExpiryService{
		orderRepo:     orderRepo,
		expiryMinutes: expiryMinutes,
		checkInterval: checkInterval,
	}
}

// Start begins the background expiry job.
// It runs until the context is cancelled (graceful shutdown).
func (s *ExpiryService) Start(ctx context.Context) {
	log.Info().
		Int("expiry_minutes", s.expiryMinutes).
		Dur("check_interval", s.checkInterval).
		Msg("Starting order expiry service")

	ticker := time.NewTicker(s.checkInterval)
	defer ticker.Stop()

	// Run once immediately on startup
	s.expireOldOrders(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Info().Msg("Stopping order expiry service")
			return
		case <-ticker.C:
			s.expireOldOrders(ctx)
		}
	}
}

// expireOldOrders cancels all orders that have been in PENDING_PAYMENT status
// for longer than the configured expiry time.
func (s *ExpiryService) expireOldOrders(ctx context.Context) {
	// Set a timeout for this operation
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	cutoff := time.Now().UTC().Add(-time.Duration(s.expiryMinutes) * time.Minute)

	count, err := s.orderRepo.ExpireOldOrders(ctx, cutoff)
	if err != nil {
		log.Error().
			Err(err).
			Time("cutoff", cutoff).
			Msg("Failed to expire old orders")
		return
	}

	if count > 0 {
		log.Info().
			Int64("expired_count", count).
			Int("expiry_minutes", s.expiryMinutes).
			Time("cutoff", cutoff).
			Msg("Expired old unpaid orders")
	}
}
