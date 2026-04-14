# Music Review Site（乐评网站）

一个参考 [progarchives.com](https://www.progarchives.com) 的音乐网站，当前主体为“猜乐队”玩法，并保留专辑/乐队浏览、收藏与评论能力。

## 项目结构

```text
music-review-site/
├── backend/          # Spring Boot 后端
├── frontend/         # React 前端
├── database/         # 数据库脚本与公开种子
└── README.md
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite + Ant Design |
| 后端 | Java Spring Boot |
| 数据库 | MySQL |
| 缓存 | Redis |
| 认证 | JWT |

## 功能模块

- [x] 猜乐队主站（默认题库 / 公开题库 / 自选题库 / 联机）
- [x] 数据库设计
- [x] 用户系统（注册/登录）
- [x] 艺术家管理
- [x] 专辑管理（支持多流派标签）
- [x] 曲目列表
- [x] 用户收藏
- [x] 乐评系统
- [x] 首字母检索
- [x] 游客自选题库（浏览器本地 localStorage，登录用户可创建可分享题库）
- [x] 联机猜乐队模式（房间对战）

## 开源说明

- 仓库不再提交数据库账号密码、JWT secret 等敏感信息。
- 后端通过环境变量读取数据库与 JWT 配置。
- 仓库包含公开音乐目录种子与公开猜乐队演示题库种子，方便本地快速体验。
- 不包含真实用户隐私与行为数据，也不包含私有部署脚本。

当前公开仓库可以复现：

- 音乐目录浏览
- 猜乐队默认题库
- 演示公开题库
- 自己注册账号后创建新题库
- 联机房间功能代码

当前公开仓库不会复现：

- 私有题库
- 游客本地题库历史
- 真实用户收藏、评论、博客、通知
- 行为日志与线上联机历史

## 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

### 2. 导入公开音乐目录数据

```bash
mysql -u root -p music_review < database/seed_public.sql
```

`seed_public.sql` 仅包含：

- `artists`
- `genres`
- `albums`
- `album_genres`
- `tracks`

### 3. 导入公开猜乐队演示题库

```bash
mysql -u root -p music_review < database/seed_public_guess_band.sql
```

这个种子会导入：

- 一个匿名化的 demo 用户
- 3 个公开题库
- 对应的题库乐队条目

说明：

- 这些题库只用于公开仓库体验，不包含真实用户邮箱或私有题库。
- demo 用户仅用于满足外键，不作为真实登录账号使用。

### 4. 启动后端

参考模板：`backend/src/main/resources/application.example.properties`

Linux/macOS：

```bash
export SPRING_DATASOURCE_URL='jdbc:mysql://localhost:3306/music_review?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
export SPRING_DATASOURCE_USERNAME='your_db_user'
export SPRING_DATASOURCE_PASSWORD='your_db_password'
export JWT_SECRET='replace_with_a_secure_random_secret_or_base64'
cd backend
./mvnw spring-boot:run
```

Windows PowerShell：

```powershell
$env:SPRING_DATASOURCE_URL='jdbc:mysql://localhost:3306/music_review?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
$env:SPRING_DATASOURCE_USERNAME='your_db_user'
$env:SPRING_DATASOURCE_PASSWORD='your_db_password'
$env:JWT_SECRET='replace_with_a_secure_random_secret_or_base64'
cd backend
./mvnw spring-boot:run
```

说明：

- `JWT_SECRET` 为空时后端会在启动阶段 fail-fast 并退出。
- 默认启用 Redis 登录节流，如本地没有 Redis，可在配置里关闭 `app.auth.login.redis.enabled` 或自行启动 Redis。

### 5. 启动前端

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

`.env.local` 示例：

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_ALLOWED_HOSTS=localhost,127.0.0.1
```

前端默认本地开发地址：`http://localhost:5173`

## 公开种子再导出

如果你在自己的数据库上维护了公开数据，可以重新生成公开种子。

先安装导出脚本依赖：

```bash
python3 -m pip install pymysql
```

### 导出公开音乐目录

```bash
env DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=music_review DB_USER=music_review_app DB_PASS='<db_password>' \
  python3 database/export_public_seed.py
```

### 导出公开猜乐队题库

```bash
env DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=music_review DB_USER=music_review_app DB_PASS='<db_password>' \
  python3 database/export_public_guess_band_seed.py
```

公开题库导出规则：

- 只导出 `PUBLIC` 题库
- 默认跳过空题库
- 自动把题库拥有者匿名化为 demo 用户
- 不导出私有题库、游客题库、行为日志

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

## 私有内容

以下内容保留为私有，不进入 GitHub：

- `scripts/` 下的私有部署与数据整理脚本
- 本地上传目录 `backend/uploads/`
- 真实环境变量和密钥

## 开发日志

- 2026-01-31：项目初始化，完成数据库设计
- 2026-04-14：补充开源版公开题库种子与导出脚本
