package main

import (
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"

	"github.com/tanasatit/barvidva-kasetfair/internal/handlers"
)

// setupRoutes configures all API routes for the application
func setupRoutes(app *fiber.App, db *sqlx.DB, orderHandler *handlers.OrderHandler, menuHandler *handlers.MenuHandler, statsHandler *handlers.StatsHandler, adminHandler *handlers.AdminHandler) {
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

	// Public routes (no authentication required)
	// Order routes - customers can create orders and view their order status
	api.Post("/orders", orderHandler.CreateOrder)
	api.Get("/orders/:id", orderHandler.GetOrder)

	// Menu routes - customers can view menu
	api.Get("/menu", menuHandler.GetMenu)

	// Queue route - public so customers can see queue status
	api.Get("/queue", orderHandler.GetQueue)

	// POS routes - public for staff-only POS system (no auth for internal use)
	// These are simplified endpoints for the POS workflow
	api.Get("/pos/orders/pending", orderHandler.GetPendingPayment)
	api.Get("/pos/orders/completed", orderHandler.GetCompletedOrders)
	api.Put("/pos/orders/:id/mark-paid", orderHandler.VerifyPayment)
	api.Put("/pos/orders/:id/complete", orderHandler.CompleteOrder)

	// Staff routes (require staff authentication)
	staffPassword := os.Getenv("STAFF_PASSWORD")
	staff := api.Group("/staff", StaffAuth(staffPassword))

	// Staff order management
	staff.Get("/orders/pending", orderHandler.GetPendingPayment)
	staff.Get("/orders/completed", orderHandler.GetCompletedOrders)
	staff.Put("/orders/:id/verify", orderHandler.VerifyPayment)
	staff.Put("/orders/:id/complete", orderHandler.CompleteOrder)
	staff.Delete("/orders/:id", orderHandler.CancelOrder)

	// Admin routes (require admin authentication)
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	admin := api.Group("/admin", AdminAuth(adminPassword))

	// Admin stats
	admin.Get("/stats", statsHandler.GetStats)
	admin.Get("/stats/orders-by-hour", statsHandler.GetOrdersByHour)
	admin.Get("/stats/popular-items", statsHandler.GetPopularItems)
	admin.Get("/stats/daily-breakdown", statsHandler.GetDailyBreakdown)

	// Admin menu management
	admin.Get("/menu", menuHandler.GetMenu)
	admin.Get("/menu/:id", menuHandler.GetMenuItem)
	admin.Post("/menu", menuHandler.CreateMenuItem)
	admin.Put("/menu/:id", menuHandler.UpdateMenuItem)
	admin.Delete("/menu/:id", menuHandler.DeleteMenuItem)

	// Admin order management
	admin.Get("/orders", adminHandler.GetAllOrders)
	admin.Delete("/orders", adminHandler.DeleteOrders)
}
