

# Map 服务说明

负责能力：定位用户、发现附近地点、提供前往目标地点的导航信息。供移动端和未来 Web 共用。

## 1. 功能范围（What）

1. 用户定位
   - 获取用户当前经纬度
   - 支持高精度模式与节电模式
   - 处理定位失败场景（权限拒绝、系统关闭定位、超时）

2. 附近地点推荐（Nearby）
   - 基于当前位置检索附近地点
   - 支持的地点类型示例：
     - 咖啡店
     - 公园和绿地
     - 书店
     - 轻餐饮
   - 支持按距离排序
   - 预留按类型、评分、营业中状态过滤能力

3. 导航与路线（Routing）
   - 提供从用户当前位置到指定地点的：
     - 步行路线
     - 预估距离
     - 预估时间
   - 返回路线几何点集，供客户端在地图上绘制
   - 不直接在服务端做完整导航界面，只返回导航数据

4. 统一对外约束
   - 接口稳定、幂等
   - 所有坐标使用 WGS84，经纬度小数点后 5 到 6 位
   - 所有时间单位明确标注（秒或分钟）
   - 对外不透出底层地图供应商实现细节

## 2. 对前端开放的 API（Contract）

所有接口均由 `packages/map` 提供，经 `packages/api-client` 封装。

### 2.1 获取附近地点

`GET /map/nearby`

请求参数：

- `lat`：number，用户当前位置纬度
- `lng`：number，用户当前位置经度
- `radius`：number，可选，单位米，默认 1000
- `types`：string，可选，地点类型，逗号分隔，如 `coffee,park`
- `limit`：number，可选，默认 20，最大 50

响应示例（逻辑结构）：

```ts
type NearbyPlace = {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  distanceMeters: number
  types: string[]
  rating?: number
  isOpenNow?: boolean
};

type NearbyResponse = {
  places: NearbyPlace[]
};
