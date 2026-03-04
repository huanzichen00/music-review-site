# 安全加固实战笔记（2026-03-04）

> 本文记录本项目从 `localStorage Token` 迁移到 `HttpOnly Cookie`，并继续加上 `CSRF + CORS 白名单` 的完整改动。

## 1. 背景与目标

之前前端把 JWT 放在 `localStorage`，再手动加 `Authorization: Bearer ...`。  
风险点是：一旦前端发生 XSS，攻击脚本可直接读取 token。

本次目标：
- 登录态改为 `HttpOnly Cookie`，减少 token 被 JS 读取风险
- 启用 CSRF 防护，避免“借 Cookie 发起伪造写请求”
- CORS 从 `*` 改成白名单，收紧跨域边界

## 2. 关键改动一览

### 2.1 JWT 改为 Cookie 承载

- 后端登录/注册成功后下发 `auth_token` Cookie（`HttpOnly`）
- 新增 `/api/auth/logout`，服务端清理 Cookie
- JWT 过滤器支持从 Cookie 读取 token（保留 Bearer 头兼容）
- 前端 Axios 开启 `withCredentials: true`，移除 `localStorage token` 注入逻辑

关键文件：
- `backend/src/main/java/com/musicreview/controller/AuthController.java`
- `backend/src/main/java/com/musicreview/security/JwtAuthenticationFilter.java`
- `frontend/src/api/axios.js`
- `frontend/src/context/AuthContext.jsx`

### 2.2 启用 CSRF（SPA 方案）

- `SecurityConfig` 启用 `CookieCsrfTokenRepository`
- 新增 `SpaCsrfCookieFilter`，确保后端给 SPA 写入 `XSRF-TOKEN` Cookie
- 前端 Axios 配置：
  - `xsrfCookieName = XSRF-TOKEN`
  - `xsrfHeaderName = X-XSRF-TOKEN`
- 登录/注册接口暂时豁免 CSRF（避免首次会话阶段拦截）

关键文件：
- `backend/src/main/java/com/musicreview/config/SecurityConfig.java`
- `backend/src/main/java/com/musicreview/config/SpaCsrfCookieFilter.java`
- `frontend/src/api/axios.js`

### 2.3 CORS 白名单化

- 从 `allowedOriginPattern("*")` 改为 `setAllowedOrigins(...)`
- 允许域名通过配置项维护：`app.cors.allowed-origins`

配置位置：
- `backend/src/main/resources/application.properties`

示例值：
```properties
app.cors.allowed-origins=http://localhost:5173,http://127.0.0.1:5173,https://guessband.cn,https://www.guessband.cn
```

## 3. 迁移时踩坑与注意点

1. 用 Cookie 鉴权后，`csrf.disable()` 不能继续保留，否则写接口可被跨站请求利用。
2. `allowCredentials=true` 时不能再配 `*` Origin，需要明确白名单。
3. 仅有 CSRF 仓库不够，SPA 场景还需要确保 `XSRF-TOKEN` Cookie 能及时下发。
4. 前端需统一走 Axios 实例，避免部分请求漏带 `withCredentials` 和 XSRF 头。

## 4. 最小验证清单

本次采用低负载验证：
- 前端：`npm run build`
- 后端：`./mvnw -DskipTests compile`
- 部署：`bash scripts/deploy_nginx.sh deploy`
- 健康检查：`/` 与 `/api/albums` 均返回正常

## 5. 下一步建议

1. 对登录接口加限流与失败锁定（防爆破）。
2. 增加安全响应头（CSP/HSTS/X-Frame-Options 等）。
3. 规划 `access token + refresh token` 的短周期与吊销机制。
