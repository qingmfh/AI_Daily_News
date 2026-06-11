import { NextResponse, after } from 'next/server';
import { runProcessingTask } from '@/lib/agent/task-runner';
import { getWorkerId } from '@/lib/agent/worker-id';
import {
  createCollectionRun,
  getProcessingStats,
  getRunningCollectionRun,
  recoverStaleCollectionRuns,
} from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/agent/process - 创建后台 AI 处理任务
export async function POST() {
  try {
    await recoverStaleCollectionRuns(getWorkerId());

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

    const run = await createCollectionRun('process', getWorkerId());
    after(() => runProcessingTask(run.id));

    return NextResponse.json(
      {
        runId: run.id,
        runType: run.runType,
        status: run.status,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('❌ 创建 AI 处理任务失败:', error);
    return NextResponse.json(
      { error: '创建 AI 处理任务失败' },
      { status: 500 }
    );
  }
}

// GET /api/agent/process - 查看处理统计
export async function GET() {
  const stats = await getProcessingStats();
  return NextResponse.json(stats);
}
