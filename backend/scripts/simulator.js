import http from "node:http";

// CONFIGURACIÓN (REEMPLAZA ESTA API KEY POR LA GENERADA EN EL DASHBOARD)
const API_KEY = "iot_b476334fcfbf2b22cb3b6061b17295cc";
const INGEST_URL = "http://localhost:3001/api/v1/ingest";
const INTERVAL_MS = 1000;

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function sendPayload() {
  const payload = JSON.stringify({
    device: {
      api_key: API_KEY,
      mac_address: "AA:BB:CC:DD:EE:FF",
      type: "ESP32"
    },
    timestamp: new Date().toISOString(),
    sensors: [
      {
        sensor_id: "temp_01",
        payload: {
          temperature: Number.parseFloat(getRandomArbitrary(20, 30).toFixed(2)),
          humidity: Number.parseFloat(getRandomArbitrary(40, 60).toFixed(2))
        }
      },
      {
        sensor_id: "motion_01",
        payload: {
          detected: Math.random() > 0.8
        }
      }
    ]
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(INGEST_URL, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`[${new Date().toLocaleTimeString()}] Sent Payload -> Status: ${res.statusCode} | Response: ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`[!] Request error: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

console.log("==========================================");
console.log(`🚀 Starting IoT Hardware Simulator`);
console.log(`📡 Target URL: ${INGEST_URL}`);
console.log(`⏱️ Interval: ${INTERVAL_MS}ms`);
console.log("==========================================");

setInterval(sendPayload, INTERVAL_MS);
// Send first one immediately
sendPayload();
