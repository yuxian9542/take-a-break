# 网络请求修复指南

## 问题诊断

经过全面审查，发现了导致"network request failed"错误的根本原因：

### 主要问题：

1. **端口不匹配** 
   - API服务器默认监听 3333 端口
   - 移动端客户端尝试连接到 3000 端口
   - 导致所有网络请求失败

2. **缺少环境配置**
   - 没有环境变量文件来配置 API 端点
   - 没有明确的文档说明如何配置

3. **调试信息不足**
   - 错误日志不够详细，难以定位问题

## 已实施的修复

### 1. 修复端口配置（✅ 已完成）

**文件：** `apps/mobile/src/services/mapService.ts`

**更改：**
- 将默认 API 端口从 3000 改为 3333
- 添加详细的控制台日志，显示正在使用的 API URL
- 添加详细的错误日志，包括错误堆栈信息

```typescript
function getDevApiPort(): number {
  const fromEnv = process.env.EXPO_PUBLIC_API_PORT ?? process.env.API_PORT;
  const parsed = fromEnv ? Number(fromEnv) : NaN;
  // 改为3333以匹配API服务器默认端口
  return Number.isFinite(parsed) ? parsed : 3333;
}
```

### 2. 添加详细日志（✅ 已完成）

在以下方法中添加了详细的调试日志：
- `getCurrentLocation()` - 显示API URL和设备位置
- `getNearbyPlaces()` - 显示请求参数和结果数量
- `getRoute()` - 显示路线请求详情
- `resolveApiBaseUrl()` - 显示解析的API基础URL

### 3. 环境配置示例

由于 `.env` 文件被 gitignore，您需要手动创建它们：

#### 移动端配置
创建 `apps/mobile/.env`：
```bash
# API Configuration
EXPO_PUBLIC_API_PORT=3333

# Optional: 显式设置API基础URL（如果需要）
# EXPO_PUBLIC_API_BASE_URL=http://localhost:3333
```

#### 后端API配置
创建 `services/api/.env`：
```bash
# API Server Configuration
PORT=3333
APP_ENV=development
ENABLE_SWAGGER=true
```

## 如何使用

### 1. 启动后端API服务器

```bash
cd services/api
PORT=3333 pnpm run dev
```

验证服务器是否运行：
```bash
curl http://localhost:3333/health
# 应该返回: {"status":"ok","timestamp":"...","environment":"development"}
```

### 2. 启动移动应用

```bash
cd apps/mobile
pnpm run dev
```

### 3. 测试网络连接

当您在应用中点击 navigation 按钮时，检查控制台日志：

**预期看到的日志：**
```
[MapService] Resolved API base URL: http://localhost:3333
[MapService] Getting current location with API URL: http://localhost:3333
[MapService] Device location obtained: {lat: ..., lng: ..., accuracy: ...}
[MapService] Fetching nearby places: {lat: ..., lng: ..., options: {...}}
[MapService] Found X nearby places
```

**如果出现错误：**
```
[MapService] Error details: {message: "...", name: "...", stack: "..."}
```

## API端点验证

您可以使用以下命令手动测试API端点：

### 健康检查
```bash
curl http://localhost:3333/health
```

### 获取位置
```bash
curl http://localhost:3333/map/location
```

### 获取附近地点
```bash
curl "http://localhost:3333/map/nearby?lat=40.7829&lng=-73.9654&radius=2000&limit=5"
```

### 获取路线
```bash
curl -X POST http://localhost:3333/map/route \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"lat": 40.7829, "lng": -73.9654},
    "destinationId": "spot_001"
  }'
```

## 故障排除

### 问题：仍然显示 "network request failed"

**检查清单：**

1. **验证API服务器是否运行**
   ```bash
   curl http://localhost:3333/health
   ```
   如果失败，重启API服务器。

2. **检查端口是否被占用**
   ```bash
   lsof -i :3333
   ```

3. **查看移动应用控制台日志**
   - 查找 `[MapService]` 前缀的日志
   - 检查 API URL 是否正确
   - 查看错误详情

4. **检查网络权限**
   - iOS：检查 Info.plist 中的网络设置
   - Android：检查 AndroidManifest.xml 中的网络权限

5. **对于Android模拟器**
   - 使用 `10.0.2.2` 而不是 `localhost`
   - mapService 已经自动处理这个转换

6. **重启应用和服务器**
   - 停止API服务器（Ctrl+C）
   - 停止Expo开发服务器（Ctrl+C）
   - 清除缓存：`pnpm run dev --clear`
   - 重启两个服务

### 问题：API服务器无法启动

**检查：**
1. 依赖是否安装：`pnpm install`
2. TypeScript配置是否正确
3. 端口3333是否被占用

### 问题：位置权限被拒绝

应用会自动回退到API的mock位置，所以这不应该导致"network request failed"错误。

## 架构说明

### 网络请求流程

```
移动应用 (MapModal)
    ↓
mapService.getCurrentLocation()
    ↓
MapApiClient.getCurrentLocation()
    ↓
HttpClient.get('/map/location')
    ↓
API服务器 (localhost:3333)
    ↓
LocationService
    ↓
返回位置数据
```

### URL解析逻辑

1. 检查显式环境变量 `EXPO_PUBLIC_API_BASE_URL`
2. 如果在开发模式（`__DEV__`）：
   - 获取端口（默认3333）
   - 检测开发服务器主机（从Metro脚本URL）
   - 对Android自动转换 localhost → 10.0.2.2
3. 如果在生产模式：使用生产URL

## 测试确认

✅ API服务器在端口3333运行  
✅ `/health` 端点响应正常  
✅ `/map/location` 端点返回mock位置  
✅ `/map/nearby` 端点返回附近地点列表  
✅ 所有端点都能正常响应  

## 后续步骤

现在您应该能够：
1. 启动API服务器
2. 启动移动应用
3. 点击 navigation 按钮
4. 看到地图加载，显示您的位置和附近地点
5. 不再看到 "network request failed" 错误

如果仍有问题，请检查控制台日志中的详细错误信息。

