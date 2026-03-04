# 安全响应头加固（2026-03-04）

## 1. 目标

为后端响应统一加上常见安全头，降低点击劫持、MIME 嗅探、信息泄露、部分 XSS 风险。

## 2. 本次新增的头

在 `SecurityConfig` 中统一启用：

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`（HTTPS 下生效）
- `Content-Security-Policy`（限制脚本、样式、图片、连接来源等）
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

关键文件：
- `backend/src/main/java/com/musicreview/config/SecurityConfig.java`

## 3. CSP 策略说明（当前版本）

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data: https:;
connect-src 'self' https:;
frame-ancestors 'none';
base-uri 'self';
object-src 'none'
```

说明：
- `style-src` 保留了 `'unsafe-inline'`，用于兼容现有前端样式注入。
- `connect-src` 允许 `https:`，兼容 HTTPS API/资源请求。
- 后续可进一步收紧（例如改 nonce/hash 方案，移除 `'unsafe-inline'`）。

## 4. 验证方式

1. 编译后端：
```bash
cd backend
./mvnw -DskipTests compile
```

2. 部署后检查响应头（示例）：
```bash
curl -I https://guessband.cn/api/albums
```

应看到新增的安全响应头。
