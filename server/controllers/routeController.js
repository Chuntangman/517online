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
