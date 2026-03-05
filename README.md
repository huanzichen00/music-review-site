# Music Review Site（乐评网站）

一个参考 [progarchives.com](https://www.progarchives.com) 的音乐评论网站，包含专辑/乐队浏览、收藏、评论与猜乐队玩法。

## 📁 项目结构

```
music-review-site/
├── backend/          # Spring Boot 后端
├── frontend/         # React 前端
├── database/         # 数据库脚本
│   └── init.sql      # 建表脚本
└── README.md         # 项目说明
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite + Ant Design |
| 后端 | Java Spring Boot |
| 数据库 | MySQL |
| 认证 | JWT |

## 功能模块

- [x] 数据库设计
- [x] 用户系统（注册/登录）
- [x] 艺术家管理
- [x] 专辑管理（支持多流派标签）
- [x] 曲目列表
- [x] 用户收藏
- [x] 乐评系统
- [x] 首字母检索
- [x] 猜乐队（默认题库 / 公开题库 / 自选题库）
- [x] 游客自选题库（浏览器本地 localStorage，登录用户可创建可分享题库）
- [x] 联机猜乐队模式（房间对战）

## 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

### 2. 启动后端

```bash
cd backend
./mvnw spring-boot:run
```

默认数据库配置见 `backend/src/main/resources/application.properties`（MySQL `music_review`）。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认本地开发地址：`http://localhost:5173`

## 部署（Nginx + SpringBoot）

在项目根目录执行：

```bash
bash scripts/deploy_nginx.sh deploy
```

常用命令：

```bash
bash scripts/deploy_nginx.sh deploy            # 构建 + 发布 + 后端按变更重启 + 重载Nginx + 健康检查
bash scripts/deploy_nginx.sh deploy_frontend   # 仅前端构建发布 + 重载Nginx
bash scripts/deploy_nginx.sh build             # 仅构建前后端
bash scripts/deploy_nginx.sh publish_frontend  # 仅发布前端静态文件
bash scripts/deploy_nginx.sh publish_backend   # 仅发布后端 jar
bash scripts/deploy_nginx.sh check             # 健康检查
bash scripts/deploy_nginx.sh status            # 查看 nginx 与后端服务状态
```

说明：
- Nginx 对外提供前端页面（默认 `80/443`）
- 后端服务默认监听 `8080`，由 Nginx 反向代理到 `/api/*`
- 前端静态目录默认发布到 `/var/www/music-review`

## 数据库表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| artists | 艺术家表 |
| genres | 流派表 |
| albums | 专辑表 |
| album_genres | 专辑-流派关联表 |
| tracks | 曲目表 |
| favorites | 收藏表 |
| reviews | 评论表 |
| question_banks / question_bank_items | 自选题库及题目 |
| guess_band_online_* | 联机猜乐队相关表 |

## 说明
- 猜乐队“游客题库”数据仅保存在当前浏览器，不会上传服务器，不支持跨设备同步。
- 登录后可创建可分享题库（支持分享链接）。

## 开发日志
- 2026-01-31：项目初始化，完成数据库设计
