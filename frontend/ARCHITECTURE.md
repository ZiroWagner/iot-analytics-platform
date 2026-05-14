# Frontend Architecture

Feature-based layered architecture inspired by Clean Architecture. Each feature is self-contained and composed of four layers with strict dependency direction:

```
presentation  ->  application  ->  domain
       \                |              ^
        `------>  infrastructure ------'
```

- **domain**: pure TypeScript. Types, Zod schemas, business rules, reducers. No I/O, no React, no framework imports.
- **application**: use cases that orchestrate domain + infrastructure. Stateless functions. Only added where they encapsulate non-trivial logic (validation + repo call + side effects).
- **infrastructure**: adapters to the outside world (HTTP repositories, sockets, browser storage). Implements interfaces declared in the same layer and consumes `@/shared/infrastructure/http`.
- **presentation**: React components, Zustand stores, hooks, pages. The only layer allowed to import from `next/*`, `react`, UI libs.

## Directory layout

```
src/
  shared/
    infrastructure/http/   # apiClient, endpoints, token storage, base URL config
    lib/                   # cn() + framework-agnostic utilities
  features/
    auth/                  # login, register, OAuth callback, session, logout
    telemetry/             # WS singleton, domain reducers, Zustand store, hooks
    projects/              # projects list, overview stats, recent events
    devices/               # devices per project, ProjectDetailPage
    sensors/               # sensors CRUD, sensor data modal
    observability/         # system metrics, lag thresholds, MetricsPage
    analytics/             # multi-series widgets, legacy config migration
  app/                     # Next.js App Router; thin wrappers delegating to features
  components/ui/           # shadcn primitives (consume @/lib/utils shim by convention)
  lib/utils.ts             # permanent shim re-exporting @/shared/lib (shadcn convention)
```

Each feature follows:

```
features/<name>/
  domain/         # types.ts, schemas.ts, rules.ts, reducers.ts, index.ts
  application/   # use-cases/*.ts (optional)
  infrastructure/ # <name>.repository.ts
  presentation/  # hooks/, components/, pages/, store.ts
  tests/         # vitest specs colocated by feature
  index.ts       # public barrel
```

## Dependency rules

- `domain` must not import from `application`, `infrastructure`, `presentation`, or any framework.
- `application` may import only from its own `domain` and `infrastructure` interfaces.
- `infrastructure` may import from `domain` and `@/shared/infrastructure/http`.
- `presentation` may import from any layer of its own feature and from other features' public barrels (`@/features/<name>`), never from another feature's internal paths.
- `app/` is a thin layer of Next.js wrappers; pages re-export the corresponding presentation page.

## State management

- **UI state** (modals, tabs, forms): local React state.
- **Business state**: Zustand stores live in `presentation/store.ts` and delegate mutations to pure reducers in `domain/reducers.ts` (see `features/telemetry`).
- **Server state**: hooks in `presentation/hooks/*` using the feature repository. Polling intervals and auth guards are encapsulated there.

## Real-time telemetry

- `features/telemetry/infrastructure/socket.ts` exposes a Socket.IO singleton bound to the API base URL (no `/api/v1` prefix).
- The gateway emits `telemetry_batch` as `{ events: TelemetryEvent[] }` and `device_status` for online/offline transitions; reducers in `domain/reducers.ts` apply both deterministically.
- Device "active" status follows: WS state (`status === 'online'`) takes precedence over REST `lastSeenAt` fallback (TTL ~15s). See `features/devices/domain/rules.ts`.

## Testing

- Stack: **Vitest + RTL + MSW**.
- Domain layers are covered by pure unit tests (`reducers`, `rules`, `schemas`, `legacy`).
- Use cases are covered with stubbed repositories (`features/auth/tests/*.use-case.test.ts`).
- Current status: **16 test files / 71 tests passing**.

Run:

```
npm test          # vitest run
npx tsc --noEmit  # type check
```

## Migration notes

- The legacy `src/lib/*` shims for `api-client`, `api-endpoints`, `use-telemetry`, `telemetry-store` were removed after the migration; only `src/lib/utils.ts` remains by shadcn convention.
- `src/components/analytics/*` and `src/components/dashboard/AnalyticsTab.tsx` have been removed; consumers import from `@/features/analytics`.
- `src/app/**/page.tsx` files are now thin re-exports of feature presentation pages.
