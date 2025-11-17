# Location Testing Guide

## 快速测试方法

### 1. 浏览器独立测试（最简单）

直接在浏览器中打开测试页面：

\`\`\`
file:///Users/ming/Documents/take-a-break/scripts/test-browser-location.html
\`\`\`

或者双击文件：`scripts/test-browser-location.html`

这个页面会：
- ✅ 自动请求你的位置
- ✅ 显示 "Getting location..." 状态
- ✅ 显示获取的真实坐标
- ✅ 在地图上显示你的位置
- ✅ 运行自动化测试

### 2. Web应用测试（真实环境）

\`\`\`bash
cd apps/web
pnpm dev
\`\`\`

然后访问 http://localhost:5173，点击 Explore 页面。

观察 "Location status" 区域的状态变化。

### 3. 单元测试

\`\`\`bash
cd packages/map
pnpm test location-service.test.ts
\`\`\`

## 测试文档

- \`LOCATION_TEST_SUMMARY.md\` - 测试摘要（快速阅读）
- \`LOCATION_STATUS_TEST_REPORT.md\` - 完整测试报告（详细信息）

## 预期结果

### 成功场景
1. 状态: "Initializing..." → "Getting location..." → "Live location active"
2. 地图居中到你的真实位置
3. 显示附近的真实地点

### 失败场景（也正常）
1. 拒绝权限 → "Using demo location (Times Square, NYC)"
2. 超时 → "Using demo location"
3. 不可用 → "Using demo location"

## 检查清单

- [ ] 看到 "Getting location..." 状态
- [ ] 浏览器显示权限请求
- [ ] 允许权限后变为 "Live location active"
- [ ] 地图显示真实位置
- [ ] 控制台显示真实坐标
- [ ] 可以点击 "Retry location" 重新获取

