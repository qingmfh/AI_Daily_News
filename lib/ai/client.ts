import OpenAI from 'openai';

// 创建 OpenAI 客户端（兼容格式）
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

// 获取模型名称
export const getModel = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';
