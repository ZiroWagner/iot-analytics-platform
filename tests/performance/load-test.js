import http from 'k6/http';
import { check, sleep } from 'k6';

const SCENARIO = __ENV.SCENARIO || 'smoke';

const scenarioConfigs = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '1m',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 30 },
      { duration: '4m', target: 30 },
      { duration: '2m', target: 0 },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '3m', target: 100 },
      { duration: '6m', target: 100 },
      { duration: '3m', target: 0 },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 200 },
      { duration: '3m', target: 200 },
      { duration: '2m', target: 0 },
    ],
  },
  soak: {
    executor: 'constant-vus',
    vus: 20,
    duration: '30m',
  },
};

export const options = {
  scenarios: {},
  thresholds: {
    http_req_failed: ['rate<0.50'],
    http_req_duration: ['p(95)<2000'],
  },
};

options.scenarios[SCENARIO] = scenarioConfigs[SCENARIO];

export default function def() {
  const baseUrl = __ENV.TARGET_URL || 'http://host.docker.internal:3001';

  let resHealth = http.get(`${baseUrl}/api/v1/health`);
  check(resHealth, {
    'health status is 200': (r) => r.status === 200,
    'health status is ok': (r) => r.json('data.status') === 'ok',
  });
  sleep(1);

  let resReady = http.get(`${baseUrl}/api/v1/health/ready`);
  check(resReady, {
    'ready status is 200': (r) => r.status === 200,
    'ready status is ready': (r) => r.json('data.status') === 'ready',
  });
  sleep(1);

  const payload = JSON.stringify({
    device: {
      api_key: 'invalid-key-for-testing'
    },
    sensors: [
      { sensor_id: 'temp-01', payload: { name: 'temperature', value: 24.5 } }
    ]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let resIngest = http.post(`${baseUrl}/api/v1/ingest`, payload, params);
  check(resIngest, {
    'ingest returns 401 for invalid key': (r) => r.status === 401,
  });
  sleep(1);
}
