import { db, initDatabase } from './client';
import { newsItems } from './schema';

// 确保表存在
initDatabase();

// 种子数据
const seedData = [
  {
    url: 'https://techcrunch.com/2026/06/04/openai-gpt-5-release',
    title: 'OpenAI Announces GPT-5 with Breakthrough Reasoning Capabilities',
    titleCn: 'OpenAI 发布 GPT-5：推理能力实现重大突破',
    summary: 'OpenAI has officially released GPT-5, featuring significant improvements in reasoning, code generation, and multi-modal understanding.',
    summaryCn: 'OpenAI 正式发布了 GPT-5，在推理、代码生成和多模态理解方面都有显著提升。新模型在数学推理和复杂问题解决上表现出色，同时保持了更快的响应速度。',
    contentExcerpt: 'OpenAI announced the release of GPT-5 today, marking a significant milestone in AI development...',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com',
    category: 'news',
    tags: '["GPT-5", "OpenAI", "大模型", "推理"]',
    keyPoints: '["推理能力大幅提升", "代码生成质量提高", "多模态理解增强"]',
    importance: 5,
    reason: '大模型领域的重大进展，可能影响整个 AI 行业格局',
    publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 1,
  },
  {
    url: 'https://arxiv.org/abs/2606.01234',
    title: 'Efficient Fine-tuning of Large Language Models with LoRA-Plus',
    titleCn: 'LoRA-Plus：大语言模型高效微调新方法',
    summary: 'A new paper proposes LoRA-Plus, an improved method for fine-tuning LLMs that reduces computational cost by 40% while maintaining performance.',
    summaryCn: '一篇新论文提出了 LoRA-Plus 方法，改进了大语言模型的微调技术。该方法将计算成本降低了 40%，同时保持了模型性能，为资源受限的团队提供了更好的微调方案。',
    contentExcerpt: 'We propose LoRA-Plus, an enhanced version of Low-Rank Adaptation...',
    source: 'arXiv',
    sourceUrl: 'https://arxiv.org',
    category: 'paper',
    tags: '["LoRA", "微调", "论文", "效率"]',
    keyPoints: '["计算成本降低 40%", "保持模型性能", "适合资源受限场景"]',
    importance: 4,
    reason: '为小团队提供了更实用的模型微调方案',
    publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 1,
  },
  {
    url: 'https://github.com/langchain-ai/langchain/releases/v0.3',
    title: 'LangChain v0.3 Released with Native MCP Support',
    titleCn: 'LangChain v0.3 发布：原生支持 MCP 协议',
    summary: 'LangChain releases version 0.3 with native Model Context Protocol support, making it easier to build AI agents that connect to external tools.',
    summaryCn: 'LangChain 发布了 v0.3 版本，新增了对 MCP（模型上下文协议）的原生支持。这使得构建连接外部工具的 AI Agent 变得更加简单，开发者可以更方便地集成各种数据源和工具。',
    contentExcerpt: 'We are excited to announce LangChain v0.3 with native MCP support...',
    source: 'GitHub',
    sourceUrl: 'https://github.com',
    category: 'tool',
    tags: '["LangChain", "MCP", "Agent", "开源"]',
    keyPoints: '["原生 MCP 支持", "简化 Agent 开发", "更好的工具集成"]',
    importance: 4,
    reason: 'Agent 开发框架的重要更新，影响开发者工作流',
    publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 1,
  },
  {
    url: 'https://github.com/meta-llama/llama4',
    title: 'Meta Releases Llama 4: Open Source Multi-modal Model',
    titleCn: 'Meta 发布 Llama 4：开源多模态模型',
    summary: 'Meta releases Llama 4, an open-source multi-modal model that rivals commercial offerings in image and video understanding.',
    summaryCn: 'Meta 发布了 Llama 4，这是一个开源多模态模型，在图像和视频理解方面可以与商业模型媲美。该模型完全开源，支持商业使用，为开源社区带来了强大的多模态能力。',
    contentExcerpt: 'Today we are releasing Llama 4, our most capable open-source model...',
    source: 'GitHub',
    sourceUrl: 'https://github.com',
    category: 'project',
    tags: '["Meta", "Llama", "多模态", "开源"]',
    keyPoints: '["开源多模态模型", "支持商业使用", "图像视频理解"]',
    importance: 5,
    reason: '开源多模态模型的重大进展，降低 AI 应用门槛',
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 0,
  },
  {
    url: 'https://venturebeat.com/ai/agent-frameworks-comparison',
    title: 'The Rise of AI Agent Frameworks: A Comprehensive Comparison',
    titleCn: 'AI Agent 框架崛起：全面对比分析',
    summary: 'A comprehensive analysis of the growing ecosystem of AI agent frameworks, comparing LangChain, CrewAI, AutoGen, and others.',
    summaryCn: '一篇全面分析 AI Agent 框架生态的文章，对比了 LangChain、CrewAI、AutoGen 等主流框架。文章指出 Agent 框架正在快速发展，但选择合适的框架需要考虑具体使用场景。',
    contentExcerpt: 'The AI agent ecosystem is rapidly evolving...',
    source: 'VentureBeat',
    sourceUrl: 'https://venturebeat.com',
    category: 'opinion',
    tags: '["Agent", "框架对比", "LangChain", "CrewAI"]',
    keyPoints: '["Agent 框架快速发展", "不同框架适合不同场景", "生态系统日趋成熟"]',
    importance: 3,
    reason: '帮助开发者了解 Agent 框架生态，做出技术选型',
    publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 0,
  },
  {
    url: 'https://the-decoder.com/anthropic-claude-update',
    title: 'Anthropic Releases Claude with Enhanced Safety Features',
    titleCn: 'Anthropic 发布 Claude 更新：增强安全特性',
    summary: 'Anthropic releases a major update to Claude with improved safety measures and reduced hallucination rates.',
    summaryCn: 'Anthropic 发布了 Claude 的重大更新，改进了安全措施并降低了幻觉率。新版本在保持高性能的同时，进一步提升了模型的可靠性和安全性。',
    contentExcerpt: 'Anthropic has released a significant update to Claude...',
    source: 'The Decoder',
    sourceUrl: 'https://the-decoder.com',
    category: 'news',
    tags: '["Anthropic", "Claude", "安全", "更新"]',
    keyPoints: '["安全特性增强", "幻觉率降低", "性能保持"]',
    importance: 4,
    reason: 'AI 安全领域的重要进展',
    publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 0,
  },
  {
    url: 'https://huggingface.co/blog/transformers-v5',
    title: 'Transformers v5: What\'s New and Why It Matters',
    titleCn: 'Transformers v5：新特性与重要意义',
    summary: 'Hugging Face releases Transformers v5 with improved performance, better hardware support, and new model architectures.',
    summaryCn: 'Hugging Face 发布了 Transformers v5，带来了性能改进、更好的硬件支持和新的模型架构。这个版本简化了模型部署流程，让更多开发者能够轻松使用最新的 AI 模型。',
    contentExcerpt: 'We are excited to announce Transformers v5...',
    source: 'Hugging Face',
    sourceUrl: 'https://huggingface.co',
    category: 'tool',
    tags: '["Transformers", "Hugging Face", "框架", "更新"]',
    keyPoints: '["性能改进", "硬件支持增强", "部署流程简化"]',
    importance: 4,
    reason: 'AI 工具链的重要更新，影响模型开发和部署',
    publishedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 0,
  },
  {
    url: 'https://arxiv.org/abs/2606.05678',
    title: 'Scaling Laws for Neural Code Generation',
    titleCn: '神经代码生成的缩放定律',
    summary: 'Researchers discover new scaling laws specifically for code generation models, providing insights for building better coding assistants.',
    summaryCn: '研究人员发现了代码生成模型的新缩放定律，为构建更好的编程助手提供了 insights。研究表明，代码模型的性能提升与数据质量和训练策略密切相关。',
    contentExcerpt: 'We study the scaling behavior of neural code generation...',
    source: 'arXiv',
    sourceUrl: 'https://arxiv.org',
    category: 'paper',
    tags: '["代码生成", "缩放定律", "研究", "编程助手"]',
    keyPoints: '["代码模型缩放定律", "数据质量很重要", "训练策略影响大"]',
    importance: 3,
    reason: '为代码生成模型的优化提供理论指导',
    publishedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 0,
  },
  {
    url: 'https://github.com/microsoft/autogen/releases/v0.4',
    title: 'AutoGen v0.4: Multi-Agent Conversations Made Easy',
    titleCn: 'AutoGen v0.4：多 Agent 对话更简单',
    summary: 'Microsoft releases AutoGen v0.4 with simplified APIs for building multi-agent conversation systems.',
    summaryCn: '微软发布了 AutoGen v0.4，简化了构建多 Agent 对话系统的 API。新版本让开发者能够更轻松地创建协作式 AI 系统，多个 Agent 可以共同完成复杂任务。',
    contentExcerpt: 'AutoGen v0.4 introduces simplified APIs...',
    source: 'GitHub',
    sourceUrl: 'https://github.com',
    category: 'project',
    tags: '["AutoGen", "微软", "多Agent", "对话"]',
    keyPoints: '["API 简化", "多 Agent 协作", "降低开发门槛"]',
    importance: 4,
    reason: '多 Agent 系统开发的重要工具更新',
    publishedAt: new Date(Date.now() - 42 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 0,
  },
  {
    url: 'https://techcrunch.com/2026/06/03/ai-startup-funding',
    title: 'AI Startup Funding Reaches New Heights in Q2 2026',
    titleCn: '2026 年 Q2 AI 创业公司融资创新高',
    summary: 'Venture capital investment in AI startups continues to surge, with Q2 2026 seeing record-breaking funding rounds.',
    summaryCn: '2026 年第二季度，AI 创业公司的风险投资持续增长，融资轮次创下新纪录。投资者对 Agent、多模态和企业 AI 应用表现出特别的兴趣。',
    contentExcerpt: 'AI startup funding has reached unprecedented levels...',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com',
    category: 'news',
    tags: '["融资", "创业", "投资", "趋势"]',
    keyPoints: '["Q2 融资创新高", "Agent 领域受关注", "企业 AI 应用热门"]',
    importance: 3,
    reason: '了解 AI 行业投资趋势',
    publishedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    processingStatus: 'processed',
    isFeatured: 0,
  },
];

// 执行种子数据插入
export function seedDatabase() {
  console.log('🌱 开始插入种子数据...');

  try {
    // 清空现有数据
    db.delete(newsItems).run();

    // 插入种子数据
    for (const item of seedData) {
      db.insert(newsItems).values(item).run();
    }

    console.log(`✅ 成功插入 ${seedData.length} 条种子数据`);
  } catch (error) {
    console.error('❌ 插入种子数据失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
seedDatabase();
