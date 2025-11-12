# 定位显示旧金山问题分析

## 🔍 问题描述

用户在纽约长岛，但地图显示旧金山地区，且没有附近地点推荐。

## 📊 日志分析

```
LOG  [MapService] Device location obtained: {"accuracy": 5, "lat": 37.785834, "lng": -122.406417}
LOG  [MapService] Fetching nearby places: {"lat": 37.785834, "lng": -122.406417, ...}
LOG  [MapService] Found 0 nearby places
```

## 🎯 根本原因

**iOS 模拟器的默认位置是旧金山** (37.785834, -122.406417)

这不是 bug，而是 iOS 模拟器的预设行为：
1. ✅ 定位功能正常工作
2. ✅ 设备成功返回了位置信息
3. ✅ 前端正确使用了设备位置
4. ❌ 但是后端的 mock 数据都在纽约，距离旧金山太远

## 🗺️ MapView 显示逻辑

MapView 的区域是动态基于用户当前位置设置的：

```typescript
const mapRegion = useMemo<Region>(
  () =>
    currentLocation
      ? {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }
      : FALLBACK_REGION,
  [currentLocation]
);
```

所以如果设备位置在旧金山，地图自然就会显示旧金山。

## ✅ 解决方案

### 方案 1：修改模拟器位置（立即生效）

运行以下命令设置模拟器位置到纽约：

```bash
# 设置为纽约
pnpm run sim:location:nyc

# 或设置为旧金山
pnpm run sim:location:sf

# 或手动设置
./scripts/set-simulator-location.sh nyc
```

**手动设置方式**：
1. 打开 iOS 模拟器
2. 菜单栏：**Features** → **Location** → **Custom Location...**
3. 输入：
   - Latitude: `40.7829`
   - Longitude: `-73.9654`

### 方案 2：添加旧金山 Mock 数据（已完成）

已在 `services/api/src/routes/map.ts` 中添加了旧金山的地点数据：

- Golden Gate Park - Japanese Tea Garden
- Yerba Buena Gardens
- Blue Bottle Coffee
- Embarcadero Waterfront
- Palace of Fine Arts
- San Francisco Public Library
- Crissy Field
- Ritual Coffee Roasters

现在无论模拟器位置在哪里，都能看到附近的放松地点推荐。

## 🧪 测试步骤

### 测试纽约位置

```bash
# 1. 设置模拟器位置为纽约
pnpm run sim:location:nyc

# 2. 重启应用

# 3. 打开地图，应该看到：
#    - 地图中心：纽约长岛
#    - 附近地点：Riverside Park, Central Park, Hudson River 等
```

### 测试旧金山位置

```bash
# 1. 设置模拟器位置为旧金山
pnpm run sim:location:sf

# 2. 重启应用

# 3. 打开地图，应该看到：
#    - 地图中心：旧金山
#    - 附近地点：Golden Gate Park, Yerba Buena Gardens 等
```

## 📝 验证清单

- [ ] 运行 `pnpm run sim:location:nyc`
- [ ] 重启应用
- [ ] 打开地图功能
- [ ] 检查日志显示正确的纽约坐标
- [ ] 确认能看到纽约的地点推荐

## 🚀 未来改进

1. **添加更多城市的 Mock 数据**
   - 洛杉矶
   - 芝加哥
   - 波士顿

2. **集成真实的地点 API**
   - Google Places API
   - Foursquare API
   - Yelp Fusion API

3. **开发环境位置切换器**
   - 在应用内添加调试菜单
   - 快速切换测试城市

4. **真实 GPS 测试**
   - 在真机上测试
   - 验证权限请求流程
   - 测试位置更新频率

## 🔧 相关文件

- `apps/mobile/src/services/mapService.ts` - 位置服务
- `apps/mobile/src/components/break/MapModal.tsx` - 地图显示
- `services/api/src/routes/map.ts` - 后端 API 和 Mock 数据
- `scripts/set-simulator-location.sh` - 位置设置脚本
- `SIMULATOR_LOCATION_SETUP.md` - 详细设置指南

## ❓ 常见问题

### Q: 为什么不直接在代码中修改默认位置？

A: 因为我们想测试真实的定位流程。在开发环境强制使用某个位置会掩盖潜在的定位问题。正确的做法是模拟真实的设备行为。

### Q: 生产环境会有这个问题吗？

A: 不会。真实设备会返回用户的实际位置。这个问题只在使用 iOS 模拟器开发时存在。

### Q: 为什么添加旧金山数据而不是只用纽约？

A: 为了更好的开发体验。现在开发者无需每次都设置模拟器位置，可以直接在旧金山位置测试功能。

### Q: API Key 有问题吗？

A: 没有。目前使用的是 mock 数据，不需要 API Key。当集成真实的地点 API（如 Google Places）时才需要 API Key。



