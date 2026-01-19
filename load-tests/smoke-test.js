/**
 * Smoke Test - Quick API Health Check
 *
 * A lightweight test to verify basic API functionality before running full load tests.
 *
 * Usage:
 *   k6 run load-tests/smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check returns 200': (r) => r.status === 200,
    'health check shows db connected': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.database === 'connected';
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // 2. Menu endpoint
  const menuRes = http.get(`${BASE_URL}/api/v1/menu`);
  check(menuRes, {
    'menu returns 200': (r) => r.status === 200,
    'menu is array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // 3. Queue endpoint
  const queueRes = http.get(`${BASE_URL}/api/v1/queue`);
  check(queueRes, {
    'queue returns 200': (r) => r.status === 200,
    'queue is array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  // 4. Create test order
  const menuItems = JSON.parse(menuRes.body).filter((item) => item.available);

  if (menuItems.length > 0) {
    const item = menuItems[0];
    const now = new Date();
    const dateKey = now.getDate() * 100 + (now.getMonth() + 1);

    const orderPayload = JSON.stringify({
      customer_name: 'LoadTest User',
      items: [
        {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ],
      date_key: dateKey,
    });

    const orderRes = http.post(`${BASE_URL}/api/v1/orders`, orderPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(orderRes, {
      'order returns 201': (r) => r.status === 201,
      'order has id': (r) => {
        try {
          return JSON.parse(r.body).id !== undefined;
        } catch {
          return false;
        }
      },
    });

    // 5. Check order status
    if (orderRes.status === 201) {
      const order = JSON.parse(orderRes.body);
      sleep(0.2);

      const statusRes = http.get(`${BASE_URL}/api/v1/orders/${order.id}`);
      check(statusRes, {
        'order status returns 200': (r) => r.status === 200,
        'order status is PENDING_PAYMENT': (r) => {
          try {
            return JSON.parse(r.body).status === 'PENDING_PAYMENT';
          } catch {
            return false;
          }
        },
      });
    }
  }

  sleep(1);
}
