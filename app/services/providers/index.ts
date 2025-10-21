/**
 * Provider 工厂和导出
 * 用于创建和管理不同的视频生成 Provider
 */

import { BaseVideoProvider, ProviderConfig } from './base-provider';
import { VolcengineProvider, VolcengineConfig } from './volcengine-provider';

/**
 * 支持的 Provider 类型
 */
export type ProviderType = 'volcengine' | 'openai' | 'runway';

/**
 * Provider 工厂类
 * 用于创建不同类型的 Provider 实例
 */
export class ProviderFactory {
  /**
   * 创建 Provider 实例
   * @param type Provider 类型
   * @param config Provider 配置
   * @returns Provider 实例
   */
  static createProvider(type: ProviderType, config: ProviderConfig): BaseVideoProvider {
    switch (type) {
      case 'volcengine':
        return new VolcengineProvider(config as VolcengineConfig);
      
      case 'openai':
        // TODO: 实现 OpenAI Provider
        throw new Error('OpenAI Provider 尚未实现');
      
      case 'runway':
        // TODO: 实现 Runway Provider
        throw new Error('Runway Provider 尚未实现');
      
      default:
        throw new Error(`不支持的 Provider 类型: ${type}`);
    }
  }

  /**
   * 获取支持的 Provider 类型列表
   */
  static getSupportedProviders(): ProviderType[] {
    return ['volcengine', 'openai', 'runway'];
  }

  /**
   * 检查 Provider 是否已实现
   */
  static isProviderImplemented(type: ProviderType): boolean {
    return type === 'volcengine';
  }
}

// 导出所有类型和接口
export { BaseVideoProvider } from './base-provider';
export type {
  VideoTask,
  VideoGenerationOptions,
  ProviderConfig,
  ValidationResult,
  ProgressCallback,
} from './base-provider';
export { VolcengineProvider } from './volcengine-provider';
export type { VolcengineConfig } from './volcengine-provider';

