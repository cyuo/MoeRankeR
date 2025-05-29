import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Character from '@/models/Character';
import { escapeRegExp } from '@/lib/utils';

// GET - 获取角色列表
export async function GET(request: NextRequest) {
  try {
    // 验证会话
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    // 连接数据库
    await dbConnect();

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    // 构建查询条件
    const query: any = {};
    if (search) {
      query.name = { $regex: escapeRegExp(search), $options: 'i' };
    }

    // 计算总数和分页
    const totalCharacters = await Character.countDocuments(query);
    const totalPages = Math.ceil(totalCharacters / limit);
    const skip = (page - 1) * limit;

    // 查询角色
    const characters = await Character.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate('traits', 'name')
      .lean();

    return NextResponse.json({
      data: characters,
      totalCharacters,
      totalPages,
      currentPage: page,
      limit
    });
  } catch (error: any) {
    console.error('获取角色时出错:', error);
    return NextResponse.json(
      { message: '获取角色时出错', error: error.message },
      { status: 500 }
    );
  }
}

// POST - 创建新角色
export async function POST(request: NextRequest) {
  try {
    // 验证会话
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    // 连接数据库
    await dbConnect();

    // 获取请求体
    const body = await request.json();

    // 验证名称
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ message: '角色名称不能为空' }, { status: 400 });
    }

    // 检查是否已存在同名角色
    const existingCharacter = await Character.findOne({ name: body.name });
    if (existingCharacter) {
      return NextResponse.json(
        { message: `已存在名为 "${body.name}" 的角色` },
        { status: 409 }
      );
    }

    // 处理数值类型字段
    if (body.bangumi_id !== undefined && body.bangumi_id !== '') {
      body.bangumi_id = parseInt(body.bangumi_id, 10);
    }

    // 创建新角色
    const newCharacter = await Character.create(body);

    return NextResponse.json(
      { message: '角色创建成功', data: newCharacter },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('创建角色时出错:', error);
    return NextResponse.json(
      { message: '创建角色时出错', error: error.message },
      { status: 500 }
    );
  }
} 