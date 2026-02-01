package utils

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGenerateOrderID(t *testing.T) {
	tests := []struct {
		name       string
		dayOfMonth int
		month      int
		sequence   int
		want       string
		wantErr    bool
	}{
		{
			name:       "January 1st Order 1",
			dayOfMonth: 1,
			month:      1,
			sequence:   1,
			want:       "01010001",
			wantErr:    false,
		},
		{
			name:       "January 14th Order 1",
			dayOfMonth: 14,
			month:      1,
			sequence:   1,
			want:       "14010001",
			wantErr:    false,
		},
		{
			name:       "February 7th Order 999",
			dayOfMonth: 7,
			month:      2,
			sequence:   999,
			want:       "07020999",
			wantErr:    false,
		},
		{
			name:       "December 31st Order 500",
			dayOfMonth: 31,
			month:      12,
			sequence:   500,
			want:       "31120500",
			wantErr:    false,
		},
		{
			name:       "June 15th Order 123",
			dayOfMonth: 15,
			month:      6,
			sequence:   123,
			want:       "15060123",
			wantErr:    false,
		},
		{
			name:       "February 7th Order 9999",
			dayOfMonth: 7,
			month:      2,
			sequence:   9999,
			want:       "07029999",
			wantErr:    false,
		},
		{
			name:       "March 1st Order 1000",
			dayOfMonth: 1,
			month:      3,
			sequence:   1000,
			want:       "01031000",
			wantErr:    false,
		},
		{
			name:       "April 15th Order 5000",
			dayOfMonth: 15,
			month:      4,
			sequence:   5000,
			want:       "15045000",
			wantErr:    false,
		},
		{
			name:       "Invalid day 0",
			dayOfMonth: 0,
			month:      1,
			sequence:   1,
			want:       "",
			wantErr:    true,
		},
		{
			name:       "Invalid day 32",
			dayOfMonth: 32,
			month:      1,
			sequence:   1,
			want:       "",
			wantErr:    true,
		},
		{
			name:       "Invalid day negative",
			dayOfMonth: -1,
			month:      1,
			sequence:   1,
			want:       "",
			wantErr:    true,
		},
		{
			name:       "Invalid month 0",
			dayOfMonth: 1,
			month:      0,
			sequence:   1,
			want:       "",
			wantErr:    true,
		},
		{
			name:       "Invalid month 13",
			dayOfMonth: 1,
			month:      13,
			sequence:   1,
			want:       "",
			wantErr:    true,
		},
		{
			name:       "Invalid sequence 0",
			dayOfMonth: 1,
			month:      1,
			sequence:   0,
			want:       "",
			wantErr:    true,
		},
		{
			name:       "Invalid sequence 10000",
			dayOfMonth: 1,
			month:      1,
			sequence:   10000,
			want:       "",
			wantErr:    true,
		},
		{
			name:       "Invalid sequence negative",
			dayOfMonth: 1,
			month:      1,
			sequence:   -1,
			want:       "",
			wantErr:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GenerateOrderID(tt.dayOfMonth, tt.month, tt.sequence)
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

func TestGenerateOrderIDFromTime(t *testing.T) {
	// Test with specific date: January 14, 2026
	testTime := time.Date(2026, time.January, 14, 10, 30, 0, 0, time.UTC)

	got, err := GenerateOrderIDFromTime(testTime, 1)
	assert.NoError(t, err)
	assert.Equal(t, "14010001", got)

	// Test with different date: December 25
	testTime2 := time.Date(2026, time.December, 25, 10, 30, 0, 0, time.UTC)
	got2, err := GenerateOrderIDFromTime(testTime2, 9999)
	assert.NoError(t, err)
	assert.Equal(t, "25129999", got2)
}

func TestGetDateKey(t *testing.T) {
	tests := []struct {
		name string
		time time.Time
		want int
	}{
		{
			name: "January 1",
			time: time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC),
			want: 101,
		},
		{
			name: "January 14",
			time: time.Date(2026, time.January, 14, 0, 0, 0, 0, time.UTC),
			want: 1401,
		},
		{
			name: "February 7",
			time: time.Date(2026, time.February, 7, 0, 0, 0, 0, time.UTC),
			want: 702,
		},
		{
			name: "December 31",
			time: time.Date(2026, time.December, 31, 0, 0, 0, 0, time.UTC),
			want: 3112,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GetDateKey(tt.time)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestValidateOrderIDFormat(t *testing.T) {
	tests := []struct {
		name            string
		id              string
		expectedDateKey int
		want            bool
	}{
		{
			name:            "Valid ID January 14",
			id:              "14010001",
			expectedDateKey: 1401,
			want:            true,
		},
		{
			name:            "Valid ID January 1",
			id:              "01010001",
			expectedDateKey: 101,
			want:            true,
		},
		{
			name:            "Valid ID December 31",
			id:              "31129999",
			expectedDateKey: 3112,
			want:            true,
		},
		{
			name:            "Valid ID February 7",
			id:              "07020500",
			expectedDateKey: 702,
			want:            true,
		},
		{
			name:            "Valid ID with 4-digit sequence 1000",
			id:              "14011000",
			expectedDateKey: 1401,
			want:            true,
		},
		{
			name:            "Valid ID with 4-digit sequence 5000",
			id:              "14015000",
			expectedDateKey: 1401,
			want:            true,
		},
		{
			name:            "Wrong expected date key",
			id:              "14010001",
			expectedDateKey: 1501,
			want:            false,
		},
		{
			name:            "Too short (7 chars)",
			id:              "1401001",
			expectedDateKey: 1401,
			want:            false,
		},
		{
			name:            "Too long (9 chars)",
			id:              "140100001",
			expectedDateKey: 1401,
			want:            false,
		},
		{
			name:            "Empty string",
			id:              "",
			expectedDateKey: 1401,
			want:            false,
		},
		{
			name:            "Invalid characters",
			id:              "14a10001",
			expectedDateKey: 1401,
			want:            false,
		},
		{
			name:            "Sequence 0000 invalid",
			id:              "14010000",
			expectedDateKey: 1401,
			want:            false,
		},
		{
			name:            "Invalid day 00",
			id:              "00010001",
			expectedDateKey: 1,
			want:            false,
		},
		{
			name:            "Invalid day 32",
			id:              "32010001",
			expectedDateKey: 3201,
			want:            false,
		},
		{
			name:            "Invalid month 00",
			id:              "01000001",
			expectedDateKey: 100,
			want:            false,
		},
		{
			name:            "Invalid month 13",
			id:              "01130001",
			expectedDateKey: 113,
			want:            false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateOrderIDFormat(tt.id, tt.expectedDateKey)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestParseOrderID(t *testing.T) {
	tests := []struct {
		name         string
		id           string
		wantDay      int
		wantMonth    int
		wantSequence int
		wantErr      bool
	}{
		{
			name:         "Parse 14010001",
			id:           "14010001",
			wantDay:      14,
			wantMonth:    1,
			wantSequence: 1,
			wantErr:      false,
		},
		{
			name:         "Parse 01010001",
			id:           "01010001",
			wantDay:      1,
			wantMonth:    1,
			wantSequence: 1,
			wantErr:      false,
		},
		{
			name:         "Parse 31129999",
			id:           "31129999",
			wantDay:      31,
			wantMonth:    12,
			wantSequence: 9999,
			wantErr:      false,
		},
		{
			name:         "Parse 07020500",
			id:           "07020500",
			wantDay:      7,
			wantMonth:    2,
			wantSequence: 500,
			wantErr:      false,
		},
		{
			name:         "Parse 14011000 (4-digit sequence)",
			id:           "14011000",
			wantDay:      14,
			wantMonth:    1,
			wantSequence: 1000,
			wantErr:      false,
		},
		{
			name:         "Parse 14015000 (4-digit sequence)",
			id:           "14015000",
			wantDay:      14,
			wantMonth:    1,
			wantSequence: 5000,
			wantErr:      false,
		},
		{
			name:         "Too short (7 chars)",
			id:           "1401001",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Too long (9 chars)",
			id:           "140100001",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Empty string",
			id:           "",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Invalid day characters",
			id:           "ab010001",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Invalid month characters",
			id:           "14ab0001",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Invalid sequence characters",
			id:           "1401abcd",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Day out of range (0)",
			id:           "00010001",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Day out of range (32)",
			id:           "32010001",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Month out of range (0)",
			id:           "01000001",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
		{
			name:         "Month out of range (13)",
			id:           "01130001",
			wantDay:      0,
			wantMonth:    0,
			wantSequence: 0,
			wantErr:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotDay, gotMonth, gotSequence, err := ParseOrderID(tt.id)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.wantDay, gotDay)
				assert.Equal(t, tt.wantMonth, gotMonth)
				assert.Equal(t, tt.wantSequence, gotSequence)
			}
		})
	}
}

func TestGetDateKeyFromOrderID(t *testing.T) {
	tests := []struct {
		name    string
		id      string
		want    int
		wantErr bool
	}{
		{
			name:    "Valid ID 14010001",
			id:      "14010001",
			want:    1401,
			wantErr: false,
		},
		{
			name:    "Valid ID 01010001",
			id:      "01010001",
			want:    101,
			wantErr: false,
		},
		{
			name:    "Valid ID 31129999",
			id:      "31129999",
			want:    3112,
			wantErr: false,
		},
		{
			name:    "Too short (7 chars)",
			id:      "1401001",
			want:    0,
			wantErr: true,
		},
		{
			name:    "Too long (9 chars)",
			id:      "140100001",
			want:    0,
			wantErr: true,
		},
		{
			name:    "Invalid characters",
			id:      "14ab0001",
			want:    0,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GetDateKeyFromOrderID(tt.id)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.want, got)
			}
		})
	}
}
