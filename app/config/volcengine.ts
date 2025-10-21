/**
 * 火山引擎视频生成配置
 * 文档：https://www.volcengine.com/docs/82379/1520757
 */

export interface ArkConfig {
  // API 凭证（必填）
  apiKey: string;
  
  // API 端点
  endpoint?: string;
  
  // 视频生成模型
  model?: string; // 默认：doubao-seedance-1-0-pro-250528
  
  // 视频配置
  videoConfig?: {
    resolution?: '720p' | '1080p' | '2k'; // 分辨率
    duration?: number; // 时长（秒）1-10
    ratio?: '16:9' | '9:16' | '1:1'; // 宽高比
    cameraFixed?: boolean; // 是否固定镜头
    watermark?: boolean; // 是否添加水印
  };
  
  // 高级配置
  advanced?: {
    timeout?: number; // 请求超时时间（毫秒）
    maxRetries?: number; // 最大重试次数
    pollInterval?: number; // 轮询间隔（毫秒）
  };
}

// 默认配置
export const defaultArkConfig: Partial<ArkConfig> = {
  endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
  model: 'doubao-seedance-1-0-pro-250528',
  videoConfig: {
    resolution: '1080p',
    duration: 5,
    ratio: '16:9',
    cameraFixed: false,
    watermark: false, // 默认不添加水印
  },
  advanced: {
    timeout: 300000, // 5分钟
    maxRetries: 3,
    pollInterval: 3000, // 3秒轮询一次
  },
};

// 从环境变量读取配置
export function getArkConfigFromEnv(): Partial<ArkConfig> {
  return {
    apiKey: process.env.ARK_API_KEY || '',
    endpoint: process.env.ARK_ENDPOINT,
    model: process.env.ARK_MODEL,
  };
}

// 验证配置是否完整
export function validateArkConfig(
  config: Partial<ArkConfig>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('API Key 不能为空');
  }

  if (config.apiKey && config.apiKey.length < 10) {
    errors.push('API Key 格式不正确');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// 兼容旧配置名称
export type VolcengineConfig = ArkConfig;
export const defaultVolcengineConfig = defaultArkConfig;
export const getVolcengineConfigFromEnv = getArkConfigFromEnv;
export const validateVolcengineConfig = validateArkConfig;

