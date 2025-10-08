# 517骑行驿站 - DataGear Dockerfile

FROM openjdk:8-jre-alpine

# 设置工作目录
WORKDIR /app

# 安装必要工具
RUN apk add --no-cache bash curl

# 复制应用文件
COPY datagear-5.5.0.jar ./
COPY config/ ./config/
COPY lib/ ./lib/

# 创建数据和日志目录
RUN mkdir -p datagear-data logs

# 设置环境变量
ENV DG_APP_HOME=/app
ENV JAVA_OPTS="-Xmx1g -Xms256m"

# 暴露端口
EXPOSE 50401

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:50401 || exit 1

# 启动命令
CMD ["sh", "-c", "java $JAVA_OPTS -cp datagear-5.5.0.jar -Dloader.home=$DG_APP_HOME -Dloader.path=datagear-5.5.0.jar!/WEB-INF/lib-provided,datagear-5.5.0.jar!/WEB-INF/lib,lib,datagear-5.5.0.jar!/WEB-INF/classes org.springframework.boot.loader.PropertiesLauncher --spring.config.additional-location=$DG_APP_HOME/config/application.properties"]

