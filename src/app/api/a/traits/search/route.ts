import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Trait from '@/models/Trait';
import dbConnect from '@/lib/dbConnect';

// GET /api/a/traits/search - 搜索萌属性
export async function GET(request: NextRequest) {
  try {
    console.log('[API_A_TRAITS_SEARCH_GET] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      console.log('[API_A_TRAITS_SEARCH_GET] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 连接数据库
    await dbConnect();

    // 获取搜索参数
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    console.log('[API_A_TRAITS_SEARCH_GET] 搜索参数:', { query, limit });

    if (!query) {
      return NextResponse.json({ error: '搜索查询不能为空' }, { status: 400 });
    }

    try {
      // 执行模糊搜索
      const traits = await Trait.find({ 
        name: { $regex: query, $options: 'i' } 
      })
      .limit(limit)
      .lean();

      console.log('[API_A_TRAITS_SEARCH_GET] 搜索结果:', { count: traits.length });

      return NextResponse.json({ 
        data: traits,
        count: traits.length 
      });
    } catch (error) {
      console.error('[API_A_TRAITS_SEARCH_GET] 数据库错误:', error);
      return NextResponse.json({ error: '搜索萌属性失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_TRAITS_SEARCH_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 