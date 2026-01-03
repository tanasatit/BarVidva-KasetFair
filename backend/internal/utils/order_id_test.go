package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateOrderID(t *testing.T) {
	tests := []struct {
		name     string
		day      int
		sequence int
		want     string
		wantErr  bool
	}{
		{
			name:     "Day 1 Order 1",
			day:      1,
			sequence: 1,
			want:     "1001",
			wantErr:  false,
		},
		{
			name:     "Day 1 Order 999",
			day:      1,
			sequence: 999,
			want:     "1999",
			wantErr:  false,
		},
		{
			name:     "Day 9 Order 1",
			day:      9,
			sequence: 1,
			want:     "9001",
			wantErr:  false,
		},
		{
			name:     "Day 9 Order 999",
			day:      9,
			sequence: 999,
			want:     "9999",
			wantErr:  false,
		},
		{
			name:     "Day 5 Order 123",
			day:      5,
			sequence: 123,
			want:     "5123",
			wantErr:  false,
		},
		{
			name:     "Invalid day 0",
			day:      0,
			sequence: 1,
			want:     "",
			wantErr:  true,
		},
		{
			name:     "Invalid day 10",
			day:      10,
			sequence: 1,
			want:     "",
			wantErr:  true,
		},
		{
			name:     "Invalid day negative",
			day:      -1,
			sequence: 1,
			want:     "",
			wantErr:  true,
		},
		{
			name:     "Invalid sequence 0",
			day:      1,
			sequence: 0,
			want:     "",
			wantErr:  true,
		},
		{
			name:     "Invalid sequence 1000",
			day:      1,
			sequence: 1000,
			want:     "",
			wantErr:  true,
		},
		{
			name:     "Invalid sequence negative",
			day:      1,
			sequence: -1,
			want:     "",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GenerateOrderID(tt.day, tt.sequence)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Empty(t, got)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.want, got)
			}
		})
	}
}

func TestValidateOrderIDFormat(t *testing.T) {
	tests := []struct {
		name        string
		id          string
		expectedDay int
		want        bool
	}{
		{
			name:        "Valid ID day 1",
			id:          "1001",
			expectedDay: 1,
			want:        true,
		},
		{
			name:        "Valid ID day 9",
			id:          "9999",
			expectedDay: 9,
			want:        true,
		},
		{
			name:        "Valid ID mid range",
			id:          "5500",
			expectedDay: 5,
			want:        true,
		},
		{
			name:        "Wrong expected day",
			id:          "1001",
			expectedDay: 2,
			want:        false,
		},
		{
			name:        "Too short",
			id:          "100",
			expectedDay: 1,
			want:        false,
		},
		{
			name:        "Too long",
			id:          "10001",
			expectedDay: 1,
			want:        false,
		},
		{
			name:        "Empty string",
			id:          "",
			expectedDay: 1,
			want:        false,
		},
		{
			name:        "Invalid characters",
			id:          "1abc",
			expectedDay: 1,
			want:        false,
		},
		{
			name:        "Sequence 000 invalid",
			id:          "1000",
			expectedDay: 1,
			want:        false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateOrderIDFormat(tt.id, tt.expectedDay)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestParseOrderID(t *testing.T) {
	tests := []struct {
		name         string
		id           string
		wantDay      int
		wantSequence int
		wantErr      bool
	}{
		{
			name:         "Parse 1001",
			id:           "1001",
			wantDay:      1,
			wantSequence: 1,
			wantErr:      false,
		},
		{
			name:         "Parse 9999",
			id:           "9999",
			wantDay:      9,
			wantSequence: 999,
			wantErr:      false,
		},
		{
			name:         "Parse 5123",
			id:           "5123",
			wantDay:      5,
			wantSequence: 123,
			wantErr:      false,
		},
		{
			name:         "Too short",
			id:           "100",
			wantDay:      0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Too long",
			id:           "10001",
			wantDay:      0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Empty string",
			id:           "",
			wantDay:      0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Invalid day character",
			id:           "a001",
			wantDay:      0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Invalid sequence characters",
			id:           "1abc",
			wantDay:      0,
			wantSequence: 0,
			wantErr:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotDay, gotSequence, err := ParseOrderID(tt.id)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.wantDay, gotDay)
				assert.Equal(t, tt.wantSequence, gotSequence)
			}
		})
	}
}
