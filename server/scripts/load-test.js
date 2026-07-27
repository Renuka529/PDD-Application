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

export default function () {
  const url = __ENV.BACKEND_URL || 'http://localhost:8000';

  // Perform simple heartbeat probe
  const response = http.get(`${url}/`);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'body has online status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'online';
      } catch (e) {
        return false;
      }
    }
  });

  sleep(1); // Standard user sleep timer
}
