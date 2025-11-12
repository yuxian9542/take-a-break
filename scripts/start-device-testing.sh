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

# 检查 .env.local 配置
ENV_FILE="apps/mobile/.env.local"
EXPECTED_URL="http://$IP:3333"

if [ -f "$ENV_FILE" ]; then
  CURRENT_URL=$(grep "EXPO_PUBLIC_API_BASE_URL" "$ENV_FILE" | cut -d'=' -f2)
  echo "✅ 找到配置文件: $ENV_FILE"
  echo "   当前配置: $CURRENT_URL"
  
  if [ "$CURRENT_URL" != "$EXPECTED_URL" ]; then
    echo "⚠️  IP 地址可能已变更"
    echo "   建议更新为: $EXPECTED_URL"
  fi
else
  echo "⚠️  未找到 $ENV_FILE"
  echo ""
  echo "正在创建配置文件..."
  cat > "$ENV_FILE" << EOF
# 真机测试配置（自动生成）
EXPO_PUBLIC_API_BASE_URL=$EXPECTED_URL
EOF
  echo "✅ 已创建: $ENV_FILE"
fi

echo ""
echo "📋 真机测试清单："
echo ""
echo "1️⃣ 在手机上安装 Expo Go"
echo "   iOS: App Store"
echo "   Android: Google Play"
echo ""
echo "2️⃣ 确保手机和电脑在同一 WiFi 网络"
echo ""
echo "3️⃣ 启动 API 服务器（在另一个终端）："
echo "   cd services/api"
echo "   HOST=0.0.0.0 PORT=3333 pnpm run dev"
echo ""
echo "4️⃣ 启动移动应用（在另一个终端）："
echo "   cd apps/mobile"
echo "   pnpm run dev"
echo ""
echo "5️⃣ 用手机扫描二维码或访问以下地址测试："
echo "   http://$IP:3333/health"
echo ""
echo "💡 提示："
echo "   - 如果连接失败，检查防火墙设置"
echo "   - 完整指南: 真机测试指南.md"
echo ""



