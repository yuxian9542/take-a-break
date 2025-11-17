# Take a Break – Application Feature Overview

This document captures the functionality of the Take a Break product as implemented before removal of the application codebase. It covers the cross-platform experience (mobile and web) as well as the supporting services that powered the app.

## Mobile App (Expo / React Native)

- **Break Planner (`Break` tab)**
  - Guided flow that collects how the user feels (`tired`, `stressed`, `need_pause`), available time (10/30/60 minutes), and preferences (can go outside / can talk).
  - Generates up to three tailored plans using the shared scenario generator. Plans include breathing exercises, walking routes, meditation, or voice sessions.
  - Launches the detailed plan modal where users can step through recommendations and trigger follow-up actions.

- **Map & Navigation Modal**
  - Presents nearby restorative locations using `react-native-maps` with support for markers, polylines, and in-app walking guidance.
  - Fetches server-provided nearby places and routes; integrates device GPS via `expo-location`.
  - Allows starting native navigation (Apple Maps / Google Maps) or switching to an in-app navigation session with live progress and step instructions.

- **Voice Companion (`Chat` tab & modal)**
  - Displays recent AI voice session history, including durations, topics, and mood transitions.
  - Provides a modal to engage the AI companion with microphone toggles, listening/speaking indicators, and conversation transcript placeholders.

- **Theming & UI**
  - Custom gradients (`expo-linear-gradient`), iconography via `lucide-react-native`, and tailored bottom tab navigation with animated states.

## Web App (Vite + React + react-native-web)

- **Responsive Shell**
  - Sidebar navigation with links to Planner, Explore, and Voice sections.
  - Uses `react-router-dom` for client-side routing and a desktop-friendly layout layer.

- **Planner Page**
  - Mirrors the mobile planner experience in the browser with radio-style selection pills and toggles.
  - Generates restorative plans using the shared break-plan package and renders them as cards with actionable links (view on map, resume voice).

- **Explore Page**
  - Embeds an interactive Google Map (`@react-google-maps/api`) that loads the same nearby places as the mobile app.
  - Requests browser geolocation (with graceful fallback) and highlights walking routes returned by the backend.
  - Supports deep-linking to a specific location (`?highlight=PLACE_ID`).

- **Voice Page**
  - Lists recent AI voice sessions, summarizing mood changes, topics, and durations.
  - Provides quick actions to resume talking, listen back, or reopen transcripts.

- **Shared UX**
  - Web styling implemented with handcrafted CSS for gradients, cards, pills, and responsive grids.
  - Reuses the shared break-plan generator to ensure parity with the mobile experience.

## Shared Packages & Services

- **`@take-a-break/break-plans`**
  - Centralized mock data (`mockSpots`) and `generateBreakPlan` logic powering both mobile and web planners.
  - Scenarios include Wim Hof breathing, guided meditation, voice sessions, and walking routes to curated nearby locations.

- **Map API Integration**
  - `@take-a-break/api-client` consumed by both platforms to fetch current location, nearby places, and walking routes from the backend.
  - Mobile used `ExpoLocationProvider`; web relied on `WebMapService` with browser geolocation plus fallback to server-side coordinates.

- **Voice & Navigation Documentation**
  - Repository retained guides (`NAVIGATION_FEATURE_GUIDE.md`, `SUCCESS_真实地图已启用.md`, etc.) detailing production setup, device testing, and navigation tuning.

## Platform Support Files

- **Configuration**
  - `app.json`, native platform directories (`ios/`, `android/`), and Gradle/Xcode settings for building mobile binaries.
  - Web-specific `vite.config.ts`, `index.html`, and environment typings (`env.d.ts`).

- **Continuous Integration**
  - `infra/ci-cd/web-app-preview.yml` workflow for building the web bundle, running break-plan tests, and uploading artifacts via GitHub Actions.

## Notes

- This summary reflects functionality prior to the removal of the application source code.
- External services (map routing, voice AI) were assumed to be provided via backend APIs; integration stubs were present in the repo but are now scheduled for deletion alongside the app code.

