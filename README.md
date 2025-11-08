## 它们如何互相使用（依赖 / 数据流）

### 客户端链路
- `apps/mobile` → 使用 `packages/api-client` 请求后端接口  
- `packages/api-client` → 复用 `packages/types` 的请求 / 响应类型定义

### 服务端链路
- `services/api` → 复用 `packages/config` 读取环境  
  → 通过 `infra/firebase` 完成 Firebase Admin 初始化  
  → 暴露公共 / 业务路由（共享 `packages/types`）  
- 未来 `services/break/map/voice` → 共享 `infra/middleware`（鉴权 / 日志 / 限流）与 `packages/config`  
  → 访问 Firestore / Storage（经 `infra/firebase`）

### 数据与安全
- `infra/firestore-schema` 定义集合 / 索引 / 迁移  
- `infra/security-rules` 依据该模型编写访问控制  
- 所有读写 Firestore 的服务（`services/*`）需遵循上述模型与规则

### 工程与交付
- `infra/ci-cd` 负责各包 / 服务的构建、测试、部署流水线  
- `packages/ui` 为 `apps/mobile`（及未来 Web）提供复用组件，提高一致性与效率

---

## 简化依赖示意

- apps/mobile → packages/api-client → services/api → infra/firebase → Firestore

- services/api → packages/config、packages/types、infra/middleware

- packages/api-client → packages/types

- infra/security-rules ↔ infra/firestore-schema

- packages/ui ← apps/mobile


---
## 每个人权责分工
模块 1：客户端体验（FE）

Owner： @fe-lead

职责：
- Break 主流程、配置表单、方案卡片、历史/周总结页面
- 统一视觉规范 & 前端交互体验
- 通用 UI 组件、api-client 使用方
  
代码范围（Owner 拥有最终决策权）：
- apps/mobile/
- packages/ui/
- packages/api-client/ 中请求封装实现（不含类型定义）
- packages/config/
  
协作约定：
- 他人如需新增页面入口或组件：提 PR，由 FE Owner 审核。
- 禁止在 apps/* 编写后端业务逻辑。
  

---

模块 2：地图 & 地点服务

Owner： @map-dev

职责：
- 地图 SDK 集成（Apple Maps / MapKit JS）
- RN 地图组件封装
- 地图后端服务：/map/nearby、/map/route 等（如本项目采用方式 A）
  
代码范围：
- services/map/
- 地图相关类型：packages/types 中 Map* 开头部分
  
协作约定：
- 前端使用地图组件 & API，无需修改 services/map/。
- 修改地图服务由 @map-dev 审，其他人不要直接 push。
  

---

模块 3：AI 语音陪伴服务

Owner： @voice-dev

职责：
- speech-to-speech pipeline（ASR + LLM + TTS）
- /voice/session WebSocket
- 会话状态管理 & 摘要写入（根据统一 Firestore schema）
  
代码范围：
- services/voice/
- 语音相关类型：packages/types 中 Voice* 部分
  
协作约定：
- 前端仅通过 packages/api-client 调用 /voice/session。
- Firestore schema 修改由模块 4 Owner 审，模块 3 不直改规则。
  

---

模块 4：后端 & 数据平台（Infra）

Owner： @backend-lead

职责：
- API 契约 & 公共响应格式
- Firebase (Auth, Firestore, Security Rules)
- /break/plans、/history
- 公共中间件（鉴权、日志、限流）
- Git Flow、CI/CD、环境管理
  
代码范围：
- services/break/
- infra/*
- docs/api/
- 公共类型：packages/types（非 map/voice 专属部分）
- packages/api-client 中接口定义生成逻辑
  
协作约定：
- 任意 API / Schema / Rules 变更，需要 @backend-lead 审核。
- 其他模块不得直接修改安全规则和中间件逻辑。


---

## 文档/目录作用概览


### `README.md`
说明整个 monorepo 的结构、启动方式、当前开放的公共 API（`/health`、`/meta/config`）。  
定位：**总览与入门指南**。

---

## 应用层

### `apps/mobile/README.md`
预留 **React Native 客户端** 说明入口。  
后续内容：目录结构与运行指引。

---

## 公共包层

### `packages/ui/README.md`
预留 **共享 UI 组件库** 说明文档。  
用途：移动端与未来 Web 项目复用。

---

### `packages/api-client/README.md`
预留 **类型安全的 HTTP / WebSocket 客户端** 说明文档。  
说明内容（待实现）：  
- 基于稳定 API 的调用封装  
- 前端直接调用后端接口的统一入口

---

### `packages/config`
- `src/index.ts`：`loadConfig()`  
  统一加载与校验环境变量（基于 `zod`），供服务端与基础设施共享。  
- `src/schema.ts`：配置项模式定义，包括：  
  - 环境与端口  
  - Firebase 项目与凭证  
  - 公开特性列表  
  - Swagger 开关

---

### `packages/types`
- `src/public.ts`：公共接口类型定义  
  包含：
  - `HealthResponse`
  - `MetaConfigResponse`  
  用于前后端共享响应模型。

---

## 服务层

### `services/api`
- `src/server.ts`：Fastify 主服务入口  
  - 注册 `CORS` / `Helmet` / `Swagger`  
  - 挂载公共路由  
  - 调用 `@take-a-break/firebase` 完成 Firebase 初始化  
- `src/routes/public.ts`：公共接口路由  
  - `GET /health`  
  - `GET /meta/config`  
  返回结构使用 `@take-a-break/types` 定义的响应类型。

---

### `services/break/README.md`
预留 **“休息计划”核心业务** 与 **鉴权接口** 说明。  
示例接口：  
- `/break/plans`  
- `/history`

---

### `services/map/README.md`
预留 **地图与路线业务** 说明（Apple Maps / MapKit）。  
示例接口：  
- `/map/nearby`  
- `/map/route`

---

### `services/voice/README.md`
预留 **语音会话与 WebSocket 流程** 文档。  
示例接口：  
- `/voice/session`

---

## 基础设施层

### `infra/firebase`
- `src/index.ts`：基于 `@take-a-break/config` 初始化 Firebase Admin  
  功能包括：
  - Auth / Firestore / Storage  
  - 导出：
    - `ensureFirebaseApp()`  
    - `getFirebaseAuth()`  
    - `getFirebaseFirestore()`  
    - `getFirebaseStorage()`

---

### `infra/firestore-schema/README.md`
预留 **Firestore 模型与迁移工具** 的位置。

---

### `infra/security-rules/README.md`
预留 **Firebase 安全规则** 文件，需与 Firestore 模型保持一致。

---

### `infra/middleware/README.md`
预留 **跨服务中间件** 模块说明。  
内容包括：
- 鉴权  
- 日志  
- 限流  

---

### `infra/ci-cd/README.md`
预留 **CI/CD 流水线与部署清单**。  
内容包括：
- 构建与测试流程  
- IaC（基础设施即代码）配置  
- 环境变量与部署策略