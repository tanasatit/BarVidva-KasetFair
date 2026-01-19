package utils

import (
	"fmt"
	"strconv"
	"time"
)

// GenerateOrderID creates an order ID in DDMMXXX format.
//
// Format explanation:
// - First 2 digits: Day of month (01-31)
// - Next 2 digits: Month (01-12)
// - Last 3 digits: Sequential order number (001-999)
//
// Example: "1401001" = January 14, Order 1
//          "0702999" = February 7, Order 999
//
// We use this format because:
// 1. Staff can read and call out these numbers quickly
// 2. Works for any date (not limited to 9-day event)
// 3. Max capacity: 999 orders per day (sufficient for this booth)
// 4. Easy to identify which date an order belongs to
//
// Thread-safety: This function is pure and can be called from multiple
// goroutines safely. The actual sequence number management happens in
// the database with atomic increments.
func GenerateOrderID(dayOfMonth, month, sequence int) (string, error) {
	if dayOfMonth < 1 || dayOfMonth > 31 {
		return "", fmt.Errorf("day must be 1-31, got %d", dayOfMonth)
	}
	if month < 1 || month > 12 {
		return "", fmt.Errorf("month must be 1-12, got %d", month)
	}
	if sequence < 1 || sequence > 999 {
		return "", fmt.Errorf("sequence must be 1-999, got %d", sequence)
	}

	return fmt.Sprintf("%02d%02d%03d", dayOfMonth, month, sequence), nil
}

// GenerateOrderIDFromTime creates an order ID using current date
func GenerateOrderIDFromTime(t time.Time, sequence int) (string, error) {
	return GenerateOrderID(t.Day(), int(t.Month()), sequence)
}

// GetDateKey returns DDMM as integer for a given time (used for queue management)
// Example: January 14 -> 1401
func GetDateKey(t time.Time) int {
	return t.Day()*100 + int(t.Month())
}

// GetCurrentDateKey returns DDMM as integer for current time
func GetCurrentDateKey() int {
	return GetDateKey(time.Now())
}

// ValidateOrderIDFormat validates the order ID format (DDMMXXX)
// expectedDateKey is DDMM format (e.g., 1401 for January 14)
func ValidateOrderIDFormat(id string, expectedDateKey int) bool {
	if len(id) != 7 {
		return false
	}

	// Extract DDMM from order ID
	dateKey, err := strconv.Atoi(id[0:4])
	if err != nil || dateKey != expectedDateKey {
		return false
	}

	// Validate day (DD) - first 2 digits
	day, err := strconv.Atoi(id[0:2])
	if err != nil || day < 1 || day > 31 {
		return false
	}

	// Validate month (MM) - next 2 digits
	month, err := strconv.Atoi(id[2:4])
	if err != nil || month < 1 || month > 12 {
		return false
	}

	// Validate sequence (XXX) - last 3 digits
	seq, err := strconv.Atoi(id[4:7])
	if err != nil || seq < 1 || seq > 999 {
		return false
	}

	return true
}

// ParseOrderID extracts day, month, and sequence from order ID
func ParseOrderID(id string) (dayOfMonth int, month int, sequence int, err error) {
	if len(id) != 7 {
		return 0, 0, 0, fmt.Errorf("invalid order ID length: expected 7, got %d", len(id))
	}

	dayOfMonth, err = strconv.Atoi(id[0:2])
	if err != nil {
		return 0, 0, 0, fmt.Errorf("invalid day in order ID: %s", id[0:2])
	}
	if dayOfMonth < 1 || dayOfMonth > 31 {
		return 0, 0, 0, fmt.Errorf("day out of range: %d", dayOfMonth)
	}

	month, err = strconv.Atoi(id[2:4])
	if err != nil {
		return 0, 0, 0, fmt.Errorf("invalid month in order ID: %s", id[2:4])
	}
	if month < 1 || month > 12 {
		return 0, 0, 0, fmt.Errorf("month out of range: %d", month)
	}

	sequence, err = strconv.Atoi(id[4:7])
	if err != nil {
		return 0, 0, 0, fmt.Errorf("invalid sequence in order ID: %s", id[4:7])
	}

	return dayOfMonth, month, sequence, nil
}

// GetDateKeyFromOrderID extracts DDMM from order ID as integer
func GetDateKeyFromOrderID(id string) (int, error) {
	if len(id) != 7 {
		return 0, fmt.Errorf("invalid order ID length")
	}

	dateKey, err := strconv.Atoi(id[0:4])
	if err != nil {
		return 0, fmt.Errorf("invalid date in order ID")
	}

	return dateKey, nil
}
