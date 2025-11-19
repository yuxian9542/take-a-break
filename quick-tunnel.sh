#!/bin/bash
# 极简版 Cloudflare Tunnel 启动脚本
# 适合快速测试，不做依赖检查

set -e
cd /Users/ming/Documents/take-a-break

echo "🚀 启动 Cloudflare Tunnel..."
echo ""

# 清理函数
cleanup() {
    echo ""
    echo "🛑 停止服务..."
    jobs -p | xargs kill 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# 启动服务
pnpm --filter @take-a-break/web dev &
pnpm --filter @take-a-break/api dev &
(cd services/voice/web_agent && source venv/bin/activate && PYTHONPATH="$(pwd)/backend:$PYTHONPATH" uvicorn backend.main:app --host 0.0.0.0 --port 8000) &

echo "⏳ 等待服务启动..."
sleep 5

caddy run --config Caddyfile &
sleep 2

echo ""
echo "🌐 创建公网隧道..."
echo ""
# cloudflared tunnel --url http://localhost:8080
cloudflared tunnel --protocol http2 --url http://localhost:8080

wait

