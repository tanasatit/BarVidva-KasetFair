# Deployment Guide - Bar Vidva Kaset Fair 2026

This guide covers deploying the Bar Vidva food ordering system to Fly.io.

## Prerequisites

1. **Fly.io CLI** - Install from https://fly.io/docs/hands-on/install-flyctl/
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Fly.io Account** - Sign up at https://fly.io

3. **Login to Fly.io**
   ```bash
   fly auth login
   ```

## Quick Deploy

Use the deployment script:

```bash
# Deploy everything
./scripts/deploy.sh all

# Or deploy individually
./scripts/deploy.sh backend
./scripts/deploy.sh frontend
```

## Manual Deployment Steps

### Step 1: Create PostgreSQL Database

```bash
# Create a PostgreSQL cluster in Singapore (closest to Thailand)
fly postgres create --name barvidva-db --region sin

# Note down the connection string provided!
```

### Step 2: Deploy Backend

```bash
cd backend

# Create the app (first time only)
fly apps create barvidva-api

# Attach the database
fly postgres attach barvidva-db -a barvidva-api

# Set secrets (use your actual secure passwords!)
fly secrets set \
  STAFF_PASSWORD=your_secure_staff_password \
  ADMIN_PASSWORD=your_secure_admin_password \
  ORDER_EXPIRY_MINUTES=60 \
  EXPIRY_CHECK_INTERVAL_SECONDS=60

# Deploy
fly deploy

# Verify deployment
fly status
fly logs
```

**Backend URL:** https://barvidva-api.fly.dev

### Step 3: Deploy Frontend

```bash
cd frontend

# Create the app (first time only)
fly apps create barvidva-web

# Set PromptPay number (use your actual number!)
fly secrets set VITE_PROMPTPAY_NUMBER=0812345678

# Deploy
fly deploy

# Verify deployment
fly status
```

**Frontend URL:** https://barvidva-web.fly.dev

## Environment Variables

### Backend Secrets

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by `fly postgres attach` |
| `STAFF_PASSWORD` | Password for staff dashboard | `staff_secure_123` |
| `ADMIN_PASSWORD` | Password for admin dashboard | `admin_secure_456` |
| `ORDER_EXPIRY_MINUTES` | Auto-cancel unpaid orders after N minutes | `60` |
| `EXPIRY_CHECK_INTERVAL_SECONDS` | How often to check for expired orders | `60` |

### Frontend Build Args

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://barvidva-api.fly.dev/api/v1` |
| `VITE_PROMPTPAY_NUMBER` | PromptPay account for QR code | `0812345678` |

## Post-Deployment Checklist

- [ ] Backend health check: `curl https://barvidva-api.fly.dev/health`
- [ ] Frontend loads: Visit https://barvidva-web.fly.dev
- [ ] Create test order and verify it appears in history
- [ ] Test admin login at https://barvidva-web.fly.dev/admin
- [ ] Verify PromptPay QR code displays correctly
- [ ] Test on mobile device
- [ ] Print QR code linking to https://barvidva-web.fly.dev

## Monitoring

```bash
# View logs
fly logs -a barvidva-api
fly logs -a barvidva-web

# Check status
fly status -a barvidva-api
fly status -a barvidva-web

# SSH into container (debugging)
fly ssh console -a barvidva-api
```

## Scaling (if needed)

```bash
# Scale backend (for higher load)
fly scale count 2 -a barvidva-api

# Scale memory
fly scale memory 1024 -a barvidva-api
```

## Database Backup

```bash
# Create backup
fly postgres db dump barvidva-db -o backup.sql

# Restore from backup
fly postgres db restore barvidva-db < backup.sql
```

## Troubleshooting

### Backend won't start
1. Check logs: `fly logs -a barvidva-api`
2. Verify DATABASE_URL is set: `fly secrets list -a barvidva-api`
3. Check database is running: `fly status -a barvidva-db`

### Frontend shows "Failed to load menu"
1. Check backend is running: `curl https://barvidva-api.fly.dev/health`
2. Check CORS settings in backend
3. Verify VITE_API_URL is correct

### Database connection issues
1. Check postgres status: `fly status -a barvidva-db`
2. Verify connection: `fly postgres connect -a barvidva-db`

## Custom Domain (Optional)

```bash
# Add custom domain
fly certs add barvidva.com -a barvidva-web

# Follow DNS instructions provided
```

## Event Day Quick Reference

**URLs:**
- Customer ordering: https://barvidva-web.fly.dev
- Staff dashboard: https://barvidva-web.fly.dev/history
- Admin dashboard: https://barvidva-web.fly.dev/admin

**Passwords:**
- Staff: (set during deployment)
- Admin: (set during deployment)

**Emergency Contacts:**
- Fly.io Status: https://status.fly.io
- Support: https://community.fly.io

---

**Event Dates:** January 30 - February 7, 2026 (9 days)
**Booth:** Bar Vidva @ Kaset Fair 2026
