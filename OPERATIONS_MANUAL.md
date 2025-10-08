# 517骑行驿站 - Docker 运维手册

> 本手册提供日常运维所需的全部操作命令和配置说明

---

## 📋 系统信息

```yaml
服务器: 47.122.117.45 (CentOS 7.9)
域名: www.wenjinlin.xyz
配置: 2核 2GB 40GB

访问地址:
  前端:    http://47.122.117.45:8080
  后端:    http://47.122.117.45:3000
  DataGear: http://47.122.117.45:50401

Docker Hub:
  用户名: chuntangman
  镜像:
    - chuntangman/517-frontend:latest
    - chuntangman/517-backend:latest
    - chuntangman/517-datagear:latest

数据目录 (Linux):
  应用配置: /opt/517-cycling/
  数据存储: /data/517-cycling/postgres
  DataGear: /data/517-cycling/datagear
  日志:     /data/517-cycling/logs
```

---

## 🔧 一、镜像构建与推送

### 1.1 构建所有镜像（Windows）

```powershell
cd D:\CareerDate\PyCharm\517

# 构建前端
docker build `
  --build-arg VITE_API_BASE_URL=http://47.122.117.45:3000 `
  --build-arg VITE_DATAGEAR_URL=http://47.122.117.45:50401 `
  --build-arg VITE_AMAP_API_KEY=b7fb4f223f6cbffc2d995a508d10f7cd `
  -t chuntangman/517-frontend:latest `
  -f Dockerfile .

# 构建后端
docker build -t chuntangman/517-backend:latest -f server/Dockerfile ./server

# 构建 DataGear
docker build -t chuntangman/517-datagear:latest -f datagear-5.5.0/Dockerfile ./datagear-5.5.0
```

### 1.2 导出为镜像文件（用于上传到服务器）

```powershell
# 导出镜像
docker save chuntangman/517-frontend:latest -o 517-frontend.tar
docker save chuntangman/517-backend:latest -o 517-backend.tar
docker save chuntangman/517-datagear:latest -o 517-datagear.tar
```

### 1.3 推送到 Docker Hub

```powershell
# 登录 Docker Hub (使用 Access Token)
docker login -u chuntangman
# 密码: 输入你的 Access Token

# 推送镜像
docker push chuntangman/517-frontend:latest
docker push chuntangman/517-backend:latest
docker push chuntangman/517-datagear:latest
```

**获取 Access Token**：
1. 访问 https://hub.docker.com/settings/security
2. 点击 "New Access Token"
3. 权限选择: Read, Write, Delete
4. 复制生成的 Token

---

## 📦 二、服务器部署与更新

### 2.1 首次部署（完整流程）

#### Windows 上传文件

```powershell
# 上传镜像文件
scp 517-frontend.tar root@47.122.117.45:/tmp/
scp 517-backend.tar root@47.122.117.45:/tmp/
scp 517-datagear.tar root@47.122.117.45:/tmp/

# 上传配置文件
scp docker-compose.prod.yml root@47.122.117.45:/tmp/517-upload/
scp deploy.sh root@47.122.117.45:/tmp/517-upload/

# 上传数据库备份
scp 517database_backup.dump root@47.122.117.45:/tmp/517-upload/
```

#### Linux 服务器执行

```bash
# 加载镜像
cd /tmp
docker load -i 517-frontend.tar
docker load -i 517-backend.tar
docker load -i 517-datagear.tar

# 部署服务
cd /tmp/517-upload
chmod +x deploy.sh
bash deploy.sh

# 导入数据库
cd /opt/517-cycling
sleep 10
docker exec -i 517-postgres pg_restore -U postgres -d 517database -c < 517database_backup.dump
```

### 2.2 更新单个服务

#### 更新前端

```powershell
# Windows: 构建并导出
docker build -t chuntangman/517-frontend:latest -f Dockerfile .
docker save chuntangman/517-frontend:latest -o 517-frontend.tar
scp 517-frontend.tar root@47.122.117.45:/tmp/
```

```bash
# Linux: 加载并重启
docker load -i /tmp/517-frontend.tar
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml up -d --force-recreate frontend
rm /tmp/517-frontend.tar
```

#### 更新后端

```powershell
# Windows
docker build -t chuntangman/517-backend:latest -f server/Dockerfile ./server
docker save chuntangman/517-backend:latest -o 517-backend.tar
scp 517-backend.tar root@47.122.117.45:/tmp/
```

```bash
# Linux
docker load -i /tmp/517-backend.tar
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml up -d --force-recreate backend
rm /tmp/517-backend.tar
```

### 2.3 一键更新脚本

```bash
# 创建更新脚本（在服务器上）
cat > /opt/517-cycling/update.sh << 'EOF'
#!/bin/bash
SERVICE=$1
if [ -z "$SERVICE" ]; then
  echo "用法: bash update.sh [frontend|backend|datagear]"
  exit 1
fi

docker load -i /tmp/517-${SERVICE}.tar
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml up -d --force-recreate $SERVICE
rm /tmp/517-${SERVICE}.tar
echo "✅ ${SERVICE} 更新完成"
EOF

chmod +x /opt/517-cycling/update.sh

# 使用: bash /opt/517-cycling/update.sh frontend
```

---

## 🗄️ 三、数据库管理

### 3.1 备份数据库

#### 在 Windows 本地

```powershell
# 导出为 dump 文件（推荐）
pg_dump -U postgres -d 517database -F c -f backup_$(Get-Date -Format "yyyyMMdd").dump

# 导出为 SQL 文件
pg_dump -U postgres -d 517database > backup_$(Get-Date -Format "yyyyMMdd").sql
```

#### 在 Linux 服务器

```bash
# 备份 Docker 容器中的数据库
docker exec 517-postgres pg_dump -U postgres -d 517database -F c > backup_$(date +%Y%m%d).dump

# 备份为 SQL
docker exec 517-postgres pg_dump -U postgres -d 517database > backup_$(date +%Y%m%d).sql
```

### 3.2 恢复数据库

```bash
# 从 dump 文件恢复
docker exec -i 517-postgres pg_restore -U postgres -d 517database -c < backup.dump

# 从 SQL 文件恢复
docker exec -i 517-postgres psql -U postgres -d 517database < backup.sql
```

### 3.3 数据库查询

```bash
# 连接数据库
docker exec -it 517-postgres psql -U postgres -d 517database

# 查看所有表
\dt

# 查看表结构
\d tablename

# 查看表数据量
SELECT COUNT(*) FROM "Waystation";

# 退出
\q
```

### 3.4 数据库表信息

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| Waystation | 驿站信息 | ID, 地区, 点名称, longitude, latitude, 住宿, 租车, 维修 |
| routetable | 路线信息 | ID, 地区, 路线名, 里程, 预计天数, 风景评分, 途径地点 |
| Destination | 目标点 | ID, 地区, 点名称, longitude, latitude, 热门线路ID |
| 517image | 图片资源 | ID, 图片名, 介绍, 存储(根目录路径) |

---

## 🚀 四、服务管理

### 4.1 启动/停止服务

```bash
cd /opt/517-cycling

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 停止所有服务
docker-compose -f docker-compose.prod.yml stop

# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 停止并删除容器（保留数据）
docker-compose -f docker-compose.prod.yml down
```

### 4.2 查看服务状态

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看所有容器
docker ps -a

# 查看镜像
docker images | grep 517
```

### 4.3 查看日志

```bash
cd /opt/517-cycling

# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker logs -f 517-frontend
docker logs -f 517-backend
docker logs -f 517-postgres
docker logs -f 517-datagear

# 查看最近50行日志
docker logs --tail 50 517-backend
```

### 4.4 进入容器

```bash
# 进入后端容器
docker exec -it 517-backend sh

# 进入数据库
docker exec -it 517-postgres psql -U postgres -d 517database

# 查看 DataGear 日志文件
docker exec -it 517-datagear tail -f /app/logs/datagear.log
```

---

## 🔧 五、配置管理

### 5.1 关键配置文件位置

```
Linux 服务器:
/opt/517-cycling/
├── docker-compose.prod.yml    # Docker 编排配置
├── 517database_backup.dump    # 数据库备份
└── deploy.sh                  # 部署脚本

/data/517-cycling/
├── postgres/                  # 数据库数据（持久化）
├── datagear/                  # DataGear 数据（持久化）
└── logs/                      # 日志文件

Windows 项目:
server/app.js                  # 后端主文件（CORS配置在47-74行）
server/config/database.js      # 数据库配置
vite.config.js                 # 前端代理配置
```

### 5.2 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 8080 → 80 | Nginx 服务 |
| 后端 | 3000 | Express API |
| 数据库 | 5432 | PostgreSQL（仅内部） |
| DataGear | 50401 | 数据可视化平台 |

### 5.3 CORS 配置（后端）

文件：`server/app.js` (47-74行)

```javascript
// 允许的来源
const allowedOrigins = [
  'http://localhost:5173',          // 本地开发
  'http://localhost:5174', 
  'http://127.0.0.1:5173', 
  'http://127.0.0.1:5174',
  'http://47.122.117.45:8080',      // 生产环境前端
  'http://47.122.117.45',
];

// 生产环境允许所有来源
if (NODE_ENV === 'production') {
  callback(null, true);
}
```

**修改后需要重新构建后端镜像！**

### 5.4 数据库连接配置

文件：`server/config/database.js`

```javascript
{
  host: process.env.DB_HOST || 'postgres',      // Docker: postgres
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || '517database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '6912190819',
}
```

**环境变量在 docker-compose.prod.yml 中配置**

### 5.5 API 基础路径配置

前端代码中使用相对路径 `/api/v1`，由 Nginx 代理到后端：

- `src/composables/useRegions.js` (11行)
- `src/components/route/PopularRoutes.vue` (166行)
- `src/composables/usePopularRoutes.js` (11行)
- `src/components/route/SmartRouteDetailModal.vue` (149行)

**修改后需要重新构建前端镜像！**

---

## 📊 六、监控与健康检查

### 6.1 健康检查

```bash
# 后端健康检查
curl http://localhost:3000/health

# 应该返回:
# {"success":true,"message":"服务运行正常",...}

# 前端测试
curl http://localhost:8080

# DataGear 测试
curl http://localhost:50401
```

### 6.2 检查容器健康状态

```bash
# 查看健康状态
docker ps --format "table {{.Names}}\t{{.Status}}"

# 应该看到：
# 517-frontend   Up (healthy)
# 517-backend    Up (healthy)
# 517-postgres   Up (healthy)
# 517-datagear   Up (healthy)
```

### 6.3 资源使用监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h /data/517-cycling

# 查看数据库大小
docker exec 517-postgres psql -U postgres -d 517database -c "
SELECT 
  pg_size_pretty(pg_database_size('517database')) AS db_size;
"
```

---

## 🔍 七、故障排查

### 7.1 常见问题

#### 问题 1: 容器无法启动

```bash
# 查看容器状态
docker ps -a

# 查看失败容器的日志
docker logs 517-backend

# 重启容器
docker restart 517-backend
```

#### 问题 2: 数据库连接失败

```bash
# 检查 PostgreSQL
docker exec 517-postgres pg_isready -U postgres

# 测试连接
docker exec 517-postgres psql -U postgres -d 517database -c "SELECT 1"

# 检查后端能否连接数据库
docker exec 517-backend ping postgres
```

#### 问题 3: CORS 错误

查看后端日志：
```bash
docker logs --tail 50 517-backend | grep CORS
```

如果看到 "不允许的来源"，需要修改 `server/app.js` 的 CORS 配置并重新构建。

#### 问题 4: 前端无法加载数据

```bash
# 检查 Nginx 配置
docker exec 517-frontend cat /etc/nginx/nginx.conf

# 查看前端日志
docker logs -f 517-frontend

# 测试 API 代理
curl http://localhost:8080/api/v1/routes/regions
```

### 7.2 重置服务

```bash
cd /opt/517-cycling

# 停止并删除所有容器
docker-compose -f docker-compose.prod.yml down

# 重新启动
docker-compose -f docker-compose.prod.yml up -d

# 查看启动日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 7.3 清理 Docker

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune

# 完整清理（谨慎！）
docker system prune -a --volumes
```

---

## 🔄 八、日常运维任务

### 8.1 每日检查

```bash
# 检查服务状态
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml ps

# 检查磁盘空间
df -h

# 检查日志异常
docker logs --tail 100 517-backend | grep -i error
```

### 8.2 每周维护

```bash
# 备份数据库
docker exec 517-postgres pg_dump -U postgres -d 517database -F c > /opt/517-cycling/backup_weekly_$(date +%Y%m%d).dump

# 清理旧日志
find /data/517-cycling/logs -name "*.log.*" -mtime +30 -delete

# 检查容器资源使用
docker stats --no-stream
```

### 8.3 定期更新

1. **更新镜像**（每次代码更新后）
2. **备份数据库**（每周）
3. **检查磁盘空间**（每月）
4. **清理 Docker 缓存**（每月）

---

## 📞 九、快速命令速查

### 启动服务

```bash
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml up -d
```

### 停止服务

```bash
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml down
```

### 重启服务

```bash
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml restart
```

### 查看日志

```bash
docker logs -f 517-backend
```

### 备份数据库

```bash
docker exec 517-postgres pg_dump -U postgres -d 517database -F c > backup.dump
```

### 更新前端

```bash
# Windows
docker build -t chuntangman/517-frontend:latest -f Dockerfile .
docker save chuntangman/517-frontend:latest -o 517-frontend.tar
scp 517-frontend.tar root@47.122.117.45:/tmp/

# Linux
docker load -i /tmp/517-frontend.tar
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml up -d --force-recreate frontend
```

### 检查服务状态

```bash
cd /opt/517-cycling
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:3000/health
```

---

## 📝 十、注意事项

### 10.1 数据持久化

以下目录包含重要数据，**不要删除**：

```bash
/data/517-cycling/postgres    # 数据库数据
/data/517-cycling/datagear    # DataGear 数据
/data/517-cycling/logs        # 日志文件
```

### 10.2 安全建议

1. ✅ 定期备份数据库
2. ✅ 定期更新镜像
3. ✅ 监控磁盘空间
4. ✅ 定期查看日志
5. ⚠️ 数据库端口 5432 未对外开放（仅 Docker 内部）
6. ⚠️ 生产环境建议修改数据库密码

### 10.3 性能优化

- DataGear JVM 内存已设置为 `-Xmx1g -Xms256m`（适配 2GB 内存服务器）
- 如果内存不足，可降低为 `-Xmx768m`
- PostgreSQL 连接池最大连接数：20

---

## 📞 技术支持

- **开发者**: 温锦林
- **联系方式**: 15808955664
- **服务器**: 47.122.117.45

---

**🎉 运维手册完成！保存此文档以备日常使用。**

