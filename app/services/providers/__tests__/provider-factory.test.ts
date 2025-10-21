/**
 * Provider 工厂测试
 */

import { ProviderFactory, ProviderType } from '../index';
import { VolcengineProvider } from '../volcengine-provider';
import { VolcengineConfig } from '../../config/volcengine';

describe('ProviderFactory', () => {
  describe('createProvider', () => {
    it('应该创建 Volcengine Provider', () => {
      const config: VolcengineConfig = {
        apiKey: 'test-key',
        endpoint: 'https://test.com',
        model: 'test-model',
      };

      const provider = ProviderFactory.createProvider('volcengine', config);

      expect(provider).toBeInstanceOf(VolcengineProvider);
      expect(provider.name).toBe('volcengine');
    });

    it('应该抛出错误当 Provider 类型不支持', () => {
      const config = { apiKey: 'test-key' };

      expect(() => {
        ProviderFactory.createProvider('unsupported' as ProviderType, config);
      }).toThrow('不支持的 Provider 类型');
    });

    it('应该抛出错误当 OpenAI Provider 未实现', () => {
      const config = { apiKey: 'test-key' };

      expect(() => {
        ProviderFactory.createProvider('openai', config);
      }).toThrow('OpenAI Provider 尚未实现');
    });

    it('应该抛出错误当 Runway Provider 未实现', () => {
      const config = { apiKey: 'test-key' };

      expect(() => {
        ProviderFactory.createProvider('runway', config);
      }).toThrow('Runway Provider 尚未实现');
    });
  });

  describe('isProviderImplemented', () => {
    it('应该返回 true 当 Provider 已实现', () => {
      expect(ProviderFactory.isProviderImplemented('volcengine')).toBe(true);
    });

    it('应该返回 false 当 Provider 未实现', () => {
      expect(ProviderFactory.isProviderImplemented('openai')).toBe(false);
      expect(ProviderFactory.isProviderImplemented('runway')).toBe(false);
    });
  });
});

