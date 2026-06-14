export type AssistantIntentId =
  | 'today_focus'
  | 'weekly_agent'
  | 'latest_papers'
  | 'new_tools'
  | 'study_plan'
  | 'summarize_current'
  | 'why_current'
  | 'related_current'
  | 'compare_current';

export type AssistantAction =
  | {
      id: string;
      type: 'filter';
      label: string;
      description: string;
      href: string;
    }
  | {
      id: string;
      type: 'prompt';
      label: string;
      description: string;
      message: string;
      intent?: AssistantIntentId;
    };

export type AssistantQuickIntent = {
  id: AssistantIntentId;
  label: string;
  description: string;
  message: string;
  scope: 'home' | 'detail';
};

export const assistantQuickIntents: AssistantQuickIntent[] = [
  {
    id: 'today_focus',
    label: '今日重点',
    description: '提炼当前情报库里最值得看的高价值动态',
    message: '今天 AI 领域最重要的动态是什么？请按重要性排序，并说明为什么值得看。',
    scope: 'home',
  },
  {
    id: 'weekly_agent',
    label: '本周 Agent',
    description: '聚焦 Agent、MCP、自动化和编码智能体相关情报',
    message: '本周 Agent 相关动态有哪些？请按主题归纳，并给出值得继续看的条目。',
    scope: 'home',
  },
  {
    id: 'latest_papers',
    label: '最新论文',
    description: '查看近期论文类情报和值得深读的研究方向',
    message: '最近有哪些值得关注的 AI 论文？请给出核心贡献和阅读优先级。',
    scope: 'home',
  },
  {
    id: 'new_tools',
    label: '新工具',
    description: '筛出工具、框架、产品和开源能力更新',
    message: '最近有什么新的 AI 工具或产品值得开发者关注？',
    scope: 'home',
  },
  {
    id: 'study_plan',
    label: '学习清单',
    description: '把当前情报整理成 5 分钟学习路径',
    message: '请基于当前可引用情报生成一份 5 分钟学习清单，按阅读顺序排列。',
    scope: 'home',
  },
  {
    id: 'summarize_current',
    label: '总结这条',
    description: '快速总结当前详情页情报',
    message: '请总结当前这条情报，说明发生了什么、为什么重要。',
    scope: 'detail',
  },
  {
    id: 'why_current',
    label: '为什么重要',
    description: '解释当前情报对开发者或产品的影响',
    message: '当前这条情报为什么重要？对开发者、产品经理或研究者分别有什么影响？',
    scope: 'detail',
  },
  {
    id: 'related_current',
    label: '找相关',
    description: '基于当前条目继续找相近主题',
    message: '请基于当前情报，找出可引用情报里相关的主题和后续阅读方向。',
    scope: 'detail',
  },
  {
    id: 'compare_current',
    label: '对比分析',
    description: '把当前情报和相关动态做横向比较',
    message: '请把当前情报和相关情报做对比分析，重点比较技术方向、成熟度和潜在影响。',
    scope: 'detail',
  },
];

export function getAssistantQuickIntents(scope: 'home' | 'detail') {
  return assistantQuickIntents.filter((intent) => intent.scope === scope);
}

function buildFeedHref(params: {
  category?: string;
  importance?: string;
  q?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.category) {
    searchParams.set('category', params.category);
  }
  if (params.importance) {
    searchParams.set('importance', params.importance);
  }
  if (params.q) {
    searchParams.set('q', params.q);
  }

  const query = searchParams.toString();
  return query ? `/?${query}#latest` : '/#latest';
}

function inferFilterFromText(message: string): AssistantAction | null {
  const normalized = message.toLowerCase();

  if (normalized.includes('agent') || message.includes('智能体') || normalized.includes('mcp')) {
    return {
      id: 'filter-agent',
      type: 'filter',
      label: '查看 Agent 情报',
      description: '打开包含 Agent / MCP / 智能体关键词的情报列表',
      href: buildFeedHref({ q: 'Agent' }),
    };
  }

  if (message.includes('论文') || normalized.includes('paper') || normalized.includes('arxiv')) {
    return {
      id: 'filter-papers',
      type: 'filter',
      label: '查看论文情报',
      description: '打开论文分类下的情报列表',
      href: buildFeedHref({ category: 'paper' }),
    };
  }

  if (message.includes('工具') || message.includes('产品') || normalized.includes('tool')) {
    return {
      id: 'filter-tools',
      type: 'filter',
      label: '查看工具情报',
      description: '打开工具分类下的情报列表',
      href: buildFeedHref({ category: 'tool' }),
    };
  }

  if (message.includes('开源') || normalized.includes('github')) {
    return {
      id: 'filter-projects',
      type: 'filter',
      label: '查看开源情报',
      description: '打开开源项目分类下的情报列表',
      href: buildFeedHref({ category: 'project' }),
    };
  }

  if (message.includes('重点') || message.includes('重要')) {
    return {
      id: 'filter-important',
      type: 'filter',
      label: '查看高重要性情报',
      description: '打开 5 星重要性情报列表',
      href: buildFeedHref({ importance: '5' }),
    };
  }

  return null;
}

export function buildAssistantActions({
  intent,
  message,
  itemId,
  hasReferences,
}: {
  intent?: AssistantIntentId;
  message: string;
  itemId?: number;
  hasReferences: boolean;
}): AssistantAction[] {
  const actions: AssistantAction[] = [];

  const intentFilter: Partial<Record<AssistantIntentId, AssistantAction>> = {
    today_focus: {
      id: 'filter-today-focus',
      type: 'filter' as const,
      label: '查看高重要性情报',
      description: '打开 5 星情报列表继续浏览',
      href: buildFeedHref({ importance: '5' }),
    },
    weekly_agent: {
      id: 'filter-weekly-agent',
      type: 'filter' as const,
      label: '查看 Agent 情报',
      description: '打开 Agent 相关情报列表',
      href: buildFeedHref({ q: 'Agent' }),
    },
    latest_papers: {
      id: 'filter-latest-papers',
      type: 'filter' as const,
      label: '查看论文情报',
      description: '打开论文分类继续浏览',
      href: buildFeedHref({ category: 'paper' }),
    },
    new_tools: {
      id: 'filter-new-tools',
      type: 'filter' as const,
      label: '查看工具情报',
      description: '打开工具分类继续浏览',
      href: buildFeedHref({ category: 'tool' }),
    },
  };

  if (intent && intentFilter[intent]) {
    actions.push(intentFilter[intent]);
  } else {
    const inferredFilter = inferFilterFromText(message);
    if (inferredFilter) {
      actions.push(inferredFilter);
    }
  }

  if (hasReferences && intent !== 'study_plan') {
    actions.push({
      id: 'prompt-study-plan',
      type: 'prompt',
      label: '生成学习清单',
      description: '把本次引用情报整理成 5 分钟阅读路径',
      message: '请基于刚才这些可引用情报生成一份 5 分钟学习清单，按阅读顺序排列。',
      intent: 'study_plan',
    });
  }

  if (itemId && intent !== 'compare_current') {
    actions.push({
      id: 'prompt-compare-current',
      type: 'prompt',
      label: '对比当前情报',
      description: '把当前条目和相关动态做横向比较',
      message: '请把当前情报和相关情报做对比分析，重点比较技术方向、成熟度和潜在影响。',
      intent: 'compare_current',
    });
  }

  return actions.slice(0, 3);
}
