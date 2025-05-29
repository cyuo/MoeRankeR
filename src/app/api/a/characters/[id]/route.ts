import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Character from '@/models/Character';
import mongoose from 'mongoose';

// GET - 获取单个角色
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证会话
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    // 连接数据库
    await dbConnect();

    // 验证ID格式
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: '无效的角色ID' }, { status: 400 });
    }

    // 查询角色
    const character = await Character.findById(id)
      .populate('traits', 'name')
      .populate('subsets', 'name')
      .lean();

    if (!character) {
      return NextResponse.json({ message: '角色不存在' }, { status: 404 });
    }

    return NextResponse.json(character);
  } catch (error: any) {
    console.error('获取角色时出错:', error);
    return NextResponse.json(
      { message: '获取角色时出错', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - 更新角色
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证会话
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    // 连接数据库
    await dbConnect();

    // 验证ID格式
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: '无效的角色ID' }, { status: 400 });
    }

    // 获取请求体
    const body = await request.json();

    // 验证名称
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ message: '角色名称不能为空' }, { status: 400 });
    }

    // 检查是否已存在同名但不同ID的角色
    const existingCharacter = await Character.findOne({
      name: body.name,
      _id: { $ne: id }
    });
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

    // 更新角色
    const updatedCharacter = await Character.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('traits', 'name').populate('subsets', 'name');

    if (!updatedCharacter) {
      return NextResponse.json({ message: '角色不存在' }, { status: 404 });
    }

    return NextResponse.json({
      message: '角色更新成功',
      data: updatedCharacter
    });
  } catch (error: any) {
    console.error('更新角色时出错:', error);
    return NextResponse.json(
      { message: '更新角色时出错', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - 删除角色
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证会话
    const { user, session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    // 连接数据库
    await dbConnect();

    // 验证ID格式
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: '无效的角色ID' }, { status: 400 });
    }

    // 删除角色
    const deletedCharacter = await Character.findByIdAndDelete(id);

    if (!deletedCharacter) {
      return NextResponse.json({ message: '角色不存在' }, { status: 404 });
    }

    return NextResponse.json({ message: '角色删除成功' });
  } catch (error: any) {
    console.error('删除角色时出错:', error);
    return NextResponse.json(
      { message: '删除角色时出错', error: error.message },
      { status: 500 }
    );
  }
} 