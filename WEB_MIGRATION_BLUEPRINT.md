## Web Migration Blueprint

### 1. Legacy Native Surfaces (Removed)

`apps/mobile`（包含 Expo、iOS、Android 工程）已删除。以下区域曾依赖原生能力，现改由 Web 端体验接手：

| Area | 现状 | 后续关注点 |
| --- | --- | --- |
| Navigation shell | Expo 导航壳已移除 | Web 路由使用 React Router + `@take-a-break/ui` 组件，确保导航视觉一致 |
| Maps UI | Native `MapModal` 已移除 | Web 版本依赖 `packages/map` 的 Google Maps 渲染路径，需要持续验证交互体验 |
| Break & chat tabs | React Native 组件已移除 | Web 端使用相同 UI 包，必要时可压缩未使用的 `.native` 变体 |
| Voice assistant surfaces | Mobile 语音入口删除 | Web 继续整合 `services/voice/web_agent`，后续逐步接入浏览器语音能力 |
| Location + navigation utilities | Expo 定位与深链逻辑删除 | Web 遵循 `useBrowserLocation` + 外部导航链接，需要完善不同浏览器下的权限与跳转体验 |

### 2. Abstractions Added in this change set

1. **Shared UI package** (`packages/ui`)
   - `BottomTabBar` implements the custom pill-styled tab selector once, now consumed by both the Expo shell and the new router-driven web shell.
   - Package is published as `@take-a-break/ui` and typed via `moduleSuffixes` to support `.native`/`.web` specializations later.

2. **Cross-platform map package** (`packages/map/src/react`)
   - Existing map domain package (migrated from `services/map` to `packages/map`) now exposes `MapView`, `MapMarker`, `MapPolyline`, and `MapProvider`.
   - Web rendering path loads Google Maps JS at runtime without extra npm deps and provides imperative helpers (`fitToCoordinates`, `animateCamera`) so modal code keeps working.
   - Native entry points are deprecated alongside `apps/mobile`; keep stubs only if required by package consumers.

3. **Browser location + API access**
   - `useBrowserLocation` encapsulates permission prompts, stores error states, and powers UI hints.
   - `browserMapService` shares the `MapApiClient` to fetch nearby places/routes using the same backend contract as mobile.

4. **New Vite-powered web target (`apps/web`)**
   - React Router shell with responsive layout, shared tab bar, and React Native Web primitives.
   - Break page reuses the mock plan generator, fetches nearby places, and renders them via the new Google Maps-backed view.
   - Chat route is stubbed with copy that directs folks to mobile until voice is ported.

5. **DevOps + testing**
   - Vitest unit coverage for `useBrowserLocation` covers both unsupported browsers and a happy path.
   - GitHub Actions workflow builds/tests the dedicated web filter and uploads the bundle artifact.
   - iOS native directory removed per request; Expo clients keep using the shared packages.

### 3. Outstanding follow-ups

| Workstream | Notes |
| --- | --- |
| Remove obsolete native code paths | Audit shared packages for `.native` entry points and retire them where no longer referenced. |
| Navigation/session hooks | Replace `useNavigationSession` / navigation helpers with web-first variants living alongside React Router. |
| Voice + chat | Web route is currently informational. Hook it to the voice service when browser audio stack + auth scaffolding land. |
| Deployment | Workflow builds and uploads artifacts; wire to hosting (e.g., Cloudflare Pages) once infra target is picked. |
