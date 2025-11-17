#!/bin/bash

# Explore Page 验证脚本
# 用于验证修复后的 Explore 页面是否正常工作

echo "🔍 验证 Explore Page 修复..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查文件是否已修复
echo "📝 1. 检查 useBrowserLocation.ts 配置..."
if grep -q "enableHighAccuracy: true" /Users/ming/Documents/take-a-break/apps/web/src/hooks/useBrowserLocation.ts && \
   grep -q "timeout: 30000" /Users/ming/Documents/take-a-break/apps/web/src/hooks/useBrowserLocation.ts && \
   grep -q "maximumAge: 0" /Users/ming/Documents/take-a-break/apps/web/src/hooks/useBrowserLocation.ts; then
    echo -e "${GREEN}✓${NC} useBrowserLocation.ts 配置正确"
else
    echo -e "${RED}✗${NC} useBrowserLocation.ts 配置不正确"
    echo "   应该包含:"
    echo "   - enableHighAccuracy: true"
    echo "   - timeout: 30000"
    echo "   - maximumAge: 0"
fi
echo ""

# 2. 检查 .env 文件
echo "🔑 2. 检查环境变量..."
if [ -f /Users/ming/Documents/take-a-break/apps/web/.env ]; then
    if grep -q "VITE_GOOGLE_MAPS_API_KEY=" /Users/ming/Documents/take-a-break/apps/web/.env; then
        api_key=$(grep "VITE_GOOGLE_MAPS_API_KEY=" /Users/ming/Documents/take-a-break/apps/web/.env | cut -d'=' -f2)
        if [ -n "$api_key" ] && [ "$api_key" != "YOUR_API_KEY_HERE" ]; then
            echo -e "${GREEN}✓${NC} Google Maps API Key 已配置"
        else
            echo -e "${YELLOW}⚠${NC} Google Maps API Key 未设置或为默认值"
            echo "   请在 apps/web/.env 中设置: VITE_GOOGLE_MAPS_API_KEY=你的API密钥"
        fi
    else
        echo -e "${YELLOW}⚠${NC} .env 文件存在但未配置 VITE_GOOGLE_MAPS_API_KEY"
    fi
else
    echo -e "${YELLOW}⚠${NC} 未找到 .env 文件"
    echo "   请在 apps/web/ 目录下创建 .env 文件并添加:"
    echo "   VITE_GOOGLE_MAPS_API_KEY=你的API密钥"
    echo "   VITE_API_BASE_URL=http://localhost:3333"
fi
echo ""

# 3. 检查 API 服务器
echo "🔌 3. 检查 API 服务器..."
if curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API 服务器运行中 (http://localhost:3333)"
else
    echo -e "${RED}✗${NC} API 服务器未运行"
    echo "   启动命令: pnpm --filter @take-a-break/api dev"
fi
echo ""

# 4. 检查 Web 应用
echo "🌐 4. 检查 Web 应用..."
if curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Web 应用运行中 (http://localhost:5174)"
else
    echo -e "${RED}✗${NC} Web 应用未运行"
    echo "   启动命令: pnpm --filter @take-a-break/web dev"
fi
echo ""

# 5. 检查测试文件
echo "🧪 5. 检查测试文件..."
if [ -f /Users/ming/Documents/take-a-break/scripts/test-browser-location.html ]; then
    echo -e "${GREEN}✓${NC} 测试文件存在"
    echo "   可以在浏览器中打开来验证浏览器 geolocation API:"
    echo "   file:///Users/ming/Documents/take-a-break/scripts/test-browser-location.html"
else
    echo -e "${RED}✗${NC} 测试文件不存在"
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 验证总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "修复内容:"
echo "  ✓ useBrowserLocation.ts geolocation 参数已更新"
echo ""
echo "需要配置:"
if [ ! -f /Users/ming/Documents/take-a-break/apps/web/.env ]; then
    echo "  ⚠ 创建 apps/web/.env 文件"
    echo "  ⚠ 添加 VITE_GOOGLE_MAPS_API_KEY"
fi
echo ""
echo "需要启动:"
if ! curl -s http://localhost:3333/health > /dev/null 2>&1; then
    echo "  ⚠ API 服务器 (pnpm --filter @take-a-break/api dev)"
fi
if ! curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "  ⚠ Web 应用 (pnpm --filter @take-a-break/web dev)"
fi
echo ""
echo "访问 Explore 页面:"
echo "  🌐 http://localhost:5174/explore"
echo ""
echo "详细说明请查看: EXPLORE_PAGE_FIX.md"
echo ""

