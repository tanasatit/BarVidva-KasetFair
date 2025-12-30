# Bar vidva - Kaset Fair 2025 Food Ordering System

A production-ready food ordering and queue management system for the Bar vidva booth at Kaset Fair 2025. Built with Go + Fiber backend and React + TypeScript frontend, designed for offline-first operation in unreliable network conditions.

## ✅ Current Status - Phase 1 Complete

**Backend**: ✅ Fully implemented and tested
- Go + Fiber REST API
- PostgreSQL database with migrations
- Order and menu management
- Validation and error handling
- Health monitoring

**Frontend**: 🚧 Next phase
**Offline Support**: 🚧 Planned
**Testing**: 🚧 Planned

## Quick Start

### Prerequisites
- Go 1.21+
- Docker & Docker Compose

### 1. Start Database
```bash
docker-compose up -d db
```

### 2. Run Backend
```bash
cd backend
go build -o server ./cmd/server
./server
```

Server runs on `http://localhost:8080`

### 3. Test Endpoints

**Health Check:**
```bash
curl http://localhost:8080/health
# Response: {"status":"healthy","database":"connected","timestamp":"..."}
```

**Get Menu:**
```bash
curl http://localhost:8080/api/v1/menu
# Returns: French Fries S (฿40), M (฿60), L (฿80)
```

**Create Order:**
```bash
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"id":"1001","customer_name":"John Doe","day":1,"items":[{"menu_item_id":1,"name":"French Fries S","price":40,"quantity":2}]}'
# Returns: Created order with ID 1001, total ฿80
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/menu` | Get menu items |
| GET | `/api/v1/menu?available=true` | Get available items only |
| POST | `/api/v1/orders` | Create new order |

## Database Schema

**Orders** (DXXX format ID)
- Customer name, items, total, status
- Day (1-9), queue number
- Timestamps for created/paid/completed

**Order Items**
- Menu item reference with historical price
- Quantity (1-10 validation)

**Menu Items** (Seeded: French Fries S/M/L)
- Name, price, category, availability
- Timestamps

## Project Structure

```
backend/
├── cmd/server/main.go        # Entry point
├── internal/
│   ├── handlers/             # API handlers
│   ├── models/               # Data models
│   ├── repository/           # Database layer
│   ├── service/              # Business logic
│   └── utils/                # Utilities
├── pkg/database/             # DB connection
├── migrations/               # SQL schema
└── .env                      # Configuration
```

## Development Notes

### Database Access
```bash
docker exec barvidva-db psql -U barvidva -d barvidva
```

### Host PostgreSQL Conflict
If you have PostgreSQL on port 5432:
```bash
brew services stop postgresql@14
```

### Stopping Services
```bash
# Stop backend: Ctrl+C or kill process
docker-compose down  # Stop database
```

## Next Steps

1. Frontend development (React + TypeScript)
2. Offline support (IndexedDB + Service Worker)
3. Testing (unit + integration)
4. Deployment (Fly.io)

## Documentation

- `CLAUDE.md` - Complete project specifications
- `INITIAL.md` - Original requirements
- `PRPs/` - Detailed implementation plans

## License

MIT