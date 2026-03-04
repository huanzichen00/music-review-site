# Secure Cookie 与安全审计日志（2026-03-04）

## 1. 本次目标

1. 生产默认强制 `Secure Cookie`。  
2. 增加认证相关安全审计日志，便于追溯攻击行为。

## 2. 改动点

### 2.1 Secure Cookie 强制化

- `AuthController` 中 `app.auth.cookie-secure` 默认值改为 `true`
- 配置文件显式设置：`app.auth.cookie-secure=true`

效果：
- 登录/注册下发的 `auth_token` Cookie 默认带 `Secure`，仅 HTTPS 发送。

关键文件：
- `backend/src/main/java/com/musicreview/controller/AuthController.java`
- `backend/src/main/resources/application.properties`

### 2.2 安全审计日志

新增服务：
- `SecurityAuditService`（logger 名称：`SECURITY_AUDIT`）

接入事件：
- `register_success`
- `register_failed`
- `login_success`
- `login_failed`
- `login_blocked`
- `logout`

日志字段：
- `event`
- `username`
- `ip`
- `detail`

关键文件：
- `backend/src/main/java/com/musicreview/service/SecurityAuditService.java`
- `backend/src/main/java/com/musicreview/controller/AuthController.java`

## 3. 为什么这两项优先

1. `Secure Cookie` 可以避免 token 在明文 HTTP 链路被发送。  
2. 审计日志是安全追溯基础，后续封禁策略、告警策略都依赖它。

## 4. 后续可继续做

1. 将 `SECURITY_AUDIT` 输出到独立文件，接入日志采集/告警。  
2. 审计日志增加 `userAgent`、`requestId` 字段。  
3. 审计级别分层（`INFO` 正常事件、`WARN` 可疑事件）。  
