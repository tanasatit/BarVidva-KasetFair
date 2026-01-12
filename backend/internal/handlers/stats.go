package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"
)

type StatsHandler struct {
	db *sqlx.DB
}

func NewStatsHandler(db *sqlx.DB) *StatsHandler {
	return &StatsHandler{db: db}
}

// GetStats handles GET /api/v1/admin/stats
func (h *StatsHandler) GetStats(c *fiber.Ctx) error {
	var stats struct {
		TotalOrdersToday      int     `db:"total_orders_today"`
		TotalRevenueToday     float64 `db:"total_revenue_today"`
		PendingOrders         int     `db:"pending_orders"`
		QueueLength           int     `db:"queue_length"`
		CompletedOrders       int     `db:"completed_orders"`
		CancelledOrders       int     `db:"cancelled_orders"`
		AvgCompletionTimeMins float64 `db:"avg_completion_time_mins"`
	}

	query := `
		SELECT
			COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS total_orders_today,
			COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE AND status IN ('PAID', 'COMPLETED')), 0) AS total_revenue_today,
			COUNT(*) FILTER (WHERE status = 'PENDING_PAYMENT') AS pending_orders,
			COUNT(*) FILTER (WHERE status = 'PAID') AS queue_length,
			COUNT(*) FILTER (WHERE status = 'COMPLETED' AND created_at::date = CURRENT_DATE) AS completed_orders,
			COUNT(*) FILTER (WHERE status = 'CANCELLED' AND created_at::date = CURRENT_DATE) AS cancelled_orders,
			COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - paid_at)) / 60) FILTER (WHERE completed_at IS NOT NULL AND paid_at IS NOT NULL AND created_at::date = CURRENT_DATE), 0) AS avg_completion_time_mins
		FROM orders
	`

	err := h.db.GetContext(c.Context(), &stats, query)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get stats")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get stats",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"total_orders_today":       stats.TotalOrdersToday,
		"total_revenue_today":      stats.TotalRevenueToday,
		"pending_orders":           stats.PendingOrders,
		"queue_length":             stats.QueueLength,
		"completed_orders":         stats.CompletedOrders,
		"cancelled_orders":         stats.CancelledOrders,
		"avg_completion_time_mins": stats.AvgCompletionTimeMins,
	})
}

// GetOrdersByHour handles GET /api/v1/admin/stats/orders-by-hour
func (h *StatsHandler) GetOrdersByHour(c *fiber.Ctx) error {
	query := `
		SELECT
			EXTRACT(HOUR FROM created_at)::int AS hour,
			COUNT(*) AS count,
			COALESCE(SUM(total_amount) FILTER (WHERE status IN ('PAID', 'COMPLETED')), 0) AS revenue
		FROM orders
		WHERE created_at::date = CURRENT_DATE
		GROUP BY EXTRACT(HOUR FROM created_at)
		ORDER BY hour
	`

	rows, err := h.db.QueryxContext(c.Context(), query)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get orders by hour")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get orders by hour",
			"code":  "INTERNAL_ERROR",
		})
	}
	defer rows.Close()

	var results []fiber.Map
	for rows.Next() {
		var hour, count int
		var revenue float64
		if err := rows.Scan(&hour, &count, &revenue); err != nil {
			log.Error().Err(err).Msg("Failed to scan row")
			continue
		}
		results = append(results, fiber.Map{
			"hour":    hour,
			"count":   count,
			"revenue": revenue,
		})
	}

	if results == nil {
		results = []fiber.Map{}
	}

	return c.JSON(results)
}

// GetPopularItems handles GET /api/v1/admin/stats/popular-items
func (h *StatsHandler) GetPopularItems(c *fiber.Ctx) error {
	query := `
		SELECT
			oi.menu_item_id,
			oi.name,
			SUM(oi.quantity)::int AS quantity_sold,
			SUM(oi.price * oi.quantity) AS revenue
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE o.created_at::date = CURRENT_DATE
			AND o.status IN ('PAID', 'COMPLETED')
		GROUP BY oi.menu_item_id, oi.name
		ORDER BY quantity_sold DESC
		LIMIT 10
	`

	rows, err := h.db.QueryxContext(c.Context(), query)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get popular items")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get popular items",
			"code":  "INTERNAL_ERROR",
		})
	}
	defer rows.Close()

	var results []fiber.Map
	for rows.Next() {
		var menuItemID, quantitySold int
		var name string
		var revenue float64
		if err := rows.Scan(&menuItemID, &name, &quantitySold, &revenue); err != nil {
			log.Error().Err(err).Msg("Failed to scan row")
			continue
		}
		results = append(results, fiber.Map{
			"menu_item_id":  menuItemID,
			"name":          name,
			"quantity_sold": quantitySold,
			"revenue":       revenue,
		})
	}

	if results == nil {
		results = []fiber.Map{}
	}

	return c.JSON(results)
}
