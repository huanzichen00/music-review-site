# Music Review Site（乐评网站）

一个参考 [progarchives.com](https://www.progarchives.com) 的音乐网站，当前主体为“猜乐队”玩法，并保留专辑/乐队浏览、收藏与评论能力。

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
| 缓存 | Redis |
| 容器化 | Docker |
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

## Security: secrets are not committed

- 仓库不再保存数据库账号密码、JWT secret 等敏感信息。
- 后端使用环境变量读取配置，模板见 `backend/src/main/resources/application.example.properties`。
- 前端开发环境变量模板见 `frontend/.env.example`。
- 运行时上传文件目录 `backend/uploads/` 不应提交到 git。

## 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

### 2. 启动后端（必须先设置环境变量）

参考模板：`backend/src/main/resources/application.example.properties`

Linux/macOS（bash/zsh）：

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
- 可通过 `SPRING_PROFILES_ACTIVE=local` 扩展本地 profile（按需）。

### 3. 启动前端

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

`.env.local` 示例：

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_ALLOWED_HOSTS=localhost,127.0.0.1,xxxx.ngrok-free.dev
```

前端默认本地开发地址：`http://localhost:5173`

## 部署（Nginx + SpringBoot）

先在生产环境注入后端环境变量（`SPRING_DATASOURCE_*` 与 `JWT_SECRET`），再执行部署脚本。

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

## Secret rotation 与历史清理

- 如果历史版本曾泄露过密钥，必须立即 rotation：更换数据库密码、更新 `JWT_SECRET`，并使旧 token 失效。
- 如需从 git 历史抹除敏感文件/字符串，可使用 `git filter-repo`（不会自动执行）：

```bash
# 删除某文件在历史中的所有版本
git filter-repo --path backend/src/main/resources/application.properties --invert-paths

# 替换历史中的敏感文本（示例）
cat > /tmp/replacements.txt <<'EOF'
literal:<old_db_password_here>==>***REMOVED***
literal:<old_jwt_secret_here>==>***REMOVED***
EOF
git filter-repo --replace-text /tmp/replacements.txt
```

警告：
- 清理历史后需要 `git push --force --all --tags`，会影响所有现有 clone/fork。
- 即使做了历史清理，也必须完成密钥 rotation。

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
