package main

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"github.com/tanasatit/barvidva-kasetfair/internal/handlers"
)

// setupRoutes configures all API routes for the application
func setupRoutes(app *fiber.App, db *sqlx.DB, orderHandler *handlers.OrderHandler, menuHandler *handlers.MenuHandler) {
	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		// Check database
		if err := db.Ping(); err != nil {
			return c.Status(503).JSON(fiber.Map{
				"status":   "unhealthy",
				"database": "disconnected",
			})
		}

		return c.JSON(fiber.Map{
			"status":    "healthy",
			"database":  "connected",
			"timestamp": time.Now().UTC(),
		})
	})

	// API v1 routes
	api := app.Group("/api/v1")

	// Order routes
	api.Post("/orders", orderHandler.CreateOrder)

	// Menu routes
	api.Get("/menu", menuHandler.GetMenu)
}
