import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/lib/db/queries';

// GET /api/items/[id] - 获取单条情报详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (Number.isNaN(itemId)) {
      return NextResponse.json(
        { error: '无效的 ID' },
        { status: 400 }
      );
    }

    const item = await getItemById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: '情报不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('获取情报详情失败:', error);
    return NextResponse.json(
      { error: '获取情报详情失败' },
      { status: 500 }
    );
  }
}
