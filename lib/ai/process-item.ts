import { openai, getModel } from './client';

// LLM 处理结果
export interface ProcessResult {
  titleCn: string;
  summaryCn: string;
  keyPoints: string[];
  tags: string[];
  category: 'news' | 'paper' | 'tool' | 'project' | 'opinion';
  importance: number;
  reason: string;
}

// 精简 prompt — 推理模型需要短 prompt + 大 max_tokens
function buildPrompt(title: string, source: string, summary: string): string {
  return `分析以下AI资讯，输出JSON（不要markdown代码块）：
标题：${title}
来源：${source}
摘要：${summary || '无'}

JSON格式：
{"title_cn":"≤30字中文标题","summary_cn":"80-120字中文摘要","key_points":["要点1","要点2","要点3"],"tags":["标签1","标签2","标签3"],"category":"news|paper|tool|project|opinion","importance":1-5,"reason":"≤20字推荐理由"}

规则：5=重大突破 4=重要进展 3=值得关注 2=一般动态 1=不相关。标签用中文。`;
}

/**
 * 调用 LLM 处理单条内容
 */
export async function processItemWithLLM(
  title: string,
  source: string,
  summary: string
): Promise<ProcessResult> {
  const prompt = buildPrompt(title, source, summary);

  const response = await openai.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 25000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('LLM 返回为空');
  }

  // 解析 JSON（兼容可能的 markdown 代码块包裹）
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const result = JSON.parse(jsonStr);

  // 校验必要字段
  if (!result.title_cn || !result.summary_cn) {
    throw new Error('LLM 返回缺少必要字段');
  }

  return {
    titleCn: result.title_cn,
    summaryCn: result.summary_cn,
    keyPoints: Array.isArray(result.key_points) ? result.key_points.slice(0, 5) : [],
    tags: Array.isArray(result.tags) ? result.tags.slice(0, 8) : [],
    category: ['news', 'paper', 'tool', 'project', 'opinion'].includes(result.category)
      ? result.category
      : 'news',
    importance: typeof result.importance === 'number'
      ? Math.min(5, Math.max(1, result.importance))
      : 3,
    reason: result.reason || '',
  };
}
