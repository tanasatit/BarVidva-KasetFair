package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestStaffAuth(t *testing.T) {
	tests := []struct {
		name           string
		password       string
		authHeader     string
		wantStatusCode int
		wantBody       string
	}{
		{
			name:           "Valid staff password",
			password:       "test_staff_password",
			authHeader:     "Bearer test_staff_password",
			wantStatusCode: http.StatusOK,
			wantBody:       "success",
		},
		{
			name:           "Invalid password",
			password:       "test_staff_password",
			authHeader:     "Bearer wrong_password",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "Invalid credentials",
		},
		{
			name:           "Missing Bearer prefix",
			password:       "test_staff_password",
			authHeader:     "test_staff_password",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "Missing or invalid authorization header",
		},
		{
			name:           "Empty auth header",
			password:       "test_staff_password",
			authHeader:     "",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "Missing or invalid authorization header",
		},
		{
			name:           "Bearer with empty token",
			password:       "test_staff_password",
			authHeader:     "Bearer ",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "UNAUTHORIZED",
		},
		{
			name:           "Bearer with actual token",
			password:       "test_staff_password",
			authHeader:     "Bearer some_token",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "Invalid credentials",
		},
		{
			name:           "Case sensitive password",
			password:       "Test_Staff_Password",
			authHeader:     "Bearer test_staff_password",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "Invalid credentials",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()
			app.Use(StaffAuth(tt.password))
			app.Get("/test", func(c *fiber.Ctx) error {
				return c.SendString("success")
			})

			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			body, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(body), tt.wantBody)
		})
	}
}

func TestAdminAuth(t *testing.T) {
	tests := []struct {
		name           string
		password       string
		authHeader     string
		wantStatusCode int
		wantBody       string
	}{
		{
			name:           "Valid admin password",
			password:       "test_admin_password",
			authHeader:     "Bearer test_admin_password",
			wantStatusCode: http.StatusOK,
			wantBody:       "success",
		},
		{
			name:           "Invalid password",
			password:       "test_admin_password",
			authHeader:     "Bearer wrong_password",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "Invalid credentials",
		},
		{
			name:           "Missing Bearer prefix",
			password:       "test_admin_password",
			authHeader:     "test_admin_password",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "Missing or invalid authorization header",
		},
		{
			name:           "Empty auth header",
			password:       "test_admin_password",
			authHeader:     "",
			wantStatusCode: http.StatusUnauthorized,
			wantBody:       "Missing or invalid authorization header",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()
			app.Use(AdminAuth(tt.password))
			app.Get("/test", func(c *fiber.Ctx) error {
				return c.SendString("success")
			})

			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode)

			body, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(body), tt.wantBody)
		})
	}
}

func TestStaffAndAdminUseDifferentPasswords(t *testing.T) {
	staffPassword := "staff_secret"
	adminPassword := "admin_secret"

	app := fiber.New()

	// Staff route
	staffGroup := app.Group("/staff", StaffAuth(staffPassword))
	staffGroup.Get("/data", func(c *fiber.Ctx) error {
		return c.SendString("staff data")
	})

	// Admin route
	adminGroup := app.Group("/admin", AdminAuth(adminPassword))
	adminGroup.Get("/data", func(c *fiber.Ctx) error {
		return c.SendString("admin data")
	})

	// Test staff password on staff route - should work
	req := httptest.NewRequest(http.MethodGet, "/staff/data", nil)
	req.Header.Set("Authorization", "Bearer "+staffPassword)
	resp, _ := app.Test(req)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Test admin password on admin route - should work
	req = httptest.NewRequest(http.MethodGet, "/admin/data", nil)
	req.Header.Set("Authorization", "Bearer "+adminPassword)
	resp, _ = app.Test(req)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Test staff password on admin route - should fail
	req = httptest.NewRequest(http.MethodGet, "/admin/data", nil)
	req.Header.Set("Authorization", "Bearer "+staffPassword)
	resp, _ = app.Test(req)
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)

	// Test admin password on staff route - should fail
	req = httptest.NewRequest(http.MethodGet, "/staff/data", nil)
	req.Header.Set("Authorization", "Bearer "+adminPassword)
	resp, _ = app.Test(req)
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}
