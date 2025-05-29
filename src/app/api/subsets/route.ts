import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subset from '@/models/Subset';
import Character from '@/models/Character';
import { getRedisClient } from '@/lib/dbConnect';

// GET /api/subsets - 获取所有分组的基本信息，用于前端展示
export async function GET(request: NextRequest) {
  const redis = getRedisClient();
  const cacheKey = 'subsets_overview';
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('[API_SUBSETS_GET] 命中缓存');
    return NextResponse.json(JSON.parse(cached));
  }
  console.log('[API_SUBSETS_GET] 未命中缓存，查库');
  try {
    console.log('[API_SUBSETS_GET] 开始处理请求');
    
    // 连接数据库
    await dbConnect();

    try {
      // 查询所有分组，只返回基本信息
      const subsets = await Subset.find()
        .select('slug display_name characters')
        .lean();
      
      // 计算每个分组的角色性别和图片统计
      const formattedSubsets: Record<string, any> = {};
      
      for (const subset of subsets) {
        const subsetData = subset as any;
        const subsetId = subsetData._id.toString();
        // 计算分组中角色的统计信息
        const characterIds = subsetData.characters || [];
        let femaleCount = 0;
        let withImageCount = 0;
        
        // 查询所有女性角色数量
        if (characterIds.length > 0) {
          // 查询该分组中的女性角色数量
          const femaleCharCount = await Character.countDocuments({
            _id: { $in: characterIds },
            gender: 1  // 性别为女性
          });
          
          // 查询该分组中有图片的角色数量
          const withImageCharCount = await Character.countDocuments({
            _id: { $in: characterIds },
            image_url: { $exists: true, $ne: null }
          });
          
          femaleCount = femaleCharCount;
          withImageCount = withImageCharCount;
        }
        
        // 存储到结果对象中
        formattedSubsets[subsetId] = {
          name: subsetData.slug,
          displayName: subsetData.display_name,
          characters: characterIds,
          femaleCount,
          withImageCount
        };
      }
      
      console.log('[API_SUBSETS_GET] 查询成功:', { count: subsets.length });
      
      await redis.set(cacheKey, JSON.stringify(formattedSubsets));
      console.log('[API_SUBSETS_GET] 已写入缓存');
      return NextResponse.json(formattedSubsets);
    } catch (error) {
      console.error('[API_SUBSETS_GET] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库获取分组' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_SUBSETS_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { slug, display_name, characters } = body;
    if (!slug || !display_name) {
      return NextResponse.json({ error: 'slug 和 display_name 字段是必需的' }, { status: 400 });
    }
    // 检查 slug 是否唯一
    const exists = await Subset.findOne({ slug });
    if (exists) {
      return NextResponse.json({ error: 'slug 已存在' }, { status: 409 });
    }
    const newSubset = new Subset({ slug, display_name, characters: characters || [] });
    await newSubset.save();
    // 新建后查库并写入最新缓存
    const redis = getRedisClient();
    const subsets = await Subset.find().select('slug display_name characters').lean();
    // 统计逻辑与 GET 保持一致
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
    console.log('[API_SUBSETS_POST] 已写入最新缓存');
    return NextResponse.json({ message: '分组创建成功', data: newSubset });
  } catch (error) {
    return NextResponse.json({ error: '创建分组失败' }, { status: 500 });
  }
} 