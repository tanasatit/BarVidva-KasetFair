package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

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
	statsHandler := handlers.NewStatsHandler(db)
	adminHandler := handlers.NewAdminHandler(orderRepo)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
	})

	// Setup middleware
	setupMiddleware(app)

	// Setup routes
	setupRoutes(app, db, orderHandler, menuHandler, statsHandler, adminHandler)

	// Setup context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start order expiry service
	expiryMinutes := getEnvInt("ORDER_EXPIRY_MINUTES", 60)
	checkIntervalSeconds := getEnvInt("EXPIRY_CHECK_INTERVAL_SECONDS", 60)
	expiryService := service.NewExpiryService(orderRepo, expiryMinutes, time.Duration(checkIntervalSeconds)*time.Second)
	go expiryService.Start(ctx)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Info().Msg("Received shutdown signal, shutting down gracefully...")
		cancel() // Stop expiry service

		if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
			log.Error().Err(err).Msg("Error during server shutdown")
		}
	}()

	// Start server - bind to 0.0.0.0 explicitly for Fly.io
	addr := "0.0.0.0:" + port
	log.Info().Str("addr", addr).Msg("Starting server")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

// getEnvInt reads an integer from environment variable with a default value
func getEnvInt(key string, defaultVal int) int {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	intVal, err := strconv.Atoi(val)
	if err != nil {
		log.Warn().Str("key", key).Str("value", val).Msg("Invalid integer value, using default")
		return defaultVal
	}
	return intVal
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
