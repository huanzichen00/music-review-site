# 联机猜乐队：本轮全房间禁止重复猜测（2026-03-04）

## 1. 需求

在联机模式中，任意玩家如果已经猜过某个乐队，本轮内其他玩家不能再重复猜该乐队。

## 2. 实现

后端在 `submitGuess` 里新增校验：

- 查询条件：`roomId + roundIndex + guessedArtistId`
- 若存在记录，直接抛错：`This band has already been guessed in this round`

这样规则在服务端统一生效，不依赖前端状态。

## 3. 变更文件

- `backend/src/main/java/com/musicreview/repository/GuessBandOnlineGuessRepository.java`
  - 新增：`existsByRoomIdAndRoundIndexAndGuessedArtistId(...)`
- `backend/src/main/java/com/musicreview/service/GuessBandOnlineService.java`
  - 在保存猜测前新增“本轮重复猜测”拦截

## 4. 结果

- 联机对战中，A 玩家猜过后，B 玩家在同一轮再猜同一乐队会被拒绝。
- 防止重复猜测消耗回合并提高规则一致性。
