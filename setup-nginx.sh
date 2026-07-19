#!/bin/bash
# setup-nginx.sh - 自动配置 Tengine/Nginx 服务 monorepo-demo

set -e

NGINX_CONF="/etc/tengine/nginx.conf"
APP_DIST="/opt/monorepo-demo/packages/app-a/dist"

echo "🔧 开始配置 Tengine/Nginx..."

# 备份原配置
if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)"
    echo "✅ 已备份原配置"
fi

# 写入新配置
cat > "$NGINX_CONF" << 'EOF'
worker_processes auto;
error_log /var/log/tengine/error.log;
pid /run/tengine.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/tengine/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/tengine/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16m;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;

        root /opt/monorepo-demo/packages/app-a/dist;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /static/ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        error_page 404 /index.html;
    }
}
EOF

echo "✅ Nginx 配置已写入"

# 测试配置
if nginx -t 2>&1; then
    echo "✅ 配置测试通过"
else
    echo "❌ 配置测试失败"
    exit 1
fi

# 重启服务
if systemctl restart tengine; then
    echo "✅ Tengine 已重启"
elif systemctl restart nginx; then
    echo "✅ Nginx 已重启"
else
    echo "❌ 重启失败"
    exit 1
fi

echo "🎉 配置完成！访问 http://服务器IP 即可查看应用"
