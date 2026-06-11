/**
 * 测试 LLM API 连接
 * 运行: npx tsx scripts/test-llm.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// 加载 .env.local
config({ path: resolve(__dirname, '../.env.local') });

const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL;
const MODEL = process.env.OPENAI_MODEL;

console.log('=== LLM API 配置检查 ===');
console.log(`API Key: ${API_KEY ? API_KEY.slice(0, 10) + '...' : '❌ 未设置'}`);
console.log(`Base URL: ${BASE_URL || '❌ 未设置'}`);
console.log(`Model: ${MODEL || '❌ 未设置'}`);
console.log('');

async function testConnection() {
  if (!API_KEY || !BASE_URL || !MODEL) {
    console.error('❌ 环境变量未完整配置');
    process.exit(1);
  }

  console.log('正在发送测试请求...');

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
            role: 'user',
            content: '请用一句话介绍你自己。',
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
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
    const usage = data.usage;

    console.log(`✅ 请求成功 (${elapsed}ms)`);
    console.log(`模型: ${data.model || MODEL}`);
    console.log(`回复: ${content}`);
    if (usage) {
      console.log(`Token 用量: prompt=${usage.prompt_tokens}, completion=${usage.completion_tokens}, total=${usage.total_tokens}`);
    }
  } catch (error) {
    console.error(`❌ 请求异常: ${error}`);
    process.exit(1);
  }
}

testConnection();
