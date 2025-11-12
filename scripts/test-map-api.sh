#!/bin/bash

echo "🧪 测试地图 API 配置..."
echo ""

BASE_URL="http://localhost:3333"

echo "1️⃣ 测试 API 健康检查..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

echo "2️⃣ 测试获取当前位置..."
curl -s "$BASE_URL/map/location" | jq '.'
echo ""

echo "3️⃣ 测试搜索附近地点（旧金山）..."
RESPONSE=$(curl -s "$BASE_URL/map/nearby?lat=37.785834&lng=-122.406417&radius=2000&limit=5")
echo "$RESPONSE" | jq '.'

# 检查返回的地点数量
PLACES_COUNT=$(echo "$RESPONSE" | jq '.places | length')
echo ""
echo "📊 找到 $PLACES_COUNT 个地点"

if [ "$PLACES_COUNT" -gt 0 ]; then
  echo ""
  echo "✅ 如果地点名称是真实的（不是 Mock 数据中的固定地点），说明正在使用 Google Places API"
  echo ""
  echo "第一个地点："
  echo "$RESPONSE" | jq '.places[0] | {name, address, rating}'
else
  echo ""
  echo "❌ 没有找到地点。可能的原因："
  echo "   1. Google Places API 密钥无效"
  echo "   2. 该地区没有符合条件的地点"
  echo "   3. 仍在使用 Mock 数据"
fi

echo ""
echo "4️⃣ 检查 Mock 数据特征..."
MOCK_SPOT=$(echo "$RESPONSE" | jq -r '.places[] | select(.name == "Riverside Park - Cherry Walk") | .name')
if [ -n "$MOCK_SPOT" ]; then
  echo "⚠️  发现 Mock 数据特征: $MOCK_SPOT"
  echo "   → 说明仍在使用 Mock 数据，而不是 Google Places API"
else
  echo "✅ 未发现 Mock 数据特征"
  echo "   → 可能正在使用真实的 Google Places API"
fi

echo ""
echo "测试完成！"



