package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"

	"github.com/tanasatit/barvidva-kasetfair/internal/models"
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

// GetMenuItem handles GET /api/v1/admin/menu/:id
func (h *MenuHandler) GetMenuItem(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid menu item ID",
			"code":  "INVALID_REQUEST",
		})
	}

	item, err := h.menuService.GetByID(c.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Menu item not found",
				"code":  "MENU_ITEM_NOT_FOUND",
			})
		}
		log.Error().Err(err).Int("id", id).Msg("Failed to get menu item")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get menu item",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(http.StatusOK).JSON(item)
}

// CreateMenuItem handles POST /api/v1/admin/menu
func (h *MenuHandler) CreateMenuItem(c *fiber.Ctx) error {
	var item models.MenuItem

	if err := c.BodyParser(&item); err != nil {
		log.Error().Err(err).Msg("Failed to parse request body")
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
			"code":  "INVALID_REQUEST",
		})
	}

	createdItem, err := h.menuService.Create(c.Context(), &item)
	if err != nil {
		log.Error().Err(err).Str("name", item.Name).Msg("Failed to create menu item")

		if strings.Contains(err.Error(), "already exists") {
			return c.Status(http.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
				"code":  "DUPLICATE_NAME",
			})
		}
		if strings.Contains(err.Error(), "must be") {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
				"code":  "VALIDATION_ERROR",
			})
		}

		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create menu item",
			"code":  "INTERNAL_ERROR",
		})
	}

	log.Info().
		Int("id", createdItem.ID).
		Str("name", createdItem.Name).
		Float64("price", createdItem.Price).
		Msg("Menu item created")

	return c.Status(http.StatusCreated).JSON(createdItem)
}

// UpdateMenuItem handles PUT /api/v1/admin/menu/:id
func (h *MenuHandler) UpdateMenuItem(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid menu item ID",
			"code":  "INVALID_REQUEST",
		})
	}

	var item models.MenuItem
	if err := c.BodyParser(&item); err != nil {
		log.Error().Err(err).Msg("Failed to parse request body")
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
			"code":  "INVALID_REQUEST",
		})
	}

	// Set the ID from the URL parameter
	item.ID = id

	updatedItem, err := h.menuService.Update(c.Context(), &item)
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("Failed to update menu item")

		if strings.Contains(err.Error(), "not found") {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Menu item not found",
				"code":  "MENU_ITEM_NOT_FOUND",
			})
		}
		if strings.Contains(err.Error(), "already exists") {
			return c.Status(http.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
				"code":  "DUPLICATE_NAME",
			})
		}
		if strings.Contains(err.Error(), "must be") {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
				"code":  "VALIDATION_ERROR",
			})
		}

		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update menu item",
			"code":  "INTERNAL_ERROR",
		})
	}

	log.Info().
		Int("id", updatedItem.ID).
		Str("name", updatedItem.Name).
		Float64("price", updatedItem.Price).
		Msg("Menu item updated")

	return c.Status(http.StatusOK).JSON(updatedItem)
}

// DeleteMenuItem handles DELETE /api/v1/admin/menu/:id
func (h *MenuHandler) DeleteMenuItem(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid menu item ID",
			"code":  "INVALID_REQUEST",
		})
	}

	err = h.menuService.Delete(c.Context(), id)
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("Failed to delete menu item")

		if strings.Contains(err.Error(), "not found") {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Menu item not found",
				"code":  "MENU_ITEM_NOT_FOUND",
			})
		}

		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete menu item",
			"code":  "INTERNAL_ERROR",
		})
	}

	log.Info().
		Int("id", id).
		Msg("Menu item deleted")

	return c.Status(http.StatusOK).JSON(fiber.Map{
		"message": "Menu item deleted successfully",
	})
}
