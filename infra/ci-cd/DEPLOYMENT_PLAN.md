# Deployment Plan

Routes follow the provided baseline: Cloudflare Pages for web, Fly.io for API and voice, GHCR for images, Cloudflare DNS for domains.

## Branches → environments
- `main` → production (`app.example.com`, `api.example.com`, `voice.example.com`)
- `develop` → staging (`staging.app.example.com`, etc.)
- PRs → CI + Pages preview only; backend deploy is skipped.

## GitHub Actions secrets/vars
- Cloudflare: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_PROJECT_NAME` (project slug, default `take-a-break`).
- Web envs (Vite): `WEB_API_BASE_URL_PROD`, `WEB_API_BASE_URL_STAGING`, `WEB_API_BASE_URL_PREVIEW`; `WEB_VOICE_WS_URL_PROD`, `WEB_VOICE_WS_URL_STAGING`, `WEB_VOICE_WS_URL_PREVIEW`; `WEB_GOOGLE_MAPS_API_KEY`.
- Registry + Fly: `GHCR_PAT` (with `write:packages`), `FLY_API_TOKEN`.

## Fly.io secrets to set per app
- API apps (`api-example`, `api-example-staging`): `APP_ENV`, `PORT` (3333), `NODE_ENV=production`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET`, `GOOGLE_MAPS_API_KEY`, `ENABLE_SWAGGER` (true/false), `PUBLIC_FEATURES` (csv).
- Voice apps (`voice-example`, `voice-example-staging`): `GLM_API_KEY`, `VITE_BACKEND_URL=https://voice.example.com` (or staging host).

## Workflows added
- `.github/workflows/deploy-web.yml` — build/test web + API lint; deploy web to Cloudflare Pages with branch-based envs and PR preview branches.
- `.github/workflows/deploy-api.yml` — lint API, build/push `services/api` image to GHCR, deploy to Fly (`api-example` / `api-example-staging`).
- `.github/workflows/deploy-voice.yml` — build/push Python voice backend image, deploy to Fly (`voice-example` / `voice-example-staging`).

## Dockerfiles
- `services/api/Dockerfile`: node:18-alpine, pnpm build of `@take-a-break/api` and deps, runs `node services/api/dist/server.js` on `PORT` (default 3333).
- `services/voice/web_agent/Dockerfile`: python:3.11-slim with ffmpeg/libsndfile, installs `requirements.txt`, runs `uvicorn backend.main:app --host 0.0.0.0 --port 8000`.

## Notes
- API build currently fails locally on `pnpm --filter @take-a-break/api build` because of config schema typing and a missing `@take-a-break/types/public.js` import; fix before expecting deploy jobs to pass.
- Add DNS: `app.example.com` → Cloudflare Pages; `api.example.com`/`voice.example.com` → Fly.io CNAMEs. TLS handled by Cloudflare.
