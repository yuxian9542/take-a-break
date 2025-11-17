# 🚀 Cloudflare Tunnel 快速启动

## 3 步启动公网访问

### 步骤 1：安装依赖（首次运行）

```bash
# Mac 用户
brew install caddy cloudflare/cloudflare/cloudflared

# 其他系统请参考 CLOUDFLARE_DEPLOY.md
```

### 步骤 2：配置环境变量

运行配置脚本（会自动备份原 .env 文件）：

```bash
./setup-tunnel-env.sh
```

**或者手动编辑 `.env` 文件**，修改以下内容：

```bash
# API 使用相对路径（通过 Caddy 反向代理）
VITE_API_BASE_URL=/api

# 语音服务使用相对路径（通过 Caddy 反向代理）
VITE_VOICE_WS_URL=/ws/voice

# Google Maps API Key（必需！）
VITE_GOOGLE_MAPS_API_KEY=你的密钥
```

### 步骤 3：启动服务

```bash
./deploy-cloudflare.sh
```

**完成！** 脚本会显示你的公网 URL，类似：

```
🌐 公网访问地址：
   https://random-abc-123.trycloudflare.com
```

在浏览器中打开这个 URL 即可访问你的应用！

---

## 🎯 它做了什么？

脚本会自动启动 5 个服务：

1. **前端** (Vite) → `localhost:5174`
2. **API 后端** → `localhost:3333`
3. **语音服务** → `localhost:8000`
4. **Caddy 反向代理** → `localhost:8080`
5. **Cloudflare 隧道** → 公网 HTTPS URL

```
[公网用户] 
    ↓ HTTPS
[Cloudflare Tunnel]
    ↓
[Caddy :8080]
    ├─ /         → [前端 :5174]
    ├─ /api/*    → [API :3333]
    └─ /ws/voice → [语音 :8000]
```

所有服务通过一个 URL 访问，无跨域问题！

---

## 📝 注意事项

- ✅ **首次运行**：需要确保 Python 虚拟环境已设置（`cd services/voice/web_agent && ./setup.sh`）
- ⚠️ **URL 会变化**：每次重启隧道，URL 都会改变
- 🔑 **Google Maps**：必须配置有效的 API Key 才能显示地图
- 🛑 **停止服务**：按 `Ctrl+C` 自动停止所有服务

---

## 🐛 遇到问题？

### 日志在哪里？

所有日志保存在 `logs/` 目录：

```bash
tail -f logs/web.log       # 前端日志
tail -f logs/api.log       # API 日志
tail -f logs/voice.log     # 语音服务日志
tail -f logs/caddy.log     # Caddy 日志
tail -f logs/cloudflared.log  # Cloudflare 日志
```

### 端口被占用？

```bash
# 查找占用进程
lsof -i :5174
lsof -i :3333
lsof -i :8000
lsof -i :8080

# 杀死进程
kill -9 <PID>
```

### 更多帮助

查看详细文档：
```bash
cat CLOUDFLARE_DEPLOY.md
```

---

## ⚡ 极简版（调试用）

如果完整脚本有问题，试试极简版：

```bash
./quick-tunnel.sh
```

---

**享受你的公网应用！** 🎉

