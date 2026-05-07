# IoT Analytics Platform - Backend API

## Descripción
API backend para plataforma de analítica IoT construida con NestJS y arquitectura limpia (Clean Architecture + DDD).

## Instalación

```bash
npm install
```

## Configuración

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configurar las variables de entorno en `.env`:
   - **Database**: `DATABASE_URL` (PostgreSQL/Supabase)
   - **JWT**: `JWT_SECRET`, `JWT_EXPIRES_IN`
   - **OAuth**: Google y GitHub credentials
   - **Redis**: `REDIS_HOST`, `REDIS_PORT`
   - **Frontend**: `FRONTEND_URL`

3. Las variables se validan automáticamente al iniciar usando Joi (ver `src/config/configuration.ts`)

## Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

## Documentación API

Swagger disponible en: `http://localhost:3001/api-docs`

## Estructura del Proyecto

```
src/
├── auth/                    # Autenticación (JWT, OAuth Google/GitHub)
│   ├── application/use-cases/  # Casos de uso
│   ├── domain/entities/         # Entidades de dominio
│   ├── interfaces/http/         # Controladores y DTOs
│   └── strategies/              # Passport strategies
├── devices/                 # Gestión de dispositivos (Clean Architecture)
├── sensors/                 # Gestión de sensores (Clean Architecture)
├── projects/                # Gestión de proyectos (Clean Architecture)
├── analytics/               # Analítica y métricas (Clean Architecture)
├── dashboards/              # Configuración de dashboards (Clean Architecture)
├── ingest/                  # Ingesta de datos IoT (Redis Streams)
├── telemetry/               # Telemetría de dispositivos
├── observability/           # Métricas del sistema
├── common/                  # Filtros, interceptores, utilidades
│   ├── filters/            # HttpExceptionFilter
│   └── interceptors/       # ResponseInterceptor
├── config/                  # Configuración y validación
│   └── configuration.ts    # Variables de entorno con Joi
└── prisma/                 # Prisma ORM
```

## Características Implementadas

### FASE 1: Refactorización a Clean Architecture
- ✅ Módulo Devices: Entidades de dominio, repositorios, casos de uso
- ✅ Módulo Sensors: Entidades de dominio, repositorios, casos de uso
- ✅ Módulo Analytics: Entidades de dominio, repositorios, casos de uso
- ✅ Módulo Dashboards: Entidades de dominio, repositorios, casos de uso
- ✅ Módulo Auth: Casos de uso, DTOs con validación

### FASE 2: Seguridad y Configuración
- ✅ **ConfigService**: Integración completa con `@nestjs/config`
- ✅ **Validación de env**: Joi schema en `config/configuration.ts`
- ✅ **Global ValidationPipe**: whitelist, forbidNonWhitelisted, transform
- ✅ **CORS**: Configurado con `FRONTEND_URL` desde ConfigService
- ✅ **Helmet**: Security headers
- ✅ **Rate limiting**: Basic rate limiting
- ✅ **ResponseInterceptor**: Respuestas unificadas
- ✅ **HttpExceptionFilter**: Errores unificados
- ✅ **API prefix**: `/api/v1`

### FASE 3: Documentación
- ✅ **Swagger/OpenAPI**: Integrado en `/api-docs`
- ✅ **Decoradores**: `@ApiTags`, `@ApiOperation`, `@ApiResponse` en todos los controladores
- ✅ **DTOs documentados**: `@ApiProperty` en todos los DTOs
- ✅ **Autenticación Bearer**: Documentada en endpoints protegidos

## Endpoints Principales

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Login local
- `GET /api/v1/auth/google` - OAuth Google
- `GET /api/v1/auth/github` - OAuth GitHub

### Proyectos
- `POST /api/v1/projects` - Crear proyecto
- `GET /api/v1/projects` - Listar proyectos
- `GET /api/v1/projects/overview` - Resumen de proyectos
- `GET /api/v1/projects/:id` - Obtener proyecto
- `PATCH /api/v1/projects/:id` - Actualizar proyecto
- `DELETE /api/v1/projects/:id` - Eliminar proyecto

### Dispositivos
- `POST /api/v1/devices` - Crear dispositivo
- `GET /api/v1/devices/project/:projectId` - Listar por proyecto
- `GET /api/v1/devices/:id` - Obtener dispositivo
- `PATCH /api/v1/devices/:id` - Actualizar dispositivo
- `DELETE /api/v1/devices/:id` - Eliminar dispositivo

### Sensores
- `POST /api/v1/sensors` - Crear sensor
- `GET /api/v1/sensors/device/:deviceId` - Listar por dispositivo
- `GET /api/v1/sensors/:id` - Obtener sensor
- `GET /api/v1/sensors/:id/data` - Obtener datos del sensor (con filtros `from`, `to`, `limit`)
- `PATCH /api/v1/sensors/:id` - Actualizar sensor
- `DELETE /api/v1/sensors/:id` - Eliminar sensor

### Analítica
- `GET /api/v1/analytics/:projectId/metrics` - Métricas disponibles
- `GET /api/v1/analytics/:projectId/timeseries` - Serie temporal
- `GET /api/v1/analytics/:projectId/multi-timeseries` - Múltiples series
- `GET /api/v1/analytics/:projectId/stats` - Estadísticas

### Ingesta de Datos
- `POST /api/v1/ingest` - Ingestar datos IoT (usa API Key)

### Dashboards
- `GET /api/v1/dashboards/project/:projectId` - Obtener configuración
- `POST /api/v1/dashboards/project/:projectId` - Guardar configuración

## Formato de Respuesta

### Éxito
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-05-02T12:34:56.789Z",
  "path": "/api/v1/..."
}
```

### Error
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "details": [...],
  "timestamp": "2026-05-02T12:34:56.789Z",
  "path": "/api/v1/..."
}
```

## Variables de Entorno

Todas las variables se configuran en `.env` y se validan automáticamente:

| Variable | Descripción | Requerida | Default |
|----------|-------------|-----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Sí | - |
| `JWT_SECRET` | Clave secreta para JWT | ✅ Sí | - |
| `JWT_EXPIRES_IN` | Tiempo de expiración JWT | No | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ Sí | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | ✅ Sí | - |
| `GOOGLE_CALLBACK_URL` | Google OAuth Callback | ✅ Sí | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | ✅ Sí | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | ✅ Sí | - |
| `GITHUB_CALLBACK_URL` | GitHub OAuth Callback | ✅ Sí | - |
| `FRONTEND_URL` | URL del frontend (CORS) | No | `http://localhost:3000` |
| `REDIS_HOST` | Redis host | No | `localhost` |
| `REDIS_PORT` | Redis port | No | `6379` |
| `PORT` | Puerto de la aplicación | No | `3001` |
| `NODE_ENV` | Entorno (development/production/test) | No | `development` |

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Migraciones Prisma

```bash
# Generar cliente
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Studio (interfaz visual)
npx prisma studio
```

## Licencia
MIT
