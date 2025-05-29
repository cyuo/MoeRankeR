import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Character, { ICharacter } from '@/models/Character';
import Trait from '@/models/Trait'; // 导入Trait模型以便populate能正常工作
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { getRedisClient } from '@/lib/dbConnect';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/a/char/[id] - 获取单个角色
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('[API_A_CHAR_ID_GET] 开始处理请求:', params);
    const { user, session } = await validateRequest();
    if (!session) {
      console.log('[API_A_CHAR_ID_GET] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的角色ID' }, { status: 400 });
    }

    await dbConnect();

    try {
      // 使用populate获取关联的traits数据
      const character = await Character.findById(id)
        .populate('traits')
        .lean();
        
      if (!character) {
        return NextResponse.json({ error: '角色未找到' }, { status: 404 });
      }
      
      console.log('[API_A_CHAR_ID_GET] 获取成功:', { id });
      return NextResponse.json({ data: character });
    } catch (error) {
      console.error('[API_A_CHAR_ID_GET] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库获取角色' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_CHAR_ID_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// PUT /api/a/char/[id] - 更新角色
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('[API_A_CHAR_ID_PUT] 开始处理请求:', params);
    const { user, session } = await validateRequest();
    if (!session) {
      console.log('[API_A_CHAR_ID_PUT] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的角色ID' }, { status: 400 });
    }

    await dbConnect();

    try {
      const body = await request.json();
      console.log('[API_A_CHAR_ID_PUT] 请求体:', body);
      
      const { name, gender, bangumi_id, image_url, traits } = body;

      if (!name) {
        return NextResponse.json({ error: '角色名称是必需的' }, { status: 400 });
      }

      // 检查更新后的名称是否与另一个已存在的角色冲突 (排除当前角色本身)
      const existingCharacter = await Character.findOne({ name, _id: { $ne: id } });
      if (existingCharacter) {
        return NextResponse.json({ error: '另一个角色已使用此名称' }, { status: 409 });
      }

      const updateData: Partial<ICharacter> = {
        name,
        gender,
        bangumi_id,
        image_url,
        traits
      };
      
      // Mongoose 的 findByIdAndUpdate 默认会运行 schema 验证
      const updatedCharacter = await Character.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      ).populate('traits');

      if (!updatedCharacter) {
        return NextResponse.json({ error: '角色未找到或更新失败' }, { status: 404 });
      }

      // 角色更新成功后，失效所有包含该角色的 subset 缓存，并 set 最新缓存
      const redis = getRedisClient();
      const Subset = mongoose.model('Subset');
      const subsets = await Subset.find({ characters: id }).select('_id characters slug display_name').lean();
      for (const subset of subsets) {
        // 查库并 set 最新分组角色缓存
        const characterIds = subset.characters || [];
        const charactersFromDB = await Character.find({ _id: { $in: characterIds } })
          .populate('traits')
          .lean();
        const formattedCharacters: Record<string, any> = {};
        const imageMapping: Record<string, string[]> = {};
        for (const char of charactersFromDB) {
          const charIdStr = char._id.toString();
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
        await redis.set(`subset_${subset._id}_characters`, JSON.stringify({
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
            image_url: { $exists: true, $ne: null, $ne: '' }
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

      console.log('[API_A_CHAR_ID_PUT] 更新成功:', { id });
      return NextResponse.json({ message: '角色更新成功', data: updatedCharacter });
    } catch (error: any) {
      console.error('[API_A_CHAR_ID_PUT] 数据库错误:', error);
      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: '验证失败', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: '更新角色失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_CHAR_ID_PUT] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// DELETE /api/a/char/[id] - 删除角色
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('[API_A_CHAR_ID_DELETE] 开始处理请求:', params);
    const { user, session } = await validateRequest();
    if (!session) {
      console.log('[API_A_CHAR_ID_DELETE] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的角色ID' }, { status: 400 });
    }

    await dbConnect();

    try {
      // 获取角色信息，确认存在
      const character = await Character.findById(id);
      if (!character) {
        return NextResponse.json({ error: '角色未找到' }, { status: 404 });
      }

      // 角色删除成功后，失效所有包含该角色的 subset 缓存，并 set 最新缓存
      const redis = getRedisClient();
      const Subset = mongoose.model('Subset');
      const subsets = await Subset.find({ characters: id }).select('_id characters slug display_name').lean();
      for (const subset of subsets) {
        // 查库并 set 最新分组角色缓存
        const characterIds = subset.characters || [];
        const charactersFromDB = await Character.find({ _id: { $in: characterIds } })
          .populate('traits')
          .lean();
        const formattedCharacters: Record<string, any> = {};
        const imageMapping: Record<string, string[]> = {};
        for (const char of charactersFromDB) {
          const charIdStr = char._id.toString();
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
        await redis.set(`subset_${subset._id}_characters`, JSON.stringify({
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
            image_url: { $exists: true, $ne: null, $ne: '' }
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

      // 1. 从所有包含此角色的分组中移除该角色引用
      await Subset.updateMany(
        { characters: id },
        { $pull: { characters: id } }
      );
      // 2. 从角色自身移除所有 traits 引用（可选，防止脏数据）
      const CharacterModel = mongoose.model('Character');
      await CharacterModel.updateOne(
        { _id: id },
        { $set: { traits: [] } }
      );

      // 删除角色
      await Character.findByIdAndDelete(id);
      
      console.log('[API_A_CHAR_ID_DELETE] 删除成功:', { id });
      return NextResponse.json({ message: '角色删除成功' });
    } catch (error) {
      console.error('[API_A_CHAR_ID_DELETE] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库删除角色' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_CHAR_ID_DELETE] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 