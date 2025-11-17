# Cloudflare Tunnel 快速部署指南

## 🎯 方案说明

使用 Caddy 反向代理 + Cloudflare Quick Tunnel，一个公网 URL 访问所有服务。

## ⚡ 快速开始（8分钟）

### 1️⃣ 安装依赖（2分钟）

```bash
# 安装 Caddy（反向代理）
brew install caddy

# 安装 cloudflared（Cloudflare Tunnel）
brew install cloudflare/cloudflare/cloudflared

# 或者下载安装（跨平台）
# https://caddyserver.com/docs/install
# https://github.com/cloudflare/cloudflared/releases
```

### 2️⃣ 配置环境变量（1分钟）

编辑 `.env` 文件，修改以下配置以支持反向代理：

```bash
# API 和语音服务使用相对路径（通过 Caddy 代理）
VITE_API_BASE_URL=/api
VITE_VOICE_WS_URL=/ws/voice

# Google Maps API Key（必需）
VITE_GOOGLE_MAPS_API_KEY=你的密钥
```

**重要**：修改后需要重启前端服务才能生效！

### 3️⃣ 一键启动（5分钟）

```bash
cd /Users/ming/Documents/take-a-break
./deploy-cloudflare.sh
```

脚本会自动：
- ✅ 启动前端（端口 5174）
- ✅ 启动 API 后端（端口 3333）
- ✅ 启动语音服务（端口 8000）
- ✅ 启动 Caddy 反向代理（端口 8080）
- ✅ 创建 Cloudflare 公网隧道
- ✅ 显示公网访问 URL

### 4️⃣ 访问应用

脚本启动后会显示类似：

```
🌐 公网访问地址：
   https://random-abc-123.trycloudflare.com

📍 本地访问地址：
   http://localhost:8080
```

**在浏览器中访问公网 URL** 即可！

---

## 📊 架构说明

```
用户浏览器
    ↓
Cloudflare Tunnel (HTTPS)
    ↓
Caddy 反向代理 (localhost:8080)
    ├─ /         → 前端 (localhost:5174)
    ├─ /api/*    → API后端 (localhost:3333)
    └─ /ws/voice → 语音服务 (localhost:8000)
```

所有服务通过同一个域名访问，避免跨域问题！

---

## 🛠️ 手动启动（调试用）

如果自动脚本有问题，可以手动启动各个服务：

### 终端 1 - 前端
```bash
cd /Users/ming/Documents/take-a-break
pnpm --filter @take-a-break/web dev
```

### 终端 2 - API 后端
```bash
cd /Users/ming/Documents/take-a-break
pnpm --filter @take-a-break/api dev
```

### 终端 3 - 语音服务
```bash
cd /Users/ming/Documents/take-a-break/services/voice/web_agent
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 终端 4 - Caddy 代理
```bash
cd /Users/ming/Documents/take-a-break
caddy run --config Caddyfile
```

### 终端 5 - Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:8080
```

等待几秒钟，终端 5 会显示公网 URL。

---

## 🔍 故障排查

### 问题：无法启动服务

**检查端口占用**：
```bash
lsof -i :5174  # 前端
lsof -i :3333  # API
lsof -i :8000  # 语音
lsof -i :8080  # Caddy
```

**杀死占用的进程**：
```bash
kill -9 <PID>
```

### 问题：Caddy 未安装

```bash
# Mac
brew install caddy

# Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 问题：cloudflared 未安装

```bash
# Mac
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Windows
# 从 GitHub 下载: https://github.com/cloudflare/cloudflared/releases
```

### 问题：Python 虚拟环境未找到

```bash
cd /Users/ming/Documents/take-a-break/services/voice/web_agent
./setup.sh
```

### 问题：地图不显示

确保 `.env` 文件中设置了 Google Maps API Key：
```bash
VITE_GOOGLE_MAPS_API_KEY=你的密钥
```

修改后重启前端：
```bash
# 停止当前前端 (Ctrl+C)
pnpm --filter @take-a-break/web dev
```

### 问题：WebSocket 连接失败

检查 `.env` 中的配置：
```bash
VITE_VOICE_WS_URL=/ws/voice
```

浏览器会自动将相对路径转换为：
- 本地：`ws://localhost:8080/ws/voice`
- 隧道：`wss://your-url.trycloudflare.com/ws/voice`

---

## 📝 查看日志

所有服务的日志保存在 `logs/` 目录：

```bash
# 查看所有日志
tail -f logs/*.log

# 查看特定服务
tail -f logs/web.log      # 前端
tail -f logs/api.log      # API
tail -f logs/voice.log    # 语音
tail -f logs/caddy.log    # Caddy
tail -f logs/cloudflared.log  # Cloudflare
```

---

## 🛑 停止服务

使用自动脚本启动的，直接按 `Ctrl+C` 会自动停止所有服务。

如果手动启动的，需要在每个终端按 `Ctrl+C`。

---

## ⚠️ 注意事项

1. **临时 URL**：Quick Tunnel 的 URL 每次重启都会改变
2. **开发模式**：此方案适合演示、测试，不建议用于生产环境
3. **环境变量**：修改 `.env` 后必须重启前端服务
4. **防火墙**：确保本地防火墙允许访问这些端口

---

## 🚀 生产环境部署

如果需要固定域名和更稳定的部署，建议使用：
- **Vercel** (前端) + **Railway** (后端+语音)
- **Netlify** (前端) + **Render** (后端+语音)
- **Cloudflare Pages** (前端) + **Fly.io** (后端+语音)

详见其他部署文档。

---

## 📞 需要帮助？

查看日志文件获取详细错误信息：
```bash
ls -lh logs/
```

