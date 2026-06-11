/**
 * 测试 LLM 处理单条内容
 * 运行: npx tsx scripts/test-process.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL;
const MODEL = process.env.OPENAI_MODEL;

const PROCESS_PROMPT = `你是一个 AI 领域资讯分析师，专门为中国开发者整理 AI 领域的每日情报。请分析以下内容，输出 JSON 格式。

输入信息：
- 标题：{title}
- 来源：{source}
- 摘要：{summary}

请输出严格的 JSON 格式（不要包含 markdown 代码块标记）：
{
  "title_cn": "中文标题（不超过30字，准确概括核心内容）",
  "summary_cn": "80-120字中文摘要（客观、信息密度高，面向中文开发者）",
  "key_points": ["核心要点1（15字以内）", "核心要点2", "核心要点3"],
  "tags": ["标签1", "标签2", "标签3"],
  "category": "news|paper|tool|project|opinion",
  "importance": 3,
  "reason": "为什么值得看（20字以内）"
}

分类说明：
- news: AI 行业新闻、公司动态、产品发布
- paper: 学术论文、研究成果
- tool: 开发工具、框架、库
- project: 开源项目、代码仓库
- opinion: 观点文章、分析评论

重要性评分标准：
- 5: 重大突破（如新模型发布、行业格局变化）
- 4: 重要进展（如重要更新、显著改进）
- 3: 值得关注（如一般更新、常规发布）
- 2: 一般动态（如小版本更新、普通文章）
- 1: 不太相关（与 AI 关系不大）

规则：
1. 如果内容与 AI/机器学习/LLM 无关，importance 设为 1
2. 摘要要客观，不夸大，信息密度要高
3. 标签用中文，简短（2-4字）
4. 核心要点要具体，不要泛泛而谈`;

async function testProcess() {
  if (!API_KEY || !BASE_URL || !MODEL) {
    console.error('❌ 环境变量未完整配置');
    process.exit(1);
  }

  const title = 'OpenAI Announces GPT-5 with Breakthrough Reasoning Capabilities';
  const source = 'TechCrunch';
  const summary = 'OpenAI has officially released GPT-5, featuring significant improvements in reasoning, code generation, and multi-modal understanding.';

  const prompt = PROCESS_PROMPT
    .replace('{title}', title)
    .replace('{source}', source)
    .replace('{summary}', summary);

  console.log('=== 测试 LLM 处理 ===');
  console.log(`模型: ${MODEL}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  try {
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的 AI 资讯分析师。请严格按照要求的 JSON 格式输出，不要包含任何其他文字。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 请求失败: HTTP ${response.status}`);
      console.error(`响应: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log(`✅ 请求成功 (${elapsed}ms)`);
    console.log(`模型: ${data.model || MODEL}`);
    console.log('');
    console.log('--- LLM 原始响应 ---');
    console.log(content);
    console.log('--- 响应结束 ---');
    console.log('');

    if (!content) {
      console.error('❌ LLM 返回为空');
      process.exit(1);
    }

    // 尝试解析 JSON
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const result = JSON.parse(jsonStr);
      console.log('✅ JSON 解析成功');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error('❌ JSON 解析失败:', e);
      console.error('原始字符串:', jsonStr);
    }

  } catch (error) {
    console.error(`❌ 请求异常: ${error}`);
    process.exit(1);
  }
}

testProcess();
