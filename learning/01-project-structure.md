# 项目结构与实体设计

> 学习笔记 - 乐评网站项目

---

## 一、项目整体结构

```
music-review-site/
├── backend/                         # Spring Boot 后端
│   ├── pom.xml                      # Maven 依赖配置
│   └── src/main/java/com/musicreview/
│       ├── MusicReviewBackendApplication.java  # 启动类
│       ├── entity/                  # 实体类 (对应数据库表)
│       ├── repository/              # 数据访问层 (DAO)
│       ├── service/                 # 业务逻辑层
│       ├── controller/              # 控制器层 (REST API)
│       ├── dto/                     # 数据传输对象
│       ├── config/                  # 配置类
│       └── security/                # 安全相关 (JWT)
├── frontend/                        # React 前端
├── database/                        # 数据库脚本
│   └── init.sql                     # 建表脚本
└── learning/                        # 学习笔记
```

---

## 二、后端分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    Controller 层                         │
│              处理 HTTP 请求，返回 JSON 响应               │
└───────────────────────┬─────────────────────────────────┘
                        │ 调用
┌───────────────────────▼─────────────────────────────────┐
│                     Service 层                           │
│                    业务逻辑处理                           │
└───────────────────────┬─────────────────────────────────┘
                        │ 调用
┌───────────────────────▼─────────────────────────────────┐
│                   Repository 层                          │
│              数据访问 (Spring Data JPA)                   │
└───────────────────────┬─────────────────────────────────┘
                        │ 操作
┌───────────────────────▼─────────────────────────────────┐
│                     Entity 层                            │
│              实体类 (映射数据库表)                         │
└─────────────────────────────────────────────────────────┘
```

### 各层职责

| 层级 | 职责 | 命名规范 |
|------|------|----------|
| Entity | 映射数据库表结构 | `XxxEntity` 或 `Xxx` |
| Repository | 数据库 CRUD 操作 | `XxxRepository` |
| Service | 业务逻辑处理 | `XxxService` / `XxxServiceImpl` |
| Controller | 接收请求、返回响应 | `XxxController` |
| DTO | 数据传输对象 | `XxxRequest` / `XxxResponse` / `XxxDTO` |

---

## 三、实体关系图 (ER Diagram)

### 文字版

```
┌─────────┐     1:N     ┌─────────┐     N:1     ┌─────────┐
│  User   │─────────────│ Review  │─────────────│  Album  │
└─────────┘             └─────────┘             └────┬────┘
     │                                               │
     │ 1:N              ┌─────────┐                  │ N:1
     └──────────────────│Favorite │──────────────────┤
                        └─────────┘                  │
                                                     │
┌─────────┐     1:N     ┌─────────┐     1:N          │
│ Artist  │─────────────│  Album  │──────────────────┘
└─────────┘             └────┬────┘
                             │
                             │ N:M         1:N
                             ├─────────────────────┐
                             │                     │
                             ▼                     ▼
                        ┌─────────┐          ┌─────────┐
                        │  Genre  │          │  Track  │
                        └─────────┘          └─────────┘
```

### 关系说明

| 实体A | 关系 | 实体B | 说明 |
|-------|------|-------|------|
| Artist | 1:N | Album | 一个艺术家有多张专辑 |
| Album | N:M | Genre | 一张专辑可有多个流派，一个流派可包含多张专辑 |
| Album | 1:N | Track | 一张专辑有多首歌曲 |
| User | 1:N | Review | 一个用户可写多条评论 |
| User | 1:N | Favorite | 一个用户可收藏多张专辑 |
| Album | 1:N | Review | 一张专辑可有多条评论 |
| Album | 1:N | Favorite | 一张专辑可被多人收藏 |

---

## 四、数据库表对应

| 实体类 | 数据库表 | 说明 |
|--------|----------|------|
| User | users | 用户表 |
| Artist | artists | 艺术家表 |
| Genre | genres | 流派表 |
| Album | albums | 专辑表 |
| Track | tracks | 曲目表 |
| Favorite | favorites | 收藏表 |
| Review | reviews | 评论表 |
| - | album_genres | 专辑-流派关联表 (JPA 自动管理) |

---

## 五、JPA 关键注解说明

### 基础注解

| 注解 | 用途 | 示例 |
|------|------|------|
| `@Entity` | 声明为 JPA 实体类 | `@Entity public class User` |
| `@Table(name = "xxx")` | 指定对应的数据库表名 | `@Table(name = "users")` |
| `@Id` | 声明主键字段 | `@Id private Long id;` |
| `@GeneratedValue` | 主键生成策略 | `@GeneratedValue(strategy = GenerationType.IDENTITY)` |
| `@Column` | 配置列属性 | `@Column(nullable = false, length = 50)` |

### 关系映射注解

| 注解 | 关系类型 | 使用场景 |
|------|----------|----------|
| `@OneToOne` | 一对一 | 如：用户 ↔ 用户详情 |
| `@OneToMany` | 一对多 | 如：艺术家 → 专辑列表 |
| `@ManyToOne` | 多对一 | 如：专辑 → 艺术家 |
| `@ManyToMany` | 多对多 | 如：专辑 ↔ 流派 |
| `@JoinColumn` | 指定外键列 | `@JoinColumn(name = "artist_id")` |
| `@JoinTable` | 配置关联表 (多对多) | 指定中间表名和关联字段 |

### 关系示例代码

```java
// 多对一：Album -> Artist
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "artist_id", nullable = false)
private Artist artist;

// 一对多：Artist -> Albums
@OneToMany(mappedBy = "artist", cascade = CascadeType.ALL)
private List<Album> albums = new ArrayList<>();

// 多对多：Album <-> Genre
@ManyToMany
@JoinTable(
    name = "album_genres",                           // 中间表名
    joinColumns = @JoinColumn(name = "album_id"),    // 当前实体的外键
    inverseJoinColumns = @JoinColumn(name = "genre_id")  // 关联实体的外键
)
private Set<Genre> genres = new HashSet<>();
```

### FetchType 加载策略

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `LAZY` | 延迟加载，用到时才查询 | 关联数据量大，不常用 |
| `EAGER` | 立即加载，查询时一起获取 | 关联数据常用，数据量小 |

> **最佳实践**：`@ManyToOne` 默认 EAGER，建议改为 LAZY；`@OneToMany` 默认 LAZY，保持即可。

### CascadeType 级联操作

| 类型 | 说明 |
|------|------|
| `PERSIST` | 保存时级联保存关联对象 |
| `MERGE` | 更新时级联更新关联对象 |
| `REMOVE` | 删除时级联删除关联对象 |
| `ALL` | 包含以上所有操作 |

---

## 六、Lombok 注解说明

| 注解 | 作用 | 生成内容 |
|------|------|----------|
| `@Data` | 组合注解 | getter/setter/toString/equals/hashCode |
| `@Builder` | 构建者模式 | 链式创建对象 |
| `@NoArgsConstructor` | 无参构造函数 | `public User() {}` |
| `@AllArgsConstructor` | 全参构造函数 | `public User(Long id, String name, ...)` |

### Builder 使用示例

```java
User user = User.builder()
    .username("john")
    .email("john@example.com")
    .password("encrypted_password")
    .role("USER")
    .build();
```

---

## 七、Hibernate 时间戳注解

| 注解 | 作用 |
|------|------|
| `@CreationTimestamp` | 创建时自动填充当前时间 |
| `@UpdateTimestamp` | 更新时自动填充当前时间 |

```java
@CreationTimestamp
@Column(name = "created_at", updatable = false)
private LocalDateTime createdAt;

@UpdateTimestamp
@Column(name = "updated_at")
private LocalDateTime updatedAt;
```

---

## 八、本项目实体类文件

| 文件 | 对应表 | 主要字段 |
|------|--------|----------|
| `User.java` | users | id, username, email, password, role |
| `Artist.java` | artists | id, name, nameInitial, country, formedYear |
| `Genre.java` | genres | id, name, description |
| `Album.java` | albums | id, title, titleInitial, artist, releaseYear, genres |
| `Track.java` | tracks | id, album, trackNumber, title, duration |
| `Favorite.java` | favorites | id, user, album, createdAt |
| `Review.java` | reviews | id, user, album, rating, content |

---

*更新日期：2026-01-31*
