# Provider 模式实现示例

这是一个详细的实现指南，展示如何将现有的火山引擎集成重构为 Provider 模式，以支持多个视频生成平台。

## 📁 新的目录结构

```
app/
├── services/
│   ├── providers/
│   │   ├── base-provider.ts          # 基础接口
│   │   ├── volcengine-provider.ts    # 火山引擎实现
│   │   ├── openai-provider.ts        # OpenAI 实现（示例）
│   │   └── index.ts                  # 导出和工厂函数
│   ├── video-generation.ts           # 保持向后兼容
│   └── provider-manager.ts           # 平台管理器
├── config/
│   ├── volcengine.ts                 # 保持现有配置
│   └── provider-config.ts            # 新的多平台配置
└── ...
```

## 🔧 实现步骤

### 步骤 1：创建基础 Provider 接口

**文件：`app/services/providers/base-provider.ts`**

```typescript
export interface VideoTask {
  id: string;
  status: 'pending' | 'processing' | 'running' | 'succeeded' | 'failed';
  videoUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProviderConfig {
  apiKey: string;
  endpoint?: string;
  [key: string]: any;
}

export interface VideoGenerationOptions {
  prompt: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  resolution?: '720p' | '1080p' | '2k';
  duration?: number;
  ratio?: '16:9' | '9:16' | '1:1';
}

export abstract class BaseVideoProvider {
  abstract name: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract createTask(options: VideoGenerationOptions): Promise<{ id: string }>;
  abstract getTaskStatus(taskId: string): Promise<VideoTask>;
  abstract validateConfig(): { valid: boolean; errors: string[] };

  // 可选的通用方法
  async waitForTask(
    taskId: string,
    onProgress?: (task: VideoTask) => void,
    maxWaitTime: number = 600000
  ): Promise<VideoTask> {
    const startTime = Date.now();
    const pollInterval = 3000;

    while (Date.now() - startTime < maxWaitTime) {
      const task = await this.getTaskStatus(taskId);
      
      if (onProgress) {
        onProgress(task);
      }

      if (task.status === 'succeeded' || task.status === 'failed') {
        return task;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('任务超时');
  }
}
```

### 步骤 2：实现火山引擎 Provider

**文件：`app/services/providers/volcengine-provider.ts`**

```typescript
import { BaseVideoProvider, VideoTask, VideoGenerationOptions } from './base-provider';

export class VolcengineProvider extends BaseVideoProvider {
  name = 'volcengine';

  async createTask(options: VideoGenerationOptions): Promise<{ id: string }> {
    const { prompt, firstFrameUrl, lastFrameUrl, resolution, duration } = options;

    // 构建提示词
    let fullPrompt = prompt;
    if (resolution) fullPrompt += ` --resolution ${resolution}`;
    if (duration) fullPrompt += ` --duration ${duration}`;

    // 构建内容数组
    const content: any[] = [
      { type: 'text', text: fullPrompt }
    ];

    if (firstFrameUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: firstFrameUrl }
      });
    }

    if (lastFrameUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: lastFrameUrl }
      });
    }

    // 调用 API
    const response = await fetch('/api/video/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: this.config.apiKey,
        endpoint: this.config.endpoint,
        model: 'doubao-seedance-1-0-pro-250528',
        content
      })
    });

    if (!response.ok) {
      throw new Error(`创建任务失败: ${response.statusText}`);
    }

    return response.json();
  }

  async getTaskStatus(taskId: string): Promise<VideoTask> {
    const response = await fetch(`/api/video/status/${taskId}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.config.apiKey,
        'x-endpoint': this.config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3'
      }
    });

    if (!response.ok) {
      throw new Error(`查询任务失败: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      videoUrl: data.content?.video_url,
      error: data.error,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  validateConfig() {
    const errors: string[] = [];
    if (!this.config.apiKey) {
      errors.push('API Key 不能为空');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### 步骤 3：创建 Provider 工厂

**文件：`app/services/providers/index.ts`**

```typescript
import { BaseVideoProvider, ProviderConfig } from './base-provider';
import { VolcengineProvider } from './volcengine-provider';

export type ProviderType = 'volcengine' | 'openai' | 'runway';

export class ProviderFactory {
  private static providers: Record<ProviderType, typeof BaseVideoProvider> = {
    volcengine: VolcengineProvider,
    openai: VolcengineProvider, // 待实现
    runway: VolcengineProvider  // 待实现
  };

  static createProvider(
    type: ProviderType,
    config: ProviderConfig
  ): BaseVideoProvider {
    const ProviderClass = this.providers[type];
    if (!ProviderClass) {
      throw new Error(`不支持的平台: ${type}`);
    }
    return new ProviderClass(config);
  }

  static getSupportedProviders(): ProviderType[] {
    return Object.keys(this.providers) as ProviderType[];
  }
}

export { BaseVideoProvider, ProviderConfig, VideoTask, VideoGenerationOptions } from './base-provider';
```

### 步骤 4：创建 Provider 管理器

**文件：`app/services/provider-manager.ts`**

```typescript
import { ProviderFactory, ProviderType, BaseVideoProvider, ProviderConfig } from './providers';

export interface StoredProviderConfig extends ProviderConfig {
  id: string;
  type: ProviderType;
  name: string;
  isDefault: boolean;
  createdAt: number;
}

export class ProviderManager {
  private providers: Map<string, BaseVideoProvider> = new Map();
  private configs: Map<string, StoredProviderConfig> = new Map();
  private defaultProviderId: string = '';

  // 从 localStorage 加载配置
  loadConfigs() {
    const stored = localStorage.getItem('provider_configs');
    if (stored) {
      const configs = JSON.parse(stored) as StoredProviderConfig[];
      configs.forEach(config => {
        this.configs.set(config.id, config);
        if (config.isDefault) {
          this.defaultProviderId = config.id;
        }
      });
    }
  }

  // 保存配置
  saveConfigs() {
    const configs = Array.from(this.configs.values());
    localStorage.setItem('provider_configs', JSON.stringify(configs));
  }

  // 添加平台配置
  addProvider(type: ProviderType, config: ProviderConfig, name: string, isDefault: boolean = false) {
    const id = `${type}_${Date.now()}`;
    const storedConfig: StoredProviderConfig = {
      id,
      type,
      name,
      isDefault,
      createdAt: Date.now(),
      ...config
    };

    this.configs.set(id, storedConfig);
    const provider = ProviderFactory.createProvider(type, config);
    this.providers.set(id, provider);

    if (isDefault) {
      this.defaultProviderId = id;
    }

    this.saveConfigs();
    return id;
  }

  // 获取默认平台
  getDefaultProvider(): BaseVideoProvider {
    if (!this.defaultProviderId) {
      throw new Error('没有设置默认平台');
    }
    const provider = this.providers.get(this.defaultProviderId);
    if (!provider) {
      throw new Error('平台不存在');
    }
    return provider;
  }

  // 获取指定平台
  getProvider(id: string): BaseVideoProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`平台不存在: ${id}`);
    }
    return provider;
  }

  // 列出所有平台
  listProviders() {
    return Array.from(this.configs.values());
  }

  // 删除平台
  removeProvider(id: string) {
    this.configs.delete(id);
    this.providers.delete(id);
    if (this.defaultProviderId === id) {
      this.defaultProviderId = '';
    }
    this.saveConfigs();
  }
}

export const providerManager = new ProviderManager();
```

### 步骤 5：更新使用代码

**在 `home.tsx` 中使用：**

```typescript
import { providerManager } from '@/app/services/provider-manager';
import { VideoGenerationOptions } from '@/app/services/providers';

// 在 handleSendMessage 中
const handleSendMessage = async (content: string, imageData?: string) => {
  try {
    const provider = providerManager.getDefaultProvider();
    
    const options: VideoGenerationOptions = {
      prompt: content,
      firstFrameUrl: firstFrameUrl || undefined,
      lastFrameUrl: lastFrameUrl || undefined,
      resolution: '1080p',
      duration: 5
    };

    const task = await provider.createTask(options);
    
    // 等待任务完成
    const result = await provider.waitForTask(task.id, (task) => {
      // 更新进度
      console.log('任务状态:', task.status);
    });

    if (result.status === 'succeeded') {
      console.log('视频生成成功:', result.videoUrl);
    }
  } catch (error) {
    console.error('视频生成失败:', error);
  }
};
```

## 🎯 优势总结

✅ **易于扩展**：添加新平台只需实现 `BaseVideoProvider`  
✅ **配置管理**：支持多个平台并行配置  
✅ **代码复用**：通用的轮询逻辑在基类中  
✅ **类型安全**：完整的 TypeScript 类型支持  
✅ **向后兼容**：现有代码可逐步迁移  

## 📝 下一步

1. 创建上述文件
2. 逐步迁移现有代码
3. 添加新的平台实现（OpenAI、Runway 等）
4. 更新 UI 支持平台切换

