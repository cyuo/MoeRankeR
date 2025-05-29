import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Subset, { ISubset } from '@/models/Subset';
import Character from '@/models/Character';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/a/subsets/[id]/characters - 获取分组中的角色
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[API_A_SUBSETS_ID_CHARACTERS_GET] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      console.log('[API_A_SUBSETS_ID_CHARACTERS_GET] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的分组ID' }, { status: 400 });
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 验证分页参数
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: '无效的页码' }, { status: 400 });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: '无效的每页数量' }, { status: 400 });
    }

    // 连接数据库
    await dbConnect();

    try {
      // 检查分组是否存在
      const subset = await Subset.findById(id).lean();
      if (!subset) {
        return NextResponse.json({ error: '分组未找到' }, { status: 404 });
      }

      // 获取分组中的角色IDs - 使用正确的类型断言
      const subsetData = subset as unknown as ISubset & { _id: string };
      const characterIds = subsetData.characters || [];
      
      // 计算总角色数
      const total = characterIds.length;
      const totalPages = Math.ceil(total / limit);
      
      // 分页获取角色
      const skip = (page - 1) * limit;
      
      // 改为直接查询数据库获取对应角色，而不是用slice方式
      // 这样可以确保与其他API的分页行为一致
      const characters = await Character.find({
        _id: { $in: characterIds }
      })
      .select('name gender image_url')
      .sort({ name: 1, _id: 1 }) // 添加排序确保分页结果唯一性
      .skip(skip)
      .limit(limit)
      .lean();
      
      console.log('[API_A_SUBSETS_ID_CHARACTERS_GET] 获取成功:', { 
        subsetId: id, 
        count: characters.length, 
        total 
      });
      
      return NextResponse.json({
        data: characters,
        currentPage: page,
        totalPages,
        totalCharacters: total
      });
    } catch (error) {
      console.error('[API_A_SUBSETS_ID_CHARACTERS_GET] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库获取角色' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_SUBSETS_ID_CHARACTERS_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 