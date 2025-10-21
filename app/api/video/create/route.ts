import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, endpoint, model, content } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少 API Key' },
        { status: 400 }
      );
    }

    console.log('🚀 代理创建视频任务:', {
      endpoint,
      model,
      contentLength: content?.length,
    });

    // 调用火山引擎 API
    const apiEndpoint = endpoint || 'https://ark.cn-beijing.volces.com/api/v3';
    const response = await fetch(`${apiEndpoint}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'doubao-seedance-1-0-pro-250528',
        content,
      }),
    });

    const responseText = await response.text();
    console.log('📡 API 响应状态:', response.status);

    if (!response.ok) {
      console.error('❌ API 错误:', responseText);
      return NextResponse.json(
        { error: `API 请求失败: ${responseText}` },
        { status: response.status }
      );
    }

    const result = JSON.parse(responseText);
    console.log('✅ 任务创建成功:', result.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ 代理请求失败:', error);
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    );
  }
}

