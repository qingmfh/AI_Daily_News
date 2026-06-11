/**
 * 测试 LLM 处理 - 简化版
 * 运行: npx tsx scripts/test-process2.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL;
const MODEL = process.env.OPENAI_MODEL;

async function testProcess() {
  if (!API_KEY || !BASE_URL || !MODEL) {
    console.error('❌ 环境变量未完整配置');
    process.exit(1);
  }

  console.log('=== 测试 1: 简单请求（无 system message） ===');
  try {
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
            role: 'user',
            content: '请用中文一句话介绍 GPT-5。',
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    console.log('响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('错误:', error);
  }

  console.log('\n=== 测试 2: 带 system message ===');
  try {
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
            content: '你是一个 AI 资讯分析师。请用 JSON 格式输出。',
          },
          {
            role: 'user',
            content: '请分析这个标题并输出 JSON: OpenAI 发布 GPT-5',
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    console.log('响应:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('错误:', error);
  }

  console.log('\n=== 测试 3: 完整 prompt（缩短版） ===');
  try {
    const prompt = `分析以下内容，输出 JSON：
标题：OpenAI Announces GPT-5
来源：TechCrunch
摘要：OpenAI releases GPT-5 with breakthrough reasoning.

输出格式：
{"title_cn":"中文标题","summary_cn":"80字摘要","tags":["标签"],"category":"news","importance":5,"reason":"推荐理由"}`;

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
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log('内容:', content);

    if (content) {
      try {
        const json = JSON.parse(content);
        console.log('JSON 解析成功:', json);
      } catch (e) {
        console.log('JSON 解析失败，原始内容:', content);
      }
    }
  } catch (error) {
    console.error('错误:', error);
  }
}

testProcess();
