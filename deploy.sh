#!/bin/bash

# 517骑行驿站 - Linux 服务器部署脚本
# 系统: CentOS 7.9 64位
# 服务器: 47.122.117.45
# 使用方法: bash deploy.sh

set -e

echo "========================================"
echo "  517骑行驿站 Docker 部署脚本"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
APP_DIR="/opt/517-cycling"          # 应用配置目录
DATA_DIR="/data/517-cycling"        # 数据持久化目录
COMPOSE_FILE="docker-compose.prod.yml"
DB_BACKUP="517database_backup.dump"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户或 sudo 运行此脚本${NC}"
    exit 1
fi

# 1. 检查 Docker 是否安装
echo -e "${YELLOW}[1/7] 检查 Docker 环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安装，正在安装...${NC}"
    
    # 安装 Docker (CentOS 7)
    yum install -y yum-utils
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io
    
    # 启动 Docker
    systemctl start docker
    systemctl enable docker
    
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker 已安装${NC}"
fi

# 2. 检查 Docker Compose 是否安装
echo -e "${YELLOW}[2/7] 检查 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose 未安装，正在安装...${NC}"
    
    # 安装 Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
fi

echo -e "Docker 版本: $(docker --version)"
echo -e "Docker Compose 版本: $(docker-compose --version)"
echo ""

# 3. 创建应用和数据目录
echo -e "${YELLOW}[3/7] 创建目录结构...${NC}"

# 创建应用目录
mkdir -p ${APP_DIR}

# 创建数据目录
mkdir -p ${DATA_DIR}/postgres
mkdir -p ${DATA_DIR}/datagear
mkdir -p ${DATA_DIR}/logs

# 设置目录权限
chmod -R 755 ${APP_DIR}
chmod -R 755 ${DATA_DIR}

echo -e "${GREEN}✓ 应用目录: ${APP_DIR}${NC}"
echo -e "${GREEN}✓ 数据目录: ${DATA_DIR}${NC}"
echo ""

# 4. 检查并移动配置文件
echo -e "${YELLOW}[4/7] 检查配置文件...${NC}"

# 检查当前目录或应用目录中的配置文件
if [ -f "${COMPOSE_FILE}" ]; then
    echo -e "${CYAN}移动文件到应用目录...${NC}"
    mv ${COMPOSE_FILE} ${APP_DIR}/
    [ -f "${DB_BACKUP}" ] && mv ${DB_BACKUP} ${APP_DIR}/
    [ -f "deploy.sh" ] && cp deploy.sh ${APP_DIR}/
    
    # 移动镜像文件（如果存在）
    [ -f "517-frontend.tar" ] && mv 517-frontend.tar ${APP_DIR}/
    [ -f "517-backend.tar" ] && mv 517-backend.tar ${APP_DIR}/
    [ -f "517-datagear.tar" ] && mv 517-datagear.tar ${APP_DIR}/
    
    echo -e "${GREEN}✓ 文件移动完成${NC}"
fi

# 进入应用目录
cd ${APP_DIR}

if [ ! -f "${COMPOSE_FILE}" ]; then
    echo -e "${RED}错误: 未找到 ${COMPOSE_FILE}${NC}"
    echo -e "${YELLOW}请上传文件到 ${APP_DIR} 或当前目录${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 配置文件已就绪: ${APP_DIR}/${COMPOSE_FILE}${NC}"
echo ""

# 5. 加载或拉取镜像
echo -e "${YELLOW}[5/7] 加载 Docker 镜像...${NC}"

# 检查是否有本地镜像文件
if [ -f "517-frontend.tar" ] && [ -f "517-backend.tar" ] && [ -f "517-datagear.tar" ]; then
    echo -e "${CYAN}检测到本地镜像文件，正在加载...${NC}"
    
    docker load -i 517-frontend.tar
    docker load -i 517-backend.tar
    docker load -i 517-datagear.tar
    
    echo -e "${GREEN}✓ 本地镜像加载完成${NC}"
else
    echo -e "${CYAN}从 Docker Hub 拉取镜像...${NC}"
    docker-compose -f ${COMPOSE_FILE} pull
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: 镜像拉取失败${NC}"
        echo -e "${YELLOW}建议: 在本地导出镜像后上传${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ 镜像拉取完成${NC}"
fi

# 拉取 PostgreSQL 官方镜像
echo -e "${CYAN}拉取 PostgreSQL 镜像...${NC}"
docker pull postgres:15-alpine

echo ""

# 6. 停止旧容器（如果存在）
echo -e "${YELLOW}[6/7] 停止旧容器（如果存在）...${NC}"
docker-compose -f ${COMPOSE_FILE} down 2>/dev/null || true
echo -e "${GREEN}✓ 旧容器已停止${NC}"
echo ""

# 7. 启动服务
echo -e "${YELLOW}[7/7] 启动服务...${NC}"
docker-compose -f ${COMPOSE_FILE} up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 服务启动失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 等待服务启动
echo -e "${CYAN}等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo ""
echo -e "${CYAN}服务状态:${NC}"
docker-compose -f ${COMPOSE_FILE} ps

echo ""
echo -e "${CYAN}服务访问地址:${NC}"
echo -e "  前端:    ${GREEN}http://47.122.117.45:8080${NC}"
echo -e "  后端:    ${GREEN}http://47.122.117.45:3000${NC}"
echo -e "  DataGear: ${GREEN}http://47.122.117.45:50401${NC}"
echo ""

echo -e "${CYAN}目录信息:${NC}"
echo -e "  应用目录:   ${GREEN}${APP_DIR}${NC}"
echo -e "  数据目录:   ${GREEN}${DATA_DIR}${NC}"
echo ""

echo -e "${CYAN}常用命令:${NC}"
echo -e "  进入应用目录: ${CYAN}cd ${APP_DIR}${NC}"
echo -e "  查看日志:     ${CYAN}docker-compose -f ${COMPOSE_FILE} logs -f${NC}"
echo -e "  重启服务:     ${CYAN}docker-compose -f ${COMPOSE_FILE} restart${NC}"
echo -e "  停止服务:     ${CYAN}docker-compose -f ${COMPOSE_FILE} down${NC}"
echo -e "  查看状态:     ${CYAN}docker-compose -f ${COMPOSE_FILE} ps${NC}"
echo ""

echo -e "${YELLOW}数据存储位置:${NC}"
echo -e "  数据库:     ${DATA_DIR}/postgres"
echo -e "  DataGear:   ${DATA_DIR}/datagear"
echo -e "  日志:       ${DATA_DIR}/logs"
echo ""

if [ -f "${APP_DIR}/${DB_BACKUP}" ]; then
    echo -e "${YELLOW}下一步: 导入数据库${NC}"
    echo -e "  ${CYAN}cd ${APP_DIR}${NC}"
    echo -e "  ${CYAN}docker exec -i 517-postgres pg_restore -U postgres -d 517database -c < ${DB_BACKUP}${NC}"
    echo ""
fi

