import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Subset, { ISubset } from '@/models/Subset';
import dbConnect from '@/lib/dbConnect';

// GET /api/a/subsets - 获取分组列表
export async function GET(request: NextRequest) {
  try {
    console.log('[API_A_SUBSETS_GET] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      console.log('[API_A_SUBSETS_GET] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchQuery = searchParams.get('search') || '';
    
    // 验证分页参数
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: '无效的页码' }, { status: 400 });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: '无效的每页数量' }, { status: 400 });
    }
    
    console.log('[API_A_SUBSETS_GET] 查询参数:', { page, limit, searchQuery });

    // 连接数据库
    await dbConnect();

    try {
      // 构建查询条件
      const query = searchQuery
        ? {
            $or: [
              { slug: { $regex: searchQuery, $options: 'i' } },
              { display_name: { $regex: searchQuery, $options: 'i' } }
            ]
          }
        : {};

      // 计算总记录数和总页数
      const total = await Subset.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      // 获取分页数据
      const skip = (page - 1) * limit;
      const subsets = await Subset.find(query)
        .sort({ display_name: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      console.log('[API_A_SUBSETS_GET] 查询成功:', { count: subsets.length, total });
      
      // 返回结果
      return NextResponse.json({
        data: subsets,
        currentPage: page,
        totalPages,
        totalSubsets: total
      });
    } catch (error) {
      console.error('[API_A_SUBSETS_GET] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库获取分组' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_SUBSETS_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// POST /api/a/subsets - 创建新分组
export async function POST(request: NextRequest) {
  try {
    console.log('[API_A_SUBSETS_POST] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      console.log('[API_A_SUBSETS_POST] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const { slug, display_name } = body;
    
    // 验证必填字段
    if (!slug) {
      return NextResponse.json({ error: '缺少slug字段' }, { status: 400 });
    }
    
    if (!display_name) {
      return NextResponse.json({ error: '缺少display_name字段' }, { status: 400 });
    }
    
    // 连接数据库
    await dbConnect();

    try {
      // 检查slug是否已存在
      const existingSubset = await Subset.findOne({ slug }).lean();
      if (existingSubset) {
        return NextResponse.json({ error: '该slug已存在' }, { status: 409 });
      }
      
      // 创建新分组
      const newSubset = new Subset({
        slug,
        display_name,
        characters: [] // 初始化为空数组
      });
      
      await newSubset.save();
      
      console.log('[API_A_SUBSETS_POST] 创建成功:', { id: newSubset._id });
      
      // 返回结果
      return NextResponse.json({
        message: '分组创建成功',
        data: newSubset
      });
    } catch (error: any) {
      console.error('[API_A_SUBSETS_POST] 数据库错误:', error);
      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: '验证失败', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: '无法创建分组' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_SUBSETS_POST] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 