/**
 * JogjaHub — Load Test dengan k6
 *
 * Cara pakai:
 *   k6 run k6/load-test.js                          → default (smoke test)
 *   k6 run -e SCENARIO=load k6/load-test.js         → 100 user
 *   k6 run -e SCENARIO=stress k6/load-test.js       → sampai 500 user
 *   k6 run -e SCENARIO=spike k6/load-test.js        → spike mendadak
 *
 * Ganti BASE_URL kalau server bukan localhost:8000
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';

// Akun test — pastikan sudah ada di database sebelum run
const CUSTOMER_EMAIL    = __ENV.CUSTOMER_EMAIL    || 'customer2@example.com';
const CUSTOMER_PASSWORD = __ENV.CUSTOMER_PASSWORD || 'Customer321';
const TENANT_EMAIL      = __ENV.TENANT_EMAIL      || 'flourist555@gmail.com';
const TENANT_PASSWORD   = __ENV.TENANT_PASSWORD   || 'password123';

// ─── Custom Metrics ───────────────────────────────────────────────────────────
const errorRate       = new Rate('errors');
const loginDuration   = new Trend('login_duration');
const servicesDuration = new Trend('services_list_duration');

// ─── Scenarios ────────────────────────────────────────────────────────────────
const SCENARIO = __ENV.SCENARIO || 'smoke';

const scenarios = {
  // Smoke test — pastikan tidak ada yang error sebelum load test besar
  smoke: {
    stages: [
      { duration: '30s', target: 5 },
      { duration: '30s', target: 5 },
      { duration: '10s', target: 0 },
    ],
  },
  // Load test — simulasi penggunaan normal
  load: {
    stages: [
      { duration: '1m',  target: 10  }, // ramp up ke 10 user
      { duration: '2m',  target: 50  }, // naik ke 50 user
      { duration: '2m',  target: 100 }, // naik ke 100 user
      { duration: '1m',  target: 100 }, // tahan di 100 user
      { duration: '30s', target: 0   }, // turun
    ],
  },
  // Stress test — cari batas maksimum
  stress: {
    stages: [
      { duration: '1m',  target: 100 },
      { duration: '2m',  target: 200 },
      { duration: '2m',  target: 300 },
      { duration: '2m',  target: 500 },
      { duration: '1m',  target: 0   },
    ],
  },
  // Spike test — simulasi viral/lonjakan tiba-tiba
  spike: {
    stages: [
      { duration: '10s', target: 5   }, // normal
      { duration: '1m',  target: 500 }, // spike mendadak!
      { duration: '10s', target: 5   }, // turun lagi
      { duration: '30s', target: 5   }, // recovery
      { duration: '10s', target: 0   },
    ],
  },
};

// ─── Options ──────────────────────────────────────────────────────────────────
//
// CATATAN THRESHOLD:
//   - DEV  (php artisan serve, single-thread): threshold longgar, fokus ke error rate
//   - PROD (Nginx/Apache multi-thread)       : threshold ketat sesuai target SLA
//
// Aktifkan threshold PROD setelah deploy ke server sesungguhnya.
//
const IS_PROD_SERVER = (__ENV.ENV === 'production');

export const options = {
  stages: scenarios[SCENARIO].stages,

  thresholds: {
    // Error rate — wajib 0% di semua environment
    'errors':          ['rate<0.05'],
    'http_req_failed': ['rate<0.05'],

    // Response time — beda threshold dev vs prod
    'http_req_duration': IS_PROD_SERVER
      ? ['p(95)<2000']    // PROD: 95% request < 2 detik
      : ['p(95)<10000'],  // DEV : toleransi lebih longgar (single-thread server)

    'http_req_duration{type:login}': IS_PROD_SERVER
      ? ['p(95)<1000']    // PROD: login < 1 detik
      : ['p(95)<10000'],  // DEV : toleransi longgar

    'http_req_duration{type:services}': IS_PROD_SERVER
      ? ['p(95)<1500']    // PROD: list services < 1.5 detik
      : ['p(95)<10000'],  // DEV : toleransi longgar
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function jsonHeaders(token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers };
}

function login(email, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password, role: email === CUSTOMER_EMAIL ? 'customer' : 'tenant' }),
    { ...jsonHeaders(), tags: { type: 'login' } }
  );
  loginDuration.add(res.timings.duration);
  return res;
}

// ─── Main Test Function ───────────────────────────────────────────────────────
export default function () {

  // ── Group 1: Public Endpoints (tanpa login) ──
  group('Public — Services & Categories', () => {
    // List categories
    const catRes = http.get(`${BASE_URL}/categories`, jsonHeaders());
    check(catRes, {
      'categories: status 200': (r) => r.status === 200,
      'categories: ada data':   (r) => r.json('success') === true,
    });
    errorRate.add(catRes.status !== 200);

    sleep(0.5);

    // List services
    const svcRes = http.get(`${BASE_URL}/services`, {
      ...jsonHeaders(),
      tags: { type: 'services' },
    });
    servicesDuration.add(svcRes.timings.duration);
    check(svcRes, {
      'services: status 200':     (r) => r.status === 200,
      'services: ada pagination': (r) => r.json('data') !== null,
      'services: response < 2s':  (r) => r.timings.duration < 2000,
    });
    errorRate.add(svcRes.status !== 200);

    // Kalau ada service, ambil detail pertama
    const services = svcRes.json('data.data');
    if (services && services.length > 0) {
      const firstServiceId = services[0].id;

      sleep(0.3);

      // Detail service
      const detailRes = http.get(`${BASE_URL}/services/${firstServiceId}`, jsonHeaders());
      check(detailRes, {
        'service detail: status 200': (r) => r.status === 200,
      });

      sleep(0.3);

      // Slots service
      const slotsRes = http.get(`${BASE_URL}/services/${firstServiceId}/slots`, jsonHeaders());
      check(slotsRes, {
        'service slots: status 200': (r) => r.status === 200,
      });

      sleep(0.3);

      // Reviews service
      const reviewsRes = http.get(`${BASE_URL}/services/${firstServiceId}/reviews`, jsonHeaders());
      check(reviewsRes, {
        'service reviews: status 200': (r) => r.status === 200,
      });
    }

    sleep(1);
  });

  // ── Group 2: Customer Flow ──
  group('Customer — Login & Lihat Bookings', () => {
    // Login sebagai customer
    const loginRes = login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    const loginOk = check(loginRes, {
      'customer login: status 200': (r) => r.status === 200,
      'customer login: ada token':  (r) => r.json('data.token') !== null,
    });
    errorRate.add(loginRes.status !== 200);

    if (!loginOk) return;

    const token = loginRes.json('data.token');

    sleep(0.5);

    // List booking customer
    const bookingsRes = http.get(`${BASE_URL}/customer/bookings`, jsonHeaders(token));
    check(bookingsRes, {
      'customer bookings: status 200': (r) => r.status === 200,
    });
    errorRate.add(bookingsRes.status !== 200);

    sleep(1);
  });

  // ── Group 3: Tenant Flow ──
  group('Tenant — Login & Lihat Incoming Orders', () => {
    // Login sebagai tenant
    const loginRes = login(TENANT_EMAIL, TENANT_PASSWORD);
    const loginOk = check(loginRes, {
      'tenant login: status 200': (r) => r.status === 200,
      'tenant login: ada token':  (r) => r.json('data.token') !== null,
    });
    errorRate.add(loginRes.status !== 200);

    if (!loginOk) return;

    const token = loginRes.json('data.token');

    sleep(0.5);

    // List booking tenant
    const incomingRes = http.get(`${BASE_URL}/tenant/bookings`, jsonHeaders(token));
    check(incomingRes, {
      'tenant bookings: status 200': (r) => r.status === 200,
    });
    errorRate.add(incomingRes.status !== 200);

    sleep(0.5);

    // Profil tenant
    const profileRes = http.get(`${BASE_URL}/tenant/profile`, jsonHeaders(token));
    check(profileRes, {
      'tenant profile: status 200': (r) => r.status === 200,
    });

    sleep(1);
  });

  sleep(1);
}

// ─── Summary Report ───────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'k6/result.json': JSON.stringify(data, null, 2),
    stdout: buildSummary(data),
  };
}

function buildSummary(data) {
  const m = data.metrics;
  const p95 = (metric) => metric ? Math.round(metric.values['p(95)']) : 'N/A';
  const rate = (metric) => metric ? (metric.values.rate * 100).toFixed(1) + '%' : 'N/A';

  return `
╔══════════════════════════════════════════════════════╗
║           JogjaHub — K6 Load Test Result             ║
╠══════════════════════════════════════════════════════╣
║  Scenario       : ${(SCENARIO).padEnd(32)}║
║  Total Requests : ${String(m.http_reqs?.values.count || 0).padEnd(32)}║
║  Error Rate     : ${rate(m.errors).padEnd(32)}║
╠══════════════════════════════════════════════════════╣
║  Response Time (p95):                                ║
║    All requests   : ${String(p95(m.http_req_duration) + 'ms').padEnd(30)}║
║    Login          : ${String(p95(m['http_req_duration{type:login}']) + 'ms').padEnd(30)}║
║    Services list  : ${String(p95(m['http_req_duration{type:services}']) + 'ms').padEnd(30)}║
╚══════════════════════════════════════════════════════╝
`;
}

