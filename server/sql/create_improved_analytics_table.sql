-- 创建改进的用户行为分析表
-- 将数据字段分离，便于可视化分析

-- 删除旧表
DROP TABLE IF EXISTS user_behavior_simplified CASCADE;

-- 创建路线导航记录表
CREATE TABLE IF NOT EXISTS route_navigation_records (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    start_point_lng DECIMAL(10, 7),
    start_point_lat DECIMAL(10, 7),
    start_point_name VARCHAR(255),
    end_point_lng DECIMAL(10, 7),
    end_point_lat DECIMAL(10, 7),
    end_point_name VARCHAR(255),
    waypoints_count INTEGER DEFAULT 0,
    route_policy VARCHAR(10) CHECK (route_policy IN ('0', '1', '2')), -- 0:综合, 1:推荐, 2:最快
    search_mode VARCHAR(20) CHECK (search_mode IN ('coordinates', 'keyword')),
    route_distance_km DECIMAL(10, 2),
    route_duration_minutes INTEGER,
    smart_sampling_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建热门路线点击记录表
CREATE TABLE IF NOT EXISTS popular_route_clicks (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    route_id INTEGER NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    route_region VARCHAR(100),
    route_distance_km DECIMAL(10, 2),
    route_duration_days INTEGER,
    click_source VARCHAR(50) DEFAULT 'popular_routes',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建智能路线匹配记录表
CREATE TABLE IF NOT EXISTS smart_route_matches (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    preferred_distance_min INTEGER, -- 偏好最小距离(km)
    preferred_distance_max INTEGER, -- 偏好最大距离(km)
    preferred_days_min INTEGER,     -- 偏好最小天数
    preferred_days_max INTEGER,     -- 偏好最大天数
    preferred_difficulty VARCHAR(20) CHECK (preferred_difficulty IN ('easy', 'medium', 'hard', '简单', '中等', '困难')),
    weather_preference VARCHAR(20),
    scenery_preference INTEGER CHECK (scenery_preference >= 1 AND scenery_preference <= 10), -- 风景偏好评分
    matched_routes_count INTEGER DEFAULT 0,
    selected_route_id INTEGER,
    selected_route_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建轨迹回放记录表
CREATE TABLE IF NOT EXISTS trajectory_playbacks (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    route_id INTEGER,
    route_name VARCHAR(255),
    waypoints_count INTEGER DEFAULT 0,
    playback_source VARCHAR(50) CHECK (playback_source IN ('popular_routes', 'smart_match', 'custom')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_route_navigation_session_id ON route_navigation_records(session_id);
CREATE INDEX IF NOT EXISTS idx_route_navigation_created_at ON route_navigation_records(created_at);
CREATE INDEX IF NOT EXISTS idx_route_navigation_policy ON route_navigation_records(route_policy);
CREATE INDEX IF NOT EXISTS idx_route_navigation_search_mode ON route_navigation_records(search_mode);

CREATE INDEX IF NOT EXISTS idx_popular_route_clicks_session_id ON popular_route_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_popular_route_clicks_route_id ON popular_route_clicks(route_id);
CREATE INDEX IF NOT EXISTS idx_popular_route_clicks_created_at ON popular_route_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_popular_route_clicks_region ON popular_route_clicks(route_region);

CREATE INDEX IF NOT EXISTS idx_smart_route_matches_session_id ON smart_route_matches(session_id);
CREATE INDEX IF NOT EXISTS idx_smart_route_matches_created_at ON smart_route_matches(created_at);
CREATE INDEX IF NOT EXISTS idx_smart_route_matches_difficulty ON smart_route_matches(preferred_difficulty);

CREATE INDEX IF NOT EXISTS idx_trajectory_playbacks_session_id ON trajectory_playbacks(session_id);
CREATE INDEX IF NOT EXISTS idx_trajectory_playbacks_created_at ON trajectory_playbacks(created_at);
CREATE INDEX IF NOT EXISTS idx_trajectory_playbacks_source ON trajectory_playbacks(playback_source);

-- 添加表注释
COMMENT ON TABLE route_navigation_records IS '路线导航记录表';
COMMENT ON TABLE popular_route_clicks IS '热门路线点击记录表';
COMMENT ON TABLE smart_route_matches IS '智能路线匹配记录表';
COMMENT ON TABLE trajectory_playbacks IS '轨迹回放记录表';

-- 插入示例数据
INSERT INTO route_navigation_records 
(session_id, start_point_lng, start_point_lat, end_point_lng, end_point_lat, waypoints_count, route_policy, search_mode, route_distance_km, route_duration_minutes, smart_sampling_enabled) 
VALUES 
('session_example_1', 116.4074, 39.9042, 121.4737, 31.2304, 3, '0', 'coordinates', 1200.5, 480, true);

INSERT INTO popular_route_clicks 
(session_id, route_id, route_name, route_region, route_distance_km, route_duration_days, click_source) 
VALUES 
('session_example_2', 1, '青海湖环湖骑行路线', '青海', 360.0, 3, 'popular_routes');

INSERT INTO smart_route_matches 
(session_id, preferred_distance_min, preferred_distance_max, preferred_days_min, preferred_days_max, preferred_difficulty, matched_routes_count, selected_route_id, selected_route_name) 
VALUES 
('session_example_3', 100, 300, 2, 3, '简单', 5, 2, '环太湖骑行路线');

INSERT INTO trajectory_playbacks 
(session_id, route_id, route_name, waypoints_count, playback_source) 
VALUES 
('session_example_4', 1, '青海湖环湖骑行路线', 8, 'popular_routes');

SELECT 'improved analytics tables created successfully' AS status;
