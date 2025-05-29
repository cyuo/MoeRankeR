import { NextRequest, NextResponse } from 'next/server';

// GET /api/gender-types - 获取性别类型数据
export async function GET(request: NextRequest) {
  try {
    console.log('[API_GENDER_TYPES_GET] 开始处理请求');
    
    // 返回固定的性别类型数据
    const genderTypes = {
      '0': '男性',
      '1': '女性',
      '2': '无性别/未知'
    };
    
    return NextResponse.json(genderTypes);
  } catch (error) {
    console.error('[API_GENDER_TYPES_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 