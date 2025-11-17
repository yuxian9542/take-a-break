# Google Maps Setup Guide

## 问题说明

当前地图显示"loading map"的原因是缺少 Google Maps API 密钥。需要完成以下步骤才能让地图正常工作。

## 快速设置步骤

### 1. 获取 Google Maps API Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用以下 API:
   - **Maps JavaScript API** (必需 - 用于显示地图)
   - **Places API** (可选 - 用于显示真实地点)
   - **Directions API** (可选 - 用于显示路线)

4. 创建 API 密钥:
   - 导航到 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "API Key"
   - 复制生成的 API 密钥

5. **重要**: 限制 API 密钥 (推荐):
   - 应用程序限制: 选择 "HTTP referrers (web sites)"
   - 添加: `http://localhost:*` 和 `http://127.0.0.1:*`
   - API 限制: 选择上述启用的 API

### 2. 配置环境变量

打开项目根目录的 `.env` 文件，将 API 密钥填入以下位置:

```bash
# 替换 YOUR_GOOGLE_MAPS_API_KEY_HERE 为你的实际 API 密钥
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### 3. 启用真实地图数据 (可选)

如果你启用了 Places API 和 Directions API，可以使用真实的地图数据而不是 mock 数据:

```bash
USE_REAL_MAP_API=true
```

### 4. 启动服务

需要同时启动 API 服务器和 Web 应用:

```bash
# 终端 1: 启动 API 服务器
cd /Users/ming/Documents/take-a-break
pnpm --filter @take-a-break/api dev

# 终端 2: 启动 Web 应用
cd /Users/ming/Documents/take-a-break
pnpm --filter @take-a-break/web dev
```

### 5. 授予位置权限

1. 在浏览器中打开 `http://localhost:5174/explore`
2. 当浏览器请求位置权限时，点击"允许"
3. 地图应该会显示你的真实位置

## 故障排除

### 地图一直显示 "Loading map..."

**原因**: Google Maps API 密钥未设置或无效

**解决方案**:
1. 检查 `.env` 文件中的 `VITE_GOOGLE_MAPS_API_KEY` 是否正确设置
2. 在浏览器开发者工具的 Console 中查看错误信息
3. 确认 API 密钥在 Google Cloud Console 中启用了 Maps JavaScript API
4. 重启 Vite 开发服务器 (修改 `.env` 后需要重启)

### API 请求失败 (ERR_CONNECTION_REFUSED)

**原因**: API 服务器未启动

**解决方案**:
```bash
pnpm --filter @take-a-break/api dev
```

### 位置权限被拒绝

**原因**: 浏览器位置权限被拒绝

**解决方案**:
1. 在浏览器地址栏点击锁形图标
2. 找到"位置"权限并设置为"允许"
3. 刷新页面

### Network location provider error

**原因**: Google 的位置服务无法访问

**解决方案**:
- 这是浏览器的 geolocation API 尝试使用 Google 的位置服务
- 如果你已经授予位置权限，浏览器应该会使用设备的 GPS
- 如果仍然失败，地图会自动使用 fallback 位置 (Times Square, NYC)

## 开发模式

如果你想在没有 Google Maps API 密钥的情况下进行开发，系统会使用 mock 数据:

- **地图**: 不会显示真实地图，但会显示"Set VITE_GOOGLE_MAPS_API_KEY to enable the map"提示
- **位置**: 使用 fallback 位置 (Times Square, NYC)
- **地点**: 使用预定义的 mock 地点数据
- **路线**: 使用简单的直线路线计算

## 费用说明

Google Maps API 有免费额度:

- **Maps JavaScript API**: 每月 28,000 次加载免费
- **Places API**: 每月一定额度的免费请求
- **Directions API**: 每月一定额度的免费请求

对于开发和测试，免费额度通常足够。详情请查看 [Google Maps Platform 定价](https://mapsplatform.google.com/pricing/)。

## 安全建议

1. **不要**将 API 密钥提交到 git 仓库
2. `.env` 文件已经在 `.gitignore` 中，确保不会被提交
3. 为开发环境设置 API 密钥限制 (HTTP referrers)
4. 生产环境使用单独的 API 密钥，并设置更严格的限制


