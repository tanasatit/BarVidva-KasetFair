package utils

import (
	"fmt"
	"strconv"
)

// GenerateOrderID creates an order ID in DXXX format.
//
// Format explanation:
// - First digit: Day of event (1-9)
// - Next 3 digits: Sequential order number (001-999)
//
// Example: "1001" = Day 1, Order 1
//          "9999" = Day 9, Order 999
//
// We use this simple format instead of UUIDs because:
// 1. Staff need to read these numbers quickly during service
// 2. Easier to call out loud ("Queue one-zero-zero-one")
// 3. Max capacity: 999 orders per day (sufficient for this event)
//
// Thread-safety: This function is pure and can be called from multiple
// goroutines safely. The actual sequence number management happens in
// the database with atomic increments.
func GenerateOrderID(day, sequence int) (string, error) {
	if day < 1 || day > 9 {
		return "", fmt.Errorf("day must be 1-9, got %d", day)
	}
	if sequence < 1 || sequence > 999 {
		return "", fmt.Errorf("sequence must be 1-999, got %d", sequence)
	}

	return fmt.Sprintf("%d%03d", day, sequence), nil
}

// ValidateOrderIDFormat validates the order ID format
func ValidateOrderIDFormat(id string, expectedDay int) bool {
	if len(id) != 4 {
		return false
	}

	day, err := strconv.Atoi(id[0:1])
	if err != nil || day != expectedDay {
		return false
	}

	seq, err := strconv.Atoi(id[1:4])
	if err != nil || seq < 1 || seq > 999 {
		return false
	}

	return true
}

// ParseOrderID extracts day and sequence from order ID
func ParseOrderID(id string) (day int, sequence int, err error) {
	if len(id) != 4 {
		return 0, 0, fmt.Errorf("invalid order ID length")
	}

	day, err = strconv.Atoi(id[0:1])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid day in order ID")
	}

	sequence, err = strconv.Atoi(id[1:4])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid sequence in order ID")
	}

	return day, sequence, nil
}
