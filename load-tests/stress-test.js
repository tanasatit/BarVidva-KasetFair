/**
 * Stress Test - Find Breaking Point
 *
 * Gradually increases load until the system starts failing.
 * Use this to understand system limits.
 *
 * Usage:
 *   k6 run load-tests/stress-test.js
 *
 * Warning: This test will push the system to its limits!
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const orderCount = new Counter('orders_created');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp to 50 users
    { duration: '30s', target: 100 },  // Ramp to 100 users
    { duration: '30s', target: 150 },  // Ramp to 150 users
    { duration: '30s', target: 200 },  // Ramp to 200 users
    { duration: '30s', target: 250 },  // Ramp to 250 users
    { duration: '30s', target: 300 },  // Ramp to 300 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.30'],             // Allow up to 30% errors during stress
    http_req_duration: ['p(90)<2000'], // 90% of requests under 2s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

function randomName() {
  const names = ['Stress', 'Test', 'User', 'Load', 'Check'];
  return names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
}

function getCurrentDateKey() {
  const now = new Date();
  return now.getDate() * 100 + (now.getMonth() + 1);
}

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // Heavy order creation load
  const menuRes = http.get(`${BASE_URL}/api/v1/menu`);

  let passed = check(menuRes, {
    'menu OK': (r) => r.status === 200,
  });

  if (!passed) {
    errorRate.add(1);
    sleep(0.5);
    return;
  }

  let menuItems = [];
  try {
    menuItems = JSON.parse(menuRes.body).filter((item) => item.available);
  } catch {
    errorRate.add(1);
    return;
  }

  if (menuItems.length === 0) {
    sleep(0.5);
    return;
  }

  // Create order
  const item = menuItems[Math.floor(Math.random() * menuItems.length)];
  const orderPayload = JSON.stringify({
    customer_name: randomName(),
    items: [
      {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: Math.floor(Math.random() * 5) + 1,
      },
    ],
    date_key: getCurrentDateKey(),
  });

  const orderRes = http.post(`${BASE_URL}/api/v1/orders`, orderPayload, {
    headers,
    timeout: '10s',
  });

  passed = check(orderRes, {
    'order created': (r) => r.status === 201,
  });

  if (passed) {
    orderCount.add(1);
  } else {
    errorRate.add(1);
    console.log(`Order failed: ${orderRes.status} - ${orderRes.body}`);
  }

  // Small delay to simulate real user behavior
  sleep(Math.random() * 0.5 + 0.2);
}

export function handleSummary(data) {
  const totalOrders = data.metrics.orders_created?.values?.count || 0;
  const errorPercent = (data.metrics.errors?.values?.rate || 0) * 100;
  const p95Duration = data.metrics.http_req_duration?.values?.['p(95)'] || 0;

  console.log('\n=== STRESS TEST SUMMARY ===');
  console.log(`Total Orders Created: ${totalOrders}`);
  console.log(`Error Rate: ${errorPercent.toFixed(2)}%`);
  console.log(`P95 Response Time: ${p95Duration.toFixed(0)}ms`);

  if (errorPercent > 10) {
    console.log('\nWARNING: High error rate detected. System may be at capacity.');
  }

  if (p95Duration > 1000) {
    console.log('\nWARNING: Response times degrading. Consider optimization.');
  }

  return {};
}
