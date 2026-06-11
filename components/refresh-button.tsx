'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RunType = 'all' | 'process';

interface TaskRun {
  id: number;
  runType: RunType;
  status: string | null;
  itemsFound: number | null;
  itemsCreated: number | null;
  itemsFailed: number | null;
  aiProcessed: number | null;
  aiFailed: number | null;
  error: string | null;
}

interface ProcessingStats {
  total: number;
  pending: number;
  processed: number;
  failed: number;
  invalid: number;
}

interface StatusResponse {
  run: TaskRun | null;
  stats: ProcessingStats;
}

interface StartResponse {
  runId?: number;
  runType?: RunType;
  status?: string;
  error?: string;
}

interface CollectResult {
  itemsCreated: number;
  itemsFailed: number;
  aiProcessed: number;
  aiFailed: number;
}

interface ProcessResult {
  processed: number;
  failed: number;
}

const POLL_INTERVAL_MS = 1500;

export function RefreshButton() {
  const router = useRouter();
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [activeRunType, setActiveRunType] = useState<RunType | null>(null);
  const [runProgress, setRunProgress] = useState<TaskRun | null>(null);
  const [collectResult, setCollectResult] = useState<CollectResult | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreRunningTask() {
      try {
        const response = await fetch('/api/agent/run', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const data = await response.json() as StatusResponse;
        if (!cancelled && data.run?.status === 'running') {
          setActiveRunId(data.run.id);
          setActiveRunType(data.run.runType);
          setRunProgress(data.run);
        }
      } catch {
        // 页面初始化失败不影响手动触发任务。
      }
    }

    void restoreRunningTask();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeRunId) {
      return;
    }

    let cancelled = false;
    let lastSignature = '';

    async function pollStatus() {
      try {
        const response = await fetch(`/api/agent/run?runId=${activeRunId}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('查询任务状态失败');
        }

        const data = await response.json() as StatusResponse;
        if (cancelled || !data.run) {
          return;
        }

        setRunProgress(data.run);
        setActiveRunType(data.run.runType);
        setError(null);

        const signature = JSON.stringify({
          stats: data.stats,
          status: data.run.status,
          itemsCreated: data.run.itemsCreated,
          itemsFailed: data.run.itemsFailed,
          aiProcessed: data.run.aiProcessed,
          aiFailed: data.run.aiFailed,
        });

        if (signature !== lastSignature) {
          lastSignature = signature;
          router.refresh();
        }

        if (data.run.status !== 'running') {
          if (data.run.runType === 'all') {
            setCollectResult({
              itemsCreated: data.run.itemsCreated || 0,
              itemsFailed: data.run.itemsFailed || 0,
              aiProcessed: data.run.aiProcessed || 0,
              aiFailed: data.run.aiFailed || 0,
            });
          } else {
            setProcessResult({
              processed: data.run.aiProcessed || 0,
              failed: data.run.aiFailed || 0,
            });
          }

          if (data.run.status === 'failed') {
            setError(data.run.error || '任务执行失败');
          }

          setActiveRunId(null);
          setActiveRunType(null);
          setRunProgress(null);
        }
      } catch {
        if (!cancelled) {
          setError('暂时无法获取任务进度，正在继续重试');
        }
      }
    }

    void pollStatus();
    const timer = window.setInterval(() => void pollStatus(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeRunId, router]);

  const startTask = async (path: string, requestedType: RunType) => {
    setCollectResult(null);
    setProcessResult(null);
    setError(null);

    try {
      const response = await fetch(path, { method: 'POST' });
      const data = await response.json() as StartResponse;

      if (!data.runId || !data.runType) {
        setError(data.error || '创建任务失败');
        return;
      }

      if (!response.ok && response.status !== 409) {
        setError(data.error || '创建任务失败');
        return;
      }

      setActiveRunId(data.runId);
      setActiveRunType(data.runType || requestedType);
      if (response.status === 409) {
        setError('已有任务正在运行，已接入现有任务进度');
      }
    } catch {
      setError('网络错误，请重试');
    }
  };

  const collecting = activeRunType === 'all';
  const processing = activeRunType === 'process';
  const isLoading = activeRunId !== null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="h-9 border-orange-100 bg-white text-stone-700 hover:bg-orange-50"
        onClick={() => void startTask('/api/agent/run', 'all')}
        disabled={isLoading}
      >
        <RefreshCw className={`size-4 ${collecting ? 'animate-spin' : ''}`} />
        {collecting ? '采集中...' : '刷新'}
      </Button>

      <Button
        variant="outline"
        className="h-9 border-orange-100 bg-white text-stone-700 hover:bg-orange-50"
        onClick={() => void startTask('/api/agent/process', 'process')}
        disabled={isLoading}
        title="处理所有未完成 AI 分析的条目"
      >
        <Sparkles className={`size-4 ${processing ? 'animate-spin text-orange-500' : ''}`} />
        {processing ? '处理中...' : 'AI 处理'}
      </Button>

      {runProgress && (
        <span className="text-xs text-stone-500">
          {collecting ? `已新增 ${runProgress.itemsCreated || 0} 条，` : ''}
          AI 已完成 {runProgress.aiProcessed || 0} 条
          {(runProgress.aiFailed || 0) > 0 && `，失败 ${runProgress.aiFailed} 条`}
        </span>
      )}

      {collectResult && (
        <span className="text-xs text-stone-500">
          新增 {collectResult.itemsCreated} 条，AI 处理 {collectResult.aiProcessed} 条
          {collectResult.itemsFailed > 0 && `，入库失败 ${collectResult.itemsFailed} 条`}
          {collectResult.aiFailed > 0 && `，AI 失败 ${collectResult.aiFailed} 条`}
        </span>
      )}

      {processResult && (
        <span className="text-xs text-stone-500">
          AI 处理 {processResult.processed} 条
          {processResult.failed > 0 && `，${processResult.failed} 条失败`}
        </span>
      )}

      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
