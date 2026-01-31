# 后端 API 开发笔记

> 学习笔记 - Spring Boot REST API 开发

---

## 一、项目分层架构

```
com.musicreview/
├── entity/          # 实体层：数据库表映射
├── repository/      # 数据访问层：JPA 接口
├── dto/             # 数据传输对象：请求/响应格式
├── service/         # 业务逻辑层：核心功能实现
├── controller/      # 控制器层：REST API 端点
├── config/          # 配置类：Security、CORS 等
└── security/        # 安全相关：JWT 认证
```

### 各层职责详解

| 层 | 职责 | 注解 |
|---|------|------|
| Entity | 映射数据库表 | `@Entity`, `@Table` |
| Repository | 数据库 CRUD 操作 | `@Repository` |
| DTO | 定义请求/响应数据格式 | 无特殊注解，普通 POJO |
| Service | 业务逻辑处理 | `@Service`, `@Transactional` |
| Controller | 接收 HTTP 请求 | `@RestController`, `@RequestMapping` |

---

## 二、Spring Data JPA Repository

### 基础用法

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // JpaRepository 自带方法：
    // - save(entity)        保存/更新
    // - findById(id)        根据 ID 查询
    // - findAll()           查询全部
    // - deleteById(id)      根据 ID 删除
    // - existsById(id)      判断是否存在
}
```

### 方法命名查询

JPA 会根据方法名自动生成 SQL：

```java
// 根据用户名查找
Optional<User> findByUsername(String username);
// 生成: SELECT * FROM users WHERE username = ?

// 根据首字母查找并排序
List<Artist> findByNameInitialOrderByNameAsc(String initial);
// 生成: SELECT * FROM artists WHERE name_initial = ? ORDER BY name ASC

// 模糊查询（忽略大小写）
List<Album> findByTitleContainingIgnoreCase(String title);
// 生成: SELECT * FROM albums WHERE LOWER(title) LIKE LOWER('%?%')

// 判断是否存在
boolean existsByEmail(String email);
// 生成: SELECT COUNT(*) > 0 FROM users WHERE email = ?
```

### 命名规则

| 关键字 | 示例 | 等价 SQL |
|--------|------|----------|
| `findBy` | `findByName` | `WHERE name = ?` |
| `And` | `findByNameAndAge` | `WHERE name = ? AND age = ?` |
| `Or` | `findByNameOrEmail` | `WHERE name = ? OR email = ?` |
| `OrderBy` | `findByAgeOrderByNameDesc` | `ORDER BY name DESC` |
| `Containing` | `findByNameContaining` | `WHERE name LIKE '%?%'` |
| `IgnoreCase` | `findByNameIgnoreCase` | `WHERE LOWER(name) = LOWER(?)` |
| `Between` | `findByAgeBetween` | `WHERE age BETWEEN ? AND ?` |
| `LessThan` | `findByAgeLessThan` | `WHERE age < ?` |
| `GreaterThan` | `findByAgeGreaterThan` | `WHERE age > ?` |

### 自定义 JPQL 查询

```java
@Query("SELECT a FROM Album a JOIN a.genres g WHERE g.id = :genreId ORDER BY a.title ASC")
List<Album> findByGenreId(@Param("genreId") Long genreId);

@Query("SELECT AVG(r.rating) FROM Review r WHERE r.album.id = :albumId")
Double getAverageRatingByAlbumId(@Param("albumId") Long albumId);
```

---

## 三、DTO 数据传输对象

### 为什么需要 DTO？

1. **隐藏敏感信息**：不暴露密码等字段
2. **控制响应格式**：只返回需要的字段
3. **参数校验**：在请求 DTO 上加校验注解
4. **解耦**：Entity 变化不影响 API 响应格式

### Request DTO 示例

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
```

### Response DTO 示例

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistResponse {

    private Long id;
    private String name;
    private String country;
    private Integer albumCount;

    // 从 Entity 转换为 DTO 的静态方法
    public static ArtistResponse fromEntity(Artist artist) {
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .country(artist.getCountry())
                .albumCount(artist.getAlbums().size())
                .build();
    }
}
```

### 常用校验注解

| 注解 | 用途 | 示例 |
|------|------|------|
| `@NotNull` | 不能为 null | `@NotNull private Long id;` |
| `@NotBlank` | 不能为空字符串 | `@NotBlank private String name;` |
| `@Size` | 长度限制 | `@Size(min=3, max=50)` |
| `@Email` | 邮箱格式 | `@Email private String email;` |
| `@Min` / `@Max` | 数值范围 | `@Min(0) @Max(5)` |
| `@DecimalMin` / `@DecimalMax` | 小数范围 | `@DecimalMax("5.0")` |
| `@Pattern` | 正则匹配 | `@Pattern(regexp="^[A-Z]+$")` |

---

## 四、Service 业务逻辑层

### 基本结构

```java
@Service
@RequiredArgsConstructor  // Lombok 自动生成构造函数注入
public class ArtistService {

    private final ArtistRepository artistRepository;

    public List<ArtistResponse> getAllArtists() {
        return artistRepository.findAllByOrderByNameAsc()
                .stream()
                .map(ArtistResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional  // 开启事务（写操作必须加）
    public ArtistResponse createArtist(ArtistRequest request) {
        Artist artist = Artist.builder()
                .name(request.getName())
                .country(request.getCountry())
                .build();
        Artist saved = artistRepository.save(artist);
        return ArtistResponse.fromEntity(saved);
    }
}
```

### @Transactional 注解

```java
@Transactional              // 默认：遇到 RuntimeException 回滚
@Transactional(readOnly = true)  // 只读事务，优化性能
@Transactional(rollbackFor = Exception.class)  // 所有异常都回滚
```

---

## 五、Controller REST API 层

### 基本结构

```java
@RestController                    // 返回 JSON 而非视图
@RequestMapping("/api/artists")    // 基础路径
@RequiredArgsConstructor
public class ArtistController {

    private final ArtistService artistService;

    @GetMapping                    // GET /api/artists
    public ResponseEntity<List<ArtistResponse>> getAllArtists() {
        return ResponseEntity.ok(artistService.getAllArtists());
    }

    @GetMapping("/{id}")           // GET /api/artists/123
    public ResponseEntity<?> getArtistById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(artistService.getArtistById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping                   // POST /api/artists
    public ResponseEntity<?> createArtist(@Valid @RequestBody ArtistRequest request) {
        return ResponseEntity.ok(artistService.createArtist(request));
    }

    @PutMapping("/{id}")           // PUT /api/artists/123
    public ResponseEntity<?> updateArtist(
            @PathVariable Long id,
            @Valid @RequestBody ArtistRequest request) {
        return ResponseEntity.ok(artistService.updateArtist(id, request));
    }

    @DeleteMapping("/{id}")        // DELETE /api/artists/123
    public ResponseEntity<?> deleteArtist(@PathVariable Long id) {
        artistService.deleteArtist(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
```

### HTTP 方法映射

| 注解 | HTTP 方法 | 用途 |
|------|-----------|------|
| `@GetMapping` | GET | 查询数据 |
| `@PostMapping` | POST | 创建数据 |
| `@PutMapping` | PUT | 更新数据（全量） |
| `@PatchMapping` | PATCH | 更新数据（部分） |
| `@DeleteMapping` | DELETE | 删除数据 |

### 参数注解

| 注解 | 来源 | 示例 |
|------|------|------|
| `@PathVariable` | URL 路径 | `/api/artists/{id}` → `@PathVariable Long id` |
| `@RequestParam` | URL 参数 | `/search?q=xxx` → `@RequestParam("q") String query` |
| `@RequestBody` | 请求体 JSON | `@RequestBody ArtistRequest request` |
| `@Valid` | 启用参数校验 | `@Valid @RequestBody ...` |

### ResponseEntity 常用方法

```java
ResponseEntity.ok(data)              // 200 OK
ResponseEntity.created(uri).build()  // 201 Created
ResponseEntity.noContent().build()   // 204 No Content
ResponseEntity.badRequest().body(error)  // 400 Bad Request
ResponseEntity.notFound().build()    // 404 Not Found
```

---

## 六、JWT 认证流程

### 认证流程图

```
┌──────────────────────────────────────────────────────────────┐
│                         客户端                                │
└─────────────────────────────┬────────────────────────────────┘
                              │
    1. POST /api/auth/login   │   { username, password }
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AuthController                            │
│    验证用户名密码 → 生成 JWT Token → 返回 Token              │
└─────────────────────────────┬───────────────────────────────┘
                              │
    2. 返回 Token             │   { token: "eyJhbG..." }
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         客户端                               │
│              保存 Token 到 localStorage                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
    3. 请求受保护的 API        │   Header: Authorization: Bearer eyJhbG...
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               JwtAuthenticationFilter                        │
│    解析 Token → 验证签名和过期 → 设置 SecurityContext        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Controller                               │
│                    处理业务逻辑                               │
└─────────────────────────────────────────────────────────────┘
```

### JWT Token 结构

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huIiwiaWF0IjoxNzA5MjIzNDU2fQ.abc123...
    │                      │                                      │
    │                      │                                      │
    ▼                      ▼                                      ▼
  Header               Payload                                Signature
  (算法)               (数据)                                  (签名)
```

### Spring Security 配置要点

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)       // 禁用 CSRF（前后端分离不需要）
            .cors(cors -> cors.configurationSource(...)) // 配置 CORS
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // 公开接口
                .anyRequest().authenticated()                  // 其他需要认证
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // 无状态
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## 七、完整 API 列表

### 认证 API (`/api/auth`)

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/register` | 用户注册 | ❌ |
| POST | `/login` | 用户登录 | ❌ |
| GET | `/me` | 获取当前用户 | ✅ |

### 艺术家 API (`/api/artists`)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/` | 获取所有艺术家 |
| GET | `/initial/{letter}` | 按首字母筛选 (A-Z, #) |
| GET | `/{id}` | 获取艺术家详情 |
| GET | `/search?q=xxx` | 搜索艺术家 |
| POST | `/` | 创建艺术家 |
| PUT | `/{id}` | 更新艺术家 |
| DELETE | `/{id}` | 删除艺术家 |

### 专辑 API (`/api/albums`)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/` | 获取所有专辑 |
| GET | `/initial/{letter}` | 按首字母筛选 |
| GET | `/{id}` | 获取专辑详情（含曲目、评分） |
| GET | `/artist/{artistId}` | 按艺术家筛选 |
| GET | `/genre/{genreId}` | 按流派筛选 |
| GET | `/year/{year}` | 按年份筛选 |
| GET | `/years` | 获取所有年份列表 |
| GET | `/search?q=xxx` | 搜索专辑 |
| POST | `/` | 创建专辑 |
| PUT | `/{id}` | 更新专辑 |
| DELETE | `/{id}` | 删除专辑 |

### 流派 API (`/api/genres`)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/` | 获取所有流派 |
| GET | `/{id}` | 获取流派详情 |

### 收藏 API (`/api/favorites`)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/` | 获取我的收藏 |
| GET | `/check/{albumId}` | 检查是否已收藏 |
| POST | `/{albumId}` | 添加收藏 |
| DELETE | `/{albumId}` | 取消收藏 |

### 评论 API (`/api/reviews`)

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/album/{albumId}` | 获取专辑评论列表 |
| GET | `/my` | 获取我的所有评论 |
| GET | `/my/{albumId}` | 获取我对某专辑的评论 |
| POST | `/` | 创建/更新评论 |
| DELETE | `/{id}` | 删除评论 |
| GET | `/stats/{albumId}` | 获取专辑评分统计 |

---

## 八、后端项目文件结构

```
backend/src/main/java/com/musicreview/
├── MusicReviewBackendApplication.java    # 启动类
├── config/
│   └── SecurityConfig.java               # Spring Security 配置
├── controller/
│   ├── AuthController.java               # 认证 API
│   ├── ArtistController.java             # 艺术家 API
│   ├── AlbumController.java              # 专辑 API
│   ├── GenreController.java              # 流派 API
│   ├── FavoriteController.java           # 收藏 API
│   └── ReviewController.java             # 评论 API
├── dto/
│   ├── auth/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   └── AuthResponse.java
│   ├── artist/
│   │   ├── ArtistRequest.java
│   │   └── ArtistResponse.java
│   ├── album/
│   │   ├── AlbumRequest.java
│   │   ├── AlbumResponse.java
│   │   └── TrackDTO.java
│   ├── genre/
│   │   └── GenreResponse.java
│   ├── favorite/
│   │   └── FavoriteResponse.java
│   └── review/
│       ├── ReviewRequest.java
│       └── ReviewResponse.java
├── entity/
│   ├── User.java
│   ├── Artist.java
│   ├── Album.java
│   ├── Genre.java
│   ├── Track.java
│   ├── Favorite.java
│   └── Review.java
├── repository/
│   ├── UserRepository.java
│   ├── ArtistRepository.java
│   ├── AlbumRepository.java
│   ├── GenreRepository.java
│   ├── TrackRepository.java
│   ├── FavoriteRepository.java
│   └── ReviewRepository.java
├── security/
│   ├── JwtUtils.java                     # JWT 工具类
│   ├── JwtAuthenticationFilter.java      # JWT 过滤器
│   ├── UserDetailsImpl.java
│   └── UserDetailsServiceImpl.java
└── service/
    ├── AuthService.java
    ├── ArtistService.java
    ├── AlbumService.java
    ├── GenreService.java
    ├── FavoriteService.java
    └── ReviewService.java
```

---

*更新日期：2026-01-31*
