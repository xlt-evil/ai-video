/**
 * 火山引擎视频生成 Provider 实现
 * 文档：https://www.volcengine.com/docs/82379/1520757
 */

import {
  BaseVideoProvider,
  VideoGenerationOptions,
  VideoTask,
  ValidationResult,
  ProviderConfig,
} from './base-provider';

/**
 * 火山引擎特定的配置
 */
export interface VolcengineConfig extends ProviderConfig {
  apiKey: string;
  endpoint?: string;
  model?: string;
  videoConfig?: {
    resolution?: '720p' | '1080p' | '2k';
    duration?: number;
    ratio?: '16:9' | '9:16' | '1:1';
    cameraFixed?: boolean;
    watermark?: boolean;
  };
  advanced?: {
    timeout?: number;
    maxRetries?: number;
    pollInterval?: number;
  };
}

/**
 * 火山引擎 Provider 实现
 */
export class VolcengineProvider extends BaseVideoProvider {
  name = 'volcengine';
  protected config: VolcengineConfig;

  constructor(config: VolcengineConfig) {
    super(config);
    this.config = config;
  }

  /**
   * 创建视频生成任务
   */
  async createTask(options: VideoGenerationOptions): Promise<{ id: string }> {
    const { prompt, firstFrameUrl, lastFrameUrl } = options;
    const endpoint = this.config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3';
    const videoConfig = this.config.videoConfig || {};

    // 构建完整的提示词（包含视频参数）
    let fullPrompt = prompt;
    if (videoConfig.resolution) {
      fullPrompt += ` --resolution ${videoConfig.resolution}`;
    }
    if (videoConfig.duration) {
      fullPrompt += ` --duration ${videoConfig.duration}`;
    }
    if (videoConfig.cameraFixed !== undefined) {
      fullPrompt += ` --camerafixed ${videoConfig.cameraFixed}`;
    }
    if (videoConfig.watermark !== undefined) {
      fullPrompt += ` --watermark ${videoConfig.watermark}`;
    }

    // 构建内容数组
    const content: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }> = [];

    // 添加文本提示词
    content.push({
      type: 'text',
      text: fullPrompt,
    });

    // 添加首帧图片
    if (firstFrameUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: firstFrameUrl },
      });
    }

    // 添加尾帧图片
    if (lastFrameUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: lastFrameUrl },
      });
    }

    console.log(`🚀 [${this.name}] 创建视频任务:`, {
      model: this.config.model || 'doubao-seedance-1-0-pro-250528',
      prompt: fullPrompt,
      hasApiKey: !!this.config.apiKey,
    });

    try {
      // 调用本地 API 代理
      const response = await fetch('/api/video/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.config.apiKey,
          endpoint,
          model: this.config.model || 'doubao-seedance-1-0-pro-250528',
          content,
        }),
      });

      console.log(`📡 [${this.name}] 响应状态:`, response.status, response.statusText);

      const result = await response.json();

      if (!response.ok) {
        console.error(`❌ [${this.name}] API 错误响应:`, result);
        throw new Error(result.error || `创建任务失败 (${response.status})`);
      }

      console.log(`✅ [${this.name}] 任务创建成功:`, result);
      return result;
    } catch (error: any) {
      console.error(`❌ [${this.name}] 请求失败:`, error);

      if (error.message === 'Failed to fetch') {
        throw new Error(
          '无法连接到服务器。请检查：\n' +
          '1. 开发服务器是否正在运行\n' +
          '2. 网络连接是否正常'
        );
      }
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<VideoTask> {
    const endpoint = this.config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3';

    try {
      const response = await fetch(`/api/video/status/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'x-endpoint': endpoint,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`❌ [${this.name}] 查询任务失败:`, result);
        throw new Error(result.error || `查询任务失败 (${response.status})`);
      }

      console.log(`📊 [${this.name}] 任务状态:`, result.status, result.id);

      // 转换为通用的 VideoTask 格式
      return {
        id: result.id,
        status: result.status,
        videoUrl: result.content?.video_url,
        error: result.error,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        metadata: {
          resolution: result.resolution,
          duration: result.duration,
          framespersecond: result.framespersecond,
          ratio: result.ratio,
          seed: result.seed,
          usage: result.usage,
        },
      };
    } catch (error: any) {
      console.error(`❌ [${this.name}] 查询请求失败:`, error);
      if (error.message === 'Failed to fetch') {
        throw new Error('无法连接到服务器，无法查询任务状态');
      }
      throw error;
    }
  }

  /**
   * 验证配置
   */
  validateConfig(): ValidationResult {
    const errors: string[] = [];

    if (!this.config.apiKey) {
      errors.push('API Key 不能为空');
    } else if (this.config.apiKey.length < 10) {
      errors.push('API Key 格式不正确');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

