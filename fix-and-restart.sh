#!/bin/bash
# 彻底清理并重启所有服务
# 解决端口冲突和 404 问题

set -e

PROJECT_ROOT="/Users/ming/Documents/take-a-break"
cd "$PROJECT_ROOT"

echo "🔧 开始修复和重启服务..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 停止所有相关进程
echo -e "${BLUE}1️⃣  停止所有现有服务...${NC}"

# 停止通过 pids.txt 记录的进程
if [ -f logs/pids.txt ]; then
    echo "   停止记录的进程..."
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "   - 停止 PID: $pid"
            kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
        fi
    done < logs/pids.txt
    rm logs/pids.txt
fi

# 停止所有可能的相关进程
echo "   查找并停止占用端口的进程..."

# 端口列表
PORTS=(5174 5175 5176 3333 8000 8080)

for port in "${PORTS[@]}"; do
    pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        echo "   - 停止端口 $port (PID: $pid)"
        kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
        sleep 0.5
    fi
done

# 停止 cloudflared
echo "   停止 cloudflared..."
pkill -f cloudflared 2>/dev/null || true

# 停止 caddy
echo "   停止 caddy..."
pkill -f "caddy run" 2>/dev/null || true

# 停止 uvicorn
echo "   停止 uvicorn..."
pkill -f "uvicorn" 2>/dev/null || true

# 停止 vite
echo "   停止 vite..."
pkill -f "vite" 2>/dev/null || true

# 停止 tsx watch
echo "   停止 tsx..."
pkill -f "tsx watch" 2>/dev/null || true

sleep 2

echo -e "${GREEN}   ✅ 所有服务已停止${NC}"
echo ""

# 2. 验证端口已释放
echo -e "${BLUE}2️⃣  验证端口状态...${NC}"

all_clear=true
for port in "${PORTS[@]}"; do
    if lsof -ti :$port > /dev/null 2>&1; then
        echo -e "${RED}   ⚠️  端口 $port 仍被占用${NC}"
        lsof -i :$port
        all_clear=false
    else
        echo -e "${GREEN}   ✓ 端口 $port 已释放${NC}"
    fi
done

if [ "$all_clear" = false ]; then
    echo ""
    echo -e "${YELLOW}警告：某些端口仍被占用，尝试继续...${NC}"
    echo ""
fi

# 3. 清理日志
echo -e "${BLUE}3️⃣  清理旧日志...${NC}"
mkdir -p logs
rm -f logs/*.log
echo -e "${GREEN}   ✅ 日志已清理${NC}"
echo ""

# 4. 检查依赖
echo -e "${BLUE}4️⃣  检查依赖...${NC}"

check_cmd() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}   ✓ $1${NC}"
        return 0
    else
        echo -e "${RED}   ✗ $1 未安装${NC}"
        return 1
    fi
}

all_deps_ok=true
check_cmd pnpm || all_deps_ok=false
check_cmd caddy || all_deps_ok=false
check_cmd cloudflared || all_deps_ok=false

if [ "$all_deps_ok" = false ]; then
    echo ""
    echo -e "${RED}❌ 缺少必要依赖，请先安装${NC}"
    exit 1
fi

if [ ! -d "services/voice/web_agent/venv" ]; then
    echo -e "${RED}   ✗ Python 虚拟环境未找到${NC}"
    echo "   请运行: cd services/voice/web_agent && ./setup.sh"
    exit 1
else
    echo -e "${GREEN}   ✓ Python venv${NC}"
fi

echo ""

# 5. 启动服务
echo -e "${BLUE}5️⃣  启动服务...${NC}"
echo ""

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 停止所有服务...${NC}"
    if [ -f logs/pids.txt ]; then
        while read pid; do
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid 2>/dev/null || true
            fi
        done < logs/pids.txt
        rm logs/pids.txt
    fi
    echo "👋 已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动前端（强制使用 5174 端口）
echo "📱 启动前端 (Vite)..."
cd "$PROJECT_ROOT"
PORT=5174 pnpm --filter @take-a-break/web dev > logs/web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID >> logs/pids.txt
echo "   PID: $WEB_PID"

# 启动 API 后端（强制使用 3333 端口）
echo "🔌 启动 API 后端..."
pnpm --filter @take-a-break/api dev > logs/api.log 2>&1 &
API_PID=$!
echo $API_PID >> logs/pids.txt
echo "   PID: $API_PID"

# 启动语音服务
echo "🎤 启动语音服务..."
cd "$PROJECT_ROOT/services/voice/web_agent"
source venv/bin/activate
PYTHONPATH="$PROJECT_ROOT/services/voice/web_agent/backend:$PYTHONPATH" \
uvicorn backend.main:app --host 0.0.0.0 --port 8000 > "$PROJECT_ROOT/logs/voice.log" 2>&1 &
VOICE_PID=$!
cd "$PROJECT_ROOT"
echo $VOICE_PID >> logs/pids.txt
echo "   PID: $VOICE_PID"

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 8

# 验证服务
echo ""
echo -e "${BLUE}6️⃣  验证服务状态...${NC}"

check_service() {
    local port=$1
    local name=$2
    if curl -s http://localhost:$port > /dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}   ✓ $name (端口 $port)${NC}"
        return 0
    else
        echo -e "${RED}   ✗ $name (端口 $port) 未响应${NC}"
        return 1
    fi
}

services_ok=true
check_service 5174 "前端" || services_ok=false
check_service 3333 "API后端" || services_ok=false
check_service 8000 "语音服务" || services_ok=false

if [ "$services_ok" = false ]; then
    echo ""
    echo -e "${RED}⚠️  某些服务未正常启动，请检查日志：${NC}"
    echo "   tail -f logs/web.log"
    echo "   tail -f logs/api.log"
    echo "   tail -f logs/voice.log"
    echo ""
    echo -e "${YELLOW}继续启动 Caddy 和 Tunnel...${NC}"
    echo ""
fi

# 启动 Caddy
echo ""
echo "🌉 启动 Caddy 反向代理..."
caddy run --config Caddyfile > logs/caddy.log 2>&1 &
CADDY_PID=$!
echo $CADDY_PID >> logs/pids.txt
echo "   PID: $CADDY_PID"

sleep 3

# 验证 Caddy
check_service 8080 "Caddy代理"

# 启动 Cloudflare Tunnel
echo ""
echo "🌐 启动 Cloudflare Tunnel..."
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}正在创建公网隧道...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

cloudflared tunnel --url http://localhost:8080 > logs/cloudflared.log 2>&1 &
TUNNEL_PID=$!
echo $TUNNEL_PID >> logs/pids.txt

# 等待并获取 URL
sleep 5

# 从日志中提取 URL
TUNNEL_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' logs/cloudflared.log | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${YELLOW}⚠️  无法自动获取隧道 URL${NC}"
    echo "   请查看日志: tail -f logs/cloudflared.log"
    echo ""
    TUNNEL_URL="(查看 logs/cloudflared.log)"
else
    # 测试隧道是否工作
    echo "🧪 测试隧道连接..."
    sleep 2
    
    if curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$TUNNEL_URL" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}   ✓ 隧道连接正常${NC}"
    else
        echo -e "${YELLOW}   ⚠️  隧道可能需要几秒钟才能完全就绪${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   🎉 部署完成！                          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📡 公网访问地址：${NC}"
echo -e "${GREEN}   $TUNNEL_URL${NC}"
echo ""
echo -e "${BLUE}📍 本地访问地址：${NC}"
echo "   http://localhost:8080  (通过 Caddy 代理)"
echo "   http://localhost:5174  (直接访问前端)"
echo ""
echo -e "${BLUE}📊 服务端口：${NC}"
echo "   前端:     http://localhost:5174"
echo "   API:      http://localhost:3333"
echo "   语音:     http://localhost:8000"
echo "   Caddy:    http://localhost:8080"
echo ""
echo -e "${BLUE}📝 查看日志：${NC}"
echo "   tail -f logs/web.log       # 前端"
echo "   tail -f logs/api.log       # API"
echo "   tail -f logs/voice.log     # 语音"
echo "   tail -f logs/caddy.log     # Caddy"
echo "   tail -f logs/cloudflared.log # Tunnel"
echo ""
echo -e "${BLUE}🧪 测试访问：${NC}"
echo "   curl http://localhost:8080"
echo "   curl $TUNNEL_URL"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo "   • 如果还是 404，等待 10-15 秒让所有服务完全启动"
echo "   • Cloudflare Tunnel 可能需要一点时间传播"
echo "   • 按 Ctrl+C 停止所有服务"
echo ""
echo -e "${GREEN}✨ 现在可以通过公网 URL 访问应用了！${NC}"
echo ""

# 保持脚本运行
echo "按 Ctrl+C 停止所有服务..."
wait

