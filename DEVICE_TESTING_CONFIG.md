# 真机测试环境配置

## 📱 为真机测试配置 API 地址

### 第 1 步：获取你电脑的 IP 地址

在终端运行：

```bash
# Mac/Linux
ifconfig | grep "inet " | grep -Fv 127.0.0.1

# 或者更简单的方式
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # 有线
```

你会看到类似：
```
inet 192.168.1.100 netmask ...
```

记住这个 IP：**192.168.1.100**（你的可能不同）

### 第 2 步：创建配置文件

在 `apps/mobile/` 目录下创建 `.env.local` 文件：

```bash
cd apps/mobile
nano .env.local
```

添加以下内容（**替换 IP 地址为你的实际 IP**）：

```bash
# 真机测试 API 地址
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3333
```

保存文件（Ctrl+O，Enter，Ctrl+X）

### 第 3 步：启动 API 服务器（监听所有网络接口）

**重要：** 必须用 `HOST=0.0.0.0` 启动，否则真机无法访问！

```bash
cd services/api
HOST=0.0.0.0 PORT=3333 pnpm run dev
```

看到这个输出说明成功：
```
API listening on http://0.0.0.0:3333
```

### 第 4 步：测试从手机访问

在手机浏览器中打开（替换为你的 IP）：
```
http://192.168.1.100:3333/health
```

如果看到 JSON 响应，说明配置成功：
```json
{"status":"ok","timestamp":"...","environment":"development"}
```

---

## 🚀 启动真机测试

### 方式 1：使用 Expo Go（推荐，最快）

1. **在手机上安装 Expo Go**
   - iOS: App Store
   - Android: Google Play

2. **启动开发服务器**
   ```bash
   cd apps/mobile
   pnpm run dev
   ```

3. **扫描二维码**
   - iOS: 用系统相机扫描
   - Android: 在 Expo Go 中扫描

### 方式 2：USB 连接安装

```bash
cd apps/mobile

# iOS（Mac + Xcode 必需）
pnpm run ios --device

# Android（已安装 Android Studio 和 ADB）
pnpm run android --device
```

---

## ✅ 验证配置

### 检查控制台日志

应该看到：
```
[MapService] Resolved API base URL: http://192.168.1.100:3333
[MapService] Getting current location...
[MapService] Device location obtained: {lat: ..., lng: ...}
```

### 测试功能

- [ ] 获取真实 GPS 位置
- [ ] 显示附近真实地点
- [ ] 地图正常加载
- [ ] 导航功能工作

---

## 🔧 常见问题

### 问题：无法连接到开发服务器

**解决方案：**
1. 确认手机和电脑在同一 WiFi
2. 关闭防火墙或添加端口例外（8081, 3333）
3. 检查 IP 地址是否正确

### 问题：network request failed

**解决方案：**
1. 确认 API 服务器用 `HOST=0.0.0.0` 启动
2. 测试手机浏览器能否访问 API
3. 检查 `.env.local` 配置

### 问题：位置不准确

**解决方案：**
1. 到户外或窗边（GPS 需要看到天空）
2. 等待几秒让 GPS 定位
3. 确保开启了"精确位置"权限

---

## 📊 完整启动脚本

创建一个启动脚本方便使用：

```bash
#!/bin/bash
# scripts/start-device-testing.sh

echo "🚀 启动真机测试环境..."
echo ""

# 获取 IP
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  IP=$(ipconfig getifaddr en1)
fi

echo "📍 你的电脑 IP: $IP"
echo ""

# 提示配置
echo "请确保 apps/mobile/.env.local 中配置了："
echo "EXPO_PUBLIC_API_BASE_URL=http://$IP:3333"
echo ""

# 启动 API
echo "1️⃣ 启动 API 服务器..."
cd services/api
HOST=0.0.0.0 PORT=3333 pnpm run dev &
API_PID=$!

sleep 3

# 测试 API
echo ""
echo "2️⃣ 测试 API 可访问性..."
curl -s http://localhost:3333/health | jq '.'

echo ""
echo "3️⃣ API 地址: http://$IP:3333"
echo ""
echo "现在可以："
echo "  - 在另一个终端运行: cd apps/mobile && pnpm run dev"
echo "  - 在手机浏览器测试: http://$IP:3333/health"
echo "  - 用 Expo Go 扫描二维码"
echo ""
echo "按 Ctrl+C 停止服务器"

wait $API_PID
```

保存为 `scripts/start-device-testing.sh` 并运行：

```bash
chmod +x scripts/start-device-testing.sh
./scripts/start-device-testing.sh
```

---

查看完整指南：[真机测试指南.md](./真机测试指南.md)



