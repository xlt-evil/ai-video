# NextChat Simple

一个基于 NextChat UI 设计的简化版聊天界面项目。

## 特点

- ✨ **保留优秀 UI**：完整保留了 NextChat 的美观界面设计
- 🎯 **简化架构**：移除了复杂的业务逻辑，代码结构清晰
- 🚀 **易于二开**：代码简洁，便于理解和扩展
- 📱 **响应式设计**：支持桌面和移动设备
- 🌗 **深色模式**：自动适配系统主题

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- SCSS Modules
- React Hooks

## 项目结构

```
app/
├── components/           # 组件目录
│   ├── home.tsx         # 主页容器
│   ├── sidebar.tsx      # 侧边栏
│   ├── chat.tsx         # 聊天界面
│   └── ui-lib.tsx       # UI 组件库
├── styles/              # 样式目录
│   ├── globals.scss     # 全局样式
│   └── animation.scss   # 动画样式
└── page.tsx             # 入口页面
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 生产构建

```bash
npm run build
npm start
```

## 火山引擎视频生成配置

本项目已集成火山引擎 AI 视频生成服务的配置界面。支持文生视频和图生视频功能。

**✨ 特性：**
- ✅ 内置 API 代理，解决 CORS 跨域问题
- ✅ 实时进度显示和状态更新
- ✅ 无限轮询任务状态（不会超时）
- ✅ 内嵌视频播放器和下载功能
- ✅ **首尾帧图生视频**：上传首帧+尾帧，生成流畅过渡动画
- ✅ **智能验证**：必须上传2张图片才能生成

### 快速开始

1. **获取 API Key**
   - 访问 [火山引擎控制台](https://console.volcengine.com/)
   - 在控制台中找到「API Key 管理」
   - 创建新的 API Key 或查看现有密钥

2. **配置方式选择**

   **方式一：UI 界面配置（推荐）**
   - 启动应用后，点击左下角 ⚙️ 设置按钮
   - 填写 API Key 和视频参数
   - 点击保存

   **方式二：环境变量配置**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件，填入您的 API Key
   npm run dev
   ```

3. **开始创作**

   **文生视频：**
   ```
   输入：生成一个日落海滩的视频
   ```

   **首尾帧图生视频：**
   1. 上传首帧图片
   2. 上传尾帧图片（必须2张）
   3. 输入描述词（可选）
   4. 点击发送

4. **参考文档**
   - [功能特性说明](./FEATURES.md) ⭐
   - [图生视频完整教程](./docs/IMAGE_TO_VIDEO_GUIDE.md)
   - [快速开始指南](./QUICKSTART.md)
   - [故障排查指南](./TROUBLESHOOTING.md)
   - [视频生成 API 文档](https://www.volcengine.com/docs/82379/1520757)
   - [查询任务状态文档](https://www.volcengine.com/docs/82379/1521309)

### 配置项说明

| 配置项 | 必填 | 说明 |
|-------|------|------|
| API Key | ✅ | 火山引擎 API 密钥 |
| 模型 | ❌ | doubao-seedance-1-0-pro-250528 |
| 分辨率 | ❌ | 720p/1080p/2k（默认：1080p） |
| 视频时长 | ❌ | 1-10 秒（默认：5秒） |
| 宽高比 | ❌ | 16:9/9:16/1:1（默认：16:9） |
| 镜头运动 | ❌ | 是否启用镜头运动（默认：是） |
| 水印 | ❌ | 是否添加水印（默认：**否**） |
| 轮询间隔 | ❌ | 查询任务状态间隔（默认：3000ms） |
| 超时时间 | ❌ | 请求超时（默认：300000ms/5分钟） |

## 🏗️ 架构说明

### API 代理架构

为了解决浏览器直接调用火山引擎 API 的 CORS 跨域问题，本项目使用 Next.js API Routes 作为代理：

```
浏览器 → Next.js API 路由 → 火山引擎 API
          (app/api/video/)
```

**API 路由：**
- `POST /api/video/create` - 创建视频生成任务
- `GET /api/video/status/[taskId]` - 查询任务状态

### 目录结构

```
app/
├── api/
│   └── video/
│       ├── create/
│       │   └── route.ts          # 创建任务代理
│       └── status/
│           └── [taskId]/
│               └── route.ts      # 查询状态代理
├── services/
│   └── video-generation.ts       # 视频生成服务
├── config/
│   └── volcengine.ts            # 配置管理
└── components/
    ├── home.tsx                 # 主逻辑
    ├── chat.tsx                 # 聊天界面
    └── settings.tsx             # 设置界面
```

## 二次开发指南

### 添加 AI API 集成

在 `app/components/home.tsx` 的 `handleSendMessage` 函数中，将模拟回复替换为真实的 API 调用：

```typescript
const handleSendMessage = async (content: string) => {
  // 添加你的 AI API 调用
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: content })
  });
  const data = await response.json();
  // 处理响应...
};
```

### 集成火山引擎视频生成

```typescript
import { createVideoTask, waitForTask } from '@/app/services/video-generation';

// 从 localStorage 读取配置
const config = JSON.parse(localStorage.getItem('ark_config') || '{}');

// 创建视频生成任务
const task = await createVideoTask(
  config,
  '无人机以极快速度穿越复杂障碍或自然奇观，带来沉浸式飞行体验',
  'https://example.com/image.png' // 可选：图片 URL
);

console.log('任务ID:', task.id);

// 等待任务完成
const result = await waitForTask(config, task.id, (task) => {
  console.log('任务状态:', task.status);
});

if (result.status === 'succeeded') {
  console.log('视频URL:', result.content.video_url);
}
```

### API 示例

**创建任务：**
```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seedance-1-0-pro-250528",
    "content": [{
      "type": "text",
      "text": "描述文本 --resolution 1080p --duration 5"
    }]
  }'
```

**查询任务：**
```bash
curl -X GET https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{id} \
  -H "Authorization: Bearer $ARK_API_KEY"
```

### 自定义样式

所有样式变量都定义在 `app/styles/globals.scss` 中，你可以轻松修改：

```scss
:root {
  --primary: rgb(29, 147, 171);  // 主题色
  --sidebar-width: 300px;         // 侧边栏宽度
  // ... 更多变量
}
```

### 添加新组件

在 `app/components/` 目录下创建新的组件文件，遵循现有的模块化结构。

## 与原版 NextChat 的区别

- ❌ 移除了复杂的状态管理（Zustand）
- ❌ 移除了多平台 API 集成
- ❌ 移除了插件系统
- ❌ 移除了账号认证
- ✅ 保留了核心 UI 组件
- ✅ 保留了响应式布局
- ✅ 保留了主题系统

## 许可证

本项目基于 MIT 许可证开源。

## 致谢

UI 设计来自 [NextChat](https://github.com/ChatGPTNextWeb/NextChat)
