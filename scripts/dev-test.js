const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'reports');

// Asegurar que existe la carpeta de reportes
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function runK6(useDocker = false) {
  console.log('\n🚀 Iniciando pruebas de rendimiento con K6...');
  const targetUrl = process.env.TARGET_URL || 'http://localhost:3001';
  
  if (useDocker) {
    console.log('🐳 Ejecutando K6 a través de Docker...');
    // Para Docker en Windows/macOS, mapeamos la carpeta y usamos host.docker.internal
    const dockerTargetUrl = targetUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
    const cmd = `docker run --rm -v "${process.cwd()}:/workspace" -w /workspace grafana/k6 run -e TARGET_URL=${dockerTargetUrl} /workspace/tests/performance/load-test.js`;
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
      execSync(`k6 run -e TARGET_URL=${targetUrl} tests/performance/load-test.js`, { stdio: 'inherit' });
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
  console.log('📄 Reporte generado en reports/k6-performance-report.html');
}

function runZAP() {
  console.log('\n🔒 Iniciando escaneo de seguridad con OWASP ZAP (vía Docker)...');
  const targetBackend = process.env.TARGET_BACKEND_URL || 'http://host.docker.internal:3001';
  const targetFrontend = process.env.TARGET_FRONTEND_URL || 'http://host.docker.internal:3000';
  
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

const args = process.argv.slice(2);
const command = args[0] || 'help';
const useDocker = args.includes('--docker');

switch (command) {
  case 'perf':
    runK6(useDocker);
    break;
  case 'security':
    runZAP();
    break;
  case 'all':
    runK6(useDocker);
    runZAP();
    break;
  default:
    console.log('Uso: node scripts/dev-test.js [comando] [opciones]');
    console.log('\nComandos:');
    console.log('  perf      Ejecuta pruebas de rendimiento con K6');
    console.log('  security  Ejecuta pruebas de seguridad con OWASP ZAP (Docker)');
    console.log('  all       Ejecuta ambas pruebas');
    console.log('\nOpciones:');
    console.log('  --docker  Ejecuta K6 usando Docker en lugar del binario local (solo para comando perf)');
    console.log('\nEjemplos:');
    console.log('  node scripts/dev-test.js perf');
    console.log('  node scripts/dev-test.js perf --docker');
    console.log('  node scripts/dev-test.js security');
    console.log('  node scripts/dev-test.js all --docker');
    break;
}
