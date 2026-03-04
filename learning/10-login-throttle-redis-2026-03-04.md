# 登录限流切换 Redis（2026-03-04）

## 1. 目标

把登录限流从“单机内存”升级为“Redis 共享计数”，解决重启丢失与多实例不一致问题。

## 2. 本次实现

- 增加依赖：`spring-boot-starter-data-redis`
- `LoginThrottleService` 改为：
  - 优先使用 Redis 进行失败计数与封禁 TTL
  - Redis 异常时自动回退到原内存限流（不影响可用性）

## 3. Redis key 设计

- 失败计数：`auth:login:fail:{ip|username}`
- 封禁标记：`auth:login:block:{ip|username}`

行为：
- 登录失败：`INCR failKey`，首次失败设置窗口期 TTL
- 超阈值：设置 `blockKey`（TTL=封禁时长）并清理 `failKey`
- 登录成功：删除 `failKey` 与 `blockKey`
- 查询封禁剩余：读取 `blockKey` TTL 作为 `retryAfterSeconds`

## 4. 配置项

在 `application.properties`：

```properties
app.auth.login.redis.enabled=true
spring.data.redis.host=127.0.0.1
spring.data.redis.port=6379
spring.data.redis.timeout=2s
```

可按环境覆盖：
- 开发环境无 Redis 时，可设 `app.auth.login.redis.enabled=false`

## 5. 关键文件

- `backend/pom.xml`
- `backend/src/main/java/com/musicreview/service/LoginThrottleService.java`
- `backend/src/main/resources/application.properties`
