# Take a Break Monorepo

This repository hosts the multi-package workspace for the Take a Break experience. The structure follows the ownership and architectural guidelines shared with the team.

## Project Structure

```
apps/              # Client applications (React Native, web)
packages/          # Shared libraries (config, types, UI, API clients)
services/          # Backend services grouped by domain (api, break, map, voice)
infra/             # Infrastructure, Firebase bootstrap, schema, and CI/CD tooling
```

## Getting Started

1. Copy `.env.example` to `.env` and supply environment values (Firebase credentials can be omitted when developing locally).
2. Install dependencies with `pnpm install`.
3. Start the Fastify API locally:
   ```bash
   pnpm dev:api
   ```
4. Access the public endpoints:
   - `GET /health`
   - `GET /meta/config`

The API currently exposes only public, unauthenticated routes to unblock front-end and integration work while authentication flows are implemented.
