package main

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

// setupMiddleware configures all middleware for the Fiber app
func setupMiddleware(app *fiber.App) {
	// Recovery middleware - catches panics and returns 500
	app.Use(recover.New())

	// Logger middleware - logs all HTTP requests
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path} (${latency})\n",
	}))

	// CORS middleware - enables cross-origin requests
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))
}

// StaffAuth creates middleware that validates staff password.
// Uses Bearer token authentication: Authorization: Bearer <password>
func StaffAuth(password string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")

		// Check for Bearer token format
		if !strings.HasPrefix(auth, "Bearer ") {
			return c.Status(401).JSON(fiber.Map{
				"error": "Missing or invalid authorization header",
				"code":  "UNAUTHORIZED",
			})
		}

		token := strings.TrimPrefix(auth, "Bearer ")
		if token != password {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid credentials",
				"code":  "UNAUTHORIZED",
			})
		}

		return c.Next()
	}
}

// AdminAuth creates middleware that validates admin password.
// Uses Bearer token authentication: Authorization: Bearer <password>
func AdminAuth(password string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")

		// Check for Bearer token format
		if !strings.HasPrefix(auth, "Bearer ") {
			return c.Status(401).JSON(fiber.Map{
				"error": "Missing or invalid authorization header",
				"code":  "UNAUTHORIZED",
			})
		}

		token := strings.TrimPrefix(auth, "Bearer ")
		if token != password {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid credentials",
				"code":  "UNAUTHORIZED",
			})
		}

		return c.Next()
	}
}
