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

// GetOrder handles GET /api/v1/orders/:id
func (h *OrderHandler) GetOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Order ID is required",
			"code":  "INVALID_REQUEST",
		})
	}

	order, err := h.orderService.GetOrder(c.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Order not found",
				"code":  "ORDER_NOT_FOUND",
			})
		}
		log.Error().Err(err).Str("order_id", id).Msg("Failed to get order")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get order",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(http.StatusOK).JSON(order)
}

// GetPendingPayment handles GET /api/v1/staff/orders/pending
func (h *OrderHandler) GetPendingPayment(c *fiber.Ctx) error {
	orders, err := h.orderService.GetPendingPayment(c.Context())
	if err != nil {
		log.Error().Err(err).Msg("Failed to get pending payment orders")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get pending payment orders",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(http.StatusOK).JSON(orders)
}

// GetQueue handles GET /api/v1/staff/queue
func (h *OrderHandler) GetQueue(c *fiber.Ctx) error {
	orders, err := h.orderService.GetQueue(c.Context())
	if err != nil {
		log.Error().Err(err).Msg("Failed to get queue")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get queue",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(http.StatusOK).JSON(orders)
}

// GetCompletedOrders handles GET /api/v1/staff/orders/completed
func (h *OrderHandler) GetCompletedOrders(c *fiber.Ctx) error {
	orders, err := h.orderService.GetCompleted(c.Context())
	if err != nil {
		log.Error().Err(err).Msg("Failed to get completed orders")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get completed orders",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(http.StatusOK).JSON(orders)
}

// MarkPaidRequest is the request body for marking an order as paid
type MarkPaidRequest struct {
	PaymentMethod string `json:"payment_method"` // "PROMPTPAY" or "CASH"
}

// VerifyPayment handles PUT /api/v1/staff/orders/:id/verify
func (h *OrderHandler) VerifyPayment(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Order ID is required",
			"code":  "INVALID_REQUEST",
		})
	}

	// Parse optional payment method from request body
	var req MarkPaidRequest
	_ = c.BodyParser(&req) // Ignore error - payment_method is optional for backwards compatibility

	var paymentMethod *models.PaymentMethod
	if req.PaymentMethod != "" {
		pm := models.PaymentMethod(req.PaymentMethod)
		// Validate payment method
		if pm != models.PaymentMethodPromptPay && pm != models.PaymentMethodCash {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payment method. Must be PROMPTPAY or CASH",
				"code":  "INVALID_REQUEST",
			})
		}
		paymentMethod = &pm
	}

	order, err := h.orderService.VerifyPayment(c.Context(), id, paymentMethod)
	if err != nil {
		log.Error().Err(err).Str("order_id", id).Msg("Failed to verify payment")

		if strings.Contains(err.Error(), "not found") {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Order not found",
				"code":  "ORDER_NOT_FOUND",
			})
		}
		if strings.Contains(err.Error(), "not in pending payment") {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Order is not in pending payment status",
				"code":  "INVALID_STATUS",
			})
		}

		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to verify payment",
			"code":  "INTERNAL_ERROR",
		})
	}

	pmStr := ""
	if order.PaymentMethod != nil {
		pmStr = string(*order.PaymentMethod)
	}
	log.Info().
		Str("order_id", order.ID).
		Int("queue_number", *order.QueueNumber).
		Str("payment_method", pmStr).
		Msg("Payment verified")

	return c.Status(http.StatusOK).JSON(order)
}

// CompleteOrder handles PUT /api/v1/staff/orders/:id/complete
func (h *OrderHandler) CompleteOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Order ID is required",
			"code":  "INVALID_REQUEST",
		})
	}

	order, err := h.orderService.CompleteOrder(c.Context(), id)
	if err != nil {
		log.Error().Err(err).Str("order_id", id).Msg("Failed to complete order")

		if strings.Contains(err.Error(), "not found") {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Order not found",
				"code":  "ORDER_NOT_FOUND",
			})
		}
		if strings.Contains(err.Error(), "not in paid status") {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Order is not in paid status",
				"code":  "INVALID_STATUS",
			})
		}

		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to complete order",
			"code":  "INTERNAL_ERROR",
		})
	}

	log.Info().
		Str("order_id", order.ID).
		Msg("Order completed")

	return c.Status(http.StatusOK).JSON(order)
}

// CancelOrder handles DELETE /api/v1/staff/orders/:id
func (h *OrderHandler) CancelOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Order ID is required",
			"code":  "INVALID_REQUEST",
		})
	}

	err := h.orderService.CancelOrder(c.Context(), id)
	if err != nil {
		log.Error().Err(err).Str("order_id", id).Msg("Failed to cancel order")

		if strings.Contains(err.Error(), "not found") {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Order not found",
				"code":  "ORDER_NOT_FOUND",
			})
		}
		if strings.Contains(err.Error(), "can only cancel") {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "Can only cancel orders with pending payment status",
				"code":  "INVALID_STATUS",
			})
		}

		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to cancel order",
			"code":  "INTERNAL_ERROR",
		})
	}

	log.Info().
		Str("order_id", id).
		Msg("Order cancelled")

	return c.Status(http.StatusOK).JSON(fiber.Map{
		"message": "Order cancelled successfully",
	})
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
		Int("date_key", order.DateKey).
		Msg("Order created successfully")

	return c.Status(http.StatusCreated).JSON(order)
}
