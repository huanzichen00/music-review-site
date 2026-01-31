# 问题排查与解决记录

本文档记录了项目开发过程中遇到的问题及其解决方案。

---

## 1. Spring Security 403 Forbidden 错误

### 问题描述
创建专辑后回到主页，显示 "Failed to load data"。浏览器控制台显示：
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
```

### 原因分析
Spring Security 默认配置下，所有 API 端点都需要认证。主页需要访问 `/api/albums` 和 `/api/genres`，但这些端点没有配置为公开访问。

### 解决方案
修改 `SecurityConfig.java`，将需要公开访问的 GET 请求端点添加到白名单：

```java
.authorizeHttpRequests(auth -> auth
    // Public endpoints
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/api/public/**").permitAll()
    .requestMatchers("/api/import/**").permitAll()
    // Public read access for albums, artists, genres, reviews
    .requestMatchers(HttpMethod.GET, "/api/albums").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/albums/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/artists").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/artists/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/genres").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/genres/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
    // All other endpoints require authentication
    .anyRequest().authenticated()
)
```

### 关键点
- 使用 `HttpMethod.GET` 只开放读取权限，写入操作仍需认证
- `/**` 通配符匹配子路径，如 `/api/albums/1`

---

## 2. CORS 跨域配置问题

### 问题描述
前端运行在 `localhost:3000` 或 `localhost:3001`，但 CORS 配置只允许特定端口，导致跨域请求被拒绝。

### 解决方案
使用 `addAllowedOriginPattern("*")` 允许所有来源：

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.addAllowedOriginPattern("*");  // 允许所有来源
    configuration.addAllowedMethod("*");         // 允许所有 HTTP 方法
    configuration.addAllowedHeader("*");         // 允许所有请求头
    configuration.setAllowCredentials(true);     // 允许携带凭证

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

### 注意事项
- 生产环境应该限制具体的域名，不要使用 `*`
- `setAllowCredentials(true)` 允许发送 Cookie 和 Authorization 头

---

## 3. ConcurrentModificationException 并发修改异常

### 问题描述
访问 `/api/genres` 时后端报错：
```
java.util.ConcurrentModificationException: null
```

### 原因分析
在 `GenreResponse.fromEntity()` 方法中直接访问了懒加载的集合：

```java
// 问题代码
.albumCount(genre.getAlbums() != null ? genre.getAlbums().size() : 0)
```

JPA 的懒加载集合（`@ManyToMany` 关系）在被访问时会触发数据库查询。当多个线程同时访问时，可能导致并发修改异常。

### 解决方案
避免在 DTO 转换时直接访问懒加载集合：

```java
public static GenreResponse fromEntity(Genre genre) {
    return GenreResponse.builder()
            .id(genre.getId())
            .name(genre.getName())
            .description(genre.getDescription())
            .albumCount(0)  // 避免访问懒加载集合
            .build();
}

// 如果需要 albumCount，使用单独的方法
public static GenreResponse fromEntity(Genre genre, int albumCount) {
    return GenreResponse.builder()
            .id(genre.getId())
            .name(genre.getName())
            .description(genre.getDescription())
            .albumCount(albumCount)
            .build();
}
```

### 更好的解决方案
使用 JPQL 查询直接获取计数：

```java
@Query("SELECT COUNT(a) FROM Album a JOIN a.genres g WHERE g.id = :genreId")
long countAlbumsByGenreId(@Param("genreId") Long genreId);
```

### 关键点
- **懒加载集合**：JPA 默认对 `@OneToMany` 和 `@ManyToMany` 使用懒加载
- **避免 N+1 问题**：不要在循环中访问懒加载集合
- **使用 DTO 投影**：通过查询直接获取需要的数据，而不是加载整个实体

---

## 4. 网易云音乐 API 限制

### 问题描述
尝试从网易云音乐导入专辑信息时，API 返回错误码 `-462`，提示需要登录验证。

### 原因分析
网易云音乐加强了 API 的反爬虫措施，直接调用其 API 需要登录认证。

### 解决方案
改用 **MusicBrainz** 开源音乐数据库 API：

```java
// 搜索专辑
String url = "https://musicbrainz.org/ws/2/release/?query=release:\"" 
    + albumName + "\" AND artist:\"" + artistName + "\"&fmt=json";

// 获取专辑详情（包含曲目）
String url = "https://musicbrainz.org/ws/2/release/" + mbid 
    + "?inc=recordings+artist-credits&fmt=json";
```

### MusicBrainz API 要点
- **免费使用**：无需 API Key
- **User-Agent 要求**：必须设置有意义的 User-Agent
- **请求限制**：每秒最多 1 个请求
- **数据丰富**：包含专辑、艺术家、曲目、时长等信息

---

## 5. Vite 代理配置

### 问题描述
前端使用相对路径 `/api` 调用后端，需要配置代理将请求转发到后端服务器。

### 配置方法
`vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

### 工作原理
1. 前端代码请求 `/api/albums`
2. Vite 开发服务器拦截以 `/api` 开头的请求
3. 将请求转发到 `http://localhost:8080/api/albums`
4. 返回后端响应给前端

### 注意事项
- 这只在开发环境有效
- 生产环境需要配置 Nginx 或其他反向代理

---

## 6. 专辑详情页 404 错误

### 问题描述
点击专辑进入详情页时，显示 "Failed to load album"，控制台报 404 错误。

### 原因分析
`AlbumResponse.fromEntity()` 方法访问了多个懒加载集合：
- `album.getTracks()`
- `album.getGenres()`
- `album.getReviews()`
- `album.getFavorites()`

这些集合在事务外被访问时会触发 `ConcurrentModificationException`，被 Controller 捕获后返回 404。

### 解决方案

#### 方案1：使用 JOIN FETCH 预加载关联数据

在 Repository 中添加专门的查询方法：

```java
@Query("SELECT a FROM Album a " +
       "LEFT JOIN FETCH a.artist " +
       "LEFT JOIN FETCH a.genres " +
       "WHERE a.id = :id")
Optional<Album> findByIdWithDetails(@Param("id") Long id);
```

Service 中使用新方法：

```java
@Transactional(readOnly = true)
public AlbumResponse getAlbumById(Long id) {
    Album album = albumRepository.findByIdWithDetails(id)
            .orElseThrow(() -> new RuntimeException("Album not found"));
    return AlbumResponse.fromEntity(album);
}
```

#### 方案2：安全复制集合

在 DTO 转换时使用 try-catch 包裹：

```java
List<TrackDTO> trackList = new ArrayList<>();
try {
    if (album.getTracks() != null) {
        for (Track track : new ArrayList<>(album.getTracks())) {
            trackList.add(TrackDTO.fromEntity(track));
        }
    }
} catch (Exception e) {
    // Ignore lazy loading errors
}
```

### 注意事项
- **避免多个集合的 JOIN FETCH**：同时 fetch 多个集合会产生笛卡尔积，导致数据重复
- **使用 @Transactional**：确保懒加载在事务内执行
- **考虑使用 @EntityGraph**：Spring Data JPA 提供的声明式预加载方式

### 相关概念

#### JOIN FETCH vs 普通 JOIN
```java
// 普通 JOIN - 只用于过滤，不加载关联数据
@Query("SELECT a FROM Album a JOIN a.genres g WHERE g.id = :id")

// JOIN FETCH - 同时加载关联数据到内存
@Query("SELECT a FROM Album a LEFT JOIN FETCH a.genres WHERE a.id = :id")
```

#### @EntityGraph 方式
```java
@EntityGraph(attributePaths = {"artist", "genres", "tracks"})
Optional<Album> findById(Long id);
```

---

## 7. Hibernate Schema Validation 失败

### 问题描述
启动后端时报错：
```
Schema-validation: missing column [avatar_url] in table [users]
```

### 原因分析
`application.properties` 中配置了 `spring.jpa.hibernate.ddl-auto=validate`，Hibernate 会验证数据库表结构是否与实体类匹配。当实体类添加了新字段但数据库表没有对应列时，验证失败。

### 解决方案

#### 方案1：修改 ddl-auto 为 update（开发环境）
```properties
spring.jpa.hibernate.ddl-auto=update
```
Hibernate 会自动添加缺失的列。

#### 方案2：手动执行 SQL（生产环境推荐）
```sql
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);
ALTER TABLE users ADD COLUMN bio TEXT;
```

### ddl-auto 选项说明
| 值 | 说明 | 使用场景 |
|---|------|---------|
| `none` | 不做任何操作 | 生产环境 |
| `validate` | 只验证，不修改 | 生产环境 |
| `update` | 自动添加缺失的列/表 | 开发环境 |
| `create` | 每次启动删除重建 | 测试 |
| `create-drop` | 启动时创建，关闭时删除 | 单元测试 |

### 最佳实践
- **开发环境**：使用 `update` 方便迭代
- **生产环境**：使用 `validate` + 手动 SQL 迁移
- **使用 Flyway/Liquibase**：专业的数据库版本管理工具

---

## 调试技巧

### 1. 检查后端日志
```bash
tail -f backend.log
grep -a "ERROR\|Exception" backend.log
```

### 2. 测试 API 响应
```bash
# 查看响应状态码
curl -v http://localhost:8080/api/genres

# 查看响应内容
curl -s http://localhost:8080/api/genres | python3 -m json.tool
```

### 3. 检查进程状态
```bash
# 查看占用端口的进程
lsof -i:8080

# 强制释放端口
lsof -ti:8080 | xargs kill -9
```

### 4. 清理重新构建
```bash
cd backend
./mvnw clean spring-boot:run
```

---

## 8. ngrok 域名被 Vite 拦截

### 问题描述
使用 ngrok 暴露本地服务后，访问 ngrok 域名时显示：
```
Blocked request. This host ("xxx.ngrok-free.dev") is not allowed.
```

### 原因分析
Vite 的安全机制默认只允许 `localhost` 访问，会拦截其他域名的请求。

### 解决方案
在 `vite.config.js` 中配置 `allowedHosts`：

```javascript
server: {
  host: true,
  port: 3000,
  allowedHosts: ['.ngrok-free.dev', '.ngrok.io'],
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    }
  }
}
```

### 注意事项
- 使用 `.ngrok-free.dev` 可以匹配所有 ngrok 子域名
- 也可以指定具体域名如 `xxx-xxx.ngrok-free.dev`

---

## 9. Ant Design Menu Token 已弃用警告

### 问题描述
控制台显示警告：
```
Warning: Component Token `colorItemText` of Menu is deprecated. Please use `itemColor` instead.
```

### 原因分析
Ant Design 5.x 版本更新了 Menu 组件的 Token 命名。

### 解决方案
更新主题配置中的 Token 名称：

```javascript
// 旧版（已弃用）
Menu: {
  colorItemBg: 'transparent',
  colorItemText: '#FFF8E7',
  colorItemTextSelected: '#FFE4B5',
  colorItemBgSelected: 'rgba(255, 228, 181, 0.2)',
}

// 新版
Menu: {
  itemBg: 'transparent',
  itemColor: '#FFF8E7',
  itemSelectedColor: '#FFE4B5',
  itemSelectedBg: 'rgba(255, 228, 181, 0.2)',
  itemHoverColor: '#FFE4B5',
  itemHoverBg: 'rgba(255, 228, 181, 0.1)',
}
```

### Token 对照表
| 旧 Token | 新 Token |
|----------|----------|
| `colorItemBg` | `itemBg` |
| `colorItemText` | `itemColor` |
| `colorItemTextSelected` | `itemSelectedColor` |
| `colorItemBgSelected` | `itemSelectedBg` |

---

## 10. ngrok authtoken 配置错误

### 问题描述
启动 ngrok 时报错：
```
ERROR: authentication failed: The authtoken you specified does not look like a proper ngrok authtoken.
```

### 原因分析
用户在配置 authtoken 时使用了字面值 `YOUR_AUTHTOKEN` 而不是实际的 token。

### 解决方案
1. 登录 https://dashboard.ngrok.com/get-started/your-authtoken
2. 复制实际的 authtoken（类似 `2abcd1234efgh5678...`）
3. 重新运行配置命令：
```bash
ngrok config add-authtoken 你的实际token
```

---

## 11. ngrok 免费账户需要创建域名

### 问题描述
启动 ngrok 时报错：
```
ERROR: Your account is requesting a dev domain that does not exist.
```

### 原因分析
ngrok 免费账户需要先在 dashboard 创建一个域名才能使用。

### 解决方案
1. 打开 https://dashboard.ngrok.com/domains
2. 点击 **Create Domain** 创建免费域名
3. 启动 ngrok 时指定域名：
```bash
ngrok http 3000 --domain=your-domain.ngrok-free.dev
```

---

## 常见错误速查表

| 错误 | 可能原因 | 解决方案 |
|------|----------|----------|
| 403 Forbidden | Security 配置未开放端点 | 添加 `.permitAll()` |
| CORS error | 跨域配置不正确 | 检查 `CorsConfiguration` |
| ConcurrentModificationException | 懒加载集合并发访问 | 避免直接访问懒加载集合 |
| Connection refused | 后端未启动 | 检查进程和端口 |
| 401 Unauthorized | Token 过期或无效 | 重新登录获取 Token |
| Blocked request (Vite) | 域名不在白名单 | 配置 `allowedHosts` |
| ngrok auth failed | authtoken 配置错误 | 重新配置正确的 token |
| Port already in use | 端口被占用 | `lsof -ti:PORT \| xargs kill -9` |
