# Bar vidva - Kaset Fair 2026 Food Ordering System

A food ordering and queue management system for the Bar vidva booth at Kaset Fair 2026. Built with Go + Fiber backend, designed for offline-first operation.

## Quick Start

### Prerequisites
- Go 1.21+
- Docker & Docker Compose

### 1. Setup Environment
```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Edit both files with secure passwords
```

### 2. Start Database
```bash
docker-compose up -d db
```

### 3. Run Backend
```bash
cd backend
go run ./cmd/server
```

Server runs on `http://localhost:8080`

### 4. Run Tests
```bash
cd backend
go test ./... -cover
```

## API Endpoints

### Public (No Auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/menu` | Get menu items |
| GET | `/api/v1/menu?available=true` | Get available items only |
| POST | `/api/v1/orders` | Create new order |
| GET | `/api/v1/orders/:id` | Get order status |
| GET | `/api/v1/queue` | View current queue |

### Staff (Requires `STAFF_PASSWORD`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/staff/orders/pending` | Get pending payment orders |
| PUT | `/api/v1/staff/orders/:id/verify` | Verify payment |
| PUT | `/api/v1/staff/orders/:id/complete` | Complete order |
| DELETE | `/api/v1/staff/orders/:id` | Cancel order |

### Admin (Requires `ADMIN_PASSWORD`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/menu` | Get all menu items |
| POST | `/api/v1/admin/menu` | Create menu item |
| PUT | `/api/v1/admin/menu/:id` | Update menu item |
| DELETE | `/api/v1/admin/menu/:id` | Delete menu item |

### Authentication
Staff and admin endpoints require Bearer token:
```bash
curl -H "Authorization: Bearer your_password_here" \
  http://localhost:8080/api/v1/staff/orders/pending
```

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Customer Order | Menu selection and order placement |
| `/queue` | Queue Tracker | Search and track order status |
| `/queue/:orderId` | Queue Tracker | Direct link to track specific order |
| `/staff` | Staff Dashboard | Verify payments, manage queue, complete orders |
| `/admin` | Admin Dashboard | Menu management, analytics, popular items |

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Project Structure

```
backend/
├── cmd/server/           # Entry point, middleware, routes
├── internal/
│   ├── handlers/         # HTTP request handlers
│   ├── models/           # Data models
│   ├── repository/       # Database layer
│   ├── service/          # Business logic
│   └── utils/            # Utilities (order ID, cache)
├── pkg/database/         # DB connection
└── migrations/           # SQL schema

frontend/
├── src/
│   ├── pages/            # React pages (CustomerOrder, StaffDashboard, AdminDashboard, QueueTracker)
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
└── public/               # Static assets
```

## Development

### Database Access
```bash
docker exec -it barvidva-db psql -U barvidva -d barvidva
```

### Stop Services
```bash
docker-compose down
```

## Documentation

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Complete project specifications |
| `backend/SECURITY.md` | Security guidelines |
| `PRPs/` | Feature implementation plans |

## License

MIT
