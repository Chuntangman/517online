/**
 * 精简的前端用户分析工具
 * 只记录有价值的用户行为偏好数据
 */

import axios from 'axios'

class SimplifiedAnalytics {
  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.pendingEvents = []
    this.flushInterval = 10000 // 10秒批量发送一次
    this.init()
  }

  /**
   * 初始化分析工具
   */
  init() {
    // 启动定时批量发送
    this.startBatchFlush()
    
    // 设置页面卸载时发送剩余事件
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
    
    console.log('📊 Simplified Analytics initialized with session:', this.sessionId)
  }

  /**
   * 获取或创建会话ID
   */
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('simplified_analytics_session_id')
    
    if (!sessionId || this.isSessionExpired()) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('simplified_analytics_session_id', sessionId)
      localStorage.setItem('simplified_analytics_session_start', Date.now().toString())
    }
    
    return sessionId
  }

  /**
   * 检查会话是否过期（24小时）
   */
  isSessionExpired() {
    const sessionStart = localStorage.getItem('simplified_analytics_session_start')
    if (!sessionStart) return true
    
    const now = Date.now()
    const sessionAge = now - parseInt(sessionStart)
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    
    return sessionAge > maxAge
  }

  /**
   * 记录导航路线规划
   */
  async trackRouteNavigation(data) {
    try {
      console.log('📊 记录导航路线规划:', data)
      
      // 准备数据
      const requestData = {
        session_id: this.sessionId,
        start_point: data.start_point,
        end_point: data.end_point,
        waypoints: data.waypoints,
        route_policy: data.route_policy,
        search_mode: data.search_mode,
        distance: data.distance,
        duration: data.duration,
        smart_sampling_enabled: data.smart_sampling_enabled
      }

      // 发送到服务器
      const response = await axios.post('/api/v1/analytics-simple/route-navigation', requestData)
      
      if (response.data.success) {
        console.log('✅ 导航记录发送成功')
      }
    } catch (error) {
      console.warn('⚠️ 导航记录发送失败:', error.message)
    }
  }

  /**
   * 记录热门路线点击
   */
  async trackPopularRouteClick(routeData) {
    try {
      console.log('📊 记录热门路线点击:', routeData)
      
      // 准备数据
      const requestData = {
        session_id: this.sessionId,
        route_id: routeData.route_id,
        route_name: routeData.route_name,
        route_region: routeData.route_region,
        route_distance: routeData.route_distance,
        route_duration: routeData.route_duration,
        click_source: routeData.click_source || 'popular_routes'
      }

      // 发送到服务器
      const response = await axios.post('/api/v1/analytics-simple/popular-route-click', requestData)
      
      if (response.data.success) {
        console.log('✅ 热门路线点击记录发送成功')
      }
    } catch (error) {
      console.warn('⚠️ 热门路线点击记录发送失败:', error.message)
    }
  }

  /**
   * 记录智能路线匹配
   */
  async trackSmartRouteMatch(matchData) {
    try {
      console.log('📊 记录智能路线匹配:', matchData)
      const requestData = {
        session_id: this.sessionId,
        preferred_distance_min: matchData.preferred_distance_min,
        preferred_distance_max: matchData.preferred_distance_max,
        preferred_days_min: matchData.preferred_days_min,
        preferred_days_max: matchData.preferred_days_max,
        preferred_difficulty: matchData.preferred_difficulty,
        weather_preference: matchData.weather_preference,
        scenery_preference: matchData.scenery_preference,
        matched_routes_count: matchData.matched_routes_count,
        selected_route_id: matchData.selected_route_id,
        selected_route_name: matchData.selected_route_name
      }
      const response = await axios.post('/api/v1/analytics-simple/smart-route-match', requestData)
      if (response.data.success) {
        console.log('✅ 智能路线匹配记录发送成功')
      }
    } catch (error) {
      console.warn('⚠️ 智能路线匹配记录发送失败:', error.message)
    }
  }

  /**
   * 记录轨迹回放使用
   */
  async trackTrajectoryPlayback(playbackData) {
    try {
      const data = {
        session_id: this.sessionId,
        route_id: playbackData.route?.id,
        route_name: playbackData.route?.name || playbackData.name,
        waypoints_count: playbackData.waypoints?.length || playbackData.trajectoryPath?.length,
        playback_source: playbackData.source || 'unknown'
      }

      console.log('📊 记录轨迹回放:', data)

      await axios.post('/api/v1/analytics-simple/trajectory-playback', data)
    } catch (error) {
      console.warn('Failed to track trajectory playback:', error)
    }
  }

  /**
   * 批量发送事件（当前版本主要用于轨迹回放）
   */
  async flush() {
    if (this.pendingEvents.length === 0) return

    const events = [...this.pendingEvents]
    this.pendingEvents = []

    try {
      // 发送待处理的事件
      for (const event of events) {
        if (event.type === 'trajectory_playback') {
          await this.trackTrajectoryPlayback(event.data)
        }
      }
      
      if (events.length > 0) {
        console.log(`📊 Sent ${events.length} analytics events`)
      }
    } catch (error) {
      console.warn('Failed to send analytics events:', error)
      // 重新加入队列（最多重试一次）
      if (!events[0]?._retried) {
        events.forEach(event => {
          event._retried = true
        })
        this.pendingEvents.unshift(...events)
      }
    }
  }

  /**
   * 启动定时批量发送
   */
  startBatchFlush() {
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  /**
   * 添加事件到待发送队列（主要用于轨迹回放）
   */
  queueEvent(type, data) {
    this.pendingEvents.push({
      type,
      data,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 获取会话ID
   */
  getSessionId() {
    return this.sessionId
  }

  /**
   * 获取分析统计数据
   */
  async getStatistics(filters = {}) {
    try {
      const response = await axios.get('/api/v1/analytics-simple/statistics/behavior', {
        params: filters
      })
      return response.data
    } catch (error) {
      console.error('Failed to get analytics statistics:', error)
      throw error
    }
  }

  /**
   * 获取热门路线统计
   */
  async getPopularRouteStats(filters = {}) {
    try {
      const response = await axios.get('/api/v1/analytics-simple/statistics/popular-routes', {
        params: filters
      })
      return response.data
    } catch (error) {
      console.error('Failed to get popular route stats:', error)
      throw error
    }
  }

  /**
   * 获取导航偏好统计
   */
  async getNavigationPreferences(filters = {}) {
    try {
      const response = await axios.get('/api/v1/analytics-simple/statistics/navigation-preferences', {
        params: filters
      })
      return response.data
    } catch (error) {
      console.error('Failed to get navigation preferences:', error)
      throw error
    }
  }

  /**
   * 获取综合分析报告
   */
  async getAnalyticsReport(filters = {}) {
    try {
      const response = await axios.get('/api/v1/analytics-simple/report', {
        params: filters
      })
      return response.data
    } catch (error) {
      console.error('Failed to get analytics report:', error)
      throw error
    }
  }
}

// 创建全局实例
const simplifiedAnalytics = new SimplifiedAnalytics()

// 导出实例和类
export default simplifiedAnalytics
export { SimplifiedAnalytics }
