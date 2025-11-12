# Google Maps API 设置指南

本指南将帮助您配置 Google Maps API，以便应用能够使用真实的地点搜索和导航功能。

## 📋 前置要求

- Google Cloud 账号
- 信用卡（需要绑定，但有免费额度）
- 项目已克隆到本地

## 🚀 快速开始

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部的项目选择器
3. 点击 **"新建项目"**
4. 输入项目名称（如 `take-a-break`）
5. 点击 **"创建"**

### 2. 启用必要的 API

在 Google Cloud Console 中：

1. 前往 **API 和服务** > **库**
2. 搜索并启用以下 API：
   - **Places API** （用于地点搜索）
   - **Directions API** （用于导航路线）
   - **Geocoding API** （可选，用于地址解析）

### 3. 创建 API 密钥

1. 前往 **API 和服务** > **凭据**
2. 点击 **"创建凭据"** > **"API 密钥"**
3. 复制生成的 API 密钥
4. 点击 **"限制密钥"** 进行安全配置（重要！）

### 4. 限制 API 密钥（强烈推荐）

为了安全起见，应该限制 API 密钥的使用：

#### 应用限制：
- 选择 **"IP 地址"**
- 添加您的服务器 IP 地址
- 对于开发环境，可以添加 `127.0.0.1`

#### API 限制：
- 选择 **"限制密钥"**
- 仅选择：
  - Places API
  - Directions API
  - Geocoding API

### 5. 配置项目环境变量

在项目根目录创建 `.env` 文件：

```bash
# 在项目根目录
cd /Users/ming/Documents/take-a-break
cp .env.example .env
```

编辑 `.env` 文件，添加您的 API 密钥：

```env
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=AIzaSy...your-api-key-here

# Enable real map API
USE_REAL_MAP_API=true

# Other settings
APP_ENV=development
PORT=3333
```

### 6. 重启 API 服务器

```bash
# 停止当前服务器（如果正在运行）
# 然后重新启动
pnpm run dev:api
```

您应该看到日志：
```
[MapService] Using Google Places API
[MapService] Using Google Directions API
```

## 💰 定价和免费额度

Google Maps Platform 提供每月免费额度：

### Places API
- **免费额度**: 每月 $200 USD 积分
- **费用**: 基础数据 $0.017 per request
- **估算**: 约 11,764 次免费请求/月

### Directions API
- **免费额度**: 每月 $200 USD 积分
- **费用**: $0.005 per request
- **估算**: 约 40,000 次免费请求/月

> 💡 **提示**: 对于个人开发和小型应用，免费额度通常足够使用。

详细定价：https://mapsplatform.google.com/pricing/

## 🧪 测试配置

### 测试地点搜索

使用任何 HTTP 客户端测试：

```bash
# 测试获取当前位置
curl http://localhost:3333/map/location

# 测试搜索附近地点（旧金山）
curl "http://localhost:3333/map/nearby?lat=37.785834&lng=-122.406417&radius=2000&limit=10"

# 测试搜索附近地点（纽约）
curl "http://localhost:3333/map/nearby?lat=40.7829&lng=-73.9654&radius=2000&limit=10"
```

### 测试导航路线

```bash
curl -X POST http://localhost:3333/map/route \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"lat": 37.785834, "lng": -122.406417},
    "destinationId": "ChIJIQBpAG2ahYAR_6128GcTUEo"
  }'
```

### 在移动应用中测试

1. 启动移动应用
2. 打开地图功能
3. 应该能看到真实的附近地点
4. 点击导航应该显示真实的路线

## 🔍 故障排查

### 错误: "API key not valid"

**原因**: API 密钥配置错误或未启用相应的 API

**解决方案**:
1. 检查 `.env` 文件中的 API 密钥是否正确
2. 确认在 Google Cloud Console 中启用了 Places API 和 Directions API
3. 检查 API 密钥的限制设置

### 错误: "This API project is not authorized to use this API"

**原因**: 未启用相应的 API

**解决方案**:
1. 前往 Google Cloud Console
2. 启用 Places API 和 Directions API

### 错误: "ZERO_RESULTS"

**原因**: 指定区域没有找到符合条件的地点

**解决方案**:
1. 增加搜索半径 (radius)
2. 移除或调整类型过滤 (types)
3. 尝试不同的位置坐标

### 仍在使用 Mock 数据

**检查清单**:
- [ ] `.env` 文件存在且包含 `GOOGLE_MAPS_API_KEY`
- [ ] `USE_REAL_MAP_API=true` 已设置
- [ ] API 服务器已重启
- [ ] 日志中显示 "Using Google Places API"

## 🔒 安全最佳实践

### 1. 永远不要提交 API 密钥到 Git

确保 `.env` 在 `.gitignore` 中：

```bash
# 检查 .gitignore
cat .gitignore | grep .env
```

### 2. 为不同环境使用不同的密钥

- 开发环境: 一个密钥
- 生产环境: 另一个密钥

### 3. 设置使用配额

在 Google Cloud Console 中设置每日/每月配额限制，防止意外超支。

### 4. 监控 API 使用情况

定期检查 Google Cloud Console 的使用情况仪表板。

## 📱 移动应用配置

### iOS

如果需要在前端也使用 Google Maps：

1. 安装依赖:
```bash
cd apps/mobile
npm install react-native-maps
```

2. 配置 `ios/Podfile`:
```ruby
# Uncomment this line if using Google Maps
# pod 'GoogleMaps'
```

### Android

1. 在 `android/app/src/main/AndroidManifest.xml` 添加：
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY"/>
```

## 🔄 切换回 Mock 数据

如果需要暂时使用 Mock 数据（如节省 API 配额）：

在 `.env` 中设置：
```env
USE_REAL_MAP_API=false
```

然后重启服务器。

## 📚 相关文档

- [Google Maps Platform 文档](https://developers.google.com/maps/documentation)
- [Places API 文档](https://developers.google.com/maps/documentation/places/web-service)
- [Directions API 文档](https://developers.google.com/maps/documentation/directions)
- [API 密钥最佳实践](https://developers.google.com/maps/api-security-best-practices)

## 🆘 需要帮助？

如果遇到问题：
1. 检查服务器日志
2. 查看 Google Cloud Console 的错误报告
3. 参考本文档的故障排查部分
4. 查看 `LOCATION_ISSUE_ANALYSIS.md` 了解定位相关问题

## ✅ 验证清单

设置完成后，确认以下事项：

- [ ] Google Cloud 项目已创建
- [ ] Places API 和 Directions API 已启用
- [ ] API 密钥已创建并配置限制
- [ ] `.env` 文件已配置
- [ ] `USE_REAL_MAP_API=true`
- [ ] API 服务器已重启
- [ ] 日志显示使用 Google API
- [ ] 测试端点返回真实数据
- [ ] 移动应用能显示真实地点
- [ ] 导航功能正常工作

完成这些步骤后，您的应用就能使用真实的地图和导航功能了！🎉



