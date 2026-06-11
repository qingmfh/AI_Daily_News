# AI Daily Agent - 产品需求文档 (PRD)

> 最后更新：2026-06-04  
> 版本：v2.0

---

## 1. 产品概述

### 1.1 产品名称

**AI Daily Agent**（AI 每日情报 Agent）

### 1.2 产品定位

面向中文开发者、AI 学习者和产品从业者的 **AI 情报采集与学习 Agent**。

产品每天自动浏览公开网络信息，筛选 AI 领域的新产品、新技术、新论文、开源项目和行业动态，生成结构化中文情报流，并支持用户围绕这些内容继续追问、学习和沉淀。

它不是单纯的新闻聚合站，而是一个垂直领域的 Research Agent：

```text
公开信息源 -> MCP/工具调用 -> Agent 判断与采集 -> LLM 摘要和评分
          -> 结构化数据库 -> Web 阅读界面 -> 可追问的 AI 助手
```

### 1.3 核心用户

- 需要持续跟踪 AI 领域变化的开发者
- 想利用碎片时间学习 AI 新技术的学生和学习者
- 需要了解 AI 产品、工具和行业趋势的产品经理
- 关注 AI 创业、开源项目和论文进展的研究型用户

### 1.4 核心价值

| 用户痛点 | 产品解决方式 |
| --- | --- |
| AI 信息源分散，RSS、论文、GitHub、产品发布都要分别看 | Agent 自动从多源采集并汇总 |
| 英文内容阅读成本高 | 自动生成中文标题、摘要、要点和术语解释 |
| 信息太多，不知道哪些值得看 | 相关性判断、重要性评分、推荐理由 |
| 想快速理解一个主题 | 基于已采集内容进行问答、总结、横向比较 |
| 希望每天形成学习习惯 | 每日情报流、日报摘要、收藏和稍后读 |

### 1.5 产品边界

MVP 阶段优先做“自动采集 + 中文情报流 + 基础追问”，不做复杂社区、不做用户生成内容平台、不做全网无限制爬虫。

---

## 2. 产品目标

### 2.1 MVP 目标

在第一阶段做出一个可访问的 Web 应用，每天自动生成一份高质量 AI 情报流，用户可以快速浏览、筛选、收藏，并对当天内容进行追问。

### 2.2 非目标

- 不追求覆盖所有 AI 新闻源
- 不做实时分钟级新闻推送
- 不在 MVP 阶段做复杂个性化推荐
- 不复制原文全文，不替代原站阅读
- 不让模型无限制自主浏览网络

---

## 3. 产品形态

### 3.1 第一屏体验

用户打开首页后，直接看到今天的 AI 情报，而不是营销页。

首页核心区域：

- 今日重点：3-5 条最值得看的内容
- 最新情报流：按时间和重要性混合排序
- 分类切换：产品、技术、论文、开源、行业
- 标签筛选：模型、Agent、开源、工具、芯片、多模态等
- 右侧/悬浮 AI 助手：可对今日内容提问

### 3.2 情报卡片

每条内容不是简单新闻卡，而是一张“可学习的信息卡”。

字段包括：

- 中文标题
- 原始标题
- 来源和发布时间
- 内容类型：新闻、论文、产品、开源项目、观点
- 80-120 字中文摘要
- 3-5 个标签
- 重要性评分 1-5
- 推荐理由：为什么值得看
- 原文链接
- 收藏/稍后读

### 3.3 情报详情页

详情页用于帮助用户理解，而不是复制原文。

内容包括：

- 中文摘要
- 核心要点
- 适合谁关注
- 可能影响
- 相关术语解释
- 相关情报推荐
- 原文链接

### 3.4 AI 助手

AI 助手基于本地已采集的情报数据回答问题。

典型问题：

- 今天 AI 领域最重要的 5 件事是什么？
- 今天有什么新的 AI 产品？
- 帮我总结本周 Agent 相关动态。
- 最近有哪些值得关注的开源项目？
- 这篇论文/新闻的核心贡献是什么？
- 把今天内容整理成一份 5 分钟学习清单。

MVP 阶段助手只需要基于数据库中的内容回答，不需要无限制实时浏览网页。

---

## 4. 数据来源策略

### 4.1 MVP 数据源

优先选择稳定、低成本、合法性较清晰的数据源。

| 类型 | 数据源 | 采集方式 | MVP 优先级 | 说明 |
| --- | --- | --- | --- | --- |
| 科技媒体 | TechCrunch AI、The Verge AI、MIT Technology Review AI | RSS/公开页面 | 高 | 适合新闻动态 |
| AI 媒体 | VentureBeat AI、AI News、The Decoder | RSS/公开页面 | 高 | 垂直内容较多 |
| 论文 | arXiv cs.AI、cs.LG、cs.CL、cs.CV | API/RSS | 高 | 适合每日论文筛选 |
| 开源项目 | GitHub Search API | API | 高 | 用 stars、created、pushed、topic 模拟趋势 |
| 产品发布 | Product Hunt AI 相关主题 | API/公开页面 | 中 | 需要关注 API token 和使用限制 |
| 社交内容 | X/Twitter、Reddit、Hacker News | API/搜索/后续接入 | 低 | 成本、权限、噪声较高，MVP 暂缓 |

### 4.2 数据源原则

- 优先使用 RSS、官方 API 和公开索引页面
- 每个来源都要有独立采集器，失败不影响整体任务
- 对同一事件进行去重和合并
- 保存原始链接和来源信息
- 不抓取登录后内容，不绕过付费墙，不复制受版权保护的全文

---

## 5. Agent 与 MCP 设计

### 5.1 为什么使用 MCP

MCP 用于把搜索、浏览、RSS、GitHub、arXiv、数据库等能力标准化为工具，让 Agent 可以按任务调用。

MVP 不要求所有工具都必须来自 MCP，但架构上预留 MCP Client，便于后续接入更多工具。

### 5.2 Agent 工作流

```text
定时触发
  -> 加载采集任务配置
  -> 调用 RSS/Search/GitHub/arXiv/Product 工具
  -> 获取候选内容
  -> 去重与基础清洗
  -> LLM 判断是否与 AI 相关
  -> LLM 生成结构化情报
  -> 重要性评分与分类
  -> 入库
  -> 生成每日摘要
```

### 5.3 工具层设计

工具可以分为三类：

| 工具类型 | 示例 | 用途 |
| --- | --- | --- |
| 采集工具 | RSS Tool、Search Tool、Browser Tool | 获取候选信息 |
| 专用 API 工具 | GitHub Tool、arXiv Tool、Product Hunt Tool | 获取结构化数据 |
| 内部工具 | Database Tool、Dedup Tool、LLM Summarizer | 处理和存储数据 |

### 5.4 Agent 权限控制

Agent 不应拥有无限制能力。必须设置边界：

- 每次任务最多访问 N 个 URL
- 每个来源有速率限制
- 每天有 token 预算
- 只允许访问白名单工具
- 工具调用记录必须可追踪
- 高风险操作需要人工确认

---

## 6. LLM 使用策略

### 6.1 当前资源假设

项目拥有接近 30 亿免费 token，可支持较大规模的摘要、筛选、标签生成和问答实验。

但 token 不是唯一成本，仍需控制：

- 数据源 API 成本
- 抓取失败和重试成本
- 数据库存储成本
- 长上下文延迟
- 内容质量评估成本

### 6.2 LLM 任务拆分

| 任务 | 输入 | 输出 | 模型策略 |
| --- | --- | --- | --- |
| 相关性判断 | 标题、摘要、来源 | 是否 AI 相关、原因 | 低成本模型 |
| 摘要生成 | 原始标题、摘要、正文片段 | 中文标题、摘要、要点 | 低成本/中等模型 |
| 重要性评分 | 结构化内容 | 1-5 分、推荐理由 | 低成本模型 |
| 每日总结 | 当日高质量情报 | 日报、主题聚类 | 中等模型 |
| 用户问答 | 用户问题 + 检索结果 | 可引用来源的回答 | 高质量模型 |

### 6.3 输出结构

LLM 处理后统一输出 JSON：

```json
{
  "title_cn": "中文标题",
  "summary_cn": "80-120 字中文摘要",
  "key_points": ["要点 1", "要点 2", "要点 3"],
  "tags": ["Agent", "开源", "开发工具"],
  "category": "tool",
  "importance": 4,
  "reason": "这项工具降低了开发者构建 Agent 工作流的门槛。",
  "audience": ["开发者", "产品经理"],
  "confidence": 0.86
}
```

---

## 7. 系统架构

### 7.1 推荐架构

```text
Web Frontend
  Next.js + React + Tailwind + shadcn/ui

Backend API
  Next.js Route Handlers / Node.js service

Agent Orchestrator
  任务调度、工具调用、LLM 调用、预算控制

MCP / Tool Layer
  RSS、Search、Browser、GitHub、arXiv、Product Hunt、Database

Data Layer
  PostgreSQL / Supabase
  pgvector 可选，用于语义检索
  Redis 可选，用于队列和缓存
```

### 7.2 MVP 技术选型

| 层级 | 技术 | 说明 |
| --- | --- | --- |
| 前端 | Next.js + React | 页面和 API 可放在同一项目 |
| UI | Tailwind CSS + shadcn/ui | 快速构建工具型界面 |
| 数据库 | Supabase PostgreSQL | 免费额度适合 MVP |
| 向量检索 | pgvector | 可后置，先用全文搜索也可以 |
| 定时任务 | Vercel Cron / GitHub Actions / 外部调度器 | 免费 Vercel Cron 频率有限 |
| Agent | 自研 Orchestrator + 可选 MCP Client | 先轻量实现，后续标准化 |
| LLM | OpenAI / Claude / 兼容 API | 摘要和问答分模型 |

### 7.3 定时任务策略

免费部署时不假设高频 Cron。

MVP 推荐：

- 每天自动采集 1 次
- 支持手动刷新
- 后续如果需要 2-4 小时更新，再引入更稳定的调度器或低成本后端

---

## 8. 数据模型

### 8.1 news_items

```sql
CREATE TABLE news_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100) NOT NULL,
    source_item_id VARCHAR(255),
    source_url TEXT,
    url TEXT NOT NULL UNIQUE,
    canonical_url TEXT,
    content_hash VARCHAR(128),

    title TEXT NOT NULL,
    title_cn TEXT,
    summary TEXT,
    summary_cn TEXT,
    content_excerpt TEXT,
    image_url TEXT,

    category VARCHAR(50),
    tags JSONB DEFAULT '[]'::jsonb,
    key_points JSONB DEFAULT '[]'::jsonb,
    audience JSONB DEFAULT '[]'::jsonb,
    importance INTEGER DEFAULT 3,
    reason TEXT,
    confidence NUMERIC(4, 3),

    published_at TIMESTAMP,
    collected_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,

    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_news_items_published_at ON news_items(published_at DESC);
CREATE INDEX idx_news_items_category ON news_items(category);
CREATE INDEX idx_news_items_importance ON news_items(importance DESC);
CREATE INDEX idx_news_items_status ON news_items(processing_status);
CREATE INDEX idx_news_items_source ON news_items(source);
```

### 8.2 collection_runs

```sql
CREATE TABLE collection_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'running',
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    sources JSONB DEFAULT '[]'::jsonb,
    items_found INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    error TEXT
);
```

### 8.3 saved_items

```sql
CREATE TABLE saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    item_id UUID REFERENCES news_items(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.4 chat_messages

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    related_item_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 9. API 设计

### 9.1 情报列表

```text
GET /api/items
  ?category=tool
  ?tag=Agent
  ?source=github
  ?importance=4
  ?from=2026-06-01
  ?to=2026-06-04
  ?page=1
  ?limit=20
```

### 9.2 情报详情

```text
GET /api/items/:id
```

### 9.3 今日重点

```text
GET /api/items/featured?date=2026-06-04
```

### 9.4 搜索

```text
GET /api/search?q=agentic%20coding
```

### 9.5 Agent 问答

```text
POST /api/assistant/chat

Body:
{
  "message": "今天有什么值得关注的 AI 开源项目？",
  "session_id": "optional",
  "scope": "today"
}

Response:
{
  "reply": "今天值得关注的开源项目有...",
  "related_items": []
}
```

### 9.6 手动采集

```text
POST /api/agent/run

Body:
{
  "scope": "daily",
  "sources": ["rss", "arxiv", "github"]
}
```

---

## 10. 页面设计

### 10.1 首页 Dashboard

```text
┌────────────────────────────────────────────────────────────┐
│ AI Daily Agent        [全部] [产品] [技术] [论文] [开源]      │
├────────────────────────────────────────────────────────────┤
│ 今日重点                                                    │
│ [重点卡片 1] [重点卡片 2] [重点卡片 3]                       │
├────────────────────────────────────────────────────────────┤
│ 最新情报                         [重要性] [来源] [时间]       │
│ [情报卡片] [情报卡片] [情报卡片]                              │
│ [情报卡片] [情报卡片] [情报卡片]                              │
├────────────────────────────────────────────────────────────┤
│ 热门标签        今日统计        最近采集任务                   │
└────────────────────────────────────────────────────────────┘
                                      [AI 助手]
```

### 10.2 AI 助手面板

```text
┌──────────────────────────────┐
│ AI 助手                       │
├──────────────────────────────┤
│ 快速问题                       │
│ [今日重点] [本周论文] [新工具]   │
├──────────────────────────────┤
│ 对话消息                       │
├──────────────────────────────┤
│ [输入问题...]            [发送] │
└──────────────────────────────┘
```

---

## 11. 开发路线图

### Phase 1: MVP - 每日 AI 情报流

目标：完成自动采集、摘要生成、展示和基础筛选。

- [ ] 项目初始化
- [ ] 数据库 schema
- [ ] RSS 采集器
- [ ] arXiv 采集器
- [ ] GitHub Search 采集器
- [ ] 去重和处理状态流转
- [ ] LLM 摘要、标签、评分
- [ ] 首页情报流
- [ ] 情报详情页
- [ ] 手动刷新任务
- [ ] 基础部署

交付物：用户每天可以打开网站浏览一份 AI 中文情报流。

### Phase 2: 可追问的 AI 助手

目标：让用户可以基于已采集内容提问。

- [ ] 数据库检索接口
- [ ] 助手问答 API
- [ ] 引用相关情报
- [ ] 快速问题按钮
- [ ] 对话历史
- [ ] 每日总结生成

交付物：用户可以询问“今天有什么重点”“本周有哪些论文”等问题。

### Phase 3: MCP 化与 Agent 编排

目标：把采集能力抽象成工具层，支持更复杂的 Research Agent 工作流。

- [ ] MCP Client 接入
- [ ] Search/Browser 工具封装
- [ ] 工具白名单
- [ ] token 和调用预算
- [ ] 工具调用日志
- [ ] 采集任务可视化

交付物：系统具备标准化工具调用能力，可扩展新的数据源。

### Phase 4: 个性化与学习沉淀

目标：从“每日看新闻”升级为“持续学习工作台”。

- [ ] 用户登录
- [ ] 收藏和稍后读
- [ ] 关键词订阅
- [ ] 每日邮件摘要
- [ ] 个人阅读历史
- [ ] 主题学习路径

交付物：用户能围绕自己的兴趣持续追踪 AI 主题。

---

## 12. 成本与部署

### 12.1 成本结构

| 成本项 | MVP 策略 |
| --- | --- |
| LLM token | 使用现有免费 token，设置每日预算 |
| 数据库 | Supabase 免费额度 |
| 前端和 API | Vercel 免费额度 |
| 定时任务 | 每日自动 + 手动刷新 |
| 搜索/API | 优先免费 RSS/API，谨慎接入付费源 |

### 12.2 预算控制

- 每日最大采集条数
- 每条内容最大正文截取长度
- 低价值内容先过滤，再调用摘要模型
- 摘要结果缓存
- 对失败任务设置重试上限
- 记录每次任务 tokens_used

---

## 13. 风险与对策

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| 数据源失效 | 部分内容缺失 | 多来源、失败日志、手动禁用来源 |
| 抓取内容噪声高 | 摘要质量下降 | 相关性判断和置信度过滤 |
| LLM 幻觉 | 用户被误导 | 保留来源链接，回答时引用相关内容 |
| 版权风险 | 法律和合规问题 | 只展示摘要和链接，不复制全文 |
| MCP 工具权限过大 | 安全风险 | 工具白名单、调用日志、预算限制 |
| 免费部署限制 | 更新频率不足 | MVP 接受每日更新，后续升级调度 |
| token 被浪费 | 成本失控 | 分级模型、先过滤后摘要、每日预算 |

---

## 14. 成功指标

### 14.1 MVP 指标

| 指标 | 目标 |
| --- | --- |
| 每日有效情报条数 | 30-80 条 |
| 重复率 | < 15% |
| 摘要可用率 | > 85% |
| 采集任务成功率 | > 90% |
| 首页首屏加载时间 | < 2 秒 |
| 用户完成一次有效阅读时间 | < 1 分钟 |

### 14.2 后续指标

| 指标 | 目标 |
| --- | --- |
| 周活跃用户 | 50+ |
| 收藏率 | > 10% |
| AI 助手问题回答满意率 | > 80% |
| 日报打开率 | > 30% |

---

## 15. 竞品与参考

- Hacker News：高质量技术社区，但不针对 AI 情报聚合
- Readhub：科技资讯聚合，可参考信息流形态
- Product Hunt：产品发现，可参考新产品组织方式
- Papers with Code：论文和代码连接，可参考研究内容结构化
- Perplexity / ChatGPT Search：可参考搜索问答体验
- Codex skill / anysearch：可参考“工具调用 + 模型阅读”的工作流

---

## 16. 核心结论

AI Daily Agent 的关键不在于做一个更漂亮的新闻列表，而在于构建一条稳定的 AI 情报管线：

```text
找得到 -> 筛得准 -> 讲得清 -> 可追问 -> 可沉淀
```

MVP 应优先证明这条管线有效。只要每天能稳定产出一份高质量、可信、有学习价值的中文 AI 情报流，后续再扩展 MCP 工具、个性化推荐和深度 Agent 能力。
