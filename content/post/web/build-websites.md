---
title: '从零搭建多站点 Web 框架（Traefik + Docker）'
description: '本文作为搭建 web 服务框架的一个解决方案供参考，用一台云服务器 + Traefik + Docker，把多个域名/站点统一到同一入口，自动 HTTPS，并以 Astro 博客为例接入。'
pubDate: '2026-01-29'
draft: false
---

本文作为搭建 web 服务框架的一个解决方案供参考，用一台云服务器 + Traefik + Docker：Traefik 作为统一网关，把多个域名/站点接入到同一入口，自动签发/续期 HTTPS 证书，服务以 Docker 方式运行且可扩展。文末以 Astro 博客为例演示接入流程。

## 准备

- 域名（任意注册商）
- 具备公网 IP 的云服务器（放行 80/443）
- 已安装 Docker 与 Docker Compose

Ubuntu 示例：
```bash
sudo apt update
sudo apt install docker.io docker-compose
```

DNS 解析（A 记录）：
- 记录类型：`A`
- 主机记录：`@` / `www` / 子域名
- 记录值：服务器 IPv4

## 架构

- 入口层（Gateway/Reverse Proxy）：Traefik，仅暴露 80/443，负责 HTTPS、证书、基于域名/路径的路由。
- 业务层：各服务位于 Docker 内部网络，默认不对外暴露端口，只接受网关转发。
- 可选共享基础设施：MySQL/Redis 等，尽量隔离（网络与账号权限）。

目录组织：
- `gateway/`：入口层（Traefik）
- `stacks/<srv>/`：每个服务栈搭配一个 `docker-compose.yml`

```
/opt/stack
├── gateway
│   ├── docker-compose.yml
│   └── traefik
│       └── acme.json
└── stacks
    ├── static-a
    │   ├── docker-compose.yml
    │   └── html
    │       └── index.html
    ├── blog-b
    │   └── docker-compose.yml
    └── ...
```


## 网关（Traefik）

选择 Traefik 做网关，通过 Docker label 自描述路由规则：
- traefik 对外占用 `80` 和 `443` 端口做唯一入口
- 证书自动申请/续期 Let's Encrypt
- 可以自动发现 Docker 服务
- 在每个服务写 labels 表达域名/路径/端口

准备文件：
```bash
sudo mkdir -p /opt/stack/gateway/traefik
sudo touch /opt/stack/geteway/traefik/acme.json
sudo chmod 600 /opt/stack/gateway/traefik/acme.json
```

```yaml
# /opt/stack/gateway/docker-compose.yml
version: "3.9"

services:
  traefik:
    image: traefik:v3.2
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    command:
      - "--log.level=INFO"

      # 从 Docker labels 自动发现路由
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"

      # entrypoints
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"

      # Let's Encrypt (HTTP-01 challenge 走 80)
      - "--certificatesresolvers.le.acme.email=you@example.com"
      - "--certificatesresolvers.le.acme.storage=/acme/acme.json"
      - "--certificatesresolvers.le.acme.httpchallenge=true"
      - "--certificatesresolvers.le.acme.httpchallenge.entrypoint=web"

      # （可选）关闭 dashboard，避免多余暴露
      - "--api.dashboard=false"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik:/acme
    networks:
      - edge

networks:
  edge:
    name: edge
```

启动网关：
```bash
cd /opt/stack/gateway && sudo docker-compose up -d
```

## 添加服务栈

静态站（`a.com`）：
```html
<!-- /opt/stack/stacks/static-a/html/index.html -->
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>a.com ok</title></head>
  <body>
    <h1>a.com static OK (https)</h1>
    <p>This is a test static site behind Traefik + Let's Encrypt.</p>
  </body>
</html>
```

```yaml
# /opt/stack/stacks/static-a/docker-compose.yml
version: "3.9"

services:
  static_a:
    image: nginx:1.27-alpine
    container_name: static_a
    restart: unless-stopped
    volumes:
      - ./html:/usr/share/nginx/html:ro
    networks:
      - edge
    labels:
      - "traefik.enable=true"

      # HTTPS: a.com -> static_a
      - "traefik.http.routers.a_com.rule=Host(`a.com`) || Host(`www.a.com`)"
      - "traefik.http.routers.a_com.entrypoints=websecure"
      - "traefik.http.routers.a_com.tls.certresolver=le"
      - "traefik.http.services.a_com.loadbalancer.server.port=80"

      # HTTP -> HTTPS redirect
      - "traefik.http.routers.a_com_http.rule=Host(`a.com`) || Host(`www.a.com`)"
      - "traefik.http.routers.a_com_http.entrypoints=web"
      - "traefik.http.routers.a_com_http.middlewares=redirect_to_https"
      - "traefik.http.middlewares.redirect_to_https.redirectscheme.scheme=https"

networks:
  edge:
    external: true
    name: edge
```

占位服务（`blog.b.com`）：
```yaml
# /opt/stack/stacks/blog-b/docker-compose.yml
version: "3.9"

services:
  blog_b:
    image: traefik/whoami:v1.10
    container_name: blog_b
    restart: unless-stopped
    networks:
      - edge
    labels:
      - "traefik.enable=true"

      # HTTPS: blog.b.com -> blog_b
      - "traefik.http.routers.blog_b.rule=Host(`blog.b.com`)"
      - "traefik.http.routers.blog_b.entrypoints=websecure"
      - "traefik.http.routers.blog_b.tls.certresolver=le"
      - "traefik.http.services.blog_b.loadbalancer.server.port=80"

      # HTTP -> HTTPS redirect
      - "traefik.http.routers.blog_b_http.rule=Host(`blog.b.com`)"
      - "traefik.http.routers.blog_b_http.entrypoints=web"
      - "traefik.http.routers.blog_b_http.middlewares=redirect_to_https"
      - "traefik.http.middlewares.redirect_to_https.redirectscheme.scheme=https"

networks:
  edge:
    external: true
    name: edge
```

启动顺序：
```bash
# 网关
cd /opt/stack/gateway && sudo docker-compose up -d

# 静态站
cd /opt/stack/stacks/static-a && sudo docker-compose up -d

# 占位服务
cd /opt/stack/stacks/blog-b && sudo docker-compose up -d

# 查看状态
sudo docker ps
```

## 接入博客（Astro）

选择 [Astro](https://astro.build) 构建博客。最小流程：

初始化项目：
```bash
npm create astro@latest .  # 选择 blog 模板
npm install   # 如向导未自动安装
npm run dev   # 启动本地服务，默认在 http://localhost:4321
```

在 repo 根目录，创建 `Dockerfile` 构建镜像（多阶段构建 → Nginx 托管静态产物）：
```dockerfile
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.28-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
```

```bash
docker build -t blog:v0.0.1 .
```

Traefik 路由接入（替换占位服务的 image 即可）：
```yaml
# /opt/stack/stacks/blog-b/docker-compose.yml（片段）
services:
  blog_b:
    image: blog:v0.0.1
    networks: [edge]
    labels:  # 同上
```
