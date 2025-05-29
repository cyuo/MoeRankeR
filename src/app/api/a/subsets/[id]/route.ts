import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Subset, { ISubset } from '@/models/Subset';
import Character from '@/models/Character';
import dbConnect, { getRedisClient } from '@/lib/dbConnect';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/a/subsets/[id] - 获取单个分组
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[API_A_SUBSETS_ID_GET] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      console.log('[API_A_SUBSETS_ID_GET] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的分组ID' }, { status: 400 });
    }

    // 连接数据库
    await dbConnect();

    try {
      // 查询单个分组
      const subset = await Subset.findById(id).lean();
      
      if (!subset) {
        return NextResponse.json({ error: '分组未找到' }, { status: 404 });
      }
      
      console.log('[API_A_SUBSETS_ID_GET] 获取成功:', { id });
      return NextResponse.json({ data: subset });
    } catch (error) {
      console.error('[API_A_SUBSETS_ID_GET] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库获取分组' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_SUBSETS_ID_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// PUT /api/a/subsets/[id] - 更新分组
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[API_A_SUBSETS_ID_PUT] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的分组ID' }, { status: 400 });
    }

    // 连接数据库
    await dbConnect();

    try {
      const body = await request.json();
      const { slug, display_name } = body;

      if (!slug) {
        return NextResponse.json({ error: 'slug字段是必需的' }, { status: 400 });
      }
      
      if (!display_name) {
        return NextResponse.json({ error: 'display_name字段是必需的' }, { status: 400 });
      }

      // 检查更新后的slug是否与另一个已存在的分组冲突 (排除当前分组本身)
      const existingSubsetWithSameSlug = await Subset.findOne({ slug, _id: { $ne: id } });
      if (existingSubsetWithSameSlug) {
        return NextResponse.json({ error: '该slug已被其他分组使用' }, { status: 409 });
      }

      const updateData: Partial<ISubset> = { 
        slug, 
        display_name 
      };
      
      // Mongoose 的 findByIdAndUpdate 默认会运行 schema 验证
      const updatedSubset = await Subset.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

      if (!updatedSubset) {
        return NextResponse.json({ error: '分组未找到或更新失败' }, { status: 404 });
      }

      // 缓存失效 -> 直接查库并写入最新缓存
      const redis = getRedisClient();
      const subsets = await Subset.find().select('slug display_name characters').lean();
      const formattedSubsets: Record<string, any> = {};
      for (const subset of subsets) {
        const subsetData = subset as any;
        const subsetId = subsetData._id.toString();
        const characterIds = subsetData.characters || [];
        let femaleCount = 0;
        let withImageCount = 0;
        if (characterIds.length > 0) {
          const femaleCharCount = await Character.countDocuments({
            _id: { $in: characterIds },
            gender: 1
          });
          const withImageCharCount = await Character.countDocuments({
            _id: { $in: characterIds },
            image_url: { $exists: true, $ne: null }
          });
          femaleCount = femaleCharCount;
          withImageCount = withImageCharCount;
        }
        formattedSubsets[subsetId] = {
          name: subsetData.slug,
          displayName: subsetData.display_name,
          characters: characterIds,
          femaleCount,
          withImageCount
        };
      }
      await redis.set('subsets_overview', JSON.stringify(formattedSubsets));
      console.log('[API_A_SUBSETS_ID_PUT] 已写入最新缓存');
      return NextResponse.json({ message: '分组更新成功', data: updatedSubset });
    } catch (error: any) {
      console.error('[API_A_SUBSETS_ID_PUT] 数据库错误:', error);
      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: '验证失败', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: '无法更新分组' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_SUBSETS_ID_PUT] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// DELETE /api/a/subsets/[id] - 删除分组
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[API_A_SUBSETS_ID_DELETE] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的分组ID' }, { status: 400 });
    }

    // 连接数据库
    await dbConnect();

    try {
      // 获取分组信息，确认存在
      const subset = await Subset.findById(id);
      if (!subset) {
        return NextResponse.json({ error: '分组未找到' }, { status: 404 });
      }

      // 1. 从所有包含此分组的角色中移除该分组引用（可选，防止脏数据）
      await Character.updateMany(
        { subsets: id },
        { $pull: { subsets: id } }
      );

      // 删除分组
      await Subset.findByIdAndDelete(id);
      // 缓存失效 -> 直接查库并写入最新缓存
      const redis = getRedisClient();
      const subsets = await Subset.find().select('slug display_name characters').lean();
      const formattedSubsets: Record<string, any> = {};
      for (const subset of subsets) {
        const subsetData = subset as any;
        const subsetId = subsetData._id.toString();
        const characterIds = subsetData.characters || [];
        let femaleCount = 0;
        let withImageCount = 0;
        if (characterIds.length > 0) {
          const femaleCharCount = await Character.countDocuments({
            _id: { $in: characterIds },
            gender: 1
          });
          const withImageCharCount = await Character.countDocuments({
            _id: { $in: characterIds },
            image_url: { $exists: true, $ne: null }
          });
          femaleCount = femaleCharCount;
          withImageCount = withImageCharCount;
        }
        formattedSubsets[subsetId] = {
          name: subsetData.slug,
          displayName: subsetData.display_name,
          characters: characterIds,
          femaleCount,
          withImageCount
        };
      }
      await redis.set('subsets_overview', JSON.stringify(formattedSubsets));
      console.log('[API_A_SUBSETS_ID_DELETE] 已写入最新缓存');
      return NextResponse.json({ message: '分组删除成功' });
    } catch (error) {
      console.error('[API_A_SUBSETS_ID_DELETE] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库删除分组' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_SUBSETS_ID_DELETE] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 