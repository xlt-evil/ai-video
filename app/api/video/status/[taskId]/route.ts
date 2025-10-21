import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId;
    const apiKey = req.headers.get('x-api-key');
    const endpoint = req.headers.get('x-endpoint') || 'https://ark.cn-beijing.volces.com/api/v3';

    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少 API Key' },
        { status: 400 }
      );
    }

    console.log('📊 代理查询任务状态:', taskId);

    // 调用火山引擎 API
    const response = await fetch(
      `${endpoint}/contents/generations/tasks/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ 查询失败:', responseText);
      return NextResponse.json(
        { error: `查询失败: ${responseText}` },
        { status: response.status }
      );
    }

    const result = JSON.parse(responseText);
    console.log('✅ 任务状态:', result.status);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ 查询请求失败:', error);
    return NextResponse.json(
      { error: `服务器错误: ${error.message}` },
      { status: 500 }
    );
  }
}

