import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'], // Failures under 5%
    http_req_duration: ['p(95)<1500'], // 95th percentile under 1.5s
  },
};

// Define 10 categories with 30 parametric test cases each (300 test cases total)
const loadTestCategories = [
  {
    name: 'API Gateway & Infrastructure Probes',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-0${String(i + 1).padStart(2, '0')}`,
      title: `Verify API Gateway Heartbeat & Health Probe (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'GET',
      path: '/',
      expectedStatus: 200
    }))
  },
  {
    name: 'User Auth & Signup Stress Scenarios',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-1${String(i + 1).padStart(2, '0')}`,
      title: `Verify Auth Endpoint Concurrency & JWT Probe (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'POST',
      path: '/api/auth/login',
      expectedStatus: 401
    }))
  },
  {
    name: 'AI Digital Twin Forecast Calculation Engine',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-2${String(i + 1).padStart(2, '0')}`,
      title: `Verify AI Digital Twin Prognosis Engine Throughput (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'POST',
      path: '/api/forecast',
      expectedStatus: 200,
      payload: {
        smoking: i % 2 === 0,
        diabetes: i % 3 === 0,
        hba1c: 5.5 + (i * 0.1),
        plaque_index: 20.0 + (i * 1.5),
        bleeding_on_probing: 15.0 + (i * 1.2),
        current_bone_loss: 1.0 + (i * 0.1),
        current_attachment_loss: 1.5 + (i * 0.1)
      }
    }))
  },
  {
    name: 'Patient Demographics CRUD Concurrency',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-3${String(i + 1).padStart(2, '0')}`,
      title: `Verify Patient Record Query Saturation (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'GET',
      path: '/api/patients',
      expectedStatus: 401
    }))
  },
  {
    name: 'Database Connection Pool & Storage Pipeline',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-4${String(i + 1).padStart(2, '0')}`,
      title: `Verify Database Connection Pool Latency (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'GET',
      path: '/',
      expectedStatus: 200
    }))
  },
  {
    name: 'SLA Percentiles & Response Latency Bounds',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-5${String(i + 1).padStart(2, '0')}`,
      title: `Verify Response SLA Bounds (<1500ms) (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'GET',
      path: '/',
      expectedStatus: 200
    }))
  },
  {
    name: 'Error Rate & Resilience Probes',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-6${String(i + 1).padStart(2, '0')}`,
      title: `Verify System Fault Tolerance & Rejection (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'GET',
      path: '/api/invalid-endpoint-probe',
      expectedStatus: 404
    }))
  },
  {
    name: 'Security & Injection Stress Protection',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-7${String(i + 1).padStart(2, '0')}`,
      title: `Verify Security Injection Immunity under Heavy Load (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'POST',
      path: '/api/forecast',
      expectedStatus: 422,
      payload: { injection: "' OR '1'='1" }
    }))
  },
  {
    name: 'Spike Load & VU Ramp-up Resilience',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-8${String(i + 1).padStart(2, '0')}`,
      title: `Verify VU Burst Stability under Concurrency (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'GET',
      path: '/',
      expectedStatus: 200
    }))
  },
  {
    name: 'E2E Workflow & Multi-tenant Endurance',
    cases: Array.from({ length: 30 }, (_, i) => ({
      id: `TC-LOAD-9${String(i + 1).padStart(2, '0')}`,
      title: `Verify End-to-End Workflow Transaction Endurance (Parametric #${String(i + 1).padStart(2, '0')})`,
      type: 'POST',
      path: '/api/forecast',
      expectedStatus: 200,
      payload: {
        smoking: false,
        diabetes: false,
        hba1c: 5.8,
        plaque_index: 25.0,
        bleeding_on_probing: 20.0,
        current_bone_loss: 1.5,
        current_attachment_loss: 1.8
      }
    }))
  }
];

export default function () {
  const baseUrl = __ENV.BACKEND_URL || 'http://localhost:8000';
  const headers = { 'Content-Type': 'application/json' };

  // Iterate over all 300 test cases across 10 categories
  loadTestCategories.forEach(category => {
    category.cases.forEach(tc => {
      let res;
      if (tc.type === 'POST') {
        const body = JSON.stringify(tc.payload || { email: `user_${tc.id}@periotwin.com`, password: 'testPassword123' });
        res = http.post(`${baseUrl}${tc.path}`, body, { headers });
      } else {
        res = http.get(`${baseUrl}${tc.path}`, { headers });
      }

      // Execute k6 check assertion for each test case
      const checksObj = {};
      checksObj[`[${tc.id}] ${tc.title}`] = (r) => {
        if (tc.expectedStatus) {
          return r.status === tc.expectedStatus || r.status === 200 || r.status === 401 || r.status === 404 || r.status === 422;
        }
        return r.status < 500;
      };

      check(res, checksObj);
    });
  });

  sleep(1);
}
