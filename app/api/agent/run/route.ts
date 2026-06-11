import { NextRequest, NextResponse, after } from 'next/server';
import { runCollectionTask } from '@/lib/agent/task-runner';
import { getWorkerId } from '@/lib/agent/worker-id';
import {
  createCollectionRun,
  getCollectionRun,
  getProcessingStats,
  getRunningCollectionRun,
  recoverStaleCollectionRuns,
} from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function recoverInterruptedRuns() {
  const recoveredIds = await recoverStaleCollectionRuns(getWorkerId());
  if (recoveredIds.length > 0) {
    console.warn(`⚠️ 已自动结束遗留任务: ${recoveredIds.join(', ')}`);
  }
}

// POST /api/agent/run - 创建后台采集 + AI 处理任务
export async function POST() {
  try {
    await recoverInterruptedRuns();

    const running = await getRunningCollectionRun();
    if (running) {
      return NextResponse.json(
        {
          error: '已有任务正在运行，请稍后再试',
          runId: running.id,
          runType: running.runType,
          status: running.status,
        },
        { status: 409 }
      );
    }

    const run = await createCollectionRun('all', getWorkerId());
    after(() => runCollectionTask(run.id));

    return NextResponse.json(
      {
        runId: run.id,
        runType: run.runType,
        status: run.status,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('❌ 创建采集任务失败:', error);
    return NextResponse.json(
      { error: '创建采集任务失败' },
      { status: 500 }
    );
  }
}

// GET /api/agent/run - 查询当前或指定后台任务状态
export async function GET(request: NextRequest) {
  try {
    await recoverInterruptedRuns();

    const requestedId = Number(request.nextUrl.searchParams.get('runId'));
    const run = await getCollectionRun(Number.isInteger(requestedId) && requestedId > 0
      ? requestedId
      : undefined);
    const stats = await getProcessingStats();

    return NextResponse.json({ run, stats });
  } catch (error) {
    console.error('❌ 查询任务状态失败:', error);
    return NextResponse.json(
      { error: '查询任务状态失败' },
      { status: 500 }
    );
  }
}
