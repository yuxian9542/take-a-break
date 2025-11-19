#!/bin/bash
# 检查 Cloudflare Tunnel 所需的依赖

echo "🔍 检查 Cloudflare Tunnel 部署依赖..."
echo ""

ALL_OK=true

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_command() {
    local cmd=$1
    local name=$2
    local install_hint=$3
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -1)
        echo -e "${GREEN}✓${NC} $name 已安装"
        echo "  $version"
    else
        echo -e "${RED}✗${NC} $name 未安装"
        echo -e "  ${YELLOW}安装:${NC} $install_hint"
        ALL_OK=false
    fi
    echo ""
}

# 检查各项依赖
check_command "node" "Node.js" "访问 https://nodejs.org"
check_command "pnpm" "pnpm" "npm install -g pnpm"
check_command "caddy" "Caddy" "brew install caddy (Mac) 或访问 https://caddyserver.com/docs/install"
check_command "cloudflared" "cloudflared" "brew install cloudflare/cloudflare/cloudflared (Mac) 或访问 https://github.com/cloudflare/cloudflared/releases"
check_command "python3" "Python 3" "访问 https://python.org"

# 检查 Python 虚拟环境
echo "检查 Python 虚拟环境..."
if [ -d "services/voice/web_agent/venv" ]; then
    echo -e "${GREEN}✓${NC} Python 虚拟环境已创建"
    echo "  路径: services/voice/web_agent/venv"
else
    echo -e "${RED}✗${NC} Python 虚拟环境未创建"
    echo -e "  ${YELLOW}创建:${NC} cd services/voice/web_agent && ./setup.sh"
    ALL_OK=false
fi
echo ""

# 检查环境文件
echo "检查环境配置..."
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ] && [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✓${NC} ${ENV_FILE} 文件存在"
    
    # 检查关键配置
    if grep -q "^VITE_API_BASE_URL=/api" "$ENV_FILE"; then
        echo -e "  ${GREEN}✓${NC} API 配置正确（相对路径）"
    else
        echo -e "  ${YELLOW}⚠${NC} API 未配置为相对路径"
        echo "    建议运行: ./setup-tunnel-env.sh"
    fi
    
    if grep -q "^VITE_VOICE_WS_URL=/ws/voice" "$ENV_FILE"; then
        echo -e "  ${GREEN}✓${NC} 语音 WebSocket 配置正确（相对路径）"
    else
        echo -e "  ${YELLOW}⚠${NC} 语音 WebSocket 未配置为相对路径"
        echo "    建议运行: ./setup-tunnel-env.sh"
    fi
    
    if grep -q "^VITE_GOOGLE_MAPS_API_KEY=.\+" "$ENV_FILE" && ! grep -q "你的" "$ENV_FILE"; then
        echo -e "  ${GREEN}✓${NC} Google Maps API Key 已配置"
    else
        echo -e "  ${YELLOW}⚠${NC} Google Maps API Key 未配置或为占位符"
        echo "    请编辑 ${ENV_FILE} 文件设置有效的 API Key"
    fi
else
    echo -e "${RED}✗${NC} 未找到 .env.local 或 .env 文件"
    echo -e "  ${YELLOW}创建:${NC} ./setup-tunnel-env.sh"
    ALL_OK=false
fi
echo ""

# 检查 Caddyfile
if [ -f "Caddyfile" ]; then
    echo -e "${GREEN}✓${NC} Caddyfile 配置文件存在"
else
    echo -e "${RED}✗${NC} Caddyfile 配置文件不存在"
    echo "  这应该已经创建，请重新克隆项目或联系支持"
    ALL_OK=false
fi
echo ""

# 总结
echo "════════════════════════════════════════"
if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✅ 所有依赖已就绪！${NC}"
    echo ""
    echo "可以运行以下命令启动："
    echo "  ./deploy-cloudflare.sh"
else
    echo -e "${YELLOW}⚠️  请先完成上述缺失项的安装${NC}"
    echo ""
    echo "完成后再次运行此脚本检查"
fi
echo "════════════════════════════════════════"

