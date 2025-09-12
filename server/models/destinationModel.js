/**
 * 目标点数据模型
 * 负责处理 Destination 表的数据库操作
 */

const { query } = require('../config/database');

class DestinationModel {
  /**
   * 获取所有目标点信息
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制返回数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.region - 地区筛选
   * @returns {Promise<Array>} 目标点列表
   */
  static async getAllDestinations(options = {}) {
    const { limit, offset, region } = options;
    
    let sql = `
      SELECT 
        "ID" as id,
        "目标点名称" as name,
        "地区" as region,
        "longitude",
        "latitude",
        "介绍" as description,
        "最近驿站名称" as nearest_waystation_name,
        "最近驿站距离（km）" as nearest_waystation_distance,
        "热门途径线路id" as popular_route_id,
        "热门途径线路名称" as popular_route_name
      FROM "public"."Destination"
    `;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    // 地区筛选
    if (region) {
      conditions.push(`"地区" = $${paramIndex}`);
      params.push(region);
      paramIndex++;
    }
    
    // 添加条件
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // 排序
    sql += ' ORDER BY "ID" ASC';
    
    // 分页
    if (limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }
    
    if (offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }
    
    try {
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('获取目标点列表失败:', error);
      throw new Error('获取目标点信息失败');
    }
  }

  /**
   * 根据 ID 获取单个目标点信息
   * @param {number} id - 目标点 ID
   * @returns {Promise<Object|null>} 目标点信息
   */
  static async getDestinationById(id) {
    const sql = `
      SELECT 
        "ID" as id,
        "目标点名称" as name,
        "地区" as region,
        "longitude",
        "latitude",
        "介绍" as description,
        "最近驿站名称" as nearest_waystation_name,
        "最近驿站距离（km）" as nearest_waystation_distance,
        "热门途径线路id" as popular_route_id,
        "热门途径线路名称" as popular_route_name
      FROM "public"."Destination"
      WHERE "ID" = $1
    `;
    
    try {
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('获取目标点详情失败:', error);
      throw new Error('获取目标点详情失败');
    }
  }

  /**
   * 根据名称搜索目标点
   * @param {string} searchTerm - 搜索关键词
   * @returns {Promise<Array>} 匹配的目标点列表
   */
  static async searchDestinationsByName(searchTerm) {
    const sql = `
      SELECT 
        "ID" as id,
        "目标点名称" as name,
        "地区" as region,
        "longitude",
        "latitude",
        "介绍" as description,
        "最近驿站名称" as nearest_waystation_name,
        "最近驿站距离（km）" as nearest_waystation_distance,
        "热门途径线路id" as popular_route_id,
        "热门途径线路名称" as popular_route_name
      FROM "public"."Destination"
      WHERE "目标点名称" ILIKE $1 OR "介绍" ILIKE $1
      ORDER BY "ID" ASC
    `;
    
    try {
      const searchPattern = `%${searchTerm}%`;
      const result = await query(sql, [searchPattern]);
      return result.rows;
    } catch (error) {
      console.error('搜索目标点失败:', error);
      throw new Error('搜索目标点失败');
    }
  }

  /**
   * 根据经纬度范围获取目标点（用于地图显示）
   * @param {Object} bounds - 经纬度边界
   * @param {number} bounds.minLat - 最小纬度
   * @param {number} bounds.maxLat - 最大纬度
   * @param {number} bounds.minLng - 最小经度
   * @param {number} bounds.maxLng - 最大经度
   * @returns {Promise<Array>} 指定区域内的目标点
   */
  static async getDestinationsInBounds(bounds) {
    const { minLat, maxLat, minLng, maxLng } = bounds;
    
    const sql = `
      SELECT 
        "ID" as id,
        "目标点名称" as name,
        "地区" as region,
        "longitude",
        "latitude",
        "介绍" as description,
        "最近驿站名称" as nearest_waystation_name,
        "最近驿站距离（km）" as nearest_waystation_distance,
        "热门途径线路id" as popular_route_id,
        "热门途径线路名称" as popular_route_name
      FROM "public"."Destination"
      WHERE "latitude" BETWEEN $1 AND $2
        AND "longitude" BETWEEN $3 AND $4
        AND "latitude" IS NOT NULL 
        AND "longitude" IS NOT NULL
      ORDER BY "ID" ASC
    `;
    
    try {
      const result = await query(sql, [minLat, maxLat, minLng, maxLng]);
      return result.rows;
    } catch (error) {
      console.error('获取指定区域目标点失败:', error);
      throw new Error('获取指定区域目标点失败');
    }
  }

  /**
   * 获取目标点统计信息
   * @returns {Promise<Array>} 各地区目标点统计
   */
  static async getDestinationStatistics() {
    const sql = `
      SELECT 
        "地区" as region,
        COUNT(*) as total_count,
        COUNT("热门途径线路id") as with_route_count,
        AVG("最近驿站距离（km）") as avg_waystation_distance
      FROM "public"."Destination"
      WHERE "地区" IS NOT NULL
      GROUP BY "地区"
      ORDER BY total_count DESC
    `;
    
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('获取目标点统计失败:', error);
      throw new Error('获取目标点统计失败');
    }
  }

  /**
   * 根据热门线路ID获取目标点
   * @param {number} routeId - 线路ID
   * @returns {Promise<Array>} 该线路的目标点列表
   */
  static async getDestinationsByRouteId(routeId) {
    const sql = `
      SELECT 
        "ID" as id,
        "目标点名称" as name,
        "地区" as region,
        "longitude",
        "latitude",
        "介绍" as description,
        "最近驿站名称" as nearest_waystation_name,
        "最近驿站距离（km）" as nearest_waystation_distance,
        "热门途径线路id" as popular_route_id,
        "热门途径线路名称" as popular_route_name
      FROM "public"."Destination"
      WHERE "热门途径线路id" = $1
      ORDER BY "ID" ASC
    `;
    
    try {
      const result = await query(sql, [routeId]);
      return result.rows;
    } catch (error) {
      console.error('根据线路ID获取目标点失败:', error);
      throw new Error('根据线路ID获取目标点失败');
    }
  }
}

module.exports = DestinationModel;
