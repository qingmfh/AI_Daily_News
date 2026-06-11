import { processItemWithLLM } from '@/lib/ai/process-item';
import { collect } from '@/lib/collectors';
import { validateUrls } from '@/lib/collectors/validate-url';
import {
  finishCollectionRun,
  getPendingItems,
  getRecentItems,
  getReprocessableItems,
  incrementCollectionRunAiProgress,
  insertNewsItemIfNew,
  markItemInvalid,
  markItemProcessingFailed,
  touchCollectionRun,
  updateItemProcessing,
} from '@/lib/db/queries';

async function processItems(runId: number, includeFailed: boolean) {
  const items = includeFailed
    ? await getReprocessableItems()
    : await getPendingItems();

  console.log(`\n🤖 开始 AI 处理: ${items.length} 条待处理`);

  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      console.log(`  📝 处理 [${item.id}] ${item.title.slice(0, 50)}...`);
      const result = await processItemWithLLM(
        item.title,
        item.source,
        item.summary || ''
      );

      await updateItemProcessing(item.id, result);
      await incrementCollectionRunAiProgress(runId, true);
      processed++;
      console.log(`  ✅ [${item.id}] 完成: ${result.titleCn}`);
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : '未知错误';
      await markItemProcessingFailed(item.id, message);
      await incrementCollectionRunAiProgress(runId, false);
      console.error(`  ❌ [${item.id}] 失败: ${message}`);
    }
  }

  console.log(`\n📊 AI 处理完成: ${processed} 条成功, ${failed} 条失败`);
  return { processed, failed };
}

export async function runCollectionTask(runId: number) {
  const startedAt = Date.now();
  let itemsFound = 0;
  let itemsCreated = 0;
  let itemsFailed = 0;

  try {
    console.log(`\n📋 后台采集任务 #${runId} 开始`);
    await touchCollectionRun(runId);

    console.log('\n📡 阶段 1: 数据采集');
    const { items } = await collect();
    itemsFound = items.length;
    await touchCollectionRun(runId, { itemsFound });

    console.log(`\n💾 阶段 2: 入库去重 (${items.length} 条)`);
    for (const [index, item] of items.entries()) {
      try {
        const inserted = await insertNewsItemIfNew(item);
        if (inserted) {
          itemsCreated++;
        }
      } catch {
        itemsFailed++;
      }

      if ((index + 1) % 20 === 0) {
        await touchCollectionRun(runId, { itemsFound, itemsCreated, itemsFailed });
      }
    }
    await touchCollectionRun(runId, { itemsFound, itemsCreated, itemsFailed });
    console.log(`✅ 入库完成: 新增 ${itemsCreated} 条, 失败 ${itemsFailed} 条`);

    if (itemsCreated > 0) {
      console.log('\n🔗 阶段 2.5: URL 可达性验证');
      try {
        const recentItems = await getRecentItems(itemsCreated);
        const invalidIds = await validateUrls(
          recentItems,
          () => touchCollectionRun(runId)
        );
        for (const id of invalidIds) {
          await markItemInvalid(id);
        }
        console.log(`✅ URL 验证完成: ${invalidIds.length} 个链接不可达`);
      } catch (error) {
        console.error('⚠️ URL 验证失败（不阻塞流程）:', error);
      }
    }

    console.log('\n🤖 阶段 3: AI 处理全部待处理条目');
    const aiResult = await processItems(runId, false);

    await finishCollectionRun(runId, {
      status: 'completed',
      itemsFound,
      itemsCreated,
      itemsFailed,
    });

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`\n🎉 后台任务 #${runId} 完成 (${elapsed}s)`);
    console.log(`   采集: ${itemsFound} 条, 新增: ${itemsCreated} 条`);
    console.log(`   AI: 成功 ${aiResult.processed} 条, 失败 ${aiResult.failed} 条`);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    await finishCollectionRun(runId, {
      status: 'failed',
      itemsFound,
      itemsCreated,
      itemsFailed,
      error: message,
    });
    console.error(`❌ 后台采集任务 #${runId} 失败:`, error);
  }
}

export async function runProcessingTask(runId: number) {
  try {
    console.log(`\n🤖 后台 AI 处理任务 #${runId} 开始`);
    await touchCollectionRun(runId);
    const result = await processItems(runId, true);

    await finishCollectionRun(runId, {
      status: 'completed',
      itemsFound: result.processed + result.failed,
      itemsCreated: 0,
      itemsFailed: 0,
    });
    console.log(`🎉 后台 AI 处理任务 #${runId} 完成`);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    await finishCollectionRun(runId, {
      status: 'failed',
      itemsFound: 0,
      itemsCreated: 0,
      itemsFailed: 0,
      error: message,
    });
    console.error(`❌ 后台 AI 处理任务 #${runId} 失败:`, error);
  }
}
