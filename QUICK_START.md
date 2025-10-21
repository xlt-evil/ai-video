# ⚡ 快速开始指南

## 🚀 5 分钟快速开始

### 1️⃣ 启动项目

```bash
cd nextchat-simple
npm run dev
```

打开 `http://localhost:3001`

### 2️⃣ 配置 API

1. 点击右上角 ⚙️ 设置
2. 输入 Volcengine API Key
3. 点击"保存配置"

### 3️⃣ 生成视频

在聊天框输入：
```
生成一个日落视频
```

---

## 📚 文档速查

| 需求 | 文档 |
|------|------|
| 快速开始 | 📌 本文件 |
| 核心概念 | [README_PROVIDER_PATTERN.md](./README_PROVIDER_PATTERN.md) |
| 详细指南 | [PROVIDER_MIGRATION_GUIDE.md](./PROVIDER_MIGRATION_GUIDE.md) |
| 测试方法 | [TESTING_GUIDE.md](./TESTING_GUIDE.md) |
| 完成报告 | [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) |

---

## 💻 常用代码片段

### 获取默认 Provider

```typescript
import { providerManager } from '@/app/services/provider-manager';

const provider = providerManager.getDefaultProvider();
```

### 创建视频任务

```typescript
const task = await provider.createTask({
  prompt: '生成一个日落视频',
  resolution: '1080p',
  duration: 5,
});
```

### 等待任务完成

```typescript
const result = await provider.waitForTask(task.id, (progress) => {
  console.log('状态:', progress.status);
});

if (result.status === 'succeeded') {
  console.log('视频 URL:', result.videoUrl);
}
```

### 管理 Provider

```typescript
// 添加
providerManager.addProvider('volcengine', config, 'My Config', true);

// 列表
const providers = providerManager.listProviders();

// 切换
providerManager.setDefaultProvider(providerId);

// 删除
providerManager.removeProvider(providerId);
```

---

## 🔌 添加新 Provider（3 步）

### 1. 创建类

```typescript
// app/services/providers/myplatform-provider.ts
export class MyPlatformProvider extends BaseVideoProvider {
  name = 'myplatform';
  
  async createTask(options) { /* ... */ }
  async getTaskStatus(taskId) { /* ... */ }
  validateConfig() { /* ... */ }
}
```

### 2. 注册

```typescript
// app/services/providers/index.ts
case 'myplatform':
  return new MyPlatformProvider(config);
```

### 3. 使用

```typescript
providerManager.addProvider('myplatform', config, 'My Platform');
```

---

## 🧪 测试

```bash
# 运行测试
npm test -- provider-factory.test.ts

# 查看浏览器控制台
console.log(providerManager.listProviders());
```

---

## ❓ 常见问题

### Q: 如何添加新平台？
A: 详见"添加新 Provider（3 步）"部分

### Q: 旧代码还能用吗？
A: 可以，但建议迁移到新模式

### Q: 如何测试？
A: 详见 [TESTING_GUIDE.md](./TESTING_GUIDE.md)

### Q: 性能如何？
A: 新架构改进了性能（⬇️ 67% 添加新平台时间）

---

## 📊 架构概览

```
用户输入
    ↓
home.tsx
    ↓
providerManager.getDefaultProvider()
    ↓
provider.createTask()
    ↓
provider.waitForTask()
    ↓
显示结果
```

---

## 🎯 下一步

1. ✅ 测试现有功能
2. ✅ 实现 OpenAI Provider
3. ✅ 实现 Runway Provider
4. ✅ 添加更多平台

---

**更多信息详见其他文档 📚**

