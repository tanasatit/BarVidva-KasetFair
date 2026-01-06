package main

import (
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/tanasatit/barvidva-kasetfair/internal/handlers"
	"github.com/tanasatit/barvidva-kasetfair/internal/repository"
	"github.com/tanasatit/barvidva-kasetfair/internal/service"
	"github.com/tanasatit/barvidva-kasetfair/internal/utils"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Warn().Msg("No .env file found, using environment variables")
	}

	// Setup logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}

	level, err := zerolog.ParseLevel(logLevel)
	if err != nil {
		level = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(level)

	// Initialize database
	databaseURL := os.Getenv("DATABASE_URL")
	db := initDatabase(databaseURL)
	defer db.Close()

	// Initialize repositories
	orderRepo := repository.NewOrderRepository(db)
	menuRepo := repository.NewMenuRepository(db)

	// Initialize cache (no-op for MVP)
	cache := utils.NewNoOpCache()

	// Initialize services
	orderService := service.NewOrderService(orderRepo, menuRepo, cache)
	menuService := service.NewMenuService(menuRepo)

	// Initialize handlers
	orderHandler := handlers.NewOrderHandler(orderService)
	menuHandler := handlers.NewMenuHandler(menuService)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
	})

	// Setup middleware
	setupMiddleware(app)

	// Setup routes
	setupRoutes(app, db, orderHandler, menuHandler)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Info().Str("port", port).Msg("Starting server")
	if err := app.Listen(":" + port); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

// customErrorHandler handles errors returned from handlers
func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
		"code":  fmt.Sprintf("HTTP_%d", code),
	})
}
