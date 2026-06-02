# Plan de Trabajo: Funcionalidades CRUD Completas en Plataforma IoT

Este plan detalla el diseño técnico para implementar las operaciones CRUD faltantes (especialmente Edición y Eliminación con alertas de confirmación) en los diferentes módulos del backend y frontend de la plataforma IoT.

---

## User Review Required

> [!IMPORTANT]
> **Eliminaciones en Cascada:**
> El esquema de la base de datos (Prisma) ya tiene configurado `onDelete: Cascade` para todas las relaciones desde `User` (a través de `Account` y `Project`) hasta `DataPoint` y `DashboardConfig`. Al eliminar la cuenta del usuario, se eliminarán **todos** sus datos y telemetría de forma permanente. Se implementará una alerta de confirmación con alta visibilidad en el frontend para mitigar riesgos.

> [!NOTE]
> **Regeneración de Tokens JWT al Actualizar Perfil:**
> Al cambiar el nombre de un usuario local en la página de Ajustes, el token JWT del frontend quedará desactualizado si no se regenera. La ruta `PATCH /auth/profile` devolverá un nuevo `access_token` actualizado que el frontend guardará de inmediato en `localStorage`.

---

## Open Questions

> [!NOTE]
> **Contraseña de Cuentas OAuth:**
> Si un usuario inició sesión por Google/GitHub, no posee contraseña local. La interfaz de cambio de contraseña en la pestaña de Seguridad se deshabilitará o mostrará un mensaje indicando que no aplica para su tipo de cuenta (detectado mediante el campo `hasPassword` en el perfil del usuario).

---

## Proposed Changes

### Backend (NestJS)

#### [MODIFY] [user.repository.interface.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src/auth/domain/repositories/user.repository.interface.ts)
- Declarar métodos para buscar por ID, actualizar datos (nombre y/o contraseña) y eliminar usuario.
```typescript
findById(id: string): Promise<User | null>;
update(id: string, data: { name?: string; password?: string }): Promise<User>;
delete(id: string): Promise<void>;
```

#### [MODIFY] [prisma-user.repository.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src/auth/infrastructure/repositories/prisma-user.repository.ts)
- Implementar los métodos de base de datos definidos en el contrato:
  - `findById` mediante `prisma.user.findUnique`.
  - `update` usando `prisma.user.update` (encriptando la contraseña si se actualiza mediante `bcrypt.hash`).
  - `delete` usando `prisma.user.delete`.

#### [NEW] [update-profile.use-case.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src/auth/application/use-cases/update-profile.use-case.ts)
- Crear el caso de uso para modificar el perfil de usuario. Verificará la contraseña actual antes de actualizar a una nueva contraseña local si corresponde.

#### [NEW] [delete-user.use-case.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src/auth/application/use-cases/delete-user.use-case.ts)
- Crear el caso de uso para eliminar la cuenta de usuario.

#### [MODIFY] [auth.module.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src/auth/auth.module.ts)
- Registrar los nuevos casos de uso (`UpdateProfileUseCase`, `DeleteUserUseCase`) en los `providers` del módulo.

#### [NEW] [update-profile.dto.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src/auth/interfaces/http/dto/update-profile.dto.ts)
- Crear el DTO de validación para la actualización del perfil (nombre y contraseñas).

#### [MODIFY] [auth.controller.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/backend/src/auth/interfaces/http/auth.controller.ts)
- Añadir endpoints protegidos por JWT:
  - `GET /auth/profile`: Retorna los detalles del perfil actual y si tiene contraseña (`hasPassword`).
  - `PATCH /auth/profile`: Actualiza el perfil y retorna un nuevo token JWT.
  - `DELETE /auth/profile`: Elimina permanentemente la cuenta de usuario.

---

### Frontend (Next.js)

#### [MODIFY] [endpoints.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/shared/infrastructure/http/endpoints.ts)
- Agregar endpoint para el perfil del usuario: `PROFILE: '/auth/profile'`.

#### [MODIFY] [auth.repository.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/features/auth/infrastructure/auth.repository.ts)
- Declarar e implementar los métodos HTTP en la capa de datos frontend:
  - `getProfile()` (GET)
  - `updateProfile(data)` (PATCH)
  - `deleteProfile()` (DELETE)

#### [NEW] [metadata.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/features/sensors/domain/metadata.ts) (adición de helper)
- Agregar un formateador inverso de metadatos `formatSensorMetadata(metadata: any): string` que convierta el JSON `{ tags: ['x', 'y'] }` de vuelta a la cadena `'x, y'` para precargar el formulario al editar un sensor.

#### [MODIFY] [projects.repository.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/features/projects/infrastructure/projects.repository.ts)
- Agregar métodos `update(id, input)` (PATCH) y `delete(id)` (DELETE) al repositorio.

#### [MODIFY] [devices.repository.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/features/devices/infrastructure/devices.repository.ts)
- Agregar métodos `update(id, input)` (PATCH) y `delete(id)` (DELETE) al repositorio de dispositivos.

#### [MODIFY] [sensors.repository.ts](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/features/sensors/infrastructure/sensors.repository.ts)
- Agregar métodos `update(id, input)` (PATCH) y `delete(id)` (DELETE) al repositorio de sensores.

#### [NEW] [DeleteConfirmDialog.tsx](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/components/DeleteConfirmDialog.tsx)
- Un componente modal reusable basado en el componente `Dialog` existente, que muestra un aviso de eliminación descriptivo ("¿Estás seguro de eliminar X?") con botones de Cancelar y Confirmar, y soporte para estado de carga (`loading`).

#### [MODIFY] [SettingsPage.tsx](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/app/dashboard/settings/page.tsx)
- Reemplazar la página de ajustes mockeada por una página interactiva:
  - Cargar el perfil actual del usuario usando `authRepository.getProfile()`.
  - Implementar formulario de Información Personal (Edición de Nombre) usando `react-hook-form` y actualización del token JWT en `localStorage`.
  - Implementar formulario de Seguridad (Cambio de contraseña local) con validaciones Zod.
  - Ocultar/deshabilitar campos de contraseña si el perfil reporta que no tiene contraseña local (OAuth).
  - Agregar una sección "Zona de Peligro" con un botón para eliminar la cuenta que active el `DeleteConfirmDialog`. Al confirmar, eliminar la sesión y redirigir a `/login`.

#### [MODIFY] [ProjectsPage.tsx](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/features/projects/presentation/pages/ProjectsPage.tsx)
- Agregar botones de Edición (icono Pencil) y Eliminación (icono Trash2) en el encabezado de cada tarjeta de proyecto.
  - Al hacer clic en Edición, abre un diálogo precargado para actualizar el nombre del proyecto.
  - Al hacer clic en Eliminación, abre el `DeleteConfirmDialog` antes de realizar la petición HTTP y refrescar el listado.

#### [MODIFY] [ProjectDetailPage.tsx](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/features/devices/presentation/pages/ProjectDetailPage.tsx)
- En la tabla de **Gateways (Dispositivos)**:
  - Añadir botones de lápiz y basura en la columna de Acciones.
  - Implementar diálogos de edición y confirmación de eliminación de dispositivos.
- En la rejilla de **Sensores**:
  - En la tarjeta del sensor, agregar botones flotantes en hover (Edición y Eliminación).
  - Implementar diálogos para editar el sensor (cargando nombre y etiquetas mapeadas) y confirmación de eliminación.

#### [MODIFY] [AnalyticsTab.tsx](file:///c:/Users/ZIRO/Documents/Dev/iot-analytics-platform/frontend/src/features/analytics/presentation/AnalyticsTab.tsx)
- Envolver la eliminación de widgets en un diálogo de confirmación para cumplir con la consistencia visual y de seguridad.

---

## Verification Plan

### Automated Tests
- Ejecutar pruebas en el backend para validar que los flujos de negocio no se rompan:
  `npm run test` en la carpeta `backend/`.
- Crear pruebas unitarias para los nuevos casos de uso del backend:
  - `backend/test/unit/application/auth/use-cases/update-profile.use-case.spec.ts`
  - `backend/test/unit/application/auth/use-cases/delete-user.use-case.spec.ts`
- Ejecutar pruebas del frontend:
  `npm run test` en la carpeta `frontend/`.

### Manual Verification
- Levantar backend y frontend localmente (o simular el flujo en staging).
- Navegar a la página de Ajustes y probar la actualización del perfil e ingreso de contraseñas erróneas.
- Intentar eliminar un usuario registrado localmente y verificar que todo su ecosistema (Proyectos, Devices, Sensores) se elimine en cascada de la base de datos.
- Probar la creación, edición y eliminación de Proyectos, Nodos Gateway y Sensores, comprobando que las ventanas de confirmación bloqueen la acción destructiva accidental.
