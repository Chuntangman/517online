/**
 * 路线数据模型
 * 负责处理 routetable 表的数据库操作
 */

const { query } = require('../config/database');

class RouteModel {
  /**
   * 获取所有路线信息
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制返回数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.region - 地区筛选
   * @returns {Promise<Array>} 路线列表
   */
  static async getAllRoutes(options = {}) {
    const { limit, offset, region } = options;
    
    let sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
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
    sql += ' ORDER BY "id" ASC';
    
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
      console.error('获取路线列表失败:', error);
      throw new Error('获取路线信息失败');
    }
  }

  /**
   * 根据 ID 获取单个路线信息
   * @param {number} id - 路线 ID
   * @returns {Promise<Object|null>} 路线信息
   */
  static async getRouteById(id) {
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
      WHERE "id" = $1
    `;
    
    try {
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('获取路线详情失败:', error);
      throw new Error('获取路线详情失败');
    }
  }

  /**
   * 根据名称搜索路线
   * @param {string} searchTerm - 搜索关键词
   * @returns {Promise<Array>} 匹配的路线列表
   */
  static async searchRoutesByName(searchTerm) {
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
      WHERE "线路名称" ILIKE $1 OR "备注" ILIKE $1
      ORDER BY "id" ASC
    `;
    
    try {
      const searchPattern = `%${searchTerm}%`;
      const result = await query(sql, [searchPattern]);
      return result.rows;
    } catch (error) {
      console.error('搜索路线失败:', error);
      throw new Error('搜索路线失败');
    }
  }

  /**
   * 根据里程范围筛选路线
   * @param {Object} distanceRange - 里程范围
   * @param {number} distanceRange.min - 最小里程
   * @param {number} distanceRange.max - 最大里程
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesByDistance(distanceRange) {
    const { min, max } = distanceRange;
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
      WHERE "里程（km）" BETWEEN $1 AND $2
        AND "里程（km）" IS NOT NULL
      ORDER BY "里程（km）" ASC
    `;
    
    try {
      const result = await query(sql, [min, max]);
      return result.rows;
    } catch (error) {
      console.error('按里程筛选路线失败:', error);
      throw new Error('按里程筛选路线失败');
    }
  }

  /**
   * 根据预计天数范围筛选路线
   * @param {Object} daysRange - 天数范围
   * @param {number} daysRange.min - 最小天数
   * @param {number} daysRange.max - 最大天数
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesByDays(daysRange) {
    const { min, max } = daysRange;
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
      WHERE "预计天数" BETWEEN $1 AND $2
        AND "预计天数" IS NOT NULL
      ORDER BY "预计天数" ASC
    `;
    
    try {
      const result = await query(sql, [min, max]);
      return result.rows;
    } catch (error) {
      console.error('按天数筛选路线失败:', error);
      throw new Error('按天数筛选路线失败');
    }
  }

  /**
   * 根据路况筛选路线
   * @param {string} roadCondition - 路况条件
   * @returns {Promise<Array>} 符合条件的路线列表
   */
  static async getRoutesByRoadCondition(roadCondition) {
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
      WHERE "路况" ILIKE $1
      ORDER BY "id" ASC
    `;
    
    try {
      const searchPattern = `%${roadCondition}%`;
      const result = await query(sql, [searchPattern]);
      return result.rows;
    } catch (error) {
      console.error('按路况筛选路线失败:', error);
      throw new Error('按路况筛选路线失败');
    }
  }

  /**
   * 获取路线统计信息
   * @returns {Promise<Array>} 各地区路线统计
   */
  static async getRouteStatistics() {
    const sql = `
      SELECT 
        "地区" as region,
        COUNT(*) as total_count,
        AVG("里程（km）") as avg_distance,
        AVG("预计天数") as avg_days,
        MIN("里程（km）") as min_distance,
        MAX("里程（km）") as max_distance
      FROM "public"."routetable"
      WHERE "地区" IS NOT NULL
      GROUP BY "地区"
      ORDER BY total_count DESC
    `;
    
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      console.error('获取路线统计失败:', error);
      throw new Error('获取路线统计失败');
    }
  }

  /**
   * 根据途径地点ID筛选路线
   * @param {number} waypointId - 途径地点ID
   * @returns {Promise<Array>} 包含该地点的路线列表
   */
  static async getRoutesByWaypointId(waypointId) {
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
      WHERE $1 = ANY("途径地点id")
      ORDER BY "id" ASC
    `;
    
    try {
      const result = await query(sql, [waypointId]);
      return result.rows;
    } catch (error) {
      console.error('根据途径地点ID筛选路线失败:', error);
      throw new Error('根据途径地点ID筛选路线失败');
    }
  }

  /**
   * 根据多个途径地点ID筛选路线（包含所有指定地点的路线）
   * @param {Array<number>} waypointIds - 途径地点ID数组
   * @returns {Promise<Array>} 包含所有指定地点的路线列表
   */
  static async getRoutesByWaypointIds(waypointIds) {
    if (!Array.isArray(waypointIds) || waypointIds.length === 0) {
      throw new Error('途径地点ID数组不能为空');
    }
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
      WHERE "途径地点id" @> $1::int[]
      ORDER BY "id" ASC
    `;
    
    try {
      const result = await query(sql, [waypointIds]);
      return result.rows;
    } catch (error) {
      console.error('根据多个途径地点ID筛选路线失败:', error);
      throw new Error('根据多个途径地点ID筛选路线失败');
    }
  }

  /**
   * 根据途径地点ID筛选路线（包含任一指定地点的路线）
   * @param {Array<number>} waypointIds - 途径地点ID数组
   * @returns {Promise<Array>} 包含任一指定地点的路线列表
   */
  static async getRoutesByAnyWaypointIds(waypointIds) {
    if (!Array.isArray(waypointIds) || waypointIds.length === 0) {
      throw new Error('途径地点ID数组不能为空');
    }
    
    const sql = `
      SELECT 
        "id",
        "地区" as region,
        "线路名称" as name,
        "预计天数" as estimated_days,
        "里程（km）" as distance_km,
        "途径地点id" as waypoint_ids,
        "路况" as road_condition,
        "备注" as remarks,
        "注意事项" as precautions
      FROM "public"."routetable"
      WHERE "途径地点id" && $1::int[]
      ORDER BY "id" ASC
    `;
    
    try {
      const result = await query(sql, [waypointIds]);
      return result.rows;
    } catch (error) {
      console.error('根据任一途径地点ID筛选路线失败:', error);
      throw new Error('根据任一途径地点ID筛选路线失败');
    }
  }

  /**
   * 获取所有不重复的地区列表
   * @returns {Promise<Array>} 地区列表
   */
  static async getAllRegions() {
    const sql = `
      SELECT DISTINCT "地区" as region
      FROM "public"."routetable"
      WHERE "地区" IS NOT NULL AND "地区" != ''
      ORDER BY "地区" ASC
    `;
    
    try {
      const result = await query(sql);
      return result.rows.map(row => row.region);
    } catch (error) {
      console.error('获取地区列表失败:', error);
      throw new Error('获取地区列表失败');
    }
  }

  /**
   * 获取热门路线（根据被目标点引用次数）
   * @param {number} limit - 限制返回数量
   * @returns {Promise<Array>} 热门路线列表
   */
  static async getPopularRoutes(limit = 10) {
    const sql = `
      SELECT 
        r."id",
        r."地区" as region,
        r."线路名称" as name,
        r."预计天数" as estimated_days,
        r."里程（km）" as distance_km,
        r."途径地点id" as waypoint_ids,
        r."路况" as road_condition,
        r."备注" as remarks,
        r."注意事项" as precautions,
        COUNT(d."热门途径线路id") as reference_count
      FROM "public"."routetable" r
      LEFT JOIN "public"."Destination" d ON r."id" = d."热门途径线路id"
      GROUP BY r."id", r."地区", r."线路名称", r."预计天数", r."里程（km）", 
               r."途径地点id", r."路况", r."备注", r."注意事项"
      ORDER BY reference_count DESC, r."id" ASC
      LIMIT $1
    `;
    
    try {
      const result = await query(sql, [limit]);
      return result.rows;
    } catch (error) {
      console.error('获取热门路线失败:', error);
      throw new Error('获取热门路线失败');
    }
  }
}

module.exports = RouteModel;
