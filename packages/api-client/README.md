# API Client

This package provides typed accessors for backend services. `MapApiClient` (see `src/map.ts`) wraps the `/map/nearby`, `/map/location`, and `/map/route` endpoints with shared types sourced from `@take-a-break/types`. Run `pnpm --filter @take-a-break/api-client test` to execute the Vitest suite that checks query serialization, payload parsing, and error handling.
