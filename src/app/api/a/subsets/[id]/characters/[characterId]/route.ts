import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import Subset from '@/models/Subset';
import Character from '@/models/Character';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
    characterId: string;
  };
}

// PUT /api/a/subsets/[id]/characters/[characterId] - 添加角色到分组
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; characterId: string }> }) {
  try {
    console.log('[API_A_SUBSETS_ID_CHARACTER_ID_PUT] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      console.log('[API_A_SUBSETS_ID_CHARACTER_ID_PUT] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id, characterId } = resolvedParams;

    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(characterId)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    // 连接数据库
    await dbConnect();

    try {
      // 检查分组和角色是否存在
      const [subset, character] = await Promise.all([
        Subset.findById(id),
        Character.findById(characterId)
      ]);
      
      if (!subset) {
        return NextResponse.json({ error: '分组未找到' }, { status: 404 });
      }
      
      if (!character) {
        return NextResponse.json({ error: '角色未找到' }, { status: 404 });
      }
      
      // 检查角色是否已在分组中
      if (subset.characters && subset.characters.includes(characterId)) {
        return NextResponse.json({ message: '角色已在分组中' });
      }
      
      // 添加角色到分组
      await Subset.findByIdAndUpdate(id, {
        $addToSet: { characters: characterId }
      });
      
      // 添加分组到角色
      await Character.findByIdAndUpdate(characterId, {
        $addToSet: { subsets: id }
      });
      
      console.log('[API_A_SUBSETS_ID_CHARACTER_ID_PUT] 添加成功:', { 
        subsetId: id, 
        characterId 
      });
      
      return NextResponse.json({
        message: '角色已添加到分组'
      });
    } catch (error) {
      console.error('[API_A_SUBSETS_ID_CHARACTER_ID_PUT] 数据库错误:', error);
      return NextResponse.json({ error: '无法添加角色到分组' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_SUBSETS_ID_CHARACTER_ID_PUT] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// DELETE /api/a/subsets/[id]/characters/[characterId] - 从分组中移除角色
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; characterId: string }> }) {
  try {
    console.log('[API_A_SUBSETS_ID_CHARACTER_ID_DELETE] 开始处理请求');
    
    // 验证用户是否已登录
    const { user, session } = await validateRequest();
    
    if (!session) {
      console.log('[API_A_SUBSETS_ID_CHARACTER_ID_DELETE] 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 在NextJS 15中，必须先await params
    const resolvedParams = await params;
    const { id, characterId } = resolvedParams;

    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(characterId)) {
      return NextResponse.json({ error: '无效的ID' }, { status: 400 });
    }

    // 连接数据库
    await dbConnect();

    try {
      // 检查分组是否存在
      const subset = await Subset.findById(id);
      if (!subset) {
        return NextResponse.json({ error: '分组未找到' }, { status: 404 });
      }
      
      // 从分组中移除角色
      await Subset.findByIdAndUpdate(id, {
        $pull: { characters: characterId }
      });
      
      // 从角色中移除分组
      await Character.findByIdAndUpdate(characterId, {
        $pull: { subsets: id }
      });
      
      console.log('[API_A_SUBSETS_ID_CHARACTER_ID_DELETE] 移除成功:', { 
        subsetId: id, 
        characterId 
      });
      
      return NextResponse.json({
        message: '角色已从分组中移除'
      });
    } catch (error) {
      console.error('[API_A_SUBSETS_ID_CHARACTER_ID_DELETE] 数据库错误:', error);
      return NextResponse.json({ error: '无法从分组中移除角色' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API_A_SUBSETS_ID_CHARACTER_ID_DELETE] 意外错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 