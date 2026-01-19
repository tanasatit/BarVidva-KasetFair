# Load Testing for Bar Vidva API

Load testing suite using [k6](https://k6.io) to verify the system can handle 50+ concurrent users as required.

## Prerequisites

### Install k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6

# Docker
docker pull grafana/k6
```

## Test Files

| File | Purpose | Duration |
|------|---------|----------|
| `smoke-test.js` | Quick health check | ~10s |
| `api-load-test.js` | Standard load test (50-100 VUs) | ~2min |
| `stress-test.js` | Find breaking point (up to 300 VUs) | ~4min |

## Running Tests

### 1. Start the Backend

Make sure the backend is running:

```bash
cd backend
docker-compose up -d
# or
go run cmd/server/main.go
```

### 2. Smoke Test (Quick Check)

Run first to verify everything works:

```bash
k6 run load-tests/smoke-test.js
```

Expected output:
- All checks should pass (green checkmarks)
- No errors

### 3. Standard Load Test

Simulates real-world load with 50-100 concurrent users:

```bash
k6 run load-tests/api-load-test.js
```

**Performance Targets:**
- Menu endpoint: 95% < 200ms
- Order creation: 95% < 500ms
- Queue endpoint: 95% < 200ms
- Error rate: < 5%

### 4. Stress Test

Find system limits (warning: high load!):

```bash
k6 run load-tests/stress-test.js
```

This ramps up to 300 concurrent users to find the breaking point.

## Custom Options

### Change Base URL

Test against production or different environment:

```bash
k6 run -e BASE_URL=https://api.barvidva.com load-tests/api-load-test.js
```

### Adjust Load

Override VUs and duration:

```bash
k6 run --vus 100 --duration 60s load-tests/api-load-test.js
```

### Output to JSON

Save results for analysis:

```bash
k6 run --out json=results.json load-tests/api-load-test.js
```

### Output to InfluxDB (for Grafana dashboards)

```bash
k6 run --out influxdb=http://localhost:8086/k6 load-tests/api-load-test.js
```

## Understanding Results

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `http_req_duration` | Response time | p95 < 500ms |
| `http_req_failed` | Failed requests | < 5% |
| `iterations` | Completed iterations | Higher is better |
| `vus` | Virtual users | Max concurrent |

### Example Output

```
✓ menu status is 200
✓ menu returns array
✓ order status is 201
✓ queue status is 200

checks.........................: 98.50% ✓ 4925 ✗ 75
data_received..................: 2.5 MB 42 kB/s
data_sent......................: 890 kB 15 kB/s
http_req_duration..............: avg=45ms min=12ms med=38ms max=890ms p(90)=95ms p(95)=150ms
http_reqs......................: 5000   83.33/s
iterations.....................: 1250   20.83/s
```

## Troubleshooting

### High Error Rate

1. Check if backend is running: `curl http://localhost:8080/health`
2. Check database connection
3. Check for rate limiting
4. Review backend logs for errors

### Slow Response Times

1. Check database query performance
2. Check Redis cache hit rate
3. Consider adding database indexes
4. Check for N+1 query problems

### Connection Refused

1. Backend not running
2. Wrong port (default: 8080)
3. Firewall blocking connections

## Event Day Recommendations

Before Kaset Fair 2026:

1. Run smoke test every morning
2. Run load test at least once before opening
3. Monitor these during operation:
   - Response times (should stay < 500ms)
   - Error rate (should be < 1%)
   - Database connections
   - Memory usage

## Results Interpretation

| Error Rate | Status |
|------------|--------|
| < 1% | Excellent |
| 1-5% | Acceptable |
| 5-10% | Concerning |
| > 10% | Critical |

| P95 Response Time | Status |
|-------------------|--------|
| < 200ms | Excellent |
| 200-500ms | Good |
| 500-1000ms | Acceptable |
| > 1000ms | Needs optimization |
