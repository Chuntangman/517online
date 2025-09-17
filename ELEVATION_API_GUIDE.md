# 高程API部署指南

## 🔍 问题说明

**为什么Vite代理只在开发环境有效？**

### 开发环境 vs 生产环境

| 环境 | 原理 | 可用性 |
|------|------|--------|
| **开发环境** | `npm run dev` 启动Vite开发服务器，内置代理功能 | ✅ 可用 |
| **生产环境** | `npm run build` 构建静态文件，无服务器功能 | ❌ 不可用 |

### 数据流对比

**开发环境**：
```
浏览器 → http://localhost:5173/elevation-api/... 
       → Vite开发服务器代理 
       → https://api.open-elevation.com/...
```

**生产环境**：
```
浏览器 → https://yourdomain.com/elevation-api/... 
       → ❌ 静态文件服务器（无代理功能）
       → 404 Not Found
```

## 🚀 解决方案

### 方案1：后端API代理（已实现）

**新增文件**：
- `server/routes/elevationRoutes.js` - 后端高程API路由
- 修改 `server/app.js` - 注册高程路由
- 修改 `src/composables/useElevation.js` - 支持双环境

**API端点**：
- `GET /api/v1/elevation/lookup?locations=lat,lng` - 单点查询
- `POST /api/v1/elevation/batch` - 批量查询

**自动环境检测**：
```javascript
const isDevelopment = import.meta.env.DEV
const ELEVATION_API_URL = isDevelopment 
  ? '/elevation-api/api/v1/lookup'  // 开发：Vite代理
  : '/api/v1/elevation/lookup'      // 生产：后端API
```

### 方案2：Nginx代理（服务器配置）

```nginx
# /etc/nginx/sites-available/your-site
server {
    listen 80;
    server_name yourdomain.com;
    
    # 前端静态文件
    location / {
        root /var/www/your-app/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 高程API代理（如果需要）
    location /elevation-api/ {
        proxy_pass https://api.open-elevation.com/;
        proxy_set_header Host api.open-elevation.com;
        proxy_ssl_server_name on;
    }
}
```

### 方案3：CDN/Cloudflare Workers

使用Cloudflare Workers作为代理：

```javascript
// cloudflare-worker.js
export default {
  async fetch(request) {
    const url = new URL(request.url)
    
    if (url.pathname.startsWith('/elevation-api/')) {
      const targetUrl = url.pathname.replace('/elevation-api/', 'https://api.open-elevation.com/')
      const targetRequest = new Request(targetUrl, request)
      
      const response = await fetch(targetRequest)
      
      // 添加CORS头
      const newResponse = new Response(response.body, response)
      newResponse.headers.set('Access-Control-Allow-Origin', '*')
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      
      return newResponse
    }
    
    return fetch(request)
  }
}
```

## 📊 性能对比

| 方案 | 延迟 | 可靠性 | 成本 | 复杂度 |
|------|------|--------|------|--------|
| **后端代理** | 中等 | 高 | 低 | 低 |
| **Nginx代理** | 低 | 高 | 低 | 中等 |
| **CDN Workers** | 低 | 很高 | 中等 | 中等 |

## 🔧 部署步骤

### 1. 后端部署
```bash
# 安装后端依赖（如需要）
cd server
npm install axios

# 重启后端服务
pm2 restart your-app
# 或
node app.js
```

### 2. 前端构建
```bash
# 构建生产版本
npm run build

# 部署到服务器
rsync -av dist/ user@server:/var/www/your-app/dist/
```

### 3. 测试验证
```bash
# 测试后端API
curl "http://your-domain.com/api/v1/elevation/lookup?locations=19.045092,110.565679"

# 测试批量API
curl -X POST "http://your-domain.com/api/v1/elevation/batch" \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[{"lat":19.045092,"lng":110.565679}]}'
```

## 🛠️ 故障排除

### 常见问题

1. **生产环境404错误**
   - 确认后端服务运行正常
   - 检查路由注册是否正确

2. **API超时**
   - 检查Open-Elevation API可用性
   - 调整timeout设置

3. **频率限制429错误**
   - 减少maxPoints采样数量
   - 增加请求间延迟

### 调试命令
```bash
# 检查后端API
curl -v "http://localhost:3000/api/v1/elevation/lookup?locations=19.045092,110.565679"

# 检查进程
ps aux | grep node

# 查看日志
tail -f /var/log/your-app.log
```

## 📈 优化建议

1. **缓存策略**：对相同坐标的高程数据进行缓存
2. **数据库存储**：将常用区域的高程数据存储到数据库
3. **CDN加速**：使用CDN缓存高程数据
4. **批量优化**：优先使用批量API减少请求次数

---

通过以上方案，高程API功能将在开发和生产环境中都能正常工作！
