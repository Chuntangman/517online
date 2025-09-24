/**
 * 改进的用户行为数据模型
 * 将数据分离到独立字段便于可视化分析
 */

const db = require('../config/database');

class UserBehaviorSimplifiedModel {
  /**
   * 记录导航路线规划行为
   */
  static async recordRouteNavigation(data) {
    const {
      session_id,
      start_point,
      end_point,
      waypoints,
      route_policy,
      search_mode,
      distance,
      duration,
      smart_sampling_enabled
    } = data;

    // 解析起点坐标或名称
    let start_point_lng = null, start_point_lat = null, start_point_name = null;
    if (typeof start_point === 'string' && start_point.includes(',')) {
      const coords = start_point.split(',');
      start_point_lng = parseFloat(coords[0]);
      start_point_lat = parseFloat(coords[1]);
    } else if (typeof start_point === 'string') {
      start_point_name = start_point;
    }

    // 解析终点坐标或名称
    let end_point_lng = null, end_point_lat = null, end_point_name = null;
    if (typeof end_point === 'string' && end_point.includes(',')) {
      const coords = end_point.split(',');
      end_point_lng = parseFloat(coords[0]);
      end_point_lat = parseFloat(coords[1]);
    } else if (typeof end_point === 'string') {
      end_point_name = end_point;
    }

    // 解析距离（提取数字）
    let route_distance_km = null;
    if (distance) {
      const distanceMatch = distance.toString().match(/[\d.]+/);
      if (distanceMatch) {
        route_distance_km = parseFloat(distanceMatch[0]);
        if (distance.includes('m') && !distance.includes('km')) {
          route_distance_km = route_distance_km / 1000; // 转换米为公里
        }
      }
    }

    // 解析时长（转换为分钟）
    let route_duration_minutes = null;
    if (duration) {
      const hourMatch = duration.toString().match(/(\d+)小时/);
      const minuteMatch = duration.toString().match(/(\d+)分钟/);
      let minutes = 0;
      if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
      if (minuteMatch) minutes += parseInt(minuteMatch[1]);
      if (minutes > 0) route_duration_minutes = minutes;
    }

    const query = `
      INSERT INTO route_navigation_records (
        session_id, start_point_lng, start_point_lat, start_point_name,
        end_point_lng, end_point_lat, end_point_name, waypoints_count,
        route_policy, search_mode, route_distance_km, route_duration_minutes,
        smart_sampling_enabled, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `;

    const values = [
      session_id,
      start_point_lng, start_point_lat, start_point_name,
      end_point_lng, end_point_lat, end_point_name,
      waypoints ? waypoints.length : 0,
      route_policy,
      search_mode,
      route_distance_km,
      route_duration_minutes,
      smart_sampling_enabled || false
    ];
    
    try {
      const result = await db.query(query, values);
      console.log('📊 记录导航路线规划:', {
        起点: start_point_name || `${start_point_lng},${start_point_lat}`,
        终点: end_point_name || `${end_point_lng},${end_point_lat}`,
        途径点: waypoints ? waypoints.length : 0,
        策略: route_policy,
        距离: route_distance_km + 'km',
        时长: route_duration_minutes + '分钟'
      });
      return result.rows[0];
    } catch (error) {
      console.error('记录导航路线规划失败:', error);
      throw error;
    }
  }

  /**
   * 记录热门路线点击行为
   */
  static async recordPopularRouteClick(data) {
    const {
      session_id,
      route_id,
      route_name,
      route_region,
      route_distance,
      route_duration,
      click_source = 'popular_routes'
    } = data;

    // 解析距离
    let route_distance_km = null;
    if (route_distance) {
      const distanceMatch = route_distance.toString().match(/[\d.]+/);
      if (distanceMatch) {
        route_distance_km = parseFloat(distanceMatch[0]);
      }
    }

    // 解析天数
    let route_duration_days = null;
    if (route_duration) {
      const daysMatch = route_duration.toString().match(/(\d+)/);
      if (daysMatch) {
        route_duration_days = parseInt(daysMatch[1]);
      }
    }

    const query = `
      INSERT INTO popular_route_clicks (
        session_id, route_id, route_name, route_region, 
        route_distance_km, route_duration_days, click_source, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const values = [
      session_id,
      parseInt(route_id),
      route_name,
      route_region,
      route_distance_km,
      route_duration_days,
      click_source
    ];
    
    try {
      const result = await db.query(query, values);
      console.log('📊 记录热门路线点击:', {
        路线: route_name,
        地区: route_region,
        距离: route_distance_km + 'km',
        天数: route_duration_days + '天'
      });
      return result.rows[0];
    } catch (error) {
      console.error('记录热门路线点击失败:', error);
      throw error;
    }
  }

  /**
   * 记录智能路线匹配使用
   */
  static async recordSmartRouteMatch(data) {
    const {
      session_id,
      preferred_distance_min,
      preferred_distance_max,
      preferred_days_min,
      preferred_days_max,
      preferred_difficulty,
      weather_preference,
      scenery_preference,
      matched_routes_count,
      selected_route_id,
      selected_route_name
    } = data;

    // 直接使用传入的字段，无需解析
    console.log('📊 后端接收到的智能匹配数据:', {
      session_id,
      preferred_distance_min,
      preferred_distance_max,
      preferred_days_min,
      preferred_days_max,
      preferred_difficulty,
      weather_preference,
      scenery_preference,
      matched_routes_count,
      selected_route_id,
      selected_route_name
    });

    const query = `
      INSERT INTO smart_route_matches (
        session_id, preferred_distance_min, preferred_distance_max,
        preferred_days_min, preferred_days_max, preferred_difficulty,
        weather_preference, scenery_preference, matched_routes_count,
        selected_route_id, selected_route_name, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const values = [
      session_id,
      preferred_distance_min,
      preferred_distance_max,
      preferred_days_min,
      preferred_days_max,
      preferred_difficulty,
      weather_preference,
      scenery_preference,
      matched_routes_count || 0,
      selected_route_id,
      selected_route_name
    ];
    
    try {
      const result = await db.query(query, values);
      console.log('📊 记录智能路线匹配:', {
        距离偏好: `${preferred_distance_min}-${preferred_distance_max}km`,
        天数偏好: `${preferred_days_min}-${preferred_days_max}天`,
        难度偏好: preferred_difficulty,
        匹配数量: matched_routes_count
      });
      return result.rows[0];
    } catch (error) {
      console.error('记录智能路线匹配失败:', error);
      throw error;
    }
  }

  /**
   * 记录轨迹回放使用
   */
  static async recordTrajectoryPlayback(data) {
    const {
      session_id,
      route_id,
      route_name,
      waypoints_count,
      playback_source = 'unknown'
    } = data;

    const query = `
      INSERT INTO trajectory_playbacks (
        session_id, route_id, route_name, waypoints_count, playback_source, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const values = [
      session_id,
      route_id ? parseInt(route_id) : null,
      route_name,
      waypoints_count || 0,
      playback_source
    ];
    
    try {
      const result = await db.query(query, values);
      console.log('📊 记录轨迹回放:', {
        路线: route_name,
        途径点: waypoints_count,
        来源: playback_source
      });
      return result.rows[0];
    } catch (error) {
      console.error('记录轨迹回放失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户行为统计
   */
  static async getStatistics(filters = {}) {
    const { start_date, end_date, action_type } = filters;
    
    try {
      const results = {};
      
      // 获取导航记录统计
      if (!action_type || action_type === 'route_navigation') {
        let whereClause = 'WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (start_date) {
          paramCount++;
          whereClause += ` AND created_at >= $${paramCount}`;
          values.push(start_date);
        }

        if (end_date) {
          paramCount++;
          whereClause += ` AND created_at <= $${paramCount}`;
          values.push(end_date);
        }

        const navQuery = `
          SELECT 
            'route_navigation' as action_type,
            COUNT(*) as count,
            COUNT(DISTINCT session_id) as unique_sessions,
            DATE(created_at) as date
          FROM route_navigation_records 
          ${whereClause}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `;
        
        const navResult = await db.query(navQuery, values);
        results.route_navigation = navResult.rows;
      }

      // 获取热门路线点击统计
      if (!action_type || action_type === 'popular_route_click') {
        let whereClause = 'WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (start_date) {
          paramCount++;
          whereClause += ` AND created_at >= $${paramCount}`;
          values.push(start_date);
        }

        if (end_date) {
          paramCount++;
          whereClause += ` AND created_at <= $${paramCount}`;
          values.push(end_date);
        }

        const clickQuery = `
          SELECT 
            'popular_route_click' as action_type,
            COUNT(*) as count,
            COUNT(DISTINCT session_id) as unique_sessions,
            DATE(created_at) as date
          FROM popular_route_clicks 
          ${whereClause}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `;
        
        const clickResult = await db.query(clickQuery, values);
        results.popular_route_click = clickResult.rows;
      }

      // 计算总记录数
      const totalRecords = Object.values(results).reduce((sum, rows) => 
        sum + rows.reduce((rowSum, row) => rowSum + parseInt(row.count), 0), 0
      );

      return {
        total_records: totalRecords,
        statistics: results
      };
    } catch (error) {
      console.error('获取用户行为统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门路线点击统计
   */
  static async getPopularRouteStats(filters = {}) {
    const { start_date, end_date, limit = 20 } = filters;
    
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      values.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      values.push(end_date);
    }

    paramCount++;
    const query = `
      SELECT 
        route_id,
        route_name,
        route_region,
        AVG(route_distance_km) as avg_distance_km,
        AVG(route_duration_days) as avg_duration_days,
        COUNT(*) as click_count,
        COUNT(DISTINCT session_id) as unique_users,
        MAX(created_at) as last_clicked
      FROM popular_route_clicks 
      ${whereClause}
      GROUP BY route_id, route_name, route_region
      ORDER BY click_count DESC
      LIMIT $${paramCount}
    `;

    values.push(limit);

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('获取热门路线统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取导航偏好统计
   */
  static async getNavigationPreferences(filters = {}) {
    const { start_date, end_date } = filters;
    
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      values.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      values.push(end_date);
    }

    const query = `
      SELECT 
        route_policy,
        search_mode,
        smart_sampling_enabled,
        AVG(route_distance_km) as avg_distance_km,
        AVG(route_duration_minutes) as avg_duration_minutes,
        AVG(waypoints_count) as avg_waypoints,
        COUNT(*) as usage_count,
        COUNT(DISTINCT session_id) as unique_users
      FROM route_navigation_records 
      ${whereClause}
      GROUP BY route_policy, search_mode, smart_sampling_enabled
      ORDER BY usage_count DESC
    `;

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('获取导航偏好统计失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期数据
   */
  static async cleanupOldRecords(days = 90) {
    try {
      let totalDeleted = 0;
      
      // 清理导航记录
      const navQuery = `DELETE FROM route_navigation_records WHERE created_at < NOW() - INTERVAL '${days} days'`;
      const navResult = await db.query(navQuery);
      totalDeleted += navResult.rowCount;
      
      // 清理热门路线点击记录
      const clickQuery = `DELETE FROM popular_route_clicks WHERE created_at < NOW() - INTERVAL '${days} days'`;
      const clickResult = await db.query(clickQuery);
      totalDeleted += clickResult.rowCount;
      
      // 清理智能匹配记录
      const matchQuery = `DELETE FROM smart_route_matches WHERE created_at < NOW() - INTERVAL '${days} days'`;
      const matchResult = await db.query(matchQuery);
      totalDeleted += matchResult.rowCount;
      
      // 清理轨迹回放记录
      const playbackQuery = `DELETE FROM trajectory_playbacks WHERE created_at < NOW() - INTERVAL '${days} days'`;
      const playbackResult = await db.query(playbackQuery);
      totalDeleted += playbackResult.rowCount;
      
      console.log(`🧹 清理了 ${totalDeleted} 条过期的用户行为记录`);
      console.log(`   - 导航记录: ${navResult.rowCount} 条`);
      console.log(`   - 路线点击: ${clickResult.rowCount} 条`);
      console.log(`   - 智能匹配: ${matchResult.rowCount} 条`);
      console.log(`   - 轨迹回放: ${playbackResult.rowCount} 条`);
      
      return totalDeleted;
    } catch (error) {
      console.error('清理过期数据失败:', error);
      throw error;
    }
  }
}

module.exports = UserBehaviorSimplifiedModel;
