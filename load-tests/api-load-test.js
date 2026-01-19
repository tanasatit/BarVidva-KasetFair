/**
 * Load Testing Script for Bar Vidva API
 *
 * Uses k6 (https://k6.io) for load testing
 *
 * Installation:
 *   macOS: brew install k6
 *   Linux: sudo apt install k6
 *   Windows: choco install k6
 *
 * Usage:
 *   # Run with default options (50 VUs for 30s)
 *   k6 run load-tests/api-load-test.js
 *
 *   # Run with custom VUs and duration
 *   k6 run --vus 100 --duration 60s load-tests/api-load-test.js
 *
 *   # Run against production
 *   k6 run -e BASE_URL=https://api.barvidva.com load-tests/api-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const menuLatency = new Trend('menu_latency');
const orderLatency = new Trend('order_latency');
const queueLatency = new Trend('queue_latency');

// Test configuration
export const options = {
  // Simulate 50+ concurrent users as per requirements
  stages: [
    { duration: '10s', target: 10 },   // Ramp up to 10 users
    { duration: '20s', target: 50 },   // Ramp up to 50 users
    { duration: '30s', target: 50 },   // Stay at 50 users
    { duration: '20s', target: 100 },  // Spike to 100 users
    { duration: '20s', target: 100 },  // Stay at 100 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    // Performance targets from CLAUDE.md
    http_req_duration: ['p(95)<500'],    // 95% of requests under 500ms
    'http_req_duration{name:menu}': ['p(95)<200'],   // Menu: 95% under 200ms
    'http_req_duration{name:order}': ['p(95)<500'],  // Order: 95% under 500ms
    'http_req_duration{name:queue}': ['p(95)<200'],  // Queue: 95% under 200ms
    errors: ['rate<0.05'],               // Error rate under 5%
  },
};

// Base URL - can be overridden with -e BASE_URL=...
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Helper to generate random customer name
function randomName() {
  const names = [
    'สมชาย', 'สมหญิง', 'วิชัย', 'สุดา', 'ประยุทธ์',
    'John', 'Jane', 'Mike', 'Sarah', 'Tom',
    'นพดล', 'พิมพ์ใจ', 'อนุชา', 'กมลา', 'ธนกร',
  ];
  return names[Math.floor(Math.random() * names.length)];
}

// Helper to get current date key (DDMM format)
function getCurrentDateKey() {
  const now = new Date();
  return now.getDate() * 100 + (now.getMonth() + 1);
}

// Test scenarios
export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // Scenario 1: Customer views menu (most common)
  group('Menu Browsing', () => {
    const menuRes = http.get(`${BASE_URL}/api/v1/menu`, {
      tags: { name: 'menu' },
    });

    menuLatency.add(menuRes.timings.duration);

    const menuCheck = check(menuRes, {
      'menu status is 200': (r) => r.status === 200,
      'menu returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
      'menu response time OK': (r) => r.timings.duration < 200,
    });

    errorRate.add(!menuCheck);
  });

  sleep(0.5); // Brief pause between actions

  // Scenario 2: Customer places order (frequent during peak)
  group('Order Placement', () => {
    // First, get menu to know available items
    const menuRes = http.get(`${BASE_URL}/api/v1/menu`);
    let menuItems = [];
    try {
      menuItems = JSON.parse(menuRes.body).filter((item) => item.available);
    } catch {
      errorRate.add(1);
      return;
    }

    if (menuItems.length === 0) {
      console.log('No available menu items');
      return;
    }

    // Create order with random items
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
    const orderItems = [];

    for (let i = 0; i < numItems; i++) {
      const item = menuItems[Math.floor(Math.random() * menuItems.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity

      orderItems.push({
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: quantity,
      });
    }

    const orderPayload = JSON.stringify({
      customer_name: randomName(),
      items: orderItems,
      date_key: getCurrentDateKey(),
    });

    const orderRes = http.post(`${BASE_URL}/api/v1/orders`, orderPayload, {
      headers,
      tags: { name: 'order' },
    });

    orderLatency.add(orderRes.timings.duration);

    const orderCheck = check(orderRes, {
      'order status is 201': (r) => r.status === 201,
      'order returns id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id && body.id.length === 7;
        } catch {
          return false;
        }
      },
      'order response time OK': (r) => r.timings.duration < 500,
    });

    errorRate.add(!orderCheck);

    // If order was successful, check its status
    if (orderRes.status === 201) {
      try {
        const order = JSON.parse(orderRes.body);
        sleep(0.2);

        const statusRes = http.get(`${BASE_URL}/api/v1/orders/${order.id}`, {
          tags: { name: 'order_status' },
        });

        check(statusRes, {
          'order status check is 200': (r) => r.status === 200,
          'order has correct id': (r) => {
            try {
              return JSON.parse(r.body).id === order.id;
            } catch {
              return false;
            }
          },
        });
      } catch {
        // Ignore parsing errors
      }
    }
  });

  sleep(0.5);

  // Scenario 3: Customer checks queue (polling every 5 seconds)
  group('Queue Checking', () => {
    const queueRes = http.get(`${BASE_URL}/api/v1/queue`, {
      tags: { name: 'queue' },
    });

    queueLatency.add(queueRes.timings.duration);

    const queueCheck = check(queueRes, {
      'queue status is 200': (r) => r.status === 200,
      'queue returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
      'queue response time OK': (r) => r.timings.duration < 200,
    });

    errorRate.add(!queueCheck);
  });

  sleep(1); // Wait before next iteration
}

// Setup function - runs once before the test
export function setup() {
  // Verify server is reachable
  const healthRes = http.get(`${BASE_URL}/health`);

  if (healthRes.status !== 200) {
    throw new Error(`Server not healthy: ${healthRes.status}`);
  }

  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Server health: OK`);

  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
}
