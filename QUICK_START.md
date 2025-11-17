# 快速启动指南 - 显示真实用户位置

## 当前状态

✅ **已完成的修复**:
1. 创建了 `.env` 环境配置文件
2. 修复了 `pnpm-workspace.yaml` 配置，添加了 `services/*` 和 `infra/firebase`
3. 添加了缺失的依赖（tsx, typescript）到 API 服务
4. 安装了所有依赖
5. 启动了 API 服务器（端口 3333）
6. 修复了 ExplorePage 的 location 依赖问题

## 🚨 重要：你需要完成的步骤

### 1. 配置 Google Maps API 密钥（必需）

当前地图无法显示是因为缺少 Google Maps API 密钥。

**步骤：**

1. 打开 `.env` 文件（在项目根目录）
2. 将以下三行的 `YOUR_GOOGLE_MAPS_API_KEY_HERE` 替换为你的实际 API 密钥：

```bash
GOOGLE_MAPS_API_KEY=你的API密钥
VITE_GOOGLE_MAPS_API_KEY=你的API密钥
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=你的API密钥
```

**如何获取 API 密钥：**

1. 访问 https://console.cloud.google.com/
2. 创建项目或选择现有项目
3. 启用 "Maps JavaScript API"
4. 在 "APIs & Services" > "Credentials" 中创建 API 密钥
5. 复制 API 密钥并粘贴到 `.env` 文件

详细步骤请查看 `SETUP_GOOGLE_MAPS.md` 文件。

### 2. 重启 Web 开发服务器

修改 `.env` 文件后，需要重启 Vite 才能生效：

```bash
# 如果 Web 服务正在运行，先停止它 (Ctrl+C)
# 然后重新启动：
cd /Users/ming/Documents/take-a-break
pnpm --filter @take-a-break/web dev
```

### 3. 授予浏览器位置权限

1. 打开浏览器访问 `http://localhost:5174/explore`
2. 当浏览器弹出位置权限请求时，点击 **"允许"**
3. 等待几秒钟，地图应该会显示你的真实位置

## 运行服务

需要同时运行两个服务：

### API 服务器（已启动 ✅）
```bash
# 在一个终端窗口中
cd /Users/ming/Documents/take-a-break
pnpm --filter @take-a-break/api dev
```

### Web 应用
```bash
# 在另一个终端窗口中
cd /Users/ming/Documents/take-a-break
pnpm --filter @take-a-break/web dev
```

然后访问: http://localhost:5174/explore

## 问题排查

### 地图仍然显示 "Loading map..."

**原因：** Google Maps API 密钥未设置或无效

**解决方案：**
1. 检查 `.env` 文件中的 `VITE_GOOGLE_MAPS_API_KEY` 是否设置
2. 确认 API 密钥在 Google Cloud Console 中已启用 "Maps JavaScript API"
3. 重启 Web 开发服务器（修改 `.env` 后必须重启）
4. 打开浏览器开发者工具（F12），查看 Console 中的错误信息

### 显示 "ERR_CONNECTION_REFUSED"

**原因：** API 服务器未运行

**解决方案：**
```bash
cd /Users/ming/Documents/take-a-break
pnpm --filter @take-a-break/api dev
```

### 位置权限被拒绝

**解决方案：**
1. 点击浏览器地址栏左侧的锁形图标
2. 找到"位置"权限，设置为"允许"
3. 刷新页面

### "Network location provider" 错误

这是正常的！浏览器尝试使用 Google 的位置服务作为备用方案。只要你授予了位置权限，浏览器会使用设备的 GPS。

## 文件变更总结

修改的文件：
- ✅ `.env` - 创建了环境配置文件（需要你填入 API 密钥）
- ✅ `pnpm-workspace.yaml` - 添加了 services 和 firebase 包
- ✅ `services/api/package.json` - 添加了 tsx 和 typescript 依赖
- ✅ `apps/web/src/pages/ExplorePage.tsx` - 修复了 location 依赖问题
- 📄 `SETUP_GOOGLE_MAPS.md` - 详细的 Google Maps 设置指南
- 📄 `QUICK_START.md` - 本文件

## 已知问题

- Google Maps 免费额度限制：每月 28,000 次地图加载。对于开发足够了。
- react-day-picker 的 peer dependency 警告：不影响功能，可以忽略。

## 下一步

1. **立即操作**：在 `.env` 文件中设置 Google Maps API 密钥
2. **重启服务**：重启 Web 开发服务器
3. **测试**：在浏览器中访问 explore 页面并授予位置权限

需要帮助？查看 `SETUP_GOOGLE_MAPS.md` 获取详细的设置说明。


