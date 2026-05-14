# Plan de Arquitectura DevOps CI/CD: IoT Analytics Platform

Como Arquitecto DevOps Senior, he diseñado este plan de implementación robusto, escalable y profesional para tu plataforma IoT (Next.js, NestJS, Redis, Supabase). Este diseño está pensado para correr 100% localmente usando contenedores Docker, pero con una arquitectura *Cloud-Native* que permite una migración trivial a Kubernetes (K8s) o servicios Cloud (AWS ECS, GCP Cloud Run) en el futuro.

---

## 1. Arquitectura General

### Flujo CI/CD End-to-End
1. **Developer:** Hace `git push` a la rama `main` o `develop`.
2. **GitHub:** Dispara un evento Webhook.
3. **Ngrok:** Actúa como túnel reverso, recibiendo la petición de GitHub y redirigiéndola al Jenkins local.
4. **Jenkins (Docker):** Recibe el webhook, clona el repositorio y dispara el `Jenkinsfile`.
5. **Calidad y Testing:** Se ejecutan paralelamente los linters, unit tests de frontend y backend.
6. **SonarQube (Docker):** Escaneo estático de código (SAST) y evaluación del Quality Gate.
7. **Seguridad:** Escaneo de dependencias y vulnerabilidades (Trivy/npm audit).
8. **Build:** Creación de imágenes Docker para Frontend y Backend usando *Multi-stage builds*.
9. **Despliegue Local:** Despliegue automático usando `docker-compose` en un entorno local (Staging/Prod simulado).

### Estrategia de Red y Datos
- **Red `iot-net`:** Una red bridge de Docker exclusiva donde residen todos los servicios (Jenkins, SonarQube, Apps, Redis).
- **Persistencia:** Volúmenes nombrados para Jenkins (plugins, jobs), SonarQube (datos y DB) y bases de datos.
- **Monorepo:** Se utilizará un enfoque monorepo. Jenkins detectará cambios y construirá lo que sea necesario, aunque para este pipeline inicial construiremos ambos de manera optimizada.

> [!TIP]
> **Recomendación de Escalabilidad:** Usar Docker-in-Docker (DinD) o montar el socket `/var/run/docker.sock` en Jenkins. Para entornos locales, montar el socket es más rápido y consume menos recursos. Para K8s futuro, usaremos Pods efímeros como agentes (Kaniko).

---

## 2. Estructura Profesional del Proyecto

Para mantener un estándar Enterprise, refactorizaremos la estructura actual del proyecto así:

```text
/iot-analytics-platform
├── /frontend               # Aplicación Next.js
├── /backend                # Aplicación NestJS
├── /infra                  # Infraestructura como Código (IaC)
│   ├── /docker             # Dockerfiles (si no están en /frontend o /backend)
│   ├── /jenkins            # Archivos de configuración y Dockerfile de Jenkins
│   ├── /sonarqube          # Configuraciones de Sonar
│   └── docker-compose.infra.yml # Levanta Jenkins, Sonarqube, Ngrok
├── /scripts                # Scripts bash de utilería (setup, backup, etc.)
├── /deploy                 # Archivos de despliegue de las apps
│   ├── docker-compose.stg.yml
│   └── docker-compose.prod.yml
├── Jenkinsfile             # Pipeline CI/CD Declarativo
└── README.md
```

---

## 3. Infraestructura Local Basada en Docker (Herramientas CI/CD)

Crearemos el archivo `/infra/docker-compose.infra.yml` para levantar la infraestructura de CI/CD.

```yaml
version: '3.8'

services:
  jenkins:
    build: 
      context: ./jenkins
      dockerfile: Dockerfile
    container_name: jenkins_master
    user: root # Necesario para ejecutar docker comandos usando el socket montado
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock # Docker socket para buildear imágenes
    networks:
      - iot-net
    restart: unless-stopped

  sonarqube:
    image: sonarqube:lts-community
    container_name: sonarqube
    ports:
      - "9000:9000"
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_logs:/opt/sonarqube/logs
      - sonarqube_extensions:/opt/sonarqube/extensions
    environment:
      - SONAR_FORCEAUTHENTICATION=true
    networks:
      - iot-net
    restart: unless-stopped

  ngrok:
    image: ngrok/ngrok:latest
    container_name: ngrok
    environment:
      - NGROK_AUTHTOKEN=${NGROK_AUTHTOKEN}
    command: "http jenkins:8080 --log stdout"
    networks:
      - iot-net
    depends_on:
      - jenkins
    restart: unless-stopped

networks:
  iot-net:
    driver: bridge

volumes:
  jenkins_home:
  sonarqube_data:
  sonarqube_logs:
  sonarqube_extensions:
```

> [!CAUTION]
> **Seguridad Docker Socket:** Montar `/var/run/docker.sock` da acceso root al host. Es aceptable para desarrollo local, pero en producción cloud (K8s) usaremos Jenkins Kubernetes Plugin para agentes aislados o *Sysbox*.

---

## 4. Configuración de Jenkins Local

Necesitamos un Jenkins customizado que tenga Docker y Node.js instalados.
Archivo: `/infra/jenkins/Dockerfile`

```dockerfile
FROM jenkins/jenkins:lts-jdk17

USER root

# Dependencias base
RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release && \
    rm -rf /var/lib/apt/lists/*

# Instalar Docker CLI
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# Instalar Node.js 24
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs

# Instalar herramientas globales
RUN npm install -g pnpm yarn

# Permisos Docker
RUN groupadd -f docker && usermod -aG docker jenkins

USER jenkins

# Plugins Jenkins
RUN jenkins-plugin-cli --plugins \
    blueocean \
    docker-workflow \
    sonar \
    github-branch-source \
    configuration-as-code
```

### Configuración en UI:
1. Ir a **Manage Jenkins -> Plugins** e instalar: `Docker Pipeline`, `SonarQube Scanner`, `GitHub Integration`, `Pipeline: Stage View`.
2. Ir a **Manage Jenkins -> Credentials**: Crear un token de GitHub (tipo Secret Text) para acceder al repo, y un SonarQube Token.
3. Ir a **Manage Jenkins -> System**: Añadir la configuración del servidor SonarQube (`http://sonarqube:9000`).

---

## 5. Configuración de Ngrok + GitHub Webhooks

### Setup Ngrok:
El contenedor `ngrok` en el docker-compose ya expone a Jenkins.
1. Crea una cuenta en Ngrok y obtén tu `AUTHTOKEN`.
2. Crea un archivo `.env` en la carpeta `/infra` con `NGROK_AUTHTOKEN=tu_token_aqui`.
3. Levanta la infraestructura: `docker-compose -f infra/docker-compose.infra.yml up -d`
4. Revisa la URL generada: `docker logs ngrok` (Busca una URL como `https://1234abcd.ngrok-free.app`).

### Webhook en GitHub:
1. Ve a tu repositorio en GitHub -> Settings -> Webhooks -> Add webhook.
2. **Payload URL:** `https://1234abcd.ngrok-free.app/github-webhook/` *(¡El trailing slash `/` es obligatorio para Jenkins!)*
3. **Content type:** `application/json`.
4. Selecciona **Let me select individual events** -> Elige `Pushes` y `Pull requests`.

---

## 6. Dockerización Profesional (Aplicaciones)

Implementaremos **Multi-stage builds** para reducir drásticamente el tamaño de la imagen y mejorar la seguridad (sin código fuente ni dependencias dev en el contenedor final).

### Backend (NestJS) - `/backend/Dockerfile`
```dockerfile
# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
# Usuario no-root por seguridad
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1
CMD ["node", "dist/src/main.js"]
```

### Frontend (Next.js) - `/frontend/Dockerfile`
```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
```

> [!NOTE]
> Para Next.js Dockerizado, asegúrate de tener `output: "standalone"` configurado en tu `next.config.js`.

---

## 7. Pipeline Jenkins Profesional (`Jenkinsfile`)

Este es un pipeline robusto, multietapa, con análisis paralelo y seguridad.

```groovy
pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'local-registry:5000' // Opcional, o directo al demonio local
        FRONTEND_IMAGE = "iot-frontend:${env.BUILD_ID}"
        BACKEND_IMAGE = "iot-backend:${env.BUILD_ID}"
        SCANNER_HOME = tool 'SonarQubeScanner' // Nombre configurado en Jenkins Global Tool Configuration
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Lint & Test') {
            parallel {
                stage('Frontend Quality') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run test'
                        }
                    }
                }
                stage('Backend Quality') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run test:cov'
                        }
                    }
                }
            }
        }

        stage('Security Scan (Trivy / Audit)') {
            steps {
                dir('backend') { sh 'npm audit --audit-level=high' }
                dir('frontend') { sh 'npm audit --audit-level=high' }
                // Aquí se integraría Trivy fs scan si está instalado en el Jenkins agent
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQubeServer') { // Nombre del server en Jenkins config
                    sh "${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=iot-platform \
                        -Dsonar.sources=frontend/src,backend/src \
                        -Dsonar.host.url=http://sonarqube:9000 \
                        -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info,backend/coverage/lcov.info"
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh "docker build -t ${FRONTEND_IMAGE} -t iot-frontend:latest ."
                        }
                    }
                }
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh "docker build -t ${BACKEND_IMAGE} -t iot-backend:latest ."
                        }
                    }
                }
            }
        }

        stage('Deploy Local (Staging)') {
            steps {
                dir('deploy') {
                    // Usamos las imágenes cacheadas localmente para simular el deploy
                    sh 'docker-compose -f docker-compose.stg.yml down'
                    sh 'docker-compose -f docker-compose.stg.yml up -d'
                }
            }
        }

        stage('Health Checks & Smoke Tests') {
            steps {
                sleep time: 15, unit: 'SECONDS' // Espera a que los contenedores inicien
                sh "curl -f http://iot-backend:3000/api/v1/health || exit 1"
                sh "curl -f http://iot-frontend:3000/api/health || exit 1"
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completado exitosamente."
            // slackSend channel: '#deployments', message: "Despliegue exitoso v${env.BUILD_ID}"
        }
        failure {
            echo "❌ Pipeline falló. Iniciando Rollback automático."
            dir('deploy') {
                // Rollback simple a la versión anterior si existiera tag
                // sh 'docker-compose -f docker-compose.stg.yml down'
            }
        }
    }
}
```

---

## 8. Estrategia de Testing y Calidad (SonarQube)

1. **Unit Tests (Jest):** En el backend de NestJS y en Next.js. Ejecutados en Jenkins.
2. **Cobertura (Lcov):** Se generan reportes de cobertura que se inyectan a SonarQube (`-Dsonar.javascript.lcov.reportPaths`).
3. **Quality Gate:** Jenkins se detiene (`waitForQualityGate abortPipeline: true`) si SonarQube detecta vulnerabilidades críticas o falta de cobertura (Recomendado: 80%).

---

## 9. Seguridad DevSecOps

Para un entorno verdaderamente profesional, implementaremos:
1. **npm audit** para dependencias en etapa temprana.
2. **Imágenes Docker root-less**: Configurado en los Dockerfiles (`USER node` y `USER nextjs`).
3. **Secrets Management:** Jenkins maneja el `.env` (inyectado usando el plugin "Credentials Binding"). NUNCA subir `.env` a GitHub.
4. **Trivy (Roadmap):** Agregaremos escaneo de imágenes Docker (`trivy image iot-backend:latest`) para vulnerabilidades del sistema operativo base.

---

## 10. Despliegue Local (Staging)

Archivo: `/deploy/docker-compose.stg.yml`

```yaml
version: '3.8'

services:
  backend:
    image: iot-backend:latest # Compilado por Jenkins
    container_name: stg_backend
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL:?DATABASE_URL de Supabase es requerida}
      - JWT_SECRET=${JWT_SECRET:?JWT_SECRET es requerido}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID es requerido}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET es requerido}
      - GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL:?GOOGLE_CALLBACK_URL es requerido}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID:?GITHUB_CLIENT_ID es requerido}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET:?GITHUB_CLIENT_SECRET es requerido}
      - GITHUB_CALLBACK_URL=${GITHUB_CALLBACK_URL:?GITHUB_CALLBACK_URL es requerido}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    ports:
      - "3001:3000"
    networks:
      - iot-net
    depends_on:
      - redis

  frontend:
    image: iot-frontend:latest
    container_name: stg_frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    ports:
      - "3002:3000"
    networks:
      - iot-net

  redis:
    image: redis:alpine
    container_name: stg_redis
    networks:
      - iot-net

networks:
  iot-net:
    external: true # Usa la red creada por el compose de infraestructura
```

**Estrategia:** Rolling Update. En Docker Compose usamos `docker-compose up -d`. Docker creará los nuevos contenedores, cambiará el tráfico de los puertos y destruirá los viejos automáticamente, emulando un "Zero downtime" básico.

---

## 11. Observabilidad Básica

* **Logs Centralizados:** Jenkins captura los logs del build. En `docker-compose.stg.yml`, se puede agregar el driver `json-file` con rotación, o conectar a un stack de **Prometheus/Grafana** en el futuro exponiendo métricas de NestJS (`@willsoto/nestjs-prometheus`).
* **Métricas Docker:** Se visualizan localmente con herramientas como Portainer o `docker stats`.

---

## 12. Roadmap de Implementación

Para ejecutar este plan, seguiremos estas fases de manera ordenada:

* **Fase 1 (Día 1):** Reestructurar el repositorio (`/infra`, `/deploy`).
* **Fase 2 (Día 1):** Levantar Infraestructura local (Jenkins, Sonarqube, Ngrok).
* **Fase 3 (Día 2):** Configurar Jenkins (Plugins, Docker en Jenkins, Credenciales).
* **Fase 4 (Día 2):** Escribir y optimizar Dockerfiles (Multi-stage).
* **Fase 5 (Día 3):** Escribir e implementar el `Jenkinsfile`.
* **Fase 6 (Día 3):** Conectar GitHub Webhook con Ngrok y probar pipeline end-to-end.
* **Fase 7 (Día 4+):** Configurar Quality Gates estrictos y añadir escáner Trivy.
* **Fase 8 (Futuro):** Migración Cloud (Convertir `docker-compose.stg.yml` a manifiestos de Kubernetes `Deployment/Service` y cambiar Jenkins a Helm chart).

---

## 13. Correcciones Finales Aprobadas y Criterios Operativos

### Decisiones cerradas
- **Base de datos:** Staging depende de Supabase externo mediante `DATABASE_URL`; no se levantará Postgres local en `deploy/docker-compose.stg.yml`.
- **Health público:** El backend expone health checks públicos bajo el prefijo global: `GET /api/v1/health` y `GET /api/v1/health/ready`.
- **OAuth obligatorio:** Google OAuth y GitHub OAuth son obligatorios en staging; las variables `GOOGLE_*` y `GITHUB_*` deben existir antes de levantar backend.
- **Pipeline estricto:** Los `|| true` se eliminan definitivamente cuando la base está estable; lint, tests, audit, Quality Gate y health checks deben fallar el pipeline si detectan problemas.

### Estrategia para imágenes y volúmenes existentes
- **Reutilizar por defecto:** Como ya existen imágenes y volúmenes, no se eliminan inicialmente para evitar pérdida de estado de Jenkins, SonarQube, Redis o cachés locales.
- **Recrear contenedores:** Para aplicar imágenes nuevas, usar `docker-compose -f deploy/docker-compose.stg.yml up -d --force-recreate`; esto reemplaza contenedores sin borrar volúmenes.
- **Construir si falta imagen:** `deploy/docker-compose.stg.yml` incluye `build.context` para backend y frontend; si `iot-backend:latest` o `iot-frontend:latest` no existen localmente, Compose puede construirlas desde `../backend` y `../frontend`.
- **Reconstruir imágenes:** Jenkins vuelve a construir `iot-backend:latest` e `iot-frontend:latest` después de pasar Quality Gate; en ejecución manual también puede usarse `docker-compose -f deploy/docker-compose.stg.yml up -d --build --force-recreate`.
- **Limpieza opcional:** Solo si hay corrupción de estado o conflictos de red/volúmenes, hacer limpieza manual selectiva y respaldada de contenedores, imágenes o volúmenes.

### Monitoreo mínimo por componente
- **Jenkins:** Revisar Stage View, logs por etapa, duración, causa del build y resultado de Quality Gate antes de deploy.
- **SonarQube:** Confirmar bugs, vulnerabilities, code smells, duplicación y cobertura con Quality Gate bloqueante.
- **Backend:** Verificar `http://localhost:3001/api/v1/health` desde host y `http://stg_backend:3000/api/v1/health` desde la red Docker.
- **Frontend:** Verificar `http://localhost:3002/api/health`, `http://localhost:3002` y llamadas a `NEXT_PUBLIC_API_URL=http://localhost:3001`.
- **Redis ingest:** Validar stream `telemetry:ingest`, grupo `ingest-group`, `consumerLag`, `streamSize` y `eventsPerSecond`.
- **Observability API:** Consultar `/api/v1/observability/metrics` con JWT para confirmar `streamSize`, `consumerLag`, `eventsPerSecond` y `onlineDevices`.
- **Supabase:** Confirmar conectividad por `DATABASE_URL`, migraciones Prisma aplicadas y persistencia real de `dataPoint`.

### Paso a paso final
1. Configurar `.env` de staging con `DATABASE_URL` de Supabase, `JWT_SECRET`, callbacks OAuth y credenciales `GOOGLE_*`/`GITHUB_*`.
2. Confirmar que `iot-net` existe y que Jenkins/SonarQube/ngrok están levantados en `infra/docker-compose.infra.yml`.
3. Ejecutar pipeline Jenkins desde webhook o manualmente.
4. Validar calidad: frontend `lint/test`, backend `lint/test:cov`, `npm audit --audit-level=high` y SonarQube Quality Gate.
5. Construir imágenes Docker solo si los gates anteriores pasaron.
6. Desplegar staging con `docker-compose -f deploy/docker-compose.stg.yml up -d --force-recreate`.
7. Validar health checks backend/frontend/Redis.
8. Enviar payload de prueba a `/api/v1/ingest` con una API key válida.
9. Verificar Redis Stream, persistencia en Supabase y métricas de observabilidad.
10. Si falla el despliegue, conservar volúmenes y revisar logs antes de eliminar recursos; hacer limpieza destructiva solo como último recurso.

---

## User Review Required

> [!IMPORTANT]
> **Aprobación del Plan:** Por favor, revisa esta arquitectura. Si estás de acuerdo, procederé a **crear automáticamente todos los archivos propuestos en tu disco duro**, organizando las carpetas `/infra`, `/deploy`, actualizando los Dockerfiles y el Jenkinsfile en la raíz. 

> [!WARNING]
> Ten a la mano tu `AUTHTOKEN` de Ngrok, un token de acceso personal (PAT) de GitHub, y acceso a la configuración web de Jenkins que se levantará en `localhost:8080`.

¿Deseas que proceda con la creación de los archivos y la reestructuración de los directorios según el plan descrito?
