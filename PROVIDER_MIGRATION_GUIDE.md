# Provider 模式迁移指南

## 🎉 迁移完成！

你的项目已经成功迁移到 Provider 模式架构。本指南说明了新架构的使用方法和如何扩展新的平台。

---

## 📁 新的项目结构

```
app/
├── services/
│   ├── providers/
│   │   ├── base-provider.ts          # ✨ 新增：基础 Provider 接口
│   │   ├── volcengine-provider.ts    # ✨ 新增：火山引擎 Provider 实现
│   │   └── index.ts                  # ✨ 新增：Provider 工厂和导出
│   ├── provider-manager.ts           # ✨ 新增：Provider 管理器
│   └── video-generation.ts           # 保留（向后兼容）
├── components/
│   ├── home.tsx                      # ✅ 已更新：使用 Provider 模式
│   ├── settings.tsx                  # ✅ 已更新：支持 Provider 管理
│   └── ...
└── ...
```

---

## 🚀 使用新的 Provider 模式

### 基本用法

```typescript
import { providerManager } from '@/app/services/provider-manager';
import { VideoGenerationOptions } from '@/app/services/providers';

// 获取默认 Provider
const provider = providerManager.getDefaultProvider();

// 创建视频生成任务
const options: VideoGenerationOptions = {
  prompt: '生成一个日落视频',
  firstFrameUrl: 'https://...',
  lastFrameUrl: 'https://...',
  resolution: '1080p',
  duration: 5,
};

const task = await provider.createTask(options);

// 等待任务完成
const result = await provider.waitForTask(task.id, (progress) => {
  console.log('进度:', progress.status);
});

if (result.status === 'succeeded') {
  console.log('视频 URL:', result.videoUrl);
}
```

### 管理多个 Provider

```typescript
// 添加新的 Provider 配置
const providerId = providerManager.addProvider(
  'volcengine',
  {
    apiKey: 'your-api-key',
    endpoint: 'https://...',
  },
  'My Volcengine Config',
  true // 设为默认
);

// 列出所有 Provider
const providers = providerManager.listProviders();
console.log(providers);

// 获取指定 Provider
const provider = providerManager.getProvider(providerId);

// 设置默认 Provider
providerManager.setDefaultProvider(providerId);

// 删除 Provider
providerManager.removeProvider(providerId);
```

---

## 🔌 添加新的 Provider（如 OpenAI）

### 第 1 步：创建 Provider 类

创建文件 `app/services/providers/openai-provider.ts`：

```typescript
import {
  BaseVideoProvider,
  VideoGenerationOptions,
  VideoTask,
  ValidationResult,
} from './base-provider';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  [key: string]: any;
}

export class OpenAIProvider extends BaseVideoProvider {
  name = 'openai';
  protected config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    super(config);
    this.config = config;
  }

  async createTask(options: VideoGenerationOptions): Promise<{ id: string }> {
    // 实现 OpenAI 特定的逻辑
    const response = await fetch('https://api.openai.com/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        model: this.config.model || 'gpt-4-vision',
      }),
    });

    const data = await response.json();
    return { id: data.id };
  }

  async getTaskStatus(taskId: string): Promise<VideoTask> {
    // 实现状态查询逻辑
    const response = await fetch(
      `https://api.openai.com/v1/videos/generations/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      videoUrl: data.video_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  validateConfig(): ValidationResult {
    const errors: string[] = [];
    if (!this.config.apiKey) {
      errors.push('API Key 不能为空');
    }
    return { valid: errors.length === 0, errors };
  }
}
```

### 第 2 步：在工厂中注册

编辑 `app/services/providers/index.ts`：

```typescript
import { OpenAIProvider, OpenAIConfig } from './openai-provider';

export class ProviderFactory {
  static createProvider(type: ProviderType, config: ProviderConfig): BaseVideoProvider {
    switch (type) {
      case 'volcengine':
        return new VolcengineProvider(config as VolcengineConfig);
      
      case 'openai':
        return new OpenAIProvider(config as OpenAIConfig);  // ✨ 新增
      
      case 'runway':
        throw new Error('Runway Provider 尚未实现');
      
      default:
        throw new Error(`不支持的 Provider 类型: ${type}`);
    }
  }

  static isProviderImplemented(type: ProviderType): boolean {
    return type === 'volcengine' || type === 'openai';  // ✨ 更新
  }
}
```

### 第 3 步：使用新的 Provider

```typescript
// 添加 OpenAI Provider
providerManager.addProvider(
  'openai',
  { apiKey: 'sk-...' },
  'OpenAI Video Generation',
  false
);

// 切换到 OpenAI Provider
const openaiProvider = providerManager.getProvider('openai_...');
const task = await openaiProvider.createTask({
  prompt: '生成一个日落视频',
});
```

---

## 🔄 向后兼容性

旧的 `video-generation.ts` 文件仍然保留，以确保向后兼容性。但建议逐步迁移到新的 Provider 模式。

### 旧方式（已弃用）

```typescript
import { createVideoTask, waitForTask } from '@/app/services/video-generation';
import { ArkConfig } from '@/app/config/volcengine';

const config: ArkConfig = { apiKey: '...' };
const task = await createVideoTask(config, prompt);
const result = await waitForTask(config, task.id);
```

### 新方式（推荐）

```typescript
import { providerManager } from '@/app/services/provider-manager';

const provider = providerManager.getDefaultProvider();
const task = await provider.createTask({ prompt });
const result = await provider.waitForTask(task.id);
```

---

## 📊 Provider 接口

所有 Provider 都必须实现 `BaseVideoProvider` 接口：

```typescript
export abstract class BaseVideoProvider {
  abstract name: string;
  abstract createTask(options: VideoGenerationOptions): Promise<{ id: string }>;
  abstract getTaskStatus(taskId: string): Promise<VideoTask>;
  abstract validateConfig(): ValidationResult;
  async waitForTask(
    taskId: string,
    onProgress?: ProgressCallback,
    maxWaitTime?: number
  ): Promise<VideoTask>;
}
```

---

## 🎯 最佳实践

### 1. 总是验证配置

```typescript
const validation = provider.validateConfig();
if (!validation.valid) {
  console.error('配置错误:', validation.errors);
}
```

### 2. 使用进度回调

```typescript
const result = await provider.waitForTask(taskId, (progress) => {
  console.log(`进度: ${progress.status}`);
  updateUI(progress);
});
```

### 3. 处理错误

```typescript
try {
  const task = await provider.createTask(options);
} catch (error) {
  console.error('创建任务失败:', error);
  // 显示用户友好的错误信息
}
```

### 4. 管理多个配置

```typescript
// 为不同的用途创建多个配置
providerManager.addProvider('volcengine', config1, 'Production', true);
providerManager.addProvider('volcengine', config2, 'Testing', false);

// 根据需要切换
providerManager.setDefaultProvider(productionId);
```

---

## 🧪 测试

### 测试新 Provider

```typescript
// 验证 Provider 是否正确实现
const provider = new MyNewProvider(config);

// 1. 验证配置
const validation = provider.validateConfig();
console.assert(validation.valid, '配置验证失败');

// 2. 创建任务
const task = await provider.createTask({ prompt: 'test' });
console.assert(task.id, '任务创建失败');

// 3. 查询状态
const status = await provider.getTaskStatus(task.id);
console.assert(status.id === task.id, '状态查询失败');

// 4. 等待完成
const result = await provider.waitForTask(task.id);
console.assert(result.status === 'succeeded', '任务未完成');
```

---

## 📝 总结

✅ **已完成的改进：**
- ✨ 实现了 Provider 模式架构
- ✨ 支持多个平台配置
- ✨ 易于添加新的平台
- ✨ 保持向后兼容性
- ✨ 改进了代码组织

**下一步：**
- 实现 OpenAI Provider
- 实现 Runway Provider
- 添加更多平台支持
- 编写单元测试

---

**祝你使用愉快！🚀**

