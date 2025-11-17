#!/bin/bash
# 诊断 Cloudflare Tunnel 404 问题

PROJECT_ROOT="/Users/ming/Documents/take-a-break"
cd "$PROJECT_ROOT"

echo "🔍 诊断 Cloudflare Tunnel 404 问题..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 检查进程状态
echo -e "${BLUE}1️⃣  检查服务进程${NC}"
echo ""

check_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti :$port 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        echo -e "${GREEN}✓ $name${NC}"
        echo "  端口: $port | PID: $pid"
        ps -p $pid -o command= | sed 's/^/  命令: /'
    else
        echo -e "${RED}✗ $name 未运行${NC}"
        echo "  端口: $port"
    fi
    echo ""
}

check_port 5174 "前端 (Vite)"
check_port 3333 "API 后端"
check_port 8000 "语音服务"
check_port 8080 "Caddy 代理"

# 检查 cloudflared
if pgrep -f cloudflared > /dev/null; then
    echo -e "${GREEN}✓ Cloudflare Tunnel${NC}"
    echo "  PID: $(pgrep -f cloudflared)"
    if [ -f logs/cloudflared.log ]; then
        TUNNEL_URL=$(grep -o 'https://[^[:space:]]*\.trycloudflare\.com' logs/cloudflared.log | head -1)
        if [ ! -z "$TUNNEL_URL" ]; then
            echo "  URL: $TUNNEL_URL"
        fi
    fi
else
    echo -e "${RED}✗ Cloudflare Tunnel 未运行${NC}"
fi
echo ""

# 2. 检查端口连通性
echo -e "${BLUE}2️⃣  测试端口连通性${NC}"
echo ""

test_port() {
    local port=$1
    local name=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓ localhost:$port${NC} - $name 可访问"
    else
        echo -e "${RED}✗ localhost:$port${NC} - $name 无法访问"
    fi
}

test_port 5174 "前端"
test_port 3333 "API"
test_port 8000 "语音"
test_port 8080 "Caddy"
echo ""

# 3. 测试 HTTP 响应
echo -e "${BLUE}3️⃣  测试 HTTP 响应${NC}"
echo ""

test_http() {
    local url=$1
    local name=$2
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null)
    
    if [ ! -z "$status" ]; then
        if [ "$status" = "200" ] || [ "$status" = "304" ]; then
            echo -e "${GREEN}✓ $name${NC} - HTTP $status"
        elif [ "$status" = "404" ]; then
            echo -e "${RED}✗ $name${NC} - HTTP 404 (Not Found)"
        else
            echo -e "${YELLOW}⚠ $name${NC} - HTTP $status"
        fi
    else
        echo -e "${RED}✗ $name${NC} - 无响应"
    fi
    echo "  URL: $url"
    echo ""
}

test_http "http://localhost:5174" "前端直接访问"
test_http "http://localhost:3333" "API 直接访问"
test_http "http://localhost:8000" "语音服务"
test_http "http://localhost:8080" "Caddy 代理"

# 测试隧道 URL（如果有）
if [ ! -z "$TUNNEL_URL" ]; then
    test_http "$TUNNEL_URL" "Cloudflare Tunnel"
fi

# 4. 检查 Caddyfile 配置
echo -e "${BLUE}4️⃣  检查 Caddy 配置${NC}"
echo ""

if [ -f Caddyfile ]; then
    echo "📄 Caddyfile 配置："
    cat Caddyfile | grep -A 1 "reverse_proxy" | sed 's/^/  /'
    echo ""
    
    # 检查配置是否正确
    caddy_frontend=$(grep "reverse_proxy localhost:" Caddyfile | tail -1 | grep -o "localhost:[0-9]*")
    echo "Caddy 前端代理配置: $caddy_frontend"
    
    # 检查实际前端端口
    if [ -f logs/web.log ]; then
        actual_port=$(grep "Local:" logs/web.log | grep -o "localhost:[0-9]*" | cut -d: -f2)
        if [ ! -z "$actual_port" ]; then
            echo "前端实际运行端口: localhost:$actual_port"
            
            if [ "$caddy_frontend" != "localhost:$actual_port" ]; then
                echo -e "${RED}⚠️  警告：端口不匹配！${NC}"
                echo "   Caddy 配置代理到 $caddy_frontend"
                echo "   但前端实际运行在 localhost:$actual_port"
                echo "   这会导致 404 错误！"
            else
                echo -e "${GREEN}✓ 端口配置正确${NC}"
            fi
        fi
    fi
else
    echo -e "${RED}✗ Caddyfile 不存在${NC}"
fi
echo ""

# 5. 检查日志错误
echo -e "${BLUE}5️⃣  检查日志中的错误${NC}"
echo ""

check_log_errors() {
    local log_file=$1
    local name=$2
    
    if [ -f "$log_file" ]; then
        errors=$(grep -i "error\|failed\|EADDRINUSE" "$log_file" 2>/dev/null | tail -3)
        if [ ! -z "$errors" ]; then
            echo -e "${YELLOW}⚠ $name 日志中有错误：${NC}"
            echo "$errors" | sed 's/^/  /'
            echo ""
        else
            echo -e "${GREEN}✓ $name 日志无明显错误${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ $name 日志文件不存在${NC}"
    fi
}

check_log_errors "logs/web.log" "前端"
check_log_errors "logs/api.log" "API"
check_log_errors "logs/voice.log" "语音服务"
check_log_errors "logs/caddy.log" "Caddy"
check_log_errors "logs/cloudflared.log" "Cloudflare Tunnel"
echo ""

# 6. 环境变量检查
echo -e "${BLUE}6️⃣  检查环境配置${NC}"
echo ""

if [ -f apps/web/.env ]; then
    echo "📄 .env 文件存在"
    echo ""
    echo "关键配置（隐藏敏感信息）："
    grep "^VITE_" apps/web/.env | sed 's/VITE_GOOGLE_MAPS_API_KEY=.*/VITE_GOOGLE_MAPS_API_KEY=***隐藏***/' | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠ .env 文件不存在${NC}"
    echo "   请检查环境变量配置"
fi
echo ""

# 7. 总结和建议
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 诊断总结${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# 判断主要问题
has_issues=false

# 检查端口冲突
if [ -f logs/web.log ]; then
    if grep -q "Port.*is in use" logs/web.log; then
        echo -e "${RED}❌ 问题：前端端口被占用${NC}"
        echo "   → 前端尝试使用多个端口，最终使用了非预期端口"
        echo "   → 这导致 Caddy 代理到错误的端口"
        has_issues=true
        echo ""
    fi
fi

# 检查 API 端口
if [ -f logs/api.log ]; then
    if grep -q "EADDRINUSE" logs/api.log; then
        echo -e "${RED}❌ 问题：API 端口被占用${NC}"
        echo "   → 端口 3333 已被其他进程使用"
        has_issues=true
        echo ""
    fi
fi

# 检查 Caddy 是否运行
if ! nc -z localhost 8080 2>/dev/null; then
    echo -e "${RED}❌ 问题：Caddy 未运行${NC}"
    echo "   → Caddy 是隧道和各服务之间的桥梁"
    has_issues=true
    echo ""
fi

# 检查 Cloudflared 是否运行
if ! pgrep -f cloudflared > /dev/null; then
    echo -e "${RED}❌ 问题：Cloudflare Tunnel 未运行${NC}"
    has_issues=true
    echo ""
fi

if [ "$has_issues" = false ]; then
    echo -e "${GREEN}✅ 未发现明显问题${NC}"
    echo ""
    echo "如果仍然遇到 404，可能原因："
    echo "  1. Cloudflare Tunnel 需要几秒钟传播"
    echo "  2. 浏览器缓存问题（试试无痕模式）"
    echo "  3. 网络问题（VPN 可能干扰）"
else
    echo -e "${YELLOW}💡 建议的修复步骤：${NC}"
    echo ""
    echo "1️⃣  停止所有服务并重新启动："
    echo "   ./fix-and-restart.sh"
    echo ""
    echo "2️⃣  如果问题持续，手动清理端口："
    echo "   lsof -ti :5174 | xargs kill -9"
    echo "   lsof -ti :3333 | xargs kill -9"
    echo "   lsof -ti :8000 | xargs kill -9"
    echo "   lsof -ti :8080 | xargs kill -9"
    echo ""
    echo "3️⃣  然后重新运行："
    echo "   ./fix-and-restart.sh"
fi

echo ""
echo -e "${BLUE}📝 查看详细日志：${NC}"
echo "   tail -f logs/web.log       # 前端"
echo "   tail -f logs/caddy.log     # Caddy"
echo "   tail -f logs/cloudflared.log # Tunnel"
echo ""

