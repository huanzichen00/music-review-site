# 登录限流与防爆破（2026-03-04）

## 1. 目标

给 `POST /api/auth/login` 增加基础防爆破能力，避免同一来源短时间内高频撞库。

## 2. 实现方案

采用后端内存限流（无外部依赖），按 `IP + 用户名` 维度统计失败次数：

- 窗口期：`app.auth.login.window-seconds`（默认 300 秒）
- 最大失败次数：`app.auth.login.max-attempts`（默认 8 次）
- 锁定时长：`app.auth.login.lock-seconds`（默认 900 秒）

超过阈值后返回 `429 Too Many Requests`，并返回：

```json
{
  "error": "Too many login attempts. Please try again later.",
  "retryAfterSeconds": 123
}
```

## 3. 关键代码位置

- 限流服务：
  - `backend/src/main/java/com/musicreview/service/LoginThrottleService.java`
- 登录入口接入限流：
  - `backend/src/main/java/com/musicreview/controller/AuthController.java`
- 配置项：
  - `backend/src/main/resources/application.properties`

## 4. 关键流程

1. 进入登录接口时，先读取客户端 IP（`X-Forwarded-For` -> `X-Real-IP` -> `RemoteAddr`）。
2. 组合限流 key：`ip|username`（username 转小写）。
3. 若已封禁，直接返回 429。
4. 登录失败：记录失败次数，触发封禁时返回 429。
5. 登录成功：清空该 key 的失败状态。

## 5. 当前方案边界

- 当前是单机内存限流，服务重启后计数会清空。
- 多实例部署时每个实例各自计数，不是全局共享。
- 若后续需要更强一致性，建议迁移到 Redis 方案（按 key 全局计数与 TTL）。
