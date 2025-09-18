# 路线API数据库模型更新说明

## 更新概述
根据新的数据库表结构，更新了服务器端的路线API模型，添加了两个新的评分字段：
- `途径风景打分` (scenery_score) - 风景评分，1-10分，1最低10最高
- `路况打分` (road_difficulty_score) - 路况难度评分，1-10分，1最简单10最难

## 更新的文件

### 1. `models/routeModel.js`
- ✅ 在所有SELECT查询中添加了新的评分字段
- ✅ 新增 `getRoutesBySceneryScore()` 方法 - 根据风景评分筛选路线
- ✅ 新增 `getRoutesByDifficultyScore()` 方法 - 根据路况难度评分筛选路线
- ✅ 新增 `getRoutesByMultipleFilters()` 方法 - 支持多条件筛选（包含评分条件）

### 2. `controllers/routeController.js`
- ✅ 新增 `getRoutesBySceneryScore()` 控制器方法
- ✅ 新增 `getRoutesByDifficultyScore()` 控制器方法
- ✅ 新增 `getRoutesByMultipleFilters()` 控制器方法

### 3. `routes/routeRoutes.js`
- ✅ 新增 `/scenery-score` 路由 - 根据风景评分筛选
- ✅ 新增 `/difficulty-score` 路由 - 根据路况难度评分筛选
- ✅ 新增 `/filters` 路由 - 多条件筛选

## 新增的API端点

### 1. 根据风景评分筛选路线
```
GET /api/v1/routes/scenery-score?min=5&max=10
```
- 参数：min (1-10), max (1-10)
- 返回：按风景评分筛选的路线列表

### 2. 根据路况难度评分筛选路线
```
GET /api/v1/routes/difficulty-score?min=1&max=5
```
- 参数：min (1-10), max (1-10)
- 返回：按路况难度评分筛选的路线列表

### 3. 多条件筛选路线
```
GET /api/v1/routes/filters?region=北京&minSceneryScore=7&maxSceneryScore=10&minDifficultyScore=1&maxDifficultyScore=3
```
- 支持的参数：
  - region - 地区
  - minDistance/maxDistance - 里程范围
  - minDays/maxDays - 天数范围
  - minSceneryScore/maxSceneryScore - 风景评分范围
  - minDifficultyScore/maxDifficultyScore - 路况难度评分范围
  - limit/offset - 分页参数

## 数据库表结构匹配
- ✅ 所有查询都已更新以包含新的评分字段
- ✅ 字段映射：
  - `途径风景打分` → `scenery_score`
  - `路况打分` → `road_difficulty_score`

## 验证状态
- ✅ 代码语法检查通过
- ✅ 数据库连接配置正确
- ✅ API路由配置完整
- ✅ 参数验证已添加

## 注意事项
- 前端调用字段和内容暂未更新（按要求）
- 新的评分字段在所有相关查询中都已包含
- 评分范围限制为1-10，符合数据库注释要求
- 多条件筛选按风景评分降序、路况难度评分升序排列

## 测试建议
1. 测试新的评分筛选端点
2. 验证多条件筛选功能
3. 确认所有现有API端点仍正常工作
4. 检查返回数据包含新的评分字段
