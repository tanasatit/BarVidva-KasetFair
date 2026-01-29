package handlers

import (
	"net/http"
	"time"

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

// parseDateRange extracts start_date and end_date from query params
// Defaults to today if not provided
func parseDateRange(c *fiber.Ctx) (startDate, endDate string) {
	today := time.Now().Format("2006-01-02")
	startDate = c.Query("start_date", today)
	endDate = c.Query("end_date", today)
	return startDate, endDate
}

// GetStats handles GET /api/v1/admin/stats?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
func (h *StatsHandler) GetStats(c *fiber.Ctx) error {
	startDate, endDate := parseDateRange(c)

	var stats struct {
		TotalOrders           int     `db:"total_orders"`
		TotalRevenue          float64 `db:"total_revenue"`
		PendingOrders         int     `db:"pending_orders"`
		QueueLength           int     `db:"queue_length"`
		CompletedOrders       int     `db:"completed_orders"`
		CancelledOrders       int     `db:"cancelled_orders"`
		AvgCompletionTimeMins float64 `db:"avg_completion_time_mins"`
		PromptPayRevenue      float64 `db:"promptpay_revenue"`
		CashRevenue           float64 `db:"cash_revenue"`
		PromptPayCount        int     `db:"promptpay_count"`
		CashCount             int     `db:"cash_count"`
	}

	query := `
		SELECT
			COUNT(*) FILTER (WHERE created_at::date >= $1 AND created_at::date <= $2) AS total_orders,
			COALESCE(SUM(total_amount) FILTER (WHERE created_at::date >= $1 AND created_at::date <= $2 AND status IN ('PAID', 'COMPLETED')), 0) AS total_revenue,
			COUNT(*) FILTER (WHERE status = 'PENDING_PAYMENT' AND created_at::date >= $1 AND created_at::date <= $2) AS pending_orders,
			COUNT(*) FILTER (WHERE status = 'PAID' AND created_at::date >= $1 AND created_at::date <= $2) AS queue_length,
			COUNT(*) FILTER (WHERE status = 'COMPLETED' AND created_at::date >= $1 AND created_at::date <= $2) AS completed_orders,
			COUNT(*) FILTER (WHERE status = 'CANCELLED' AND created_at::date >= $1 AND created_at::date <= $2) AS cancelled_orders,
			COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - paid_at)) / 60) FILTER (WHERE completed_at IS NOT NULL AND paid_at IS NOT NULL AND created_at::date >= $1 AND created_at::date <= $2), 0) AS avg_completion_time_mins,
			COALESCE(SUM(total_amount) FILTER (WHERE created_at::date >= $1 AND created_at::date <= $2 AND status IN ('PAID', 'COMPLETED') AND payment_method = 'PROMPTPAY'), 0) AS promptpay_revenue,
			COALESCE(SUM(total_amount) FILTER (WHERE created_at::date >= $1 AND created_at::date <= $2 AND status IN ('PAID', 'COMPLETED') AND payment_method = 'CASH'), 0) AS cash_revenue,
			COUNT(*) FILTER (WHERE created_at::date >= $1 AND created_at::date <= $2 AND status IN ('PAID', 'COMPLETED') AND payment_method = 'PROMPTPAY') AS promptpay_count,
			COUNT(*) FILTER (WHERE created_at::date >= $1 AND created_at::date <= $2 AND status IN ('PAID', 'COMPLETED') AND payment_method = 'CASH') AS cash_count
		FROM orders
	`

	err := h.db.GetContext(c.Context(), &stats, query, startDate, endDate)
	if err != nil {
		log.Error().Err(err).Str("start_date", startDate).Str("end_date", endDate).Msg("Failed to get stats")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get stats",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"total_orders":             stats.TotalOrders,
		"total_revenue":            stats.TotalRevenue,
		"pending_orders":           stats.PendingOrders,
		"queue_length":             stats.QueueLength,
		"completed_orders":         stats.CompletedOrders,
		"cancelled_orders":         stats.CancelledOrders,
		"avg_completion_time_mins": stats.AvgCompletionTimeMins,
		"promptpay_revenue":        stats.PromptPayRevenue,
		"cash_revenue":             stats.CashRevenue,
		"promptpay_count":          stats.PromptPayCount,
		"cash_count":               stats.CashCount,
		"start_date":               startDate,
		"end_date":                 endDate,
	})
}

// GetOrdersByHour handles GET /api/v1/admin/stats/orders-by-hour?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
func (h *StatsHandler) GetOrdersByHour(c *fiber.Ctx) error {
	startDate, endDate := parseDateRange(c)

	query := `
		SELECT
			EXTRACT(HOUR FROM created_at)::int AS hour,
			COUNT(*) AS count,
			COALESCE(SUM(total_amount) FILTER (WHERE status IN ('PAID', 'COMPLETED')), 0) AS revenue
		FROM orders
		WHERE created_at::date >= $1 AND created_at::date <= $2
		GROUP BY EXTRACT(HOUR FROM created_at)
		ORDER BY hour
	`

	rows, err := h.db.QueryxContext(c.Context(), query, startDate, endDate)
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

// GetPopularItems handles GET /api/v1/admin/stats/popular-items?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
func (h *StatsHandler) GetPopularItems(c *fiber.Ctx) error {
	startDate, endDate := parseDateRange(c)

	query := `
		SELECT
			oi.menu_item_id,
			oi.name,
			SUM(oi.quantity)::int AS quantity_sold,
			SUM(oi.price * oi.quantity) AS revenue
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE o.created_at::date >= $1 AND o.created_at::date <= $2
			AND o.status IN ('PAID', 'COMPLETED')
		GROUP BY oi.menu_item_id, oi.name
		ORDER BY quantity_sold DESC
		LIMIT 10
	`

	rows, err := h.db.QueryxContext(c.Context(), query, startDate, endDate)
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

// GetDailyBreakdown handles GET /api/v1/admin/stats/daily-breakdown?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
func (h *StatsHandler) GetDailyBreakdown(c *fiber.Ctx) error {
	startDate, endDate := parseDateRange(c)

	query := `
		SELECT
			created_at::date AS date,
			COUNT(*) AS total_orders,
			COALESCE(SUM(total_amount) FILTER (WHERE status IN ('PAID', 'COMPLETED')), 0) AS revenue,
			COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
			COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
			COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - paid_at)) / 60) FILTER (WHERE completed_at IS NOT NULL AND paid_at IS NOT NULL), 0) AS avg_completion_mins
		FROM orders
		WHERE created_at::date >= $1 AND created_at::date <= $2
		GROUP BY created_at::date
		ORDER BY date
	`

	rows, err := h.db.QueryxContext(c.Context(), query, startDate, endDate)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get daily breakdown")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get daily breakdown",
			"code":  "INTERNAL_ERROR",
		})
	}
	defer rows.Close()

	var results []fiber.Map
	for rows.Next() {
		var date time.Time
		var totalOrders, completed, cancelled int
		var revenue, avgCompletionMins float64
		if err := rows.Scan(&date, &totalOrders, &revenue, &completed, &cancelled, &avgCompletionMins); err != nil {
			log.Error().Err(err).Msg("Failed to scan row")
			continue
		}
		results = append(results, fiber.Map{
			"date":                date.Format("2006-01-02"),
			"total_orders":        totalOrders,
			"revenue":             revenue,
			"completed":           completed,
			"cancelled":           cancelled,
			"avg_completion_mins": avgCompletionMins,
		})
	}

	if results == nil {
		results = []fiber.Map{}
	}

	return c.JSON(results)
}
