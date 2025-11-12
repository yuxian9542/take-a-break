# Map功能集成指南

## 概述

本文档说明如何在前端应用中集成地图功能。地图核心功能已经合并，包括：

- ✅ 类型定义 (`packages/types/src/map.ts`)
- ✅ API客户端 (`packages/api-client`)
- ✅ 地图服务 (`services/map`)
- ✅ HTTP路由 (`services/api/src/routes/map.ts`)
- ⚠️ 移动端集成 (部分完成，需要进一步开发)

## 已完成的集成

### 1. 后端API端点

以下API端点已经可用：

#### GET /map/location
获取当前位置（使用mock provider）

**查询参数：**
- `mode?: 'highAccuracy' | 'batterySaving'`
- `timeoutMs?: number`
- `allowModeFallback?: boolean`
- `allowStale?: boolean`

**响应：**
```json
{
  "lat": 37.7749,
  "lng": -122.4194,
  "accuracyMeters": 10,
  "mode": "highAccuracy",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "isStale": false
}
```

#### GET /map/nearby
获取附近地点

**查询参数：**
- `lat: number` (必需)
- `lng: number` (必需)
- `radius?: number` (默认1000米)
- `types?: string` (逗号分隔，如 "cafe,park")
- `limit?: number` (默认20，最大50)

**响应：**
```json
{
  "places": [
    {
      "id": "place-1",
      "name": "Golden Gate Park",
      "lat": 37.7694,
      "lng": -122.4862,
      "address": "Golden Gate Park, San Francisco, CA",
      "distanceMeters": 500,
      "types": ["park"],
      "rating": 4.8,
      "isOpenNow": true
    }
  ]
}
```

#### POST /map/route
获取步行路线

**请求体：**
```json
{
  "origin": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "destinationId": "place-1"
}
```

**响应：**
```json
{
  "summary": {
    "distanceMeters": 500,
    "durationSeconds": 360,
    "mode": "walking"
  },
  "polyline": [
    {
      "lat": 37.7749,
      "lng": -122.4194,
      "sequence": 0
    },
    {
      "lat": 37.7694,
      "lng": -122.4862,
      "sequence": 1
    }
  ]
}
```

### 2. 移动端基础集成

已创建的文件：
- `apps/mobile/src/services/mapService.ts` - MapApiClient封装
- `apps/mobile/src/hooks/useMapIntegration.ts` - React Hook

**使用示例：**

```typescript
import { useMapIntegration } from './hooks/useMapIntegration';

function MapComponent() {
  const {
    currentLocation,
    nearbyPlaces,
    isLoading,
    error,
    fetchNearbyPlaces
  } = useMapIntegration();

  useEffect(() => {
    if (currentLocation) {
      fetchNearbyPlaces(currentLocation.lat, currentLocation.lng, {
        radius: 1000,
        types: 'cafe,park',
        limit: 10
      });
    }
  }, [currentLocation, fetchNearbyPlaces]);

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <Text>Nearby Places:</Text>
      {nearbyPlaces.map(place => (
        <Text key={place.id}>{place.name}</Text>
      ))}
    </View>
  );
}
```

## 待完成的集成任务

### 1. 更新现有组件

需要更新 `apps/mobile/src/components/break/MapModal.tsx` 来使用真实API：

- [ ] 替换mock location数据为 `mapService.getCurrentLocation()`
- [ ] 集成 `mapService.getNearbyPlaces()` 获取真实地点
- [ ] 使用 `mapService.getRoute()` 获取真实路线
- [ ] 在地图上显示polyline路线
- [ ] 处理loading和error状态

### 2. 实现真实定位Provider

当前使用mock location provider（返回San Francisco坐标）。需要：

- [ ] 在React Native中集成设备GPS (使用 `expo-location`)
- [ ] 创建RN-specific LocationProvider
- [ ] 在API路由中注入真实provider而非mock

### 3. 集成真实地图SDK

- [ ] 集成Apple Maps (iOS)
- [ ] 集成Google Maps (Android)  
- [ ] 在MapModal中显示真实地图而非gradient placeholder
- [ ] 在地图上标记地点
- [ ] 绘制路线polyline

### 4. 环境配置

创建 `.env` 文件配置API地址：

```bash
# .env.local
EXPO_PUBLIC_API_URL=http://localhost:3333

# .env.production
EXPO_PUBLIC_API_URL=https://api.your-domain.com
```

### 5. 错误处理和用户体验

- [ ] 添加网络错误重试逻辑
- [ ] 实现offline缓存
- [ ] 添加skeleton loading状态
- [ ] 优化error messages的显示

### 6. 测试

- [ ] 为mapService编写单元测试
- [ ] 为useMapIntegration Hook编写测试
- [ ] 端到端测试地图流程

## 运行和测试

### 启动后端API

```bash
cd services/api
pnpm dev
```

API将运行在 `http://localhost:3333`

### 启动移动应用

```bash
cd apps/mobile
pnpm install
pnpm dev
```

### 测试API端点

```bash
# 获取位置
curl http://localhost:3333/map/location

# 获取附近地点
curl "http://localhost:3333/map/nearby?lat=37.7749&lng=-122.4194&radius=1000"

# 获取路线
curl -X POST http://localhost:3333/map/route \
  -H "Content-Type: application/json" \
  -d '{"origin":{"lat":37.7749,"lng":-122.4194},"destinationId":"place-1"}'
```

## 架构说明

```
┌─────────────────────────────────────────────┐
│         apps/mobile (React Native)          │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Components (MapModal, etc.)         │  │
│  └────────────────┬─────────────────────┘  │
│                   │                         │
│  ┌────────────────▼─────────────────────┐  │
│  │  Hooks (useMapIntegration)           │  │
│  └────────────────┬─────────────────────┘  │
│                   │                         │
│  ┌────────────────▼─────────────────────┐  │
│  │  Services (mapService)               │  │
│  └────────────────┬─────────────────────┘  │
└───────────────────┼─────────────────────────┘
                    │
                    │ HTTP
                    │
┌───────────────────▼─────────────────────────┐
│         services/api (Fastify)              │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Routes (/map/*)                     │  │
│  └────────────────┬─────────────────────┘  │
│                   │                         │
│  ┌────────────────▼─────────────────────┐  │
│  │  services/map                        │  │
│  │  - LocationService                   │  │
│  │  - RoutingService                    │  │
│  │  - PlacesRepository                  │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 注意事项

1. **Mock数据**: 当前实现使用mock location provider和in-memory places repository。生产环境需要替换为真实实现。

2. **认证**: API路由目前没有认证。实际部署需要添加Firebase Auth集成。

3. **地图SDK许可**: 使用Apple Maps和Google Maps需要相应的API密钥和许可。

4. **性能优化**: 
   - 考虑添加地点数据缓存
   - 实现路线请求的debounce
   - 优化地图渲染性能

## 下一步

1. 完成MapModal组件的API集成
2. 集成设备定位功能
3. 集成地图SDK显示
4. 添加用户测试和反馈收集

如有问题，请参考各个包的README或联系开发团队。



