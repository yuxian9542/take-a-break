#!/bin/bash
# Cloudflare Tunnel 快速部署脚本
# 方案2：反向代理 + 单隧道

set -e

PROJECT_ROOT="/Users/ming/Documents/take-a-break"
cd "$PROJECT_ROOT"

echo "🚀 启动 Cloudflare Tunnel 部署..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
echo -e "${BLUE}📦 检查依赖...${NC}"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装"
    echo "   安装: npm install -g pnpm"
    exit 1
fi

# 检查 Caddy
if ! command -v caddy &> /dev/null; then
    echo "⚠️  Caddy 未安装"
    echo "   安装: brew install caddy (Mac)"
    echo "   或访问: https://caddyserver.com/docs/install"
    exit 1
fi

# 检查 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "⚠️  cloudflared 未安装"
    echo "   安装: brew install cloudflare/cloudflare/cloudflared (Mac)"
    echo "   或访问: https://github.com/cloudflare/cloudflared/releases"
    exit 1
fi

# 检查 Python venv
if [ ! -d "services/voice/web_agent/venv" ]; then
    echo "⚠️  Python 虚拟环境未找到"
    echo "   请先运行: cd services/voice/web_agent && ./setup.sh"
    exit 1
fi

echo -e "${GREEN}✅ 所有依赖已安装${NC}"
echo ""

# 创建日志目录
mkdir -p logs

echo -e "${BLUE}🔧 准备启动服务...${NC}"
echo ""
echo "将启动以下服务："
echo "  1. 前端 (Vite)    → localhost:5174"
echo "  2. API 后端       → localhost:3333"
echo "  3. 语音服务       → localhost:8000"
echo "  4. Caddy 代理     → localhost:8080"
echo "  5. Cloudflare隧道 → 公网 HTTPS URL"
echo ""

# 函数：清理后台进程
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

# 函数：清理旧进程
cleanup_old_processes() {
    echo -e "${BLUE}🧹 清理旧进程...${NC}"
    
    # 清理端口
    for port in 5174 5175 5176 3333 8000 8080; do
        pid=$(lsof -t -i:$port 2>/dev/null || true)
        if [ ! -z "$pid" ]; then
            echo "   终止占用端口 $port 的进程 (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    # 清理旧的 PID 文件
    if [ -f logs/pids.txt ]; then
        echo "   清理旧的 PID 文件"
        while read pid; do
            kill -9 $pid 2>/dev/null || true
        done < logs/pids.txt
        rm logs/pids.txt
    fi
    
    # 等待端口释放
    sleep 2
    echo -e "${GREEN}✅ 清理完成${NC}"
    echo ""
}

trap cleanup SIGINT SIGTERM

# 清理旧进程
cleanup_old_processes

# 启动服务
echo -e "${GREEN}🚀 启动服务...${NC}"
echo ""

# 1. 启动前端
echo "1️⃣  启动前端 (Vite)..."
cd "$PROJECT_ROOT"
pnpm --filter @take-a-break/web dev > logs/web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID >> logs/pids.txt
echo "   PID: $WEB_PID | 日志: logs/web.log"

# 2. 启动 API 后端
echo "2️⃣  启动 API 后端..."
pnpm --filter @take-a-break/api dev > logs/api.log 2>&1 &
API_PID=$!
echo $API_PID >> logs/pids.txt
echo "   PID: $API_PID | 日志: logs/api.log"

# 3. 启动语音服务
echo "3️⃣  启动语音服务..."
cd "$PROJECT_ROOT/services/voice/web_agent"
source venv/bin/activate
# 设置 PYTHONPATH 以便导入 backend 模块
PYTHONPATH="$PROJECT_ROOT/services/voice/web_agent/backend:$PYTHONPATH" \
uvicorn backend.main:app --host 0.0.0.0 --port 8000 > "$PROJECT_ROOT/logs/voice.log" 2>&1 &
VOICE_PID=$!
cd "$PROJECT_ROOT"
echo $VOICE_PID >> logs/pids.txt
echo "   PID: $VOICE_PID | 日志: logs/voice.log"

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."

# 检查服务是否运行
check_service() {
    local port=$1
    local name=$2
    if curl -s http://localhost:$port > /dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
        echo -e "   ${GREEN}✓${NC} $name (端口 $port)"
        return 0
    else
        echo -e "   ${YELLOW}⚠${NC} $name (端口 $port) - 可能还在启动中"
        return 1
    fi
}

# 等待并重试检查服务
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=$3
    local wait_time=$4
    
    for i in $(seq 1 $max_attempts); do
        if curl -s http://localhost:$port > /dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
            echo -e "   ${GREEN}✓${NC} $name (端口 $port)"
            return 0
        fi
        if [ $i -lt $max_attempts ]; then
            sleep $wait_time
        fi
    done
    
    echo -e "   ${YELLOW}⚠${NC} $name (端口 $port) - 启动超时，但已启动进程"
    return 1
}

echo ""
echo "   检查前端服务..."
wait_for_service 5174 "前端" 3 2

echo "   检查 API 后端..."
wait_for_service 3333 "API后端" 3 2

echo "   检查语音服务（需要更长时间）..."
wait_for_service 8000 "语音服务" 6 3

# 4. 启动 Caddy
echo ""
echo "4️⃣  启动 Caddy 反向代理..."
caddy run --config Caddyfile > logs/caddy.log 2>&1 &
CADDY_PID=$!
echo $CADDY_PID >> logs/pids.txt
echo "   PID: $CADDY_PID | 日志: logs/caddy.log"

echo ""
echo "   检查 Caddy 代理..."
wait_for_service 8080 "Caddy代理" 3 2

# 5. 启动 Cloudflare Tunnel
echo ""
echo "5️⃣  启动 Cloudflare Tunnel..."
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🌐 正在创建公网隧道...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

cloudflared tunnel --url http://127.0.0.1:8080 > logs/cloudflared.log 2>&1 &
TUNNEL_PID=$!
echo $TUNNEL_PID >> logs/pids.txt

# 等待隧道启动并获取 URL
sleep 3

# 从日志中提取 URL，重试多次以确保获取到
for i in {1..10}; do
    TUNNEL_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' logs/cloudflared.log | head -1)
    if [ ! -z "$TUNNEL_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
    echo "⚠️  无法获取隧道 URL，请查看 logs/cloudflared.log"
    TUNNEL_URL="(查看 logs/cloudflared.log)"
fi

# 验证隧道连接
echo ""
echo -e "${BLUE}🔍 验证服务连接...${NC}"
echo "   Caddy (8080): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null || echo "无法连接")"
echo "   API (3333): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/api/health 2>/dev/null || echo "无法连接")"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   🎉 部署成功！                          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📡 公网访问地址：${NC}"
echo -e "${GREEN}   $TUNNEL_URL${NC}"
echo ""
echo -e "${BLUE}📍 本地访问地址：${NC}"
echo "   http://localhost:8080"
echo ""
echo -e "${BLUE}📊 服务状态：${NC}"
echo "   前端:     http://localhost:5174"
echo "   API:      http://localhost:3333"
echo "   语音:     http://localhost:8000"
echo "   Caddy:    http://localhost:8080"
echo ""
echo -e "${BLUE}📝 日志文件：${NC}"
echo "   所有日志: logs/"
echo "   实时查看: tail -f logs/*.log"
echo ""
echo -e "${YELLOW}⚠️  注意事项：${NC}"
echo "   • 隧道 URL 每次重启都会改变"
echo "   • 按 Ctrl+C 停止所有服务"
echo "   • 此模式适合演示和测试"
echo ""
echo -e "${GREEN}✨ 现在可以通过公网 URL 访问你的应用了！${NC}"
echo ""

# 保持脚本运行
echo "按 Ctrl+C 停止所有服务..."
wait

