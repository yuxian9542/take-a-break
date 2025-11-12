# Take a Break - 快速启动指南

## 🎯 问题已修复

"network request failed" 错误已经完全修复！

### 修复的问题：
✅ **端口不匹配** - API服务器使用3333端口，客户端现在也连接3333端口  
✅ **API基础URL配置** - 开发模式下正确解析API地址  
✅ **详细的错误日志** - 添加了完整的调试信息  
✅ **API服务器测试** - 所有端点都能正常响应  

---

## 🚀 快速启动（两步）

### 第1步：启动API服务器

打开一个终端窗口，运行：

```bash
cd /Users/ming/Documents/take-a-break/services/api
PORT=3333 pnpm run dev
```

**看到这个输出说明成功：**
```
API listening on http://0.0.0.0:3333
```

### 第2步：启动移动应用

打开另一个终端窗口，运行：

```bash
cd /Users/ming/Documents/take-a-break/apps/mobile
pnpm run dev
```

然后选择您的平台：
- 按 `i` 启动 iOS 模拟器
- 按 `a` 启动 Android 模拟器  
- 扫描二维码在真机上测试

---

## ✅ 验证修复

### 快速测试API服务器

```bash
curl http://localhost:3333/health
```

**预期输出：**
```json
{"status":"ok","timestamp":"2025-11-12T...","environment":"development"}
```

### 在应用中测试

1. 打开应用
2. 选择感觉状态（Tired/Stressed/Pause）
3. 选择时间（10 min/30 min/1 hour）
4. 点击 "Start" 按钮
5. 选择一个方案
6. **点击 "Navigation" 按钮**
7. 应该能看到：
   - ✅ 地图加载成功
   - ✅ 显示您的位置
   - ✅ 显示附近的地点
   - ✅ 没有 "network request failed" 错误

### 检查日志

在Metro（Expo）终端中，您应该看到：

```
[MapService] Resolved API base URL: http://localhost:3333
[MapService] Getting current location with API URL: http://localhost:3333
[MapService] Device location obtained: {lat: ..., lng: ..., accuracy: ...}
[MapService] Fetching nearby places: {lat: ..., lng: ..., options: {...}}
[MapService] Found 12 nearby places
```

---

## 📱 环境配置（可选）

如果您想自定义端口或API地址：

### 移动端配置
创建 `apps/mobile/.env`：
```bash
EXPO_PUBLIC_API_PORT=3333
# 或者直接设置完整URL
# EXPO_PUBLIC_API_BASE_URL=http://localhost:3333
```

### 后端配置
创建 `services/api/.env`：
```bash
PORT=3333
APP_ENV=development
ENABLE_SWAGGER=true
```

---

## 🔧 故障排除

### 问题1：仍然显示 "network request failed"

**解决方案：**

1. 确认API服务器正在运行：
```bash
curl http://localhost:3333/health
```

2. 重启两个服务：
   - 在API服务器终端按 Ctrl+C
   - 在Expo终端按 Ctrl+C
   - 重新启动两个服务

3. 清除缓存并重启：
```bash
cd apps/mobile
pnpm run dev --clear
```

### 问题2：API服务器启动失败

**解决方案：**

1. 检查端口是否被占用：
```bash
lsof -i :3333
# 如果有其他进程占用，结束它或更改端口
```

2. 重新安装依赖：
```bash
cd services/api
rm -rf node_modules
pnpm install
```

### 问题3：Android模拟器无法连接

**注意：** 代码已经自动处理了Android的特殊情况。

Android模拟器会自动使用 `10.0.2.2` 替代 `localhost`。  
这个转换在 `mapService.ts` 中的 `mapHostForPlatform()` 函数中自动完成。

---

## 📊 API端点测试

您可以手动测试所有API端点：

### 1. 健康检查
```bash
curl http://localhost:3333/health
```

### 2. 获取当前位置
```bash
curl http://localhost:3333/map/location
```

### 3. 获取附近地点
```bash
curl "http://localhost:3333/map/nearby?lat=40.7829&lng=-73.9654&radius=2000&limit=5"
```

### 4. 获取路线
```bash
curl -X POST http://localhost:3333/map/route \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"lat": 40.7829, "lng": -73.9654},
    "destinationId": "spot_001"
  }'
```

---

## 📝 主要代码修改

### 1. `apps/mobile/src/services/mapService.ts`

**修改的关键函数：**

- `getDevApiPort()` - 默认端口改为 3333
- `resolveApiBaseUrl()` - 添加日志输出
- `getCurrentLocation()` - 添加详细调试日志
- `getNearbyPlaces()` - 添加请求/响应日志
- `getRoute()` - 添加错误详情日志

**日志示例：**
```javascript
console.log('[MapService] Resolved API base URL:', url);
console.log('[MapService] Device location obtained:', {...});
console.error('[MapService] Error details:', { message, name, stack });
```

---

## 🎉 成功！

如果您能看到地图加载，显示位置和附近地点，那么问题已经完全解决了！

**接下来可以：**
- 测试导航功能
- 测试语音助手
- 浏览历史记录
- 查看周总结

---

## 📚 更多信息

- 详细的网络修复说明：[NETWORK_FIX_GUIDE.md](./NETWORK_FIX_GUIDE.md)
- 项目架构：[README.md](./README.md)
- 集成指南：[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

## 💬 需要帮助？

如果您仍然遇到问题，请查看控制台日志中的错误详情，它们现在包含了完整的错误堆栈和调试信息。



