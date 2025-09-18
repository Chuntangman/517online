/**
 * 路线控制器
 * 处理路线相关的 HTTP 请求和响应
 */

const { validationResult } = require('express-validator');
const RouteModel = require('../models/routeModel');

class RouteController {
  /**
   * 获取所有路线
   * GET /api/v1/routes
   */
  static async getAllRoutes(req, res) {
    try {
      // 获取查询参数
      const { limit, offset, region } = req.query;
      
      // 参数验证
      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);
      if (region) options.region = region;
      
      // 获取数据
      const routes = await RouteModel.getAllRoutes(options);
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '获取路线列表成功',
        data: routes,
        pagination: {
          limit: options.limit || null,
          offset: options.offset || 0,
          count: routes.length
        }
      });
      
    } catch (error) {
      console.error('获取路线列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据 ID 获取路线详情
   * GET /api/v1/routes/:id
   */
  static async getRouteById(req, res) {
    try {
      // 参数验证
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      
      // 获取路线信息
      const route = await RouteModel.getRouteById(parseInt(id));
      
      if (!route) {
        return res.status(404).json({
          success: false,
          message: '路线不存在'
        });
      }
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '获取路线详情成功',
        data: route
      });
      
    } catch (error) {
      console.error('获取路线详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 搜索路线
   * GET /api/v1/routes/search?q=keyword
   */
  static async searchRoutes(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词至少需要2个字符'
        });
      }
      
      // 执行搜索
      const routes = await RouteModel.searchRoutesByName(searchTerm.trim());
      
      // 返回搜索结果
      res.status(200).json({
        success: true,
        message: '搜索完成',
        data: routes,
        searchTerm: searchTerm.trim(),
        count: routes.length
      });
      
    } catch (error) {
      console.error('搜索路线失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据里程范围筛选路线
   * GET /api/v1/routes/distance?min=100&max=500
   */
  static async getRoutesByDistance(req, res) {
    try {
      const { min, max } = req.query;
      
      // 参数验证
      if (!min || !max) {
        return res.status(400).json({
          success: false,
          message: '缺少必要的里程范围参数 (min, max)'
        });
      }
      
      const minDistance = parseInt(min);
      const maxDistance = parseInt(max);
      
      if (minDistance < 0 || maxDistance < 0 || minDistance >= maxDistance) {
        return res.status(400).json({
          success: false,
          message: '无效的里程范围'
        });
      }
      
      // 获取符合条件的路线
      const routes = await RouteModel.getRoutesByDistance({ min: minDistance, max: maxDistance });
      
      res.status(200).json({
        success: true,
        message: '按里程筛选成功',
        data: routes,
        distanceRange: { min: minDistance, max: maxDistance },
        count: routes.length
      });
      
    } catch (error) {
      console.error('按里程筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据预计天数范围筛选路线
   * GET /api/v1/routes/days?min=1&max=7
   */
  static async getRoutesByDays(req, res) {
    try {
      const { min, max } = req.query;
      
      // 参数验证
      if (!min || !max) {
        return res.status(400).json({
          success: false,
          message: '缺少必要的天数范围参数 (min, max)'
        });
      }
      
      const minDays = parseFloat(min);
      const maxDays = parseFloat(max);
      
      if (minDays < 0 || maxDays < 0 || minDays >= maxDays) {
        return res.status(400).json({
          success: false,
          message: '无效的天数范围'
        });
      }
      
      // 获取符合条件的路线
      const routes = await RouteModel.getRoutesByDays({ min: minDays, max: maxDays });
      
      res.status(200).json({
        success: true,
        message: '按天数筛选成功',
        data: routes,
        daysRange: { min: minDays, max: maxDays },
        count: routes.length
      });
      
    } catch (error) {
      console.error('按天数筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据路况筛选路线
   * GET /api/v1/routes/condition?q=良好
   */
  static async getRoutesByRoadCondition(req, res) {
    try {
      const { q: roadCondition } = req.query;
      
      if (!roadCondition || roadCondition.trim().length < 1) {
        return res.status(400).json({
          success: false,
          message: '路况条件不能为空'
        });
      }
      
      // 获取符合条件的路线
      const routes = await RouteModel.getRoutesByRoadCondition(roadCondition.trim());
      
      res.status(200).json({
        success: true,
        message: '按路况筛选成功',
        data: routes,
        roadCondition: roadCondition.trim(),
        count: routes.length
      });
      
    } catch (error) {
      console.error('按路况筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取路线统计信息
   * GET /api/v1/routes/statistics
   */
  static async getRouteStatistics(req, res) {
    try {
      const statistics = await RouteModel.getRouteStatistics();
      
      res.status(200).json({
        success: true,
        message: '获取统计信息成功',
        data: statistics
      });
      
    } catch (error) {
      console.error('获取路线统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计信息失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据途径地点ID筛选路线
   * GET /api/v1/routes/waypoint/:waypointId
   */
  static async getRoutesByWaypointId(req, res) {
    try {
      // 参数验证
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }
      
      const { waypointId } = req.params;
      
      // 获取包含该地点的路线
      const routes = await RouteModel.getRoutesByWaypointId(parseInt(waypointId));
      
      res.status(200).json({
        success: true,
        message: '根据途径地点筛选成功',
        data: routes,
        waypointId: parseInt(waypointId),
        count: routes.length
      });
      
    } catch (error) {
      console.error('根据途径地点ID筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据多个途径地点ID筛选路线（包含所有指定地点）
   * GET /api/v1/routes/waypoints/all?ids=1,2,3
   */
  static async getRoutesByWaypointIds(req, res) {
    try {
      const { ids } = req.query;
      
      if (!ids) {
        return res.status(400).json({
          success: false,
          message: '缺少途径地点ID参数'
        });
      }
      
      // 解析ID数组
      let waypointIds;
      try {
        waypointIds = ids.split(',').map(id => parseInt(id.trim()));
        if (waypointIds.some(id => isNaN(id))) {
          throw new Error('无效的ID格式');
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'ID格式错误，应为逗号分隔的数字'
        });
      }
      
      // 获取包含所有指定地点的路线
      const routes = await RouteModel.getRoutesByWaypointIds(waypointIds);
      
      res.status(200).json({
        success: true,
        message: '根据多个途径地点筛选成功（包含所有地点）',
        data: routes,
        waypointIds: waypointIds,
        count: routes.length
      });
      
    } catch (error) {
      console.error('根据多个途径地点ID筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据途径地点ID筛选路线（包含任一指定地点）
   * GET /api/v1/routes/waypoints/any?ids=1,2,3
   */
  static async getRoutesByAnyWaypointIds(req, res) {
    try {
      const { ids } = req.query;
      
      if (!ids) {
        return res.status(400).json({
          success: false,
          message: '缺少途径地点ID参数'
        });
      }
      
      // 解析ID数组
      let waypointIds;
      try {
        waypointIds = ids.split(',').map(id => parseInt(id.trim()));
        if (waypointIds.some(id => isNaN(id))) {
          throw new Error('无效的ID格式');
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'ID格式错误，应为逗号分隔的数字'
        });
      }
      
      // 获取包含任一指定地点的路线
      const routes = await RouteModel.getRoutesByAnyWaypointIds(waypointIds);
      
      res.status(200).json({
        success: true,
        message: '根据多个途径地点筛选成功（包含任一地点）',
        data: routes,
        waypointIds: waypointIds,
        count: routes.length
      });
      
    } catch (error) {
      console.error('根据任一途径地点ID筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取所有地区列表
   * GET /api/v1/routes/regions
   */
  static async getAllRegions(req, res) {
    try {
      // 获取所有地区
      const regions = await RouteModel.getAllRegions();
      
      res.status(200).json({
        success: true,
        message: '获取地区列表成功',
        data: regions,
        count: regions.length
      });
      
    } catch (error) {
      console.error('获取地区列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取地区列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取热门路线
   * GET /api/v1/routes/popular?limit=10
   */
  static async getPopularRoutes(req, res) {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit) : 10;
      
      if (limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'limit 必须是 1-100 之间的整数'
        });
      }
      
      // 获取热门路线
      const routes = await RouteModel.getPopularRoutes(limitNum);
      
      res.status(200).json({
        success: true,
        message: '获取热门路线成功',
        data: routes,
        limit: limitNum,
        count: routes.length
      });
      
    } catch (error) {
      console.error('获取热门路线失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门路线失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据风景评分范围筛选路线
   * GET /api/v1/routes/scenery-score?min=1&max=10
   */
  static async getRoutesBySceneryScore(req, res) {
    try {
      const { min, max } = req.query;
      
      // 参数验证
      if (!min || !max) {
        return res.status(400).json({
          success: false,
          message: '缺少必要的风景评分范围参数 (min, max)'
        });
      }
      
      const minScore = parseInt(min);
      const maxScore = parseInt(max);
      
      if (minScore < 1 || maxScore > 10 || minScore > maxScore) {
        return res.status(400).json({
          success: false,
          message: '风景评分范围必须在1-10之间，且最小值不能大于最大值'
        });
      }
      
      // 获取符合条件的路线
      const routes = await RouteModel.getRoutesBySceneryScore({ min: minScore, max: maxScore });
      
      res.status(200).json({
        success: true,
        message: '按风景评分筛选成功',
        data: routes,
        sceneryScoreRange: { min: minScore, max: maxScore },
        count: routes.length
      });
      
    } catch (error) {
      console.error('按风景评分筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据路况难度评分范围筛选路线
   * GET /api/v1/routes/difficulty-score?min=1&max=10
   */
  static async getRoutesByDifficultyScore(req, res) {
    try {
      const { min, max } = req.query;
      
      // 参数验证
      if (!min || !max) {
        return res.status(400).json({
          success: false,
          message: '缺少必要的路况难度评分范围参数 (min, max)'
        });
      }
      
      const minScore = parseInt(min);
      const maxScore = parseInt(max);
      
      if (minScore < 1 || maxScore > 10 || minScore > maxScore) {
        return res.status(400).json({
          success: false,
          message: '路况难度评分范围必须在1-10之间，且最小值不能大于最大值'
        });
      }
      
      // 获取符合条件的路线
      const routes = await RouteModel.getRoutesByDifficultyScore({ min: minScore, max: maxScore });
      
      res.status(200).json({
        success: true,
        message: '按路况难度评分筛选成功',
        data: routes,
        difficultyScoreRange: { min: minScore, max: maxScore },
        count: routes.length
      });
      
    } catch (error) {
      console.error('按路况难度评分筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据多个条件筛选路线（包含评分条件）
   * GET /api/v1/routes/filters?region=北京&minDistance=100&maxDistance=500&minDays=1&maxDays=7&minSceneryScore=5&maxSceneryScore=10&minDifficultyScore=1&maxDifficultyScore=5
   */
  static async getRoutesByMultipleFilters(req, res) {
    try {
      const { 
        region, 
        minDistance, maxDistance, 
        minDays, maxDays,
        minSceneryScore, maxSceneryScore,
        minDifficultyScore, maxDifficultyScore,
        limit, offset 
      } = req.query;
      
      // 构建筛选条件
      const filters = {};
      
      if (region) {
        filters.region = region;
      }
      
      if (minDistance && maxDistance) {
        const minDist = parseInt(minDistance);
        const maxDist = parseInt(maxDistance);
        if (minDist >= 0 && maxDist >= 0 && minDist <= maxDist) {
          filters.distanceRange = { min: minDist, max: maxDist };
        }
      }
      
      if (minDays && maxDays) {
        const minD = parseFloat(minDays);
        const maxD = parseFloat(maxDays);
        if (minD >= 0 && maxD >= 0 && minD <= maxD) {
          filters.daysRange = { min: minD, max: maxD };
        }
      }
      
      if (minSceneryScore && maxSceneryScore) {
        const minS = parseInt(minSceneryScore);
        const maxS = parseInt(maxSceneryScore);
        if (minS >= 1 && maxS <= 10 && minS <= maxS) {
          filters.sceneryScoreRange = { min: minS, max: maxS };
        }
      }
      
      if (minDifficultyScore && maxDifficultyScore) {
        const minD = parseInt(minDifficultyScore);
        const maxD = parseInt(maxDifficultyScore);
        if (minD >= 1 && maxD <= 10 && minD <= maxD) {
          filters.difficultyScoreRange = { min: minD, max: maxD };
        }
      }
      
      if (limit) {
        const limitNum = parseInt(limit);
        if (limitNum > 0 && limitNum <= 100) {
          filters.limit = limitNum;
        }
      }
      
      if (offset) {
        const offsetNum = parseInt(offset);
        if (offsetNum >= 0) {
          filters.offset = offsetNum;
        }
      }
      
      // 获取符合条件的路线
      const routes = await RouteModel.getRoutesByMultipleFilters(filters);
      
      res.status(200).json({
        success: true,
        message: '多条件筛选成功',
        data: routes,
        filters: filters,
        count: routes.length
      });
      
    } catch (error) {
      console.error('多条件筛选路线失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 智能匹配路线
   * POST /api/v1/routes/smart-match
   */
  static async getSmartMatchedRoutes(req, res) {
    try {
      const { 
        difficulty, 
        sceneryPriority, 
        cyclingType, 
        days, 
        weatherScore,
        limit 
      } = req.body;

      // 参数验证
      if (difficulty !== undefined && (difficulty < 1 || difficulty > 10)) {
        return res.status(400).json({
          success: false,
          message: '难易度参数必须在1-10之间'
        });
      }

      if (sceneryPriority !== undefined && (sceneryPriority < 1 || sceneryPriority > 10)) {
        return res.status(400).json({
          success: false,
          message: '风景优先级参数必须在1-10之间'
        });
      }

      if (cyclingType && !['休闲', '自由', '挑战'].includes(cyclingType)) {
        return res.status(400).json({
          success: false,
          message: '骑行类型必须是：休闲、自由、挑战之一'
        });
      }

      if (days !== undefined && (days < 1 || days > 15)) {
        return res.status(400).json({
          success: false,
          message: '骑行天数必须在1-15之间'
        });
      }

      if (weatherScore !== undefined && (weatherScore < 3 || weatherScore > 9)) {
        return res.status(400).json({
          success: false,
          message: '天气评分必须在3-9之间'
        });
      }

      // 调用模型方法进行智能匹配
      const matchedRoutes = await RouteModel.getSmartMatchedRoutes({
        difficulty,
        sceneryPriority,
        cyclingType,
        days,
        weatherScore,
        limit: limit || 10
      });

      // 返回匹配结果
      res.status(200).json({
        success: true,
        message: '智能匹配成功',
        data: {
          routes: matchedRoutes,
          matchParams: {
            difficulty: difficulty || 5,
            sceneryPriority: sceneryPriority || 5,
            cyclingType: cyclingType || '自由',
            days: days || 3,
            weatherScore: weatherScore || 6
          }
        },
        count: matchedRoutes.length
      });

    } catch (error) {
      console.error('智能匹配路线失败:', error);
      res.status(500).json({
        success: false,
        message: '智能匹配失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取路线的途径点详情
   * GET /api/v1/routes/:id/waypoints
   */
  static async getRouteWaypoints(req, res) {
    try {
      // 参数验证
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      
      // 获取路线信息
      const route = await RouteModel.getRouteById(parseInt(id));
      
      if (!route) {
        return res.status(404).json({
          success: false,
          message: '路线不存在'
        });
      }
      
      // 获取途径点详情
      const waypoints = await RouteModel.getRouteWaypointsDetails(parseInt(id));
      
      res.status(200).json({
        success: true,
        message: '获取路线途径点成功',
        data: {
          route: route,
          waypoints: waypoints
        }
      });
      
    } catch (error) {
      console.error('获取路线途径点失败:', error);
      res.status(500).json({
        success: false,
        message: '获取路线途径点失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = RouteController;
