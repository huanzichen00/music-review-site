# 04 - 功能开发与样式优化

本文档记录了项目的新功能开发和样式优化过程。

---

## 一、样式与主题优化

### 1.1 暖色系主题配置

在 `App.jsx` 中配置 Ant Design 主题：

```javascript
const warmTheme = {
  token: {
    colorPrimary: '#D4A574',        // 焦糖色主色
    colorBgContainer: '#FFFBF7',    // 卡片背景
    colorBgLayout: '#FDF5ED',       // 页面背景
    colorText: '#5D4037',           // 主文字色
    colorTextSecondary: '#8D6E63',  // 次要文字色
    borderRadius: 8,
  },
  components: {
    Menu: {
      itemBg: 'transparent',
      itemColor: '#FFF8E7',
      itemSelectedColor: '#FFE4B5',
      itemSelectedBg: 'rgba(255, 228, 181, 0.2)',
    },
  },
};
```

**注意：** Ant Design 5.x 更新了 Menu 组件的 Token 名称：
- `colorItemBg` → `itemBg`
- `colorItemText` → `itemColor`
- `colorItemTextSelected` → `itemSelectedColor`
- `colorItemBgSelected` → `itemSelectedBg`

### 1.2 自定义字体

在 `index.html` 中引入 Google Fonts：

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
```

字体用途：
| 字体 | 用途 |
|------|------|
| Playfair Display | 英文标题 |
| Cormorant Garamond | 英文副标题、数字 |
| Noto Serif SC | 中文内容 |

### 1.3 字体粗细调整

为提高可读性，增加了全局字体粗细：

```css
body {
  font-weight: 500;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
}
```

---

## 二、新功能开发

### 2.1 Recent Reviews 模块

在首页显示最近的评论列表。

#### 后端实现

**Repository:**
```java
// ReviewRepository.java
List<Review> findTop10ByOrderByCreatedAtDesc();
```

**Service:**
```java
public List<ReviewResponse> getRecentReviews() {
    return reviewRepository.findTop10ByOrderByCreatedAtDesc().stream()
            .map(ReviewResponse::fromEntity)
            .collect(Collectors.toList());
}
```

**Controller:**
```java
@GetMapping("/recent")
public ResponseEntity<List<ReviewResponse>> getRecentReviews() {
    return ResponseEntity.ok(reviewService.getRecentReviews());
}
```

**Security 配置：**
```java
.requestMatchers(HttpMethod.GET, "/api/reviews/recent").permitAll()
```

#### 前端实现

```javascript
// api/reviews.js
getRecent: () => api.get('/reviews/recent'),

// Home.jsx
const [recentReviews, setRecentReviews] = useState([]);
const reviewsRes = await reviewsApi.getRecent();
setRecentReviews(reviewsRes.data);
```

### 2.2 评论回复功能

允许用户对评论进行回复。

#### 数据库设计

```sql
CREATE TABLE review_replies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 后端结构

```
dto/reply/
├── ReplyRequest.java      # 创建回复请求
└── ReplyResponse.java     # 回复响应

entity/
└── ReviewReply.java       # 回复实体

repository/
└── ReviewReplyRepository.java

service/
└── ReplyService.java

controller/
└── ReplyController.java
```

#### API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/replies/review/{reviewId}` | 获取评论的回复 |
| POST | `/api/replies` | 创建回复 |
| PUT | `/api/replies/{id}` | 更新回复 |
| DELETE | `/api/replies/{id}` | 删除回复 |

### 2.3 头像上传功能

支持用户上传图片文件作为头像。

#### 后端实现

**FileController.java:**
```java
@PostMapping("/avatar")
public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
    // 验证文件类型
    if (!file.getContentType().startsWith("image/")) {
        return ResponseEntity.badRequest().body(Map.of("error", "Only image files allowed"));
    }
    
    // 验证文件大小 (最大 5MB)
    if (file.getSize() > 5 * 1024 * 1024) {
        return ResponseEntity.badRequest().body(Map.of("error", "File too large"));
    }
    
    // 生成唯一文件名并保存
    String newFilename = UUID.randomUUID().toString() + extension;
    Path filePath = uploadPath.resolve(newFilename);
    Files.copy(file.getInputStream(), filePath);
    
    return ResponseEntity.ok(Map.of("url", "/api/files/avatars/" + newFilename));
}

@GetMapping("/avatars/{filename}")
public ResponseEntity<?> getAvatar(@PathVariable String filename) {
    // 返回图片文件
}
```

#### 前端实现

使用 Ant Design 的 Upload 组件：

```jsx
<Upload
  name="avatar"
  listType="picture-card"
  showUploadList={false}
  beforeUpload={handleUpload}
  accept="image/*"
>
  {avatarUrl ? <Avatar src={avatarUrl} /> : uploadButton}
</Upload>
```

---

## 三、部署与网络访问

### 3.1 局域网访问

在 `vite.config.js` 中启用局域网访问：

```javascript
server: {
  host: true,  // 监听所有网络接口
  port: 3000,
}
```

访问地址：`http://你的IP:3000`

### 3.2 ngrok 内网穿透

ngrok 可以将本地服务暴露到公网。

#### 安装
```bash
brew install ngrok
```

#### 配置 authtoken
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

#### 启动
```bash
ngrok http 3000 --domain=your-domain.ngrok-free.dev
```

#### Vite 配置

需要在 `vite.config.js` 中允许 ngrok 域名：

```javascript
server: {
  host: true,
  port: 3000,
  allowedHosts: ['.ngrok-free.dev', '.ngrok.io'],
}
```

---

## 四、常见问题

### 4.1 ngrok 域名被 Vite 拦截

**错误信息：**
```
Blocked request. This host is not allowed.
```

**解决方案：**
在 `vite.config.js` 的 `server.allowedHosts` 中添加 ngrok 域名。

### 4.2 Ant Design Menu Token 已弃用警告

**警告信息：**
```
Warning: Component Token `colorItemText` of Menu is deprecated.
```

**解决方案：**
使用新的 Token 名称：
- `colorItemBg` → `itemBg`
- `colorItemText` → `itemColor`
- `colorItemTextSelected` → `itemSelectedColor`
- `colorItemBgSelected` → `itemSelectedBg`

### 4.3 API 403 Forbidden 错误

**原因：** Spring Security 默认拦截所有请求。

**解决方案：** 在 `SecurityConfig.java` 中添加公开访问规则：

```java
.requestMatchers(HttpMethod.GET, "/api/reviews/recent").permitAll()
.requestMatchers(HttpMethod.GET, "/api/replies/review/**").permitAll()
.requestMatchers(HttpMethod.GET, "/api/files/**").permitAll()
```

---

## 五、项目当前功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户注册/登录 | ✅ | JWT 认证 |
| 专辑浏览 | ✅ | 按首字母筛选 |
| 专辑详情 | ✅ | 曲目列表、评分 |
| 专辑上传 | ✅ | MusicBrainz 导入 |
| 流派管理 | ✅ | 创建/查看流派 |
| 收藏功能 | ✅ | 添加/移除收藏 |
| 评论功能 | ✅ | 评分 + 文字评论 |
| 评论回复 | ✅ | 嵌套回复 |
| Recent Reviews | ✅ | 首页显示 |
| 用户资料 | ✅ | 头像上传、个人简介 |
| 暖色系主题 | ✅ | 全站统一风格 |
| 局域网访问 | ✅ | 同 WiFi 访问 |
| ngrok 部署 | ✅ | 公网访问 |
