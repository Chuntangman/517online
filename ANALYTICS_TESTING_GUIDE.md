# 精简用户分析系统测试指南

## 🎯 测试目的

验证用户操作能正确记录到数据库，数据结构符合可视化分析要求。

## 📊 数据库结构

### 4个专门的分析表

1. **route_navigation_records** - 路线导航记录
   - 起点/终点经纬度和名称（分离字段）
   - 路线距离（km）、时长（分钟）、途径点数量
   - 路线策略、搜索模式、智能采样开关

2. **popular_route_clicks** - 热门路线点击记录
   - 路线ID、名称、地区
   - 距离（km）、天数
   - 点击来源

3. **smart_route_matches** - 智能路线匹配记录
   - 偏好距离范围（最小/最大km）
   - 偏好天数范围、难度偏好
   - 风景偏好评分、匹配结果

4. **trajectory_playbacks** - 轨迹回放记录
   - 路线ID、名称、途径点数量
   - 回放来源（popular_routes/smart_match/custom）

## 🧪 测试方法

### 1. 测试路线导航记录

**操作步骤：**
1. 打开前端页面 `http://localhost:5173`
2. 进入地图页面
3. 使用CyclingNavigation组件规划路线：
   - 设置起点和终点
   - 选择路线策略（推荐/最快等）
   - 点击"开始导航"

**期望结果：**
- 浏览器控制台显示：`📊 记录导航路线规划: {...}`
- 浏览器控制台显示：`✅ 导航记录发送成功`
- 数据库`route_navigation_records`表新增记录

**验证API：**
```bash
curl http://localhost:3000/api/v1/analytics-simple/statistics/behavior
```

### 2. 测试热门路线点击记录

**操作步骤：**
1. 进入路线页面或相关页面
2. 点击任何热门路线卡片
3. 查看路线详情

**期望结果：**
- 浏览器控制台显示：`📊 记录热门路线点击: {...}`
- 浏览器控制台显示：`✅ 热门路线点击记录发送成功`
- 数据库`popular_route_clicks`表新增记录

**验证API：**
```bash
curl http://localhost:3000/api/v1/analytics-simple/statistics/popular-routes
```

### 3. 测试轨迹回放记录

**操作步骤：**
1. 选择任意路线
2. 点击"轨迹回放"按钮
3. 开始回放动画

**期望结果：**
- 浏览器控制台显示：`📊 记录轨迹回放: {...}`
- 数据库`trajectory_playbacks`表新增记录

### 4. 查看综合分析报告

**验证API：**
```bash
curl http://localhost:3000/api/v1/analytics-simple/report
```

**期望结果：**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_actions": 数量增加,
      "unique_sessions": 会话数,
      "report_period": {...}
    },
    "behavior_analytics": {
      "total_records": 总记录数,
      "statistics": {
        "route_navigation": [...],
        "popular_route_click": [...]
      }
    },
    "popular_routes": [...],
    "navigation_preferences": [...],
    "insights": {...}
  }
}
```

## 🔧 手动测试API

### 测试路线导航记录
```bash
$body = '{"session_id":"manual_test_nav","start_point":"116.4074,39.9042","end_point":"121.4737,31.2304","route_policy":"0","search_mode":"coordinates","distance":"1200km","duration":"8小时","smart_sampling_enabled":true}'
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/analytics-simple/route-navigation" -Method POST -Body $body -ContentType "application/json"
```

### 测试热门路线点击
```bash
$body = '{"session_id":"manual_test_click","route_id":"1","route_name":"测试路线","route_region":"北京","route_distance":"100km","route_duration":"2天","click_source":"popular_routes"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/analytics-simple/popular-route-click" -Method POST -Body $body -ContentType "application/json"
```

### 测试轨迹回放
```bash
$body = '{"session_id":"manual_test_playback","route_id":"1","route_name":"测试路线","waypoints_count":"5","playback_source":"popular_routes"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/analytics-simple/trajectory-playback" -Method POST -Body $body -ContentType "application/json"
```

## 📈 数据可视化验证

### 查看各种统计数据
1. **行为统计**：`GET /api/v1/analytics-simple/statistics/behavior`
2. **热门路线**：`GET /api/v1/analytics-simple/statistics/popular-routes`
3. **导航偏好**：`GET /api/v1/analytics-simple/statistics/navigation-preferences`
4. **综合报告**：`GET /api/v1/analytics-simple/report`

### 验证数据字段分离
确保返回的数据包含独立的字段，便于图表绘制：
- 距离值（数字类型，单位km）
- 时长值（数字类型，单位分钟/天）
- 坐标值（经纬度分离）
- 统计数据（点击次数、使用频率等）

## 🚨 故障排除

### 常见问题

1. **前端调用失败**
   - 检查浏览器控制台错误
   - 确认API端点可访问
   - 验证会话ID生成

2. **数据库记录失败**
   - 检查服务器日志
   - 确认数据库表已创建
   - 验证数据格式

3. **统计数据不正确**
   - 检查查询逻辑
   - 确认数据类型转换
   - 验证时间范围筛选

### 健康检查
```bash
curl http://localhost:3000/api/v1/analytics-simple/health
```

## ✅ 成功标准

1. **记录成功率 > 95%**：用户操作基本都能被记录
2. **数据完整性**：所有重要字段都有值
3. **实时性**：操作后立即能在统计中看到
4. **可视化友好**：数据格式适合图表展示
5. **性能良好**：不影响前端用户体验

---

🎉 **测试通过后，用户分析系统就可以为产品优化提供有价值的数据支持了！**
