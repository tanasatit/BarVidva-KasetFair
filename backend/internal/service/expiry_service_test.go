package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/tanasatit/barvidva-kasetfair/internal/repository/mocks"
)

func TestExpiryService_ExpireOldOrders(t *testing.T) {
	tests := []struct {
		name          string
		expiryMinutes int
		expiredCount  int64
		expectError   bool
	}{
		{
			name:          "No orders to expire",
			expiryMinutes: 60,
			expiredCount:  0,
			expectError:   false,
		},
		{
			name:          "Some orders expired",
			expiryMinutes: 60,
			expiredCount:  5,
			expectError:   false,
		},
		{
			name:          "Many orders expired",
			expiryMinutes: 10,
			expiredCount:  100,
			expectError:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup mock
			orderRepo := new(mocks.MockOrderRepository)

			// Setup expectations - the cutoff time will be approximately now - expiryMinutes
			orderRepo.On("ExpireOldOrders", mock.Anything, mock.AnythingOfType("time.Time")).
				Return(tt.expiredCount, nil).Once()

			// Create service
			service := NewExpiryService(orderRepo, tt.expiryMinutes, 1*time.Minute)

			// Test internal expiry method by starting and stopping quickly
			ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
			defer cancel()

			// Run in goroutine and let it execute once
			go service.Start(ctx)

			// Wait for context to complete
			<-ctx.Done()

			// Verify mock was called (it runs once immediately on start)
			orderRepo.AssertCalled(t, "ExpireOldOrders", mock.Anything, mock.AnythingOfType("time.Time"))
		})
	}
}

func TestExpiryService_NewExpiryService(t *testing.T) {
	orderRepo := new(mocks.MockOrderRepository)

	service := NewExpiryService(orderRepo, 60, 1*time.Minute)

	assert.NotNil(t, service)
	assert.Equal(t, 60, service.expiryMinutes)
	assert.Equal(t, 1*time.Minute, service.checkInterval)
}

func TestExpiryService_CutoffCalculation(t *testing.T) {
	orderRepo := new(mocks.MockOrderRepository)

	// Capture the cutoff time passed to ExpireOldOrders
	var capturedCutoff time.Time
	orderRepo.On("ExpireOldOrders", mock.Anything, mock.AnythingOfType("time.Time")).
		Run(func(args mock.Arguments) {
			capturedCutoff = args.Get(1).(time.Time)
		}).
		Return(int64(0), nil)

	// Create service with 60 minute expiry
	service := NewExpiryService(orderRepo, 60, 1*time.Hour)

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	go service.Start(ctx)
	<-ctx.Done()

	// Verify cutoff is approximately 60 minutes ago
	expectedCutoff := time.Now().UTC().Add(-60 * time.Minute)
	diff := expectedCutoff.Sub(capturedCutoff)

	// Allow 1 second tolerance for test execution time
	assert.True(t, diff > -1*time.Second && diff < 1*time.Second,
		"Cutoff should be approximately 60 minutes ago, diff: %v", diff)
}
