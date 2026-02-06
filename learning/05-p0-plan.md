# P0 目标清单与14天节奏

## P0-1 统一返回体 + 全局异常
- `@RestControllerAdvice`
- 参数校验失败：400
- 未登录：401
- 资源不存在：404
- 重复操作：409

## P0-2 DTO 全覆盖（不要 Entity 直出）
- 请求 DTO：`CreateReviewRequest`
- 响应 DTO：`ReviewResponse`

## P0-3 评论接口打磨成“你亲手链路”
围绕你已经关注的：
- `getRecentReviews`
- `getReviewsByAlbum`
- 再加一个：`createReview`（发乐评）
做到：Controller → Service → Repo 你能讲清楚

## P0-4 分页 + 排序
- recent：按时间倒序
- album：按时间/评分可选
- 用 `Pageable`

## P0-5 数据库约束与索引（你最容易拿分）
- reviews：(user_id, album_id) 唯一约束（按规则）
- 索引：album_id、created_at、user_id
- 写在 README 里：为什么这么建

## P0-6 README“面试友好化”
加三段就行：
- 关键接口列表（含分页参数）
- 鉴权方式（Bearer JWT）
- 表结构关键设计（中间表、索引、唯一约束）

## 14 天节奏（每天 60–90 分钟就够）
- Day1-2：DTO + 全局异常
- Day3-5：发乐评链路（你亲手写）
- Day6-7：recent/album 评论查询分页排序
- Day8-9：索引/唯一约束 + 测试数据
- Day10-14：整理 README + 复盘（能讲）
