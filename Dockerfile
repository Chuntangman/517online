# 517骑行驿站 - 前端 Dockerfile
# 多阶段构建，减小镜像体积

# 阶段1: 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 设置构建环境变量
ARG VITE_API_BASE_URL=http://47.122.117.45:3000
ARG VITE_DATAGEAR_URL=http://47.122.117.45:50401
ARG VITE_AMAP_API_KEY=b7fb4f223f6cbffc2d995a508d10f7cd

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_DATAGEAR_URL=$VITE_DATAGEAR_URL
ENV VITE_AMAP_API_KEY=$VITE_AMAP_API_KEY

# 构建前端
RUN npm run build

# 阶段2: 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

