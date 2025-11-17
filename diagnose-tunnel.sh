#!/bin/bash
# Cloudflare Tunnel 诊断脚本

PROJECT_ROOT="/Users/ming/Documents/take-a-break"
cd "$PROJECT_ROOT"

echo "🔍 Cloudflare Tunnel 诊断工具"
echo "================================"
echo ""

# 1. 检查进程状态
echo "📋 进程状态："
echo ""
echo "前端 (5174-5176):"
lsof -i :5174 -i :5175 -i :5176 2>/dev/null || echo "  ❌ 未运行"
echo ""

echo "API (3333):"
lsof -i :3333 2>/dev/null || echo "  ❌ 未运行"
echo ""

echo "语音服务 (8000):"
lsof -i :8000 2>/dev/null || echo "  ❌ 未运行"
echo ""

echo "Caddy (8080):"
lsof -i :8080 2>/dev/null || echo "  ❌ 未运行"
echo ""

echo "Cloudflared:"
ps aux | grep cloudflared | grep -v grep || echo "  ❌ 未运行"
echo ""

# 2. 测试连接
echo "🌐 连接测试："
echo ""

echo "本地前端 (5174):"
curl -s -o /dev/null -w "  状态码: %{http_code}\n" http://localhost:5174 2>/dev/null || echo "  ❌ 无法连接"

echo "本地前端 (5175):"
curl -s -o /dev/null -w "  状态码: %{http_code}\n" http://localhost:5175 2>/dev/null || echo "  ❌ 无法连接"

echo "本地前端 (5176):"
curl -s -o /dev/null -w "  状态码: %{http_code}\n" http://localhost:5176 2>/dev/null || echo "  ❌ 无法连接"

echo "API 后端 (3333):"
curl -s -o /dev/null -w "  状态码: %{http_code}\n" http://localhost:3333 2>/dev/null || echo "  ❌ 无法连接"

echo "Caddy 代理 (8080):"
curl -s -o /dev/null -w "  状态码: %{http_code}\n" http://localhost:8080 2>/dev/null || echo "  ❌ 无法连接"

# 3. 检查日志
echo ""
echo "📝 最新日志："
echo ""

if [ -f logs/cloudflared.log ]; then
    echo "Cloudflare Tunnel URL:"
    grep -o 'https://[^[:space:]]*\.trycloudflare\.com' logs/cloudflared.log | tail -1 || echo "  ❌ 未找到 URL"
    echo ""
    
    echo "最近的错误:"
    grep -i "error\|fail\|panic" logs/cloudflared.log | tail -5 || echo "  ✅ 无错误"
else
    echo "  ❌ logs/cloudflared.log 不存在"
fi

echo ""
echo "================================"
echo "诊断完成"

