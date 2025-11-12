#!/bin/bash

# 检查环境变量配置

echo "🔍 检查 Google Maps API 配置..."
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
  echo "❌ 未找到 .env 文件"
  echo ""
  echo "请创建 .env 文件并添加以下内容："
  echo ""
  echo "GOOGLE_MAPS_API_KEY=你的API密钥"
  echo "USE_REAL_MAP_API=true"
  echo ""
  exit 1
fi

echo "✅ .env 文件存在"
echo ""

# 检查 GOOGLE_MAPS_API_KEY
if grep -q "GOOGLE_MAPS_API_KEY=" .env; then
  API_KEY=$(grep "GOOGLE_MAPS_API_KEY=" .env | cut -d '=' -f 2)
  if [ -z "$API_KEY" ] || [ "$API_KEY" = "你的API密钥" ]; then
    echo "⚠️  GOOGLE_MAPS_API_KEY 未设置或使用了占位符"
    echo "   当前值: $API_KEY"
  else
    KEY_LENGTH=${#API_KEY}
    echo "✅ GOOGLE_MAPS_API_KEY 已设置 (长度: $KEY_LENGTH)"
  fi
else
  echo "❌ .env 中未找到 GOOGLE_MAPS_API_KEY"
fi

# 检查 USE_REAL_MAP_API
if grep -q "USE_REAL_MAP_API=" .env; then
  USE_REAL=$(grep "USE_REAL_MAP_API=" .env | cut -d '=' -f 2)
  if [ "$USE_REAL" = "true" ]; then
    echo "✅ USE_REAL_MAP_API=true"
  else
    echo "⚠️  USE_REAL_MAP_API=$USE_REAL (应该设置为 true)"
  fi
else
  echo "❌ .env 中未找到 USE_REAL_MAP_API"
fi

echo ""
echo "📋 .env 文件内容预览："
echo "---"
grep -v "^#" .env | grep -v "^$" | head -10
echo "---"
echo ""

# 检查端口占用
if lsof -ti:3333 > /dev/null 2>&1; then
  echo "⚠️  端口 3333 已被占用"
  echo ""
  echo "占用进程："
  lsof -i:3333
  echo ""
  echo "停止这些进程："
  echo "  kill \$(lsof -ti:3333)"
else
  echo "✅ 端口 3333 可用"
fi

echo ""
echo "完成检查！"



