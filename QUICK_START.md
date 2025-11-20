# Quick Start

This guide walks you through the minimum steps required to get the web app showing live user locations backed by the Fastify API. Follow the sections in order; each builds on the previous one.

---

## 1. Prerequisites

- **Node.js** ≥ 18.17 (v24 works too) and **pnpm** 8.x installed globally.
- **Google Maps JavaScript API** key with the Maps JavaScript API enabled. See `SETUP_GOOGLE_MAPS.md` if you need a refresher.
- (Optional) Python 3.11+ if you plan to run the voice backend later. This guide focuses on the API + web stack.

---

## 2. Configure Environment Files

1. Copy the sample files:
   ```bash
   cp .env.example .env.local
   cp apps/web/.env.example apps/web/.env.local
   # Optional, only if you need the Expo app
   cp apps/mobile/.env.example apps/mobile/.env.local
   ```
2. Edit the new `.env.local` files:
   - `./.env.local`: set `GOOGLE_MAPS_API_KEY=<your-key>` (optional entries may stay as defaults).
   - `apps/web/.env.local`: set `VITE_GOOGLE_MAPS_API_KEY=<your-key>`. Leave the other placeholders alone unless you know you need to change them.
   - `apps/mobile/.env.local`: set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<your-key>` if you plan to run the mobile app.
3. After editing `.env.local`, restart any running dev servers so Vite picks up the changes.

> Tip: create the keys in Google Cloud Console → APIs & Services → Credentials. Enable **Maps JavaScript API** for the same project.

---

## 3. Install Dependencies

From the repo root:

```bash
pnpm install
```

This wires up all workspaces (apps, packages, services, infra).

---

## 4. Start the Services

Use two terminals:

### API (Fastify) server
```bash
pnpm --filter @take-a-break/api dev
# Runs on http://localhost:3333 by default
```

### Web client
```bash
pnpm --filter @take-a-break/web dev
# Visit http://localhost:5174/explore
```

Grant the browser location permission when prompted on the `/explore` page. Once the permission is accepted and the Google Maps key is valid, the map centers on your real location.

---

## 5. Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Map stuck on “Loading map…” | Missing/invalid Google Maps key | Re-check `apps/web/.env.local`, confirm the Maps JavaScript API is enabled, restart Vite |
| Browser shows `ERR_CONNECTION_REFUSED` fetching API routes | API server not running | Start the API process with `pnpm --filter @take-a-break/api dev` |
| Browser never asks for location | Permission previously denied | Click the lock icon in the browser address bar → set Location to “Allow” → refresh |
| Console logs “Network location provider at 'https://www.googleapis.com/' ...” | Browser fallback, not an error | Ignore; it disappears once permission is granted |
| `pnpm dev` complains about missing `.env.local` | No env files | Copy from the `.env.example` files as described above |

---

## 6. Reference Changes (already in repo)

- `.env.local` – added for root services (populate with your own secrets).
- `pnpm-workspace.yaml` – includes `services/*` and `infra/firebase`.
- `services/api/package.json` – ensures `tsx`/`typescript` are available for the dev server.
- `apps/web/src/pages/ExplorePage.tsx` – uses the location hook safely.
- `SETUP_GOOGLE_MAPS.md` – deep dive on API key creation and restrictions.

You shouldn’t need to modify these unless you are extending the system.

---

## 7. Next Steps

1. Confirm the `/explore` map shows your actual location.
2. Commit your `.env.local` changes **to your machine only**; do not check them in.
3. When you’re ready to use the voice agent, run the provided shell scripts (`services/voice/web_agent/setup.sh` once, then `./start_backend.sh` and `./start_frontend.sh`) instead of manually invoking commands—they set up the correct env and validation.
4. Continue with the voice backend or mobile setup if needed (see `services/voice/web_agent/README.md` and `apps/mobile/README.md`).

Need more detail? Consult:
- `SETUP_GOOGLE_MAPS.md` for API key creation.
- `START_TUNNEL.md` if you must expose the API.
- `VOICE_INTEGRATION_GUIDE.md` for the voice agent.


