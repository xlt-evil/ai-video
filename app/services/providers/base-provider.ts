/**
 * 视频生成 Provider 基础接口
 * 所有视频生成平台都应该实现这个接口
 */

/**
 * 视频任务信息
 */
export interface VideoTask {
  id: string;
  status: 'pending' | 'processing' | 'running' | 'succeeded' | 'failed' | string;
  videoUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

/**
 * 视频生成选项
 */
export interface VideoGenerationOptions {
  prompt: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  resolution?: '720p' | '1080p' | '2k';
  duration?: number;
  ratio?: '16:9' | '9:16' | '1:1';
  [key: string]: any;
}

/**
 * Provider 配置接口
 */
export interface ProviderConfig {
  apiKey: string;
  endpoint?: string;
  model?: string;
  [key: string]: any;
}

/**
 * Provider 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (task: VideoTask) => void;

/**
 * 基础 Video Provider 抽象类
 * 所有视频生成平台的实现都应该继承这个类
 */
export abstract class BaseVideoProvider {
  /**
   * Provider 名称（如 'volcengine', 'openai', 'runway'）
   */
  abstract name: string;

  /**
   * Provider 配置
   */
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * 创建视频生成任务
   * @param options 视频生成选项
   * @returns 返回任务 ID
   */
  abstract createTask(options: VideoGenerationOptions): Promise<{ id: string }>;

  /**
   * 获取任务状态
   * @param taskId 任务 ID
   * @returns 返回任务信息
   */
  abstract getTaskStatus(taskId: string): Promise<VideoTask>;

  /**
   * 验证配置是否有效
   * @returns 返回验证结果
   */
  abstract validateConfig(): ValidationResult;

  /**
   * 等待任务完成（通用实现）
   * @param taskId 任务 ID
   * @param onProgress 进度回调
   * @param maxWaitTime 最大等待时间（毫秒）
   * @returns 返回完成的任务信息
   */
  async waitForTask(
    taskId: string,
    onProgress?: ProgressCallback,
    maxWaitTime: number = 600000
  ): Promise<VideoTask> {
    const pollInterval = 3000; // 3 秒轮询一次
    const maxErrorRetries = 10; // 最多连续失败 10 次
    
    let queryCount = 0;
    let errorCount = 0;

    console.log(`🔄 [${this.name}] 开始轮询任务:`, taskId);

    while (true) {
      try {
        queryCount++;
        const task = await this.getTaskStatus(taskId);

        // 查询成功，重置错误计数
        errorCount = 0;

        console.log(`📊 [${this.name}] 第 ${queryCount} 次查询，状态: ${task.status}`);

        // 触发进度回调
        if (onProgress) {
          onProgress(task);
        }

        // 任务完成或失败
        if (task.status === 'succeeded' || task.status === 'failed') {
          console.log(`✅ [${this.name}] 任务完成 (共查询 ${queryCount} 次)`);
          return task;
        }

        // 继续轮询
        console.log(`⏳ [${this.name}] 任务进行中，${pollInterval / 1000}秒后继续查询...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        errorCount++;
        console.error(
          `❌ [${this.name}] 第 ${queryCount} 次查询失败 (连续失败 ${errorCount}/${maxErrorRetries} 次):`,
          error.message
        );

        // 连续失败多次则报错
        if (errorCount >= maxErrorRetries) {
          throw new Error(
            `[${this.name}] 连续查询失败 ${maxErrorRetries} 次，请检查网络连接和 API 配置`
          );
        }

        // 重试
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
  }

  /**
   * 获取 Provider 信息
   */
  getInfo() {
    return {
      name: this.name,
      config: this.config,
    };
  }
}

