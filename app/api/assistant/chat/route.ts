import { NextRequest, NextResponse } from 'next/server';
import { createAssistantChatStream, type AssistantMessage } from '@/lib/ai/chat';
import { getItemById } from '@/lib/db/queries';
import { parseJsonArray } from '@/lib/utils';

type ChatRequestBody = {
  message?: string;
  itemId?: number;
  pageContent?: string;
  history?: AssistantMessage[];
};

function buildItemContext(item: NonNullable<Awaited<ReturnType<typeof getItemById>>>) {
  const tags = parseJsonArray(item.tags);
  const keyPoints = parseJsonArray(item.keyPoints);

  return [
    `中文标题：${item.titleCn || item.title}`,
    item.titleCn && item.titleCn !== item.title ? `原始标题：${item.title}` : '',
    `来源：${item.source}`,
    `原文链接：${item.url}`,
    item.publishedAt ? `发布时间：${item.publishedAt}` : '',
    item.category ? `类型：${item.category}` : '',
    item.importance ? `重要性：${item.importance}/5` : '',
    item.reason ? `推荐理由：${item.reason}` : '',
    item.summaryCn ? `中文摘要：${item.summaryCn}` : '',
    item.summary ? `原始摘要：${item.summary}` : '',
    keyPoints.length > 0 ? `核心要点：\n${keyPoints.map((point) => `- ${point}`).join('\n')}` : '',
    tags.length > 0 ? `标签：${tags.join('、')}` : '',
    item.contentExcerpt ? `正文片段：${item.contentExcerpt}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function normalizeHistory(history: unknown): AssistantMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item): item is AssistantMessage => (
      item &&
      typeof item === 'object' &&
      (item as AssistantMessage).role !== undefined &&
      ['user', 'assistant'].includes((item as AssistantMessage).role) &&
      typeof (item as AssistantMessage).content === 'string'
    ))
    .slice(-8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: '请输入问题或指令' },
        { status: 400 }
      );
    }

    const contexts: string[] = [];

    if (body.itemId) {
      const item = await getItemById(body.itemId);
      if (!item) {
        return NextResponse.json(
          { error: '情报不存在' },
          { status: 404 }
        );
      }
      contexts.push(buildItemContext(item));
    }

    if (body.pageContent?.trim()) {
      contexts.push(`当前页面展示内容：\n${body.pageContent.trim()}`);
    }

    if (contexts.length === 0) {
      contexts.push('当前没有额外页面上下文。请基于用户问题直接回答，并在必要时提醒用户补充页面内容。');
    }

    const completionStream = await createAssistantChatStream({
      message,
      context: contexts.join('\n\n---\n\n'),
      history: normalizeHistory(body.history),
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completionStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error('AI assistant stream failed:', error);
          controller.error(error);
          return;
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('AI assistant request failed:', error);
    return NextResponse.json(
      { error: 'AI 助手暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}
