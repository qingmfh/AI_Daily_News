# AI Daily Agent - 开发计划

> 日期：2026-06-04（v2 修订版）
> 目标：做一个能用的 AI 情报工具——每天自动采集 AI 内容，生成中文情报卡片，用户可以浏览和筛选。

---

## 1. 产品定义

### 1.1 一句话

**AI Daily Agent 是一个每天自动收集 AI 领域公开信息，并生成中文摘要、标签、重要性评分的情报流 Web 工具。**

### 1.2 第一版最终效果

用户打开网页后，可以看到当天 AI 领域的重要动态。每条内容都已经被 AI 处理成中文情报卡片，带有分类、标签、重要性评分和原文链接。

用户可以：
- 浏览今日情报流
- 按分类、标签、重要性筛选
- 点击查看详情和原文链接
- 手动触发采集任务

### 1.3 第一版不做什么

- ❌ 复杂用户系统（登录、注册）
- ❌ AI 助手问答（后续再做）
- ❌ 收藏、稍后读
- ❌ 邮件推送
- ❌ 移动 App
- ❌ 复杂个性化推荐
- ❌ MCP 标准化

---

## 2. 核心功能范围

### 2.1 必须实现

| 模块 | 功能 | 说明 |
|------|------|------|
| 情报采集 | RSS 采集 | 从 AI/科技媒体 RSS 获取新闻 |
| 情报采集 | arXiv 采集 | 获取 AI 相关论文 |
| 情报采集 | GitHub 采集 | 获取近期热门 AI 项目 |
| 数据处理 | 去重 | 基于 URL 和标题去重 |
| 数据处理 | AI 摘要 | 生成中文标题、摘要、标签、分类和重要性评分 |
| 前端展示 | 首页情报流 | 按发布时间展示和分页浏览最新内容 |
| 前端展示 | 筛选 | 按分类、标签、重要性筛选 |
| 前端展示 | 详情页 | 查看摘要、要点、原文链接 |
| 任务管理 | 手动刷新 | 点击按钮触发采集任务 |

### 2.2 后续再做

- AI 助手问答
- 用户系统
- 收藏/稍后读
- 邮件摘要
- 趋势图表
- MCP 标准化

---

## 3. 技术框架

### 3.1 技术栈

| 层级 | 技术 | 选择理由 |
|------|------|---------|
| 前端 | Next.js + React | 前后端一个项目，快速开发 |
| 样式 | Tailwind CSS | 快速搭建界面 |
| UI 组件 | shadcn/ui | 组件成熟，开箱即用 |
| 数据库 | **SQLite (via Turso)** | 本地开发用 SQLite 文件，部署用 Turso 云数据库 |
| ORM | **Drizzle ORM** | 轻量、TypeScript 原生、SQLite 支持好 |
| 采集任务 | Next.js API Route | 手动触发采集 |
| 定时任务 | GitHub Actions（每日） | 免费，灵活 |
| AI 调用 | OpenAI API | 摘要、评分（用户自带 Key） |

### 3.2 为什么用 SQLite

| 优势 | 说明 |
|------|------|
| 零配置 | 不需要安装 PostgreSQL，本地文件直接用 |
| 开发简单 | `better-sqlite3` 一个文件就是一个数据库 |
| 部署灵活 | 本地开发用文件，部署用 Turso（SQLite 兼容的云数据库） |
| 免费 | Turso 免费额度：500 database + 9GB 存储 + 100 亿行读取 |
| 性能好 | 单机场景下比 PostgreSQL 更快 |

### 3.3 部署方案

```
本地开发                          生产部署
┌─────────────┐                ┌─────────────┐
│  Next.js    │                │  Vercel     │
│  SQLite 文件 │                │  (前端+API) │
│  (本地)      │                └──────┬──────┘
└─────────────┘                       │
                                      ↓
                               ┌─────────────┐
                               │  Turso      │
                               │  (云SQLite) │
                               └─────────────┘
```

### 3.4 项目结构

```
app/
  page.tsx                      首页情报流
  items/[id]/page.tsx            情报详情页
  api/
    items/route.ts               情报列表 API
    agent/run/route.ts           手动采集任务 API

components/
  item-card.tsx                  情报卡片
  item-filters.tsx               筛选器
  header.tsx                     页头

lib/
  db/
    schema.ts                    数据库 schema
    client.ts                    数据库连接
  collectors/
    rss.ts                       RSS 采集器
    arxiv.ts                     arXiv 采集器
    github.ts                    GitHub 采集器
  agent/
    run-collection.ts            采集任务调度
    process-item.ts              单条内容处理
    prompts.ts                   LLM Prompt
  ai/
    client.ts                    AI API 客户端
    summarize.ts                 摘要生成
  utils/
    dedupe.ts                    去重逻辑
    normalize-url.ts             URL 规范化
```

---

## 4. 数据模型

### 4.1 news_items 表

```sql
CREATE TABLE news_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_cn TEXT,
    summary TEXT,
    summary_cn TEXT,
    content_excerpt TEXT,
    source TEXT NOT NULL,
    source_url TEXT,
    category TEXT DEFAULT 'news',
    tags TEXT DEFAULT '[]',
    key_points TEXT DEFAULT '[]',
    importance INTEGER DEFAULT 3,
    reason TEXT,
    image_url TEXT,
    published_at TEXT,
    collected_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT,
    processing_status TEXT DEFAULT 'pending',
    is_featured INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_news_items_published_at ON news_items(published_at DESC);
CREATE INDEX idx_news_items_category ON news_items(category);
CREATE INDEX idx_news_items_importance ON news_items(importance DESC);
CREATE INDEX idx_news_items_status ON news_items(processing_status);
```

### 4.2 collection_runs 表

```sql
CREATE TABLE collection_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_type TEXT NOT NULL,
    status TEXT DEFAULT 'running',
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT,
    items_found INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    error TEXT
);
```

---

## 5. 分阶段任务

### Phase 0: 项目初始化

**目标：** 搭好可开发的基础工程。

**任务：**

- [ ] 初始化 Next.js 项目（TypeScript）
- [ ] 配置 Tailwind CSS
- [ ] 配置 shadcn/ui
- [ ] 配置 Drizzle ORM + SQLite
- [ ] 创建数据库 schema
- [ ] 新建基础页面布局
- [ ] 准备环境变量模板（`.env.example`）

**交付标准：**
- 本地能启动网页
- 数据库能正常连接和查询
- 项目结构清晰

---

### Phase 1: 首页与情报卡片

**目标：** 先用 mock 数据跑通前端展示。

**任务：**

- [ ] 设计情报卡片组件
- [ ] 实现首页情报流布局
- [ ] 实现详情页
- [ ] 实现分类筛选
- [ ] 实现重要性筛选
- [ ] 插入 10-20 条 mock 数据测试
- [ ] 对接数据库 API

**交付标准：**
- 首页能展示情报卡片
- 点击卡片能进入详情页
- 筛选功能可用
- 数据来自数据库

---

### Phase 1.5: 前端信息架构与阅读体验优化（当前优先事项）

**目标：** 用户打开首页后直接看到最新情报流，并能顺畅浏览全部情报和理解单条新闻。

**执行原则：**

1. 先保证发布时间和最新顺序正确，再调整视觉布局
2. 首屏服务于阅读，不做营销页，也不突出尚未可用的功能
3. 每条情报使用一致、清晰的单行布局
4. 分页交互名称必须与实际行为一致，并保留可分享的 URL 状态
5. 每个新发现的问题先记录到 `docs/issues.md`，解决后更新状态、方案和相关文件

#### 1.5.1 数据正确性（P0）

- [x] 统一所有采集器写入的 `published_at` 为 UTC ISO 8601
- [x] 迁移已有混合格式日期，修复“今日更新”和时间排序
- [x] 为最新流增加稳定排序兜底：时间、重要性、ID
- [x] 取消“今日重点”功能并清除已有重点标记

#### 1.5.2 首页首屏重构（P1）

推荐布局：

```text
┌────────────────────────────────────────────────────────────┐
│ AI Daily Agent   今日更新/最近采集状态          搜索/筛选    │
├────────────────────────────────────────────────────────────┤
│ 最新情报流                         分类 / 标签 / 重要性       │
│ [单行情报]                                                 │
│ [单行情报]                                                 │
└────────────────────────────────────────────────────────────┘
```

- [x] 移除占据首屏的大段产品说明
- [x] 将总情报和今日更新移入固定顶栏
- [x] 将未接通的 AI 助手移出首页
- [x] 取消今日重点区域，首页直接进入最新情报流
- [x] 桌面首屏直接展示筛选器和最新情报流

#### 1.5.3 分页与筛选重构（P1）

本阶段采用 **URL 驱动的标准分页**，不使用语义不一致的“加载更多”。

- [x] 每页最多展示 10 条情报
- [x] 提供上一页、下一页、当前页、总页数和指定页跳转
- [x] 显示结果区间，例如“第 21-30 条，共 110 条”
- [x] 搜索、分类、重要性或排序变化时自动回到第 1 页
- [x] 服务端归一超范围页码，避免空白页
- [x] 翻页时保留筛选参数和 `#latest` 锚点
- [ ] 支持点击标签进入标签筛选
- [x] 保证跨页结果无重复、无跳项

#### 1.5.4 情报卡片重构（P1）

- [x] 所有情报改为每条独占一行的横向布局
- [x] 单行情报突出：中文标题、摘要、来源、时间和重要性
- [x] 首页隐藏原始标题，减少信息噪声
- [x] 取消三列等权卡片墙

#### 1.5.5 详情页阅读重构（P2）

- [ ] 阅读主线调整为：摘要结论 → 为什么重要 → 核心要点 → 可能影响
- [ ] 桌面端使用主内容 + 元数据侧栏
- [ ] 控制正文阅读宽度、字号、行高和段落间距
- [ ] 原文摘要默认折叠或降级展示
- [ ] 分阶段补充适合人群、可能影响、术语解释和相关情报
- [ ] 原文入口始终清晰可见，但不打断主阅读流程

#### 1.5.6 性能测量与优化（P3，暂缓）

- [ ] 在生产构建下测量 TTFB、查询耗时、响应体大小和前端渲染耗时
- [ ] 根据测量结果决定是否缓存/合并统计查询
- [ ] 评估减少首屏返回条数、增加 `loading.tsx` 和流式加载
- [ ] 首页首屏加载时间达到 PRD 目标：小于 2 秒

**交付标准：**

- 用户打开首页后直接看到最新情报流
- 发布时间、最新排序和今日统计准确
- 用户能够稳定翻阅、筛选和恢复列表位置
- 用户在 10 秒内识别最重要的 3 条情报
- 用户在 1 分钟内通过详情页理解一条情报的内容和价值

**对应问题：** `docs/issues.md` #001、#003、#008-#014

---

### Phase 2: RSS 采集器

**目标：** 从真实数据源获取内容。

**任务：**

- [ ] 实现 RSS 解析器
- [ ] 配置 3-5 个 RSS 来源
- [ ] 实现 URL 规范化
- [ ] 实现内容去重
- [ ] 实现采集任务日志
- [ ] 写 `/api/agent/run` 手动触发接口
- [ ] 前端添加"手动刷新"按钮

**初始 RSS 来源：**

| 名称 | URL |
|------|-----|
| TechCrunch AI | `https://techcrunch.com/category/artificial-intelligence/feed/` |
| The Verge AI | `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml` |
| VentureBeat AI | `https://venturebeat.com/category/ai/feed/` |
| Hacker News | `https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT` |
| MIT Tech Review | `https://www.technologyreview.com/feed/` |

**交付标准：**
- 点击"手动刷新"后能抓取真实内容
- 重复内容不会反复入库
- 采集结果有任务日志

---

### Phase 3: AI 处理管线

**目标：** 把原始内容处理成中文情报卡片。

**任务：**

- [ ] 配置 OpenAI API client
- [ ] 设计摘要 Prompt
- [ ] 生成中文标题
- [ ] 生成 80-120 字中文摘要
- [ ] 生成标签（3-5 个）
- [ ] 生成分类
- [ ] 生成重要性评分（1-5）
- [ ] 生成推荐理由
- [ ] 生成核心要点（3 条）
- [ ] 处理失败重试（最多 2 次）
- [ ] 统计 token 使用量

**Prompt 模板：**

```
你是一个 AI 领域资讯分析师。请分析以下内容，输出 JSON 格式。

输入信息：
- 标题：{title}
- 来源：{source}
- 内容：{content}

请输出：
{
  "title_cn": "中文标题（不超过30字）",
  "summary_cn": "80-120字中文摘要",
  "key_points": ["要点1", "要点2", "要点3"],
  "tags": ["标签1", "标签2", "标签3"],
  "category": "news|paper|tool|project|opinion",
  "importance": 1-5,
  "reason": "为什么值得看（30字以内）"
}

规则：
1. 如果内容与 AI 无关，importance 设为 1
2. 重要性评分：5=重大突破，4=重要进展，3=值得关注，2=一般动态，1=不太相关
3. 摘要要客观，不夸大
```

**交付标准：**
- 新采集内容能自动变成中文情报
- LLM 输出结构稳定
- 失败内容不会阻塞整个任务
- 首页展示真实 AI 处理结果

---

### Phase 4: 补全采集器

**目标：** 扩大数据源覆盖。

**任务：**

- [ ] 实现 arXiv 采集器
  - 使用 `https://export.arxiv.org/api/query` API
  - 筛选 cs.AI、cs.LG、cs.CL、cs.CV 分类
  - 每次获取最近 24 小时的论文
- [ ] 实现 GitHub Search 采集器
  - 使用 GitHub Search API
  - 搜索条件：`topic:ai OR topic:machine-learning OR topic:llm`
  - 按 stars 和近期创建排序
- [ ] 完善去重逻辑（跨源去重）

**交付标准：**
- arXiv 论文能自动采集
- GitHub 热门项目能自动采集
- 三个源的内容不重复

---

### Phase 5: 部署与打磨

**目标：** 部署一个可访问的 MVP。

**任务：**

- [ ] 配置 Turso 数据库（生产环境）
- [ ] 部署到 Vercel
- [ ] 配置 GitHub Actions 每日采集
- [ ] 增加 loading、empty、error 状态
- [ ] 增加响应式布局（移动端适配）
- [ ] 增加页面标题和 meta 信息

**GitHub Actions 配置示例：**

```yaml
name: Daily AI News Collection
on:
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 00:00
  workflow_dispatch:  # 支持手动触发

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run collect
        env:
          DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          DATABASE_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**交付标准：**
- 线上可访问
- 每天自动采集一次
- 手动刷新可用
- 页面稳定美观

---

## 6. MVP 验收标准

当以下条件满足时，第一版完成：

- [ ] 首页展示真实采集的 AI 情报
- [x] 首页首屏直接展示最新情报流，而不是产品说明或未完成功能
- [x] 今日更新和最新排序基于格式一致的发布时间
- [ ] 每条情报有中文标题、摘要、分类、标签、重要性评分
- [ ] 用户可以按分类和重要性筛选
- [ ] 用户可以按标签筛选，并稳定翻阅全部筛选结果
- [ ] 用户可以打开详情页查看要点和原文链接
- [ ] 详情页能够清楚回答“发生了什么、为什么重要、对谁有用”
- [ ] 用户可以手动触发一次采集任务
- [ ] 系统可以每天自动采集一次
- [ ] 线上部署后可以稳定访问

---

## 7. 开发顺序总结

```text
Phase 0: 项目初始化 + 数据库        1 天
Phase 1: 首页 + 情报卡片（mock）     1-2 天
Phase 1.5: 信息架构 + 阅读体验优化   2-3 天
Phase 2: RSS 采集器                 1-2 天
Phase 3: AI 处理管线                2-3 天
Phase 4: arXiv + GitHub 采集器      1-2 天
Phase 5: 部署 + 打磨                1-2 天
────────────────────────────────────────
总计：                              9-15 天
```

每一步都有可见成果，可以随时停下来评估效果。

---

## 8. 环境变量模板

```env
# 数据库（本地开发用 SQLite 文件）
DATABASE_URL="file:./local.db"

# Turso（生产环境）
# TURSO_DATABASE_URL="libsql://xxx.turso.io"
# TURSO_AUTH_TOKEN="xxx"

# OpenAI API（用户自带 Key）
OPENAI_API_KEY="sk-xxx"
OPENAI_MODEL="gpt-4o-mini"

# GitHub API（可选，提高采集速率限制）
# GITHUB_TOKEN="ghp_xxx"
```
