# iOS 模拟器位置设置指南

## 问题描述
iOS 模拟器的默认位置是旧金山 (37.785834, -122.406417)，导致无法找到纽约的 mock 地点数据。

## 解决方案

### 方法 1：通过菜单设置自定义位置

1. 打开 iOS 模拟器
2. 在菜单栏选择：**Features** → **Location** → **Custom Location...**
3. 输入纽约长岛坐标：
   - **Latitude**: `40.7829`
   - **Longitude**: `-73.9654`
4. 点击 OK

### 方法 2：通过菜单选择预设城市

在菜单栏选择：**Features** → **Location** → **City Bicycle Ride** (或其他接近纽约的选项)

### 方法 3：通过命令行设置（推荐用于自动化）

```bash
# 获取模拟器的 UDID
xcrun simctl list devices | grep Booted

# 设置位置到纽约长岛
xcrun simctl location <SIMULATOR_UDID> set 40.7829 -73.9654

# 或者直接设置到所有启动的模拟器
xcrun simctl location booted set 40.7829 -73.9654
```

### 方法 4：在 Xcode 中调试位置

1. 在 Xcode 中运行应用
2. 点击底部调试栏的位置图标
3. 选择 **Custom Location**
4. 输入纽约坐标：`40.7829, -73.9654`

## 验证位置设置

重新启动应用后，检查日志应该显示：

```
LOG  [MapService] Device location obtained: {"accuracy": 5, "lat": 40.7829, "lng": -73.9654}
LOG  [MapService] Found 10 nearby places
```

## 常见问题

### Q: 为什么改了位置还是显示旧金山？
A: 需要完全关闭应用并重新打开，或者在应用内触发新的位置请求。

### Q: 能否在代码中强制使用纽约位置？
A: 可以，但不推荐。开发环境应该测试真实的定位流程。如果确实需要，可以修改 `mapService.ts` 添加开发环境的位置覆盖。

## 未来改进

考虑添加开发环境的位置切换功能，允许在应用内快速切换测试位置。



