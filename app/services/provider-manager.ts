/**
 * Provider 管理器
 * 用于管理多个 Provider 配置和实例
 */

import {
  ProviderFactory,
  ProviderType,
  BaseVideoProvider,
  ProviderConfig,
} from './providers';

/**
 * 存储的 Provider 配置
 */
export interface StoredProviderConfig extends ProviderConfig {
  id: string;
  type: ProviderType;
  name: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Provider 管理器类
 * 负责管理多个 Provider 的配置和实例
 */
export class ProviderManager {
  private providers: Map<string, BaseVideoProvider> = new Map();
  private configs: Map<string, StoredProviderConfig> = new Map();
  private defaultProviderId: string = '';
  private storageKey = 'provider_configs';

  constructor() {
    this.loadConfigs();
  }

  /**
   * 从 localStorage 加载配置
   */
  private loadConfigs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const configs = JSON.parse(stored) as StoredProviderConfig[];
        configs.forEach(config => {
          this.configs.set(config.id, config);
          
          // 创建 Provider 实例
          try {
            const provider = ProviderFactory.createProvider(config.type, config);
            this.providers.set(config.id, provider);
          } catch (error) {
            console.error(`无法创建 Provider ${config.type}:`, error);
          }

          // 记录默认 Provider
          if (config.isDefault) {
            this.defaultProviderId = config.id;
          }
        });
      }
    } catch (error) {
      console.error('加载 Provider 配置失败:', error);
    }
  }

  /**
   * 保存配置到 localStorage
   */
  private saveConfigs() {
    try {
      const configs = Array.from(this.configs.values());
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
    } catch (error) {
      console.error('保存 Provider 配置失败:', error);
    }
  }

  /**
   * 添加 Provider 配置
   */
  addProvider(
    type: ProviderType,
    config: ProviderConfig,
    name: string,
    isDefault: boolean = false
  ): string {
    // 检查 Provider 是否已实现
    if (!ProviderFactory.isProviderImplemented(type)) {
      throw new Error(`Provider ${type} 尚未实现`);
    }

    const id = `${type}_${Date.now()}`;
    const now = Date.now();

    const storedConfig: StoredProviderConfig = {
      id,
      type,
      name,
      isDefault,
      createdAt: now,
      updatedAt: now,
      ...config,
    };

    this.configs.set(id, storedConfig);

    // 创建 Provider 实例
    const provider = ProviderFactory.createProvider(type, config);
    this.providers.set(id, provider);

    // 如果设置为默认，更新默认 Provider
    if (isDefault) {
      // 取消其他 Provider 的默认标志
      this.configs.forEach(cfg => {
        if (cfg.id !== id) {
          cfg.isDefault = false;
        }
      });
      this.defaultProviderId = id;
    }

    this.saveConfigs();
    console.log(`✅ Provider ${name} (${type}) 已添加`);
    return id;
  }

  /**
   * 获取默认 Provider
   */
  getDefaultProvider(): BaseVideoProvider {
    if (!this.defaultProviderId) {
      throw new Error('没有设置默认 Provider，请先在设置中配置');
    }

    const provider = this.providers.get(this.defaultProviderId);
    if (!provider) {
      throw new Error('默认 Provider 不存在');
    }

    return provider;
  }

  /**
   * 获取指定 Provider
   */
  getProvider(id: string): BaseVideoProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider 不存在: ${id}`);
    }
    return provider;
  }

  /**
   * 列出所有 Provider 配置
   */
  listProviders(): StoredProviderConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * 删除 Provider
   */
  removeProvider(id: string) {
    this.configs.delete(id);
    this.providers.delete(id);

    // 如果删除的是默认 Provider，清空默认设置
    if (this.defaultProviderId === id) {
      this.defaultProviderId = '';
    }

    this.saveConfigs();
    console.log(`✅ Provider ${id} 已删除`);
  }

  /**
   * 设置默认 Provider
   */
  setDefaultProvider(id: string) {
    if (!this.configs.has(id)) {
      throw new Error(`Provider 不存在: ${id}`);
    }

    // 取消其他 Provider 的默认标志
    this.configs.forEach(cfg => {
      cfg.isDefault = cfg.id === id;
    });

    this.defaultProviderId = id;
    this.saveConfigs();
    console.log(`✅ 默认 Provider 已设置为: ${id}`);
  }

  /**
   * 更新 Provider 配置
   */
  updateProvider(id: string, config: Partial<ProviderConfig>) {
    const stored = this.configs.get(id);
    if (!stored) {
      throw new Error(`Provider 不存在: ${id}`);
    }

    // 更新配置
    Object.assign(stored, config, { updatedAt: Date.now() });

    // 重新创建 Provider 实例
    try {
      const provider = ProviderFactory.createProvider(stored.type, stored);
      this.providers.set(id, provider);
    } catch (error) {
      console.error(`无法更新 Provider ${id}:`, error);
      throw error;
    }

    this.saveConfigs();
    console.log(`✅ Provider ${id} 已更新`);
  }

  /**
   * 获取 Provider 信息
   */
  getProviderInfo(id: string) {
    const config = this.configs.get(id);
    if (!config) {
      throw new Error(`Provider 不存在: ${id}`);
    }
    return config;
  }

  /**
   * 清空所有 Provider
   */
  clearAll() {
    this.providers.clear();
    this.configs.clear();
    this.defaultProviderId = '';
    this.saveConfigs();
    console.log('✅ 所有 Provider 已清空');
  }
}

/**
 * 全局 Provider 管理器实例
 */
export const providerManager = new ProviderManager();

