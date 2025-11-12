# 🗺️ 真实地图功能快速开始

> 从 Mock 数据切换到 Google Maps API 的完整指南

## ⚡ 5 分钟快速设置

### 步骤 1: 获取 Google Maps API 密钥

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 进入 **API 和服务** > **库**
4. 搜索并启用：
   - ✅ **Places API**
   - ✅ **Directions API**
5. 进入 **凭据** > **创建凭据** > **API 密钥**
6. 复制生成的 API 密钥

### 步骤 2: 配置项目

在项目根目录创建 `.env` 文件：

```bash
cd /Users/ming/Documents/take-a-break

# 创建 .env 文件
cat > .env << 'EOF'
# Google Maps Configuration
GOOGLE_MAPS_API_KEY=你的API密钥
USE_REAL_MAP_API=true

# App Configuration
APP_ENV=development
PORT=3333
PUBLIC_FEATURES=break-planner,map,voice
ENABLE_SWAGGER=true
EOF
```

**替换 API 密钥**：
编辑 `.env` 文件，将 `你的API密钥` 替换为第一步获取的实际密钥。

### 步骤 3: 启动服务

```bash
# 启动 API 服务器
pnpm run dev:api
```

✅ **成功标志** - 查看日志应显示：
```
[MapService] Using Google Places API
[MapService] Using Google Directions API
```

### 步骤 4: 启动移动应用

```bash
# 在新终端窗口
cd apps/mobile
pnpm start
```

然后按 `i` 启动 iOS 模拟器或 `a` 启动 Android。

### 步骤 5: 设置模拟器位置

iOS 模拟器默认在旧金山，设置为其他城市：

```bash
# 设置为纽约
pnpm run sim:location:nyc

# 或设置为旧金山
pnpm run sim:location:sf
```

## 🎉 测试功能

### 测试真实地点搜索

在移动应用中：
1. 打开 **地图** 功能
2. 系统会自动搜索附近的真实地点
3. 应该看到真实的公园、咖啡馆等

### 测试导航功能

1. 在地点列表中选择一个地点
2. 点击 **导航** 按钮
3. 地图上会显示真实的步行路线
4. 显示准确的距离和时间

## 🔍 验证配置

### 通过 API 端点测试

```bash
# 测试获取当前位置
curl http://localhost:3333/map/location

# 测试搜索附近地点（旧金山）
curl "http://localhost:3333/map/nearby?lat=37.785834&lng=-122.406417&radius=2000&limit=10"

# 测试导航路线
curl -X POST http://localhost:3333/map/route \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"lat": 37.785834, "lng": -122.406417},
    "destinationId": "ChIJIQBpAG2ahYAR_6128GcTUEo"
  }'
```

## 🔧 故障排查

### 问题：仍然显示 Mock 数据

**解决方案**：
```bash
# 1. 检查环境变量
cat .env | grep GOOGLE_MAPS_API_KEY
cat .env | grep USE_REAL_MAP_API

# 2. 确认 USE_REAL_MAP_API=true
# 3. 重启 API 服务器

# 4. 检查日志
# 应该显示: [MapService] Using Google Places API
```

### 问题：API Key 无效

**解决方案**：
1. 确认 API 密钥没有多余的空格或换行
2. 在 Google Cloud Console 中检查 API 是否已启用
3. 检查 API 密钥的限制设置

### 问题：找不到附近地点

**原因**：模拟器位置可能与 Mock 数据不匹配

**解决方案**：
```bash
# 设置模拟器到正确位置
pnpm run sim:location:nyc  # 纽约
# 或
pnpm run sim:location:sf   # 旧金山
```

### 问题：ZERO_RESULTS 错误

**解决方案**：
- 增加搜索半径
- 尝试不同的位置坐标
- 检查该地区是否有符合条件的地点

## 💰 成本说明

### 免费额度

Google Maps 每月提供：
- **$200 USD** 免费积分
- Places API: ~11,764 次免费请求
- Directions API: ~40,000 次免费请求

### 估算使用量

假设每天使用应用 10 次：
- 搜索地点: 10 次
- 查看导航: 3 次

**月度成本**：
- Places: 300 次 × $0.017 = $5.10
- Directions: 90 次 × $0.005 = $0.45
- **总计**: ~$5.55/月（远低于 $200 免费额度）

> 💡 **提示**: 个人开发和小型应用完全在免费额度内！

## 🔄 切换回 Mock 数据

如需临时使用 Mock 数据（节省配额或离线开发）：

```bash
# 编辑 .env 文件
USE_REAL_MAP_API=false

# 重启 API 服务器
pnpm run dev:api
```

## 📊 功能对比

| 功能 | Mock 数据 | Google Maps API |
|------|-----------|-----------------|
| 地点搜索 | 固定10-18个地点 | 真实的全球地点 |
| 位置准确性 | 估算 | 精确 |
| 导航路线 | 直线估算 | 真实路线 |
| 距离/时间 | 估算 | 精确 |
| 地点信息 | 基础 | 详细（评分、营业等） |
| 网络需求 | 无 | 需要 |
| 成本 | 免费 | 有限免费额度 |

## 🎯 下一步

现在您的应用已经集成了真实地图功能！

推荐阅读：
- `GOOGLE_MAPS_SETUP.md` - 详细的 API 配置和安全设置
- `REAL_MAP_INTEGRATION_GUIDE.md` - 技术实现细节
- `LOCATION_ISSUE_ANALYSIS.md` - 定位问题排查

## 🆘 需要帮助？

### 常见问题

**Q: 如何限制 API 密钥以提高安全性？**
A: 参见 `GOOGLE_MAPS_SETUP.md` 的安全章节

**Q: 如何监控 API 使用量？**
A: 在 Google Cloud Console 的 API 仪表板中查看

**Q: 生产环境需要注意什么？**
A: 设置 IP 限制、API 限制和配额告警

### 获取支持

1. 检查服务器日志错误信息
2. 查看相关文档
3. 在 Google Cloud Console 查看 API 错误

---

**恭喜！** 您现在可以使用真实的地图和导航功能了！🎉

享受精确的地点搜索和导航体验吧！



