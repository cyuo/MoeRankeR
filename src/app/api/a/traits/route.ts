import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Trait, { ITrait } from '@/models/Trait';
import dbConnect from '@/lib/dbConnect';

// GET /api/a/traits - 获取萌属性列表
export async function GET(request: NextRequest) {
  try {
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const searchQuery = searchParams.get('search') || '';

    const query: any = {};
    if (searchQuery) {
      query.name = { $regex: searchQuery, $options: 'i' }; // 不区分大小写搜索
    }

    try {
      const traits = await Trait.find(query)
        .sort({ createdAt: -1, _id: 1 }) // 添加_id作为第二排序条件，确保分页结果的稳定性
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(); // 使用 .lean() 获取普通JS对象，提高性能

      const totalTraits = await Trait.countDocuments(query);

      return NextResponse.json({
        data: traits,
        totalPages: Math.ceil(totalTraits / limit),
        currentPage: page,
        totalTraits,
      });
    } catch (error) {
      console.error('[API_A_TRAITS_GET] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch traits from database' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_TRAITS_GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/a/traits - 创建新的萌属性
export async function POST(request: NextRequest) {
  try {
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
      const body = await request.json();
      const { name, importance, moegirl_link } = body;

      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      // 检查名称是否已存在
      const existingTrait = await Trait.findOne({ name });
      if (existingTrait) {
        return NextResponse.json({ error: 'Trait with this name already exists' }, { status: 409 }); // 409 Conflict
      }

      const newTraitData: Partial<ITrait> = {
        name,
      };
      if (importance !== undefined) newTraitData.importance = Number(importance);
      if (moegirl_link !== undefined) newTraitData.moegirl_link = String(moegirl_link);

      const newTrait = new Trait(newTraitData);
      await newTrait.save();

      return NextResponse.json({ message: 'Trait created successfully', data: newTrait }, { status: 201 });
    } catch (error: any) {
      console.error('[API_A_TRAITS_POST] Database error:', error);
      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to create trait' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_TRAITS_POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 