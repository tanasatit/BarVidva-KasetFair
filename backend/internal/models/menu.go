package models

import "time"

// MenuItem represents a menu item
type MenuItem struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name" validate:"required,min=2,max=100"`
	Price     float64   `json:"price" db:"price" validate:"required,gt=0,lte=10000"`
	Category  *string   `json:"category,omitempty" db:"category"`
	ImageURL  *string   `json:"image_url,omitempty" db:"image_url"`
	Available bool      `json:"available" db:"available"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
