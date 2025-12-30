package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"

	"github.com/tanasatit/barvidva-kasetfair/internal/service"
)

type MenuHandler struct {
	menuService service.MenuService
}

func NewMenuHandler(menuService service.MenuService) *MenuHandler {
	return &MenuHandler{
		menuService: menuService,
	}
}

// GetMenu handles GET /api/v1/menu
func (h *MenuHandler) GetMenu(c *fiber.Ctx) error {
	// Check if only available items should be returned
	availableOnly := c.Query("available") == "true"

	var items interface{}
	var err error

	if availableOnly {
		items, err = h.menuService.GetAvailable(c.Context())
	} else {
		items, err = h.menuService.GetAll(c.Context())
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to get menu items")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get menu items",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(http.StatusOK).JSON(items)
}
