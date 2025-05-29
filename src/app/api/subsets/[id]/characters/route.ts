import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subset from '@/models/Subset';
import Character from '@/models/Character';
import Trait from '@/models/Trait';
import mongoose from 'mongoose';
import { getRedisClient } from '@/lib/dbConnect';
import { verifyCaptcha } from '@/lib/captcha';

interface RouteParams {
  params: {
    id: string;
  };
}

// 临时的类型定义，用于解决 Linter 问题
interface PopulatedCharacter {
  _id: mongoose.Types.ObjectId;
  name: string;
  gender?: number;
  traits?: { name: string; moegirl_link?: string }[];
  bangumi_id?: number;
  image_url?: string;
  // 根据你的 Character 模型 lean() 对象可能包含的字段添加
}

// GET /api/subsets/[id]/characters - 获取指定分组的所有角色数据
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 校验临时 session token
  const sessionToken = request.headers.get('x-captcha-session');
  const redis = getRedisClient();
  if (!sessionToken) {
    return NextResponse.json({ error: '缺少人机验证凭证' }, { status: 401 });
  }
  const exists = await redis.get(`captcha_session:${sessionToken}`);
  if (!exists) {
    return NextResponse.json({ error: '人机验证已过期或无效，请刷新页面重试' }, { status: 401 });
  }

  // 先 await params
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const cacheKey = `subset_${id}_characters`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  try {
    console.log('[API_SUBSETS_ID_CHARACTERS_GET] 开始处理请求');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: '无效的分组ID' }, { status: 400 });
    }

    await dbConnect();

    try {
      const subset = await Subset.findById(id).lean();
      if (!subset) {
        return NextResponse.json({ error: '分组未找到' }, { status: 404 });
      }

      const subsetData = subset as any;
      const characterIds = subsetData.characters || [];
      
      if (characterIds.length === 0) {
        return NextResponse.json({ 
          characters: {},
          mapping: {}
        });
      }

      const charactersFromDB = await Character.find({
        _id: { $in: characterIds }
      })
      .populate<{ traits: { name: string; moegirl_link?: string }[] }>({
        path: 'traits',
        select: 'name moegirl_link'
      })
      .lean() as unknown as PopulatedCharacter[];

      const formattedCharacters: Record<string, any> = {};
      const imageMapping: Record<string, string[]> = {};

      for (const char of charactersFromDB) {
        const charIdStr = char._id.toString(); 
        
        const characterTraitsData: Record<string, { score: number; moegirl_link?: string }> = {};
        if (char.traits && Array.isArray(char.traits)) {
          char.traits.forEach((traitDoc) => {
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

      console.log('[API_SUBSETS_ID_CHARACTERS_GET] 查询成功:', { 
        subsetId: id, 
        charactersCount: charactersFromDB.length
      });

      await redis.set(cacheKey, JSON.stringify({
        characters: formattedCharacters,
        mapping: imageMapping
      }));

      return NextResponse.json({
        characters: formattedCharacters,
        mapping: imageMapping
      });
    } catch (error) {
      console.error('[API_SUBSETS_ID_CHARACTERS_GET] 数据库错误:', error);
      return NextResponse.json({ error: '无法从数据库获取角色' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_SUBSETS_ID_CHARACTERS_GET] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 