#!/bin/bash
# 配置环境变量以支持 Cloudflare Tunnel

ENV_FILE="/Users/ming/Documents/take-a-break/.env"

echo "🔧 配置 Cloudflare Tunnel 环境变量..."
echo ""

# 检查 .env 文件是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env 文件不存在"
    echo "   正在创建..."
    touch "$ENV_FILE"
fi

# 备份原文件
cp "$ENV_FILE" "$ENV_FILE.backup"
echo "✅ 已备份原文件到 .env.backup"

# 读取当前的 Google Maps API Key
CURRENT_MAPS_KEY=$(grep "^VITE_GOOGLE_MAPS_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)

# 创建新的配置
cat > "$ENV_FILE" << 'EOF'
# Cloudflare Tunnel 配置
# API 使用相对路径（通过 Caddy 反向代理）
VITE_API_BASE_URL=/api

# 语音服务使用相对路径（通过 Caddy 反向代理）
VITE_VOICE_WS_URL=/ws/voice

# Google Maps API Key
EOF

# 添加 Maps API Key
if [ -n "$CURRENT_MAPS_KEY" ]; then
    echo "VITE_GOOGLE_MAPS_API_KEY=$CURRENT_MAPS_KEY" >> "$ENV_FILE"
    echo "✅ 保留了原有的 Google Maps API Key"
else
    echo "VITE_GOOGLE_MAPS_API_KEY=你的Google_Maps_API密钥" >> "$ENV_FILE"
    echo "⚠️  请手动设置 Google Maps API Key"
fi

echo ""
echo "✅ 环境变量配置完成！"
echo ""
echo "📝 新的配置："
cat "$ENV_FILE"
echo ""
echo "⚠️  重要：修改 .env 后需要重启前端服务才能生效！"
echo ""

