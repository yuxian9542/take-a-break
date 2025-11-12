# 环境变量配置模板

## 创建 .env 文件

在项目根目录创建 `.env` 文件，使用以下模板：

```env
# ============================================
# Application Environment
# ============================================
APP_ENV=development
PORT=3333

# ============================================
# Google Maps API Configuration
# ============================================
# 获取 API Key: https://console.cloud.google.com/google/maps-apis
# 详细设置步骤见: GOOGLE_MAPS_SETUP.md

GOOGLE_MAPS_API_KEY=你的API密钥

# 启用真实地图 API (true=使用Google Maps, false=使用Mock数据)
USE_REAL_MAP_API=true

# ============================================
# Firebase Configuration (可选)
# ============================================
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
# FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# ============================================
# Feature Flags
# ============================================
PUBLIC_FEATURES=break-planner,map,voice

# ============================================
# Development Settings
# ============================================
ENABLE_SWAGGER=true
```

## 快速开始

### 1. 复制模板

```bash
cat > .env << 'EOF'
APP_ENV=development
PORT=3333
GOOGLE_MAPS_API_KEY=你的API密钥
USE_REAL_MAP_API=true
PUBLIC_FEATURES=break-planner,map,voice
ENABLE_SWAGGER=true
EOF
```

### 2. 替换 API 密钥

编辑 `.env` 文件，将 `你的API密钥` 替换为实际的 Google Maps API Key。

### 3. 验证配置

```bash
# 检查环境变量
cat .env

# 启动服务器并检查日志
pnpm run dev:api
```

## 配置说明

### 必需配置

| 变量 | 说明 | 示例 |
|------|------|------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API 密钥 | `AIzaSyD...` |
| `USE_REAL_MAP_API` | 是否使用真实 API | `true` 或 `false` |

### 可选配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `APP_ENV` | 应用环境 | `development` |
| `PORT` | 服务器端口 | `3333` |
| `ENABLE_SWAGGER` | API 文档 | `true` |

## 不同环境配置

### 开发环境

```env
APP_ENV=development
USE_REAL_MAP_API=true  # 或 false 节省配额
ENABLE_SWAGGER=true
```

### 生产环境

```env
APP_ENV=production
USE_REAL_MAP_API=true
ENABLE_SWAGGER=false
```

## 安全注意事项

⚠️ **重要**: 
- `.env` 文件包含敏感信息，**不要**提交到 Git
- 确保 `.env` 在 `.gitignore` 中
- 不同环境使用不同的 API 密钥
- 定期轮换 API 密钥

## 验证配置

启动服务器后，检查日志：

### 使用真实 API
```
[MapService] Using Google Places API
[MapService] Using Google Directions API
```

### 使用 Mock 数据
```
[MapService] Using mock places data
[MapService] Using heuristic routing
```

## 故障排查

### 问题：找不到 .env 文件

```bash
# 检查文件是否存在
ls -la .env

# 检查文件内容
cat .env
```

### 问题：环境变量未加载

```bash
# 确保 .env 在项目根目录
pwd  # 应该显示: /Users/ming/Documents/take-a-break

# 重启服务器
pnpm run dev:api
```

### 问题：API Key 无效

1. 检查 API Key 是否正确复制（没有多余空格）
2. 确认在 Google Cloud Console 中启用了相应的 API
3. 检查 API Key 的限制设置

## 相关文档

- `GOOGLE_MAPS_SETUP.md` - Google Maps API 配置详细步骤
- `REAL_MAP_INTEGRATION_GUIDE.md` - 真实地图集成指南
- `NETWORK_FIX_GUIDE.md` - 网络问题排查



