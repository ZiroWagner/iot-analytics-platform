import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp-up a 20 VUs
    { duration: '20s', target: 20 }, // Carga sostenida con 20 VUs
    { duration: '10s', target: 0 },  // Ramp-down a 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],  // Menos del 1% de fallos
    http_req_duration: ['p(95)<500'], // El 95% de las peticiones deben tardar < 500ms
  },
};

export default function def() {
  // Por defecto apunta al puerto expuesto de backend de Staging (3001)
  const baseUrl = __ENV.TARGET_URL || 'http://host.docker.internal:3001';

  // 1. Consultar endpoint de salud pública
  let resHealth = http.get(`${baseUrl}/api/v1/health`);
  check(resHealth, {
    'health status is 200': (r) => r.status === 200,
    'health status is ok': (r) => r.json('status') === 'ok',
  });
  sleep(1);

  // 2. Consultar endpoint de readiness pública
  let resReady = http.get(`${baseUrl}/api/v1/health/ready`);
  check(resReady, {
    'ready status is 200': (r) => r.status === 200,
    'ready status is ready': (r) => r.json('status') === 'ready',
  });
  sleep(1);

  // 3. Simular intento fallido de ingesta de datos (API Key inválida)
  const payload = JSON.stringify({
    device: {
      id: 'test-device-k6',
      api_key: 'invalid-key-for-testing'
    },
    metrics: [
      { name: 'temperature', value: 24.5, timestamp: new Date().toISOString() }
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

// Genera un reporte dinámico en HTML utilizando la librería de visualización k6-reporter
export function handleSummary(data) {
  return {
    'reports/k6-performance-report.html': htmlReport(data),
  };
}
