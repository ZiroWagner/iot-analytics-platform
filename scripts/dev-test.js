const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function buildK6Args(targetUrl, scenario, influxdbUrl) {
  let args = `-e TARGET_URL=${targetUrl}`;
  args += ` -e SCENARIO=${scenario}`;
  if (influxdbUrl) {
    args += ` --out influxdb=${influxdbUrl}`;
  }
  return args;
}

function runK6(useDocker = false, scenario = 'smoke', influxdbUrl = null) {
  console.log(`\n🚀 Iniciando pruebas de rendimiento con K6 (scenario: ${scenario})...`);
  const targetUrl = process.env.TARGET_URL || 'http://localhost:3001';
  const k6Args = buildK6Args(targetUrl, scenario, influxdbUrl);

  if (useDocker) {
    console.log('🐳 Ejecutando K6 a través de Docker...');
    const dockerTargetUrl = targetUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
    let dockerInfluxUrl = null;
    if (influxdbUrl) {
      dockerInfluxUrl = 'http://influxdb:8086/k6';
    }
    const dockerArgs = buildK6Args(dockerTargetUrl, scenario, dockerInfluxUrl);
    const cmd = `docker run --rm --network iot-net -v "${process.cwd()}:/workspace" -w /workspace grafana/k6 run ${dockerArgs} /workspace/tests/performance/load-test.js`;
    console.log(`Ejecutando: ${cmd}`);
    try {
      execSync(cmd, { stdio: 'inherit' });
      console.log('\n✅ Pruebas de rendimiento completadas sin superar los umbrales.');
    } catch (err) {
      if (err.status === 99) {
        console.log('\n⚠️ Nota: Las pruebas de rendimiento finalizaron, pero se superaron algunos umbrales establecidos (Thresholds).');
      } else {
        console.log('\n❌ Error al ejecutar K6 en Docker:', err.message);
      }
    }
  } else {
    console.log('💻 Ejecutando K6 localmente...');
    try {
      execSync(`k6 run ${k6Args} tests/performance/load-test.js`, { stdio: 'inherit' });
      console.log('\n✅ Pruebas de rendimiento completadas sin superar los umbrales.');
    } catch (err) {
      if (err.status === 99) {
        console.log('\n⚠️ Nota: Las pruebas de rendimiento finalizaron, pero se superaron algunos umbrales establecidos (Thresholds).');
      } else {
        console.log('\n❌ Error al ejecutar K6 localmente. ¿Está K6 instalado en tu sistema dev?');
        console.log('💡 Prueba ejecutando con Docker usando: node scripts/dev-test.js perf --docker');
        process.exit(1);
      }
    }
  }
}

function runZAP() {
  console.log('\n🔒 Iniciando escaneo de seguridad con OWASP ZAP (vía Docker)...');
  const targetBackend = process.env.TARGET_BACKEND_URL || 'http://localhost:3001';
  const targetFrontend = process.env.TARGET_FRONTEND_URL || 'http://localhost:3000';

  console.log('🐳 Ejecutando OWASP ZAP para Frontend...');
  const cmdFrontend = `docker run --rm -v "${reportsDir}:/zap/wrk:rw" --add-host=host.docker.internal:host-gateway zaproxy/zap-stable zap-baseline.py -t ${targetFrontend} -r zap-frontend-report.html`;
  console.log(`Ejecutando: ${cmdFrontend}`);
  try {
    execSync(cmdFrontend, { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️ ZAP finalizó con advertencias o alertas encontradas (esto es normal y se reportará en el HTML).');
  }

  console.log('\n🐳 Ejecutando OWASP ZAP para Backend...');
  const cmdBackend = `docker run --rm -v "${reportsDir}:/zap/wrk:rw" --add-host=host.docker.internal:host-gateway zaproxy/zap-stable zap-baseline.py -t ${targetBackend} -r zap-backend-report.html`;
  console.log(`Ejecutando: ${cmdBackend}`);
  try {
    execSync(cmdBackend, { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️ ZAP finalizó con advertencias o alertas encontradas (esto es normal y se reportará en el HTML).');
  }

  console.log('\n✅ Escaneo de seguridad completado. Reportes generados en:');
  console.log(`   - ${path.join(reportsDir, 'zap-frontend-report.html')}`);
  console.log(`   - ${path.join(reportsDir, 'zap-backend-report.html')}`);
}

function parseArgs(args) {
  const command = args[0] || 'help';
  const useDocker = args.includes('--docker');
  const influxIdx = args.indexOf('--influxdb');
  const influxdbUrl = influxIdx !== -1 && args[influxIdx + 1] ? args[influxIdx + 1] : null;
  const scenarioIdx = args.indexOf('--scenario');
  const scenario = scenarioIdx !== -1 && args[scenarioIdx + 1]
    ? args[scenarioIdx + 1]
    : (process.env.SCENARIO || 'smoke');
  return { command, useDocker, influxdbUrl, scenario };
}

const { command, useDocker, influxdbUrl, scenario } = parseArgs(process.argv.slice(2));

switch (command) {
  case 'perf':
    runK6(useDocker, scenario, influxdbUrl);
    break;
  case 'security':
    runZAP();
    break;
  case 'all':
    runK6(useDocker, scenario, influxdbUrl);
    runZAP();
    break;
  default:
    console.log('Uso: node scripts/dev-test.js [comando] [opciones]');
    console.log('\nComandos:');
    console.log('  perf      Ejecuta pruebas de rendimiento con K6');
    console.log('  security  Ejecuta pruebas de seguridad con OWASP ZAP (Docker)');
    console.log('  all       Ejecuta ambas pruebas');
    console.log('\nOpciones:');
    console.log('  --docker              Ejecuta K6 usando Docker en lugar del binario local');
    console.log('  --scenario <name>     Escenario: smoke (default), load, stress, spike, soak');
    console.log('  --influxdb <url>      Envía métricas a InfluxDB (ej: http://localhost:8086/k6)');
    console.log('\nEntorno:');
    console.log('  SCENARIO              Escenario por defecto (default: smoke)');
    console.log('  TARGET_URL            URL del backend a testear (default: http://localhost:3001)');
    console.log('\nEjemplos:');
    console.log('  node scripts/dev-test.js perf');
    console.log('  node scripts/dev-test.js perf --docker');
    console.log('  node scripts/dev-test.js perf --scenario load');
    console.log('  node scripts/dev-test.js perf --docker --scenario stress --influxdb http://localhost:8086/k6');
    console.log('  node scripts/dev-test.js security');
    console.log('  node scripts/dev-test.js all --docker');
    break;
}
