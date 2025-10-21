/**
 * 火山引擎视频生成服务
 * 文档：https://www.volcengine.com/docs/82379/1520757
 */

import { ArkConfig } from '../config/volcengine';

export interface VideoTask {
  id: string;
  model: string;
  status: 'pending' | 'processing' | 'running' | 'succeeded' | 'failed' | string; // 支持所有可能的状态
  content?: {
    video_url: string;
  };
  usage?: {
    completion_tokens: number;
    total_tokens: number;
  };
  created_at: number;
  updated_at: number;
  seed?: number;
  resolution?: string;
  duration?: number;
  ratio?: string;
  framespersecond?: number;
  error?: string;
}

export interface CreateTaskRequest {
  model: string;
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

/**
 * 创建视频生成任务
 */
export async function createVideoTask(
  config: ArkConfig,
  prompt: string,
  firstFrameUrl?: string,
  lastFrameUrl?: string
): Promise<{ id: string }> {
  const endpoint = config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3';
  const videoConfig = config.videoConfig || {};

  // 构建内容数组
  const content: CreateTaskRequest['content'] = [];

  // 添加文本提示词（包含视频参数）
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

  content.push({
    type: 'text',
    text: fullPrompt,
  });

  // 如果有首帧图片，添加首帧
  if (firstFrameUrl) {
    content.push({
      type: 'image_url',
      image_url: {
        url: firstFrameUrl,
      },
    });
  }

  // 如果有尾帧图片，添加尾帧
  if (lastFrameUrl) {
    content.push({
      type: 'image_url',
      image_url: {
        url: lastFrameUrl,
      },
    });
  }

  // 发送请求到本地 API 代理
  console.log('🚀 创建视频任务:', {
    model: config.model || 'doubao-seedance-1-0-pro-250528',
    prompt: fullPrompt,
    hasApiKey: !!config.apiKey,
  });

  try {
    // 使用本地 API 路由代理请求，避免 CORS 问题
    const response = await fetch('/api/video/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: config.apiKey,
        endpoint,
        model: config.model || 'doubao-seedance-1-0-pro-250528',
        content,
      }),
    });

    console.log('📡 响应状态:', response.status, response.statusText);

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ API 错误响应:', result);
      throw new Error(result.error || `创建任务失败 (${response.status})`);
    }

    console.log('✅ 任务创建成功:', result);
    return result;
  } catch (error: any) {
    console.error('❌ 请求失败:', error);
    
    // 提供更友好的错误提示
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
 * 查询任务状态
 */
export async function getTaskStatus(
  config: ArkConfig,
  taskId: string
): Promise<VideoTask> {
  const endpoint = config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3';

  try {
    // 使用本地 API 路由代理请求
    const response = await fetch(`/api/video/status/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'x-endpoint': endpoint,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ 查询任务失败:', result);
      throw new Error(result.error || `查询任务失败 (${response.status})`);
    }

    console.log('📊 任务状态:', result.status, result.id);
    return result;
  } catch (error: any) {
    console.error('❌ 查询请求失败:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('无法连接到服务器，无法查询任务状态');
    }
    throw error;
  }
}

/**
 * 轮询任务直到完成
 */
export async function waitForTask(
  config: ArkConfig,
  taskId: string,
  onProgress?: (task: VideoTask) => void
): Promise<VideoTask> {
  const pollInterval = config.advanced?.pollInterval || 3000;
  const maxRetries = config.advanced?.maxRetries || 100;

  let queryCount = 0; // 查询次数（仅用于显示）
  let errorCount = 0; // 连续错误次数（用于判断是否真的失败）
  const maxErrorRetries = 10; // 最多连续失败10次
  
  console.log('🔄 开始轮询任务:', taskId);
  console.log('⚙️ 轮询配置: 间隔', pollInterval / 1000, '秒');
  
  while (true) { // 无限循环，只有成功/失败才退出
    try {
      queryCount++;
      const task = await getTaskStatus(config, taskId);
      
      // 查询成功，重置错误计数
      errorCount = 0;
      
      console.log(`📊 [第 ${queryCount} 次查询] 任务状态:`, task.status);
      
      // 触发进度回调
      if (onProgress) {
        onProgress(task);
      }

      // 只有明确的成功或失败状态才终止轮询
      if (task.status === 'succeeded') {
        console.log(`✅ 任务成功完成! (共查询 ${queryCount} 次)`);
        return task;
      }
      
      if (task.status === 'failed') {
        console.log(`❌ 任务失败! (共查询 ${queryCount} 次)`);
        return task;
      }

      // 对于 pending、processing、running 等所有进行中的状态，继续无限轮询
      console.log(`⏳ 任务进行中 (${task.status})，${pollInterval / 1000}秒后继续查询...`);
      
      // 等待后继续轮询
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error: any) {
      errorCount++;
      console.error(`❌ 第 ${queryCount} 次查询失败 (连续失败 ${errorCount}/${maxErrorRetries} 次):`, error.message);
      
      // 只有连续失败多次才真正报错
      if (errorCount >= maxErrorRetries) {
        throw new Error(`连续查询失败 ${maxErrorRetries} 次，请检查网络连接和API配置`);
      }
      
      console.log(`🔄 将在 ${pollInterval / 1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

/**
 * 下载视频
 */
export async function downloadVideo(videoUrl: string, filename: string = 'video.mp4') {
  const response = await fetch(videoUrl);
  const blob = await response.blob();
  
  // 创建下载链接
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

