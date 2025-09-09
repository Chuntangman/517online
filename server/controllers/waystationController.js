/**
 * 驿站控制器
 * 处理驿站相关的 HTTP 请求和响应
 */

const { validationResult } = require('express-validator');
const WaystationModel = require('../models/waystationModel');

class WaystationController {
  /**
   * 获取所有驿站
   * GET /api/v1/waystations
   */
  static async getAllWaystations(req, res) {
    try {
      // 获取查询参数
      const { limit, offset, region } = req.query;
      
      // 参数验证
      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);
      if (region) options.region = region;
      
      // 获取数据
      const waystations = await WaystationModel.getAllWaystations(options);
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '获取驿站列表成功',
        data: waystations,
        pagination: {
          limit: options.limit || null,
          offset: options.offset || 0,
          count: waystations.length
        }
      });
      
    } catch (error) {
      console.error('获取驿站列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据 ID 获取驿站详情
   * GET /api/v1/waystations/:id
   */
  static async getWaystationById(req, res) {
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
      
      // 获取驿站信息
      const waystation = await WaystationModel.getWaystationById(parseInt(id));
      
      if (!waystation) {
        return res.status(404).json({
          success: false,
          message: '驿站不存在'
        });
      }
      
      // 返回成功响应
      res.status(200).json({
        success: true,
        message: '获取驿站详情成功',
        data: waystation
      });
      
    } catch (error) {
      console.error('获取驿站详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 搜索驿站
   * GET /api/v1/waystations/search?q=keyword
   */
  static async searchWaystations(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词至少需要2个字符'
        });
      }
      
      // 执行搜索
      const waystations = await WaystationModel.searchWaystationsByName(searchTerm.trim());
      
      // 返回搜索结果
      res.status(200).json({
        success: true,
        message: '搜索完成',
        data: waystations,
        searchTerm: searchTerm.trim(),
        count: waystations.length
      });
      
    } catch (error) {
      console.error('搜索驿站失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据服务类型筛选驿站
   * GET /api/v1/waystations/services?accommodation=1&bike_rental=1
   */
  static async getWaystationsByServices(req, res) {
    try {
      const { accommodation, bike_rental, bike_return, maintenance } = req.query;
      
      // 构建服务筛选条件
      const services = {};
      if (accommodation === '1') services.accommodation = true;
      if (bike_rental === '1') services.bike_rental = true;
      if (bike_return === '1') services.bike_return = true;
      if (maintenance === '1') services.maintenance = true;
      
      // 检查是否至少选择了一种服务
      if (Object.keys(services).length === 0) {
        return res.status(400).json({
          success: false,
          message: '请至少选择一种服务类型'
        });
      }
      
      // 获取符合条件的驿站
      const waystations = await WaystationModel.getWaystationsByServices(services);
      
      // 返回结果
      res.status(200).json({
        success: true,
        message: '按服务筛选成功',
        data: waystations,
        filters: services,
        count: waystations.length
      });
      
    } catch (error) {
      console.error('按服务筛选驿站失败:', error);
      res.status(500).json({
        success: false,
        message: '筛选失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取驿站统计信息
   * GET /api/v1/waystations/statistics
   */
  static async getWaystationStatistics(req, res) {
    try {
      const statistics = await WaystationModel.getWaystationStatistics();
      
      res.status(200).json({
        success: true,
        message: '获取统计信息成功',
        data: statistics
      });
      
    } catch (error) {
      console.error('获取驿站统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计信息失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 根据地图边界获取驿站（用于地图显示）
   * GET /api/v1/waystations/bounds?minLat=39&maxLat=40&minLng=116&maxLng=117
   */
  static async getWaystationsInBounds(req, res) {
    try {
      const { minLat, maxLat, minLng, maxLng } = req.query;
      
      // 参数验证
      if (!minLat || !maxLat || !minLng || !maxLng) {
        return res.status(400).json({
          success: false,
          message: '缺少必要的边界参数 (minLat, maxLat, minLng, maxLng)'
        });
      }
      
      const bounds = {
        minLat: parseFloat(minLat),
        maxLat: parseFloat(maxLat),
        minLng: parseFloat(minLng),
        maxLng: parseFloat(maxLng)
      };
      
      // 验证经纬度范围
      if (bounds.minLat >= bounds.maxLat || bounds.minLng >= bounds.maxLng) {
        return res.status(400).json({
          success: false,
          message: '无效的边界范围'
        });
      }
      
      // 获取指定区域内的驿站
      const waystations = await WaystationModel.getWaystationsInBounds(bounds);
      
      res.status(200).json({
        success: true,
        message: '获取区域驿站成功',
        data: waystations,
        bounds: bounds,
        count: waystations.length
      });
      
    } catch (error) {
      console.error('获取区域驿站失败:', error);
      res.status(500).json({
        success: false,
        message: '获取区域驿站失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = WaystationController;
