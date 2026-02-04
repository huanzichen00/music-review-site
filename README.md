# 🎵 Music Review Site (乐评网站)

一个参考 [progarchives.com](https://www.progarchives.com) 的音乐评论网站。

## 📁 项目结构

```
music-review-site/
├── backend/          # Spring Boot 后端
├── frontend/         # React 前端
├── database/         # 数据库脚本
│   └── init.sql      # 建表脚本
└── README.md         # 项目说明
```

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React |
| 后端 | Java Spring Boot |
| 数据库 | MySQL |
| 认证 | JWT |

## ✨ 功能模块

- [x] 数据库设计
- [x] 用户系统（注册/登录）
- [x] 艺术家管理
- [x] 专辑管理（支持多流派标签）
- [x] 曲目列表
- [x] 用户收藏
- [x] 乐评系统
- [x] 首字母检索

## 🚀 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

### 2. 启动后端

```bash
cd backend
./mvnw spring-boot:run
```

### 3. 启动前端

```bash
cd frontend
npm install
npm start
```

## 📊 数据库表

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

## 📝 开发日志

- 2026-01-31: 项目初始化，完成数据库设计
