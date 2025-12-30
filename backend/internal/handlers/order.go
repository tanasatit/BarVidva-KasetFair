package handlers

import (
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"

	"github.com/tanasatit/barvidva-kasetfair/internal/models"
	"github.com/tanasatit/barvidva-kasetfair/internal/service"
)

type OrderHandler struct {
	orderService service.OrderService
}

func NewOrderHandler(orderService service.OrderService) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
	}
}

// CreateOrder handles POST /api/v1/orders
func (h *OrderHandler) CreateOrder(c *fiber.Ctx) error {
	var req models.CreateOrderRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		log.Error().Err(err).Msg("Failed to parse request body")
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
			"code":  "INVALID_REQUEST",
		})
	}

	// Create order
	order, err := h.orderService.CreateOrder(c.Context(), &req)
	if err != nil {
		log.Error().
			Err(err).
			Str("order_id", req.ID).
			Str("customer_name", req.CustomerName).
			Msg("Failed to create order")

		// Check for validation errors
		if strings.Contains(err.Error(), "validation failed") {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
				"code":  "VALIDATION_ERROR",
			})
		}

		// Check for duplicate order
		if strings.Contains(err.Error(), "order ID already exists") {
			return c.Status(http.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
				"code":  "DUPLICATE_ORDER",
			})
		}

		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create order",
			"code":  "INTERNAL_ERROR",
		})
	}

	log.Info().
		Str("order_id", order.ID).
		Str("customer_name", order.CustomerName).
		Float64("total_amount", order.TotalAmount).
		Int("day", order.Day).
		Msg("Order created successfully")

	return c.Status(http.StatusCreated).JSON(order)
}
