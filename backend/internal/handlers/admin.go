package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"

	"github.com/tanasatit/barvidva-kasetfair/internal/repository"
)

type AdminHandler struct {
	orderRepo repository.OrderRepository
}

func NewAdminHandler(orderRepo repository.OrderRepository) *AdminHandler {
	return &AdminHandler{
		orderRepo: orderRepo,
	}
}

// DeleteOrdersRequest is the request body for bulk deleting orders
type DeleteOrdersRequest struct {
	OrderIDs []string `json:"order_ids"`
}

// DeleteOrders handles DELETE /api/v1/admin/orders
// Supports bulk delete by IDs or delete all with ?all=true
func (h *AdminHandler) DeleteOrders(c *fiber.Ctx) error {
	// Check if we should delete all
	deleteAll := c.Query("all") == "true"

	if deleteAll {
		deleted, err := h.orderRepo.DeleteAllOrders(c.Context())
		if err != nil {
			log.Error().Err(err).Msg("Failed to delete all orders")
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to delete orders",
				"code":  "INTERNAL_ERROR",
			})
		}

		log.Info().Int64("deleted_count", deleted).Msg("Deleted all orders")
		return c.JSON(fiber.Map{
			"message":       "All orders deleted successfully",
			"deleted_count": deleted,
		})
	}

	// Parse order IDs from request body
	var req DeleteOrdersRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
			"code":  "INVALID_REQUEST",
		})
	}

	if len(req.OrderIDs) == 0 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "No order IDs provided",
			"code":  "INVALID_REQUEST",
		})
	}

	deleted, err := h.orderRepo.DeleteOrders(c.Context(), req.OrderIDs)
	if err != nil {
		log.Error().Err(err).Int("count", len(req.OrderIDs)).Msg("Failed to delete orders")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete orders",
			"code":  "INTERNAL_ERROR",
		})
	}

	log.Info().
		Int64("deleted_count", deleted).
		Int("requested_count", len(req.OrderIDs)).
		Msg("Deleted orders")

	return c.JSON(fiber.Map{
		"message":       "Orders deleted successfully",
		"deleted_count": deleted,
	})
}

// GetAllOrders handles GET /api/v1/admin/orders
func (h *AdminHandler) GetAllOrders(c *fiber.Ctx) error {
	// Get all non-deleted orders (all statuses)
	orders, err := h.orderRepo.GetByStatuses(c.Context(), nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get all orders")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get orders",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(orders)
}
