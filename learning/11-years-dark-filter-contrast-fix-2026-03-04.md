# Years 页面黑夜模式筛选框对比度修复（2026-03-04）

## 1. 问题

`/music/years` 页面在黑夜模式下，筛选区搜索框与背景颜色过于接近，可读性差。

## 2. 解决思路

最小改动：

1. 给 Years 页面筛选行增加专用 class：`years-filters`  
2. 在 dark 主题下仅针对 `years-filters` 覆盖输入控件样式，提升对比度：
   - 更亮的输入底色（与卡片背景区分）
   - 更明显的边框颜色
   - 明确 placeholder 颜色
   - focus 态高亮边框与阴影

## 3. 变更文件

- `frontend/src/pages/Years.jsx`
- `frontend/src/index.css`

## 4. 结果

- 黑夜模式下年份搜索框、专辑名检索、乐队名检索、最小数量输入框均与背景有明显区分。
- 构建验证通过：`npm run build`
