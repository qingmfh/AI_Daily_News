import { getModel, openai } from './client';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt() {
  return `You are the built-in assistant for AI Daily Agent.

Your job is to help the user understand the page they are currently viewing. The app is an AI news and intelligence reader, so the user may ask you to summarize, translate, extract key points, compare items, explain implications, or continue a conversation about the current page.

Rules:
1. Answer in Simplified Chinese by default, unless the user explicitly asks for another language.
2. Prioritize the provided page context, item details, and recent conversation history.
3. If the context is not enough to support a confident answer, say so directly and give a careful answer based only on available information.
4. Do not invent article details, sources, numbers, dates, author opinions, or external facts.
5. Sound like a helpful web assistant, not an implementation report.
6. Keep answers concise, structured, and useful. Markdown lists are welcome when they improve readability.
7. If the user asks about "this page" or "the current item", treat the provided page context as the primary source.
8. If the user asks for summary, translation, key points, or analysis, perform the task directly.
9. When the context contains "可引用情报", use those items as evidence for factual claims.
10. Cite supporting items inline with Markdown links like [#123](https://example.com) when you rely on them.
11. If no provided item supports a claim, label it as an inference or say the current database does not contain enough evidence.`;
}

export async function createAssistantChatStream({
  message,
  context,
  history = [],
}: {
  message: string;
  context: string;
  history?: AssistantMessage[];
}) {
  const trimmedHistory = history
    .filter((item) => item.content.trim())
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 1500),
    }));

  return openai.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(),
      },
      {
        role: 'user',
        content: `当前页面上下文：\n${context.slice(0, 12000)}`,
      },
      ...trimmedHistory,
      {
        role: 'user',
        content: message,
      },
    ],
    temperature: 0.3,
    max_tokens: 4000,
    stream: true,
  });
}
