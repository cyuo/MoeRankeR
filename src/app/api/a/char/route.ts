import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Character, { ICharacter } from '@/models/Character';
import Trait from '@/models/Trait'; // 导入Trait模型以便populate能正常工作
import dbConnect from '@/lib/dbConnect';

// GET /api/a/char - 获取角色列表
export async function GET(request: NextRequest) {
  try {
    console.log('[API_A_CHAR_GET] 开始处理请求');
    const { user, session } = await validateRequest();
    console.log('[API_A_CHAR_GET] 验证结果:', { hasSession: !!session, userId: user?.id || 'none' });
    
    if (!session) {
      console.log('[API_A_CHAR_GET] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const searchQuery = searchParams.get('search') || '';

    console.log('[API_A_CHAR_GET] 查询参数:', { page, limit, searchQuery });

    const query: any = {};
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { name_cn: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    try {
      // 使用populate获取关联的traits数据
      const characters = await Character.find(query)
        .populate('traits')
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const totalCharacters = await Character.countDocuments(query);
      
      console.log('[API_A_CHAR_GET] 查询成功:', { count: characters.length, total: totalCharacters });

      return NextResponse.json({
        data: characters,
        totalPages: Math.ceil(totalCharacters / limit),
        currentPage: page,
        totalCharacters,
      });
    } catch (error) {
      console.error('[API_A_CHAR_GET] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库获取角色' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_CHAR_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// POST /api/a/char - 创建新角色
export async function POST(request: NextRequest) {
  try {
    console.log('[API_A_CHAR_POST] 开始处理请求');
    const { user, session } = await validateRequest();
    if (!session) {
      console.log('[API_A_CHAR_POST] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
      const body = await request.json();
      console.log('[API_A_CHAR_POST] 请求体:', body);
      
             const { name, gender, bangumi_id, image_url, traits } = body;

       if (!name) {
         return NextResponse.json({ error: '角色名称是必需的' }, { status: 400 });
       }

       // 检查名称是否已存在
       const existingCharacter = await Character.findOne({ name });
       
       if (existingCharacter) {
         return NextResponse.json({ error: '同名角色已存在' }, { status: 409 });
       }

       const newCharacterData: Partial<ICharacter> = {
         name,
         gender,
         bangumi_id,
         image_url,
         traits
       };

      const newCharacter = new Character(newCharacterData);
      await newCharacter.save();

      console.log('[API_A_CHAR_POST] 创建成功:', { id: newCharacter._id });
      return NextResponse.json({ message: '角色创建成功', data: newCharacter }, { status: 201 });
    } catch (error: any) {
      console.error('[API_A_CHAR_POST] 数据库错误:', error);
      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: '验证失败', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: '创建角色失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_CHAR_POST] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 