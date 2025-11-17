#!/bin/bash

echo "🚀 准备真机测试环境..."
echo ""

# 获取 IP 地址
IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -z "$IP" ]; then
  IP=$(ipconfig getifaddr en1 2>/dev/null)
fi

if [ -z "$IP" ]; then
  echo "❌ 无法获取 IP 地址"
  echo "请手动运行: ifconfig | grep 'inet ' | grep -Fv 127.0.0.1"
  exit 1
fi

echo "📍 你的电脑 IP 地址: $IP"
echo ""

DEV_URL="http://$IP:5173"

echo ""
echo "📋 局域网测试清单（Web App）："
echo ""
echo "1️⃣ 确保手机和电脑在同一 WiFi 网络"
echo ""
echo "2️⃣ 启动 API 服务（可选，如需真实数据）："
echo "   cd services/api"
echo "   HOST=0.0.0.0 PORT=3333 pnpm run dev"
echo ""
echo "3️⃣ 启动 Web 应用："
echo "   cd apps/web"
echo "   pnpm dev -- --host"
echo ""
echo "4️⃣ 在手机浏览器中访问："
echo "   $DEV_URL"
echo ""
echo "5️⃣ 如果端口被占用，可在第3步追加 --port <端口>"
echo ""
echo "💡 提示："
echo "   - 如需 HTTPS，可使用本地代理或隧道工具（ngrok、cloudflared）"
echo "   - 如果连接失败，检查防火墙或网络隔离设置"
echo ""



