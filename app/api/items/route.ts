import { NextRequest, NextResponse } from 'next/server';
import { getItemsPaginated } from '@/lib/db/queries';

// GET /api/items - 获取情报列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const category = searchParams.get('category') || undefined;
    const importance = searchParams.get('importance') || undefined;
    const source = searchParams.get('source') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.max(1, Math.min(10, parseInt(searchParams.get('limit') || '10', 10) || 10));

    const result = await getItemsPaginated(
      { category, importance, source, search },
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取情报列表失败:', error);
    return NextResponse.json(
      { error: '获取情报列表失败' },
      { status: 500 }
    );
  }
}
