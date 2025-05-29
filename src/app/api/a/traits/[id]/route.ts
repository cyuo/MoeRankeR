import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Trait, { ITrait } from '@/models/Trait';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/a/traits/[id] - 获取单个萌属性
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[API_A_TRAITS_ID_GET] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      console.log('[API_A_TRAITS_ID_GET] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的萌属性ID' }, { status: 400 });
    }

    // 连接数据库
    await dbConnect();

    try {
      // 查询单个萌属性
      const trait = await Trait.findById(id).lean();
      
      if (!trait) {
        return NextResponse.json({ error: '萌属性未找到' }, { status: 404 });
      }
      
      console.log('[API_A_TRAITS_ID_GET] 获取成功:', { id });
      return NextResponse.json({ data: trait });
    } catch (error) {
      console.error('[API_A_TRAITS_ID_GET] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库获取萌属性' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_TRAITS_ID_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// PUT /api/a/traits/[id] - 更新萌属性
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid trait ID' }, { status: 400 });
    }

    await dbConnect();

    try {
      const body = await request.json();
      const { name, importance, moegirl_link } = body;

      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      // 检查更新后的名称是否与另一个已存在的特征冲突 (排除当前特征本身)
      const existingTraitWithSameName = await Trait.findOne({ name, _id: { $ne: id } });
      if (existingTraitWithSameName) {
        return NextResponse.json({ error: 'Another trait with this name already exists' }, { status: 409 });
      }

      const updateData: Partial<ITrait> = { name };
      if (importance !== undefined) updateData.importance = Number(importance);
      if (moegirl_link !== undefined) updateData.moegirl_link = String(moegirl_link);
      
      // Mongoose 的 findByIdAndUpdate 默认会运行 schema 验证
      const updatedTrait = await Trait.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

      if (!updatedTrait) {
        return NextResponse.json({ error: 'Trait not found or failed to update' }, { status: 404 });
      }

      // ====== 缓存同步逻辑 ======
      const redis = (await import('@/lib/dbConnect')).getRedisClient();
      const Character = mongoose.model('Character');
      const Subset = mongoose.model('Subset');
      // 找到所有引用此 trait 的角色
      const affectedCharacters = await Character.find({ traits: id }).select('_id subsets').lean();
      // 统计所有受影响的分组 id
      const affectedSubsetIds = new Set<string>();
      for (const char of affectedCharacters) {
        if (Array.isArray(char.subsets)) {
          char.subsets.forEach((sid: any) => affectedSubsetIds.add(String(sid)));
        }
      }
      // 更新每个受影响分组的缓存
      for (const subsetId of affectedSubsetIds) {
        const subset = await Subset.findById(subsetId).lean();
        if (!subset) continue;
        const characterIds = (subset as unknown as import('@/models/Subset').ISubset).characters || [];
        const charactersFromDB = await Character.find({ _id: { $in: characterIds } })
          .populate('traits')
          .lean();
        const formattedCharacters: Record<string, any> = {};
        const imageMapping: Record<string, string[]> = {};
        for (const char of charactersFromDB) {
          const charIdStr = String(char._id);
          const characterTraitsData: Record<string, { score: number; moegirl_link?: string }> = {};
          if (char.traits && Array.isArray(char.traits)) {
            char.traits.forEach((traitDoc: any) => {
              if (traitDoc && traitDoc.name) {
                characterTraitsData[traitDoc.name] = {
                  score: 1,
                  moegirl_link: traitDoc.moegirl_link
                };
              }
            });
          }
          formattedCharacters[charIdStr] = {
            id: charIdStr,
            name: char.name,
            gender: char.gender !== undefined ? char.gender : 2,
            traits: characterTraitsData,
            bgm_id: char.bangumi_id?.toString()
          };
          if (char.image_url) {
            imageMapping[charIdStr] = [char.image_url];
          } else {
            imageMapping[charIdStr] = [];
          }
        }
        await redis.set(`subset_${subsetId}_characters`, JSON.stringify({
          characters: formattedCharacters,
          mapping: imageMapping
        }));
      }
      // 同步 set 最新 subsets_overview
      const allSubsets = await Subset.find().select('slug display_name characters').lean();
      const formattedSubsets: Record<string, any> = {};
      for (const subset of allSubsets) {
        const subsetData = subset as any;
        const subsetId = subsetData._id.toString();
        const characterIds = (subset as unknown as import('@/models/Subset').ISubset).characters || [];
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
      // ====== 缓存同步逻辑 END ======

      return NextResponse.json({ message: 'Trait updated successfully', data: updatedTrait });
    } catch (error: any) {
      console.error('[API_A_TRAIT_ID_PUT] Database error:', error);
      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to update trait' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_TRAIT_ID_PUT] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/a/traits/[id] - 删除萌属性
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid trait ID' }, { status: 400 });
    }

    await dbConnect();

    try {
      // 获取萌属性信息，确认存在
      const trait = await Trait.findById(id);
      if (!trait) {
        return NextResponse.json({ error: 'Trait not found' }, { status: 404 });
      }

      // 引入Character模型以进行引用清理
      const Character = mongoose.model('Character');
      
      // 从所有引用此萌属性的角色中移除该属性引用
      await Character.updateMany(
        { traits: id },
        { $pull: { traits: id } }
      );
      
      console.log(`[API_A_TRAITS_ID_DELETE] 已从角色中清理萌属性引用: ${id}`);

      // 删除萌属性
      await Trait.findByIdAndDelete(id);
      
      return NextResponse.json({ message: 'Trait deleted successfully' });
    } catch (error) {
      console.error('[API_A_TRAIT_ID_DELETE] Database error:', error);
      return NextResponse.json({ error: 'Failed to delete trait from database' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_TRAIT_ID_DELETE] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 