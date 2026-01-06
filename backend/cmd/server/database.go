package main

import (
	"github.com/jmoiron/sqlx"
	"github.com/rs/zerolog/log"

	"github.com/tanasatit/barvidva-kasetfair/pkg/database"
)

// initDatabase initializes and returns a database connection
func initDatabase(databaseURL string) *sqlx.DB {
	if databaseURL == "" {
		log.Fatal().Msg("DATABASE_URL environment variable is required")
	}

	// Connect to database
	db, err := database.NewFromURL(databaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}

	log.Info().Msg("Database connection established")

	return db
}
