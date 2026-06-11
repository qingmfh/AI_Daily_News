'use client';

import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Bot,
  ChevronDown,
  Grip,
  Loader2,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAssistantPageContext } from '@/components/assistant-page-context';
import { MarkdownRenderer } from '@/components/markdown-renderer';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface AssistantPanelProps {
  onOpenChange?: (open: boolean) => void;
}

const PANEL_WIDTH = 384;
const PANEL_HEIGHT = 640;
const PANEL_TOP_OFFSET = 72;
const PANEL_BOTTOM_GAP = 8;

const defaultMessages: ChatMessage[] = [
  {
    role: 'assistant',
    content: '我会跟着你在首页和情报详情之间一起走。直接问我就行。',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCurrentItemId(pathname: string): number | undefined {
  const match = pathname.match(/^\/items\/(\d+)$/);
  if (!match) {
    return undefined;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getDefaultPosition() {
  if (typeof window === 'undefined') {
    return { x: 24, y: 96 };
  }

  return {
    x: Math.max(24, window.innerWidth - PANEL_WIDTH - 24),
    y: 96,
  };
}

function getPanelHeight(viewportHeight: number) {
  return Math.min(PANEL_HEIGHT, Math.max(420, viewportHeight - PANEL_TOP_OFFSET - PANEL_BOTTOM_GAP));
}

function appendToLastAssistant(messages: ChatMessage[], content: string): ChatMessage[] {
  const nextMessages = [...messages];
  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    if (nextMessages[index].role === 'assistant') {
      nextMessages[index] = {
        role: 'assistant',
        content: `${nextMessages[index].content}${content}`,
      };
      return nextMessages;
    }
  }

  return [...nextMessages, { role: 'assistant', content }];
}

function replaceLastAssistant(messages: ChatMessage[], content: string): ChatMessage[] {
  const nextMessages = [...messages];
  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    if (nextMessages[index].role === 'assistant') {
      nextMessages[index] = { role: 'assistant', content };
      return nextMessages;
    }
  }

  return [...nextMessages, { role: 'assistant', content }];
}

export function AssistantPanel({ onOpenChange }: AssistantPanelProps) {
  const pathname = usePathname();
  const itemId = getCurrentItemId(pathname);
  const { pageContext } = useAssistantPageContext();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window === 'undefined' ? 900 : window.innerHeight
  );
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    getDefaultPosition()
  );
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const desktopMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const mobileMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const panelHeight = getPanelHeight(viewportHeight);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setViewportHeight((current) => (
        current === window.innerHeight ? current : window.innerHeight
      ));

      setPosition((current) => {
        if (!current) {
          return current;
        }

        const nextX = clamp(current.x, 8, Math.max(8, window.innerWidth - PANEL_WIDTH - 8));
        const nextY = clamp(
          current.y,
          PANEL_TOP_OFFSET,
          Math.max(PANEL_TOP_OFFSET, window.innerHeight - getPanelHeight(window.innerHeight) - PANEL_BOTTOM_GAP)
        );

        if (nextX === current.x && nextY === current.y) {
          return current;
        }

        return { x: nextX, y: nextY };
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    desktopMessagesEndRef.current?.scrollIntoView({ block: 'end' });
    mobileMessagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isLoading]);

  const scopeLabel = itemId ? `当前上下文：情报 #${itemId}` : '当前上下文：首页情报流';

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!position) {
      return;
    }

    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragState.current) {
        return;
      }

      const nextX = dragState.current.originX + (moveEvent.clientX - dragState.current.startX);
      const nextY = dragState.current.originY + (moveEvent.clientY - dragState.current.startY);

      setPosition({
        x: clamp(nextX, 8, Math.max(8, window.innerWidth - PANEL_WIDTH - 8)),
        y: clamp(nextY, PANEL_TOP_OFFSET, Math.max(PANEL_TOP_OFFSET, window.innerHeight - panelHeight - PANEL_BOTTOM_GAP)),
      });
    };

    const handleUp = () => {
      dragState.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const askAssistant = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const history = messages.slice(-6);
    setMessages((current) => [
      ...current,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '' },
    ]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          itemId,
          pageContent: pageContext?.content,
          history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(errorData?.error || 'AI 助手请求失败');
      }

      if (!response.body) {
        throw new Error('AI 助手没有返回可读取的响应流');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          setMessages((current) => appendToLastAssistant(current, chunk));
        }
      }

      const rest = decoder.decode();
      if (rest) {
        setMessages((current) => appendToLastAssistant(current, rest));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI 助手请求失败';
      setMessages((current) => replaceLastAssistant(current, `抱歉，${errorMessage}`));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void askAssistant(message);
    }
  };

  const renderMessages = (endRef: typeof desktopMessagesEndRef, mobile = false) => (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-lg border border-orange-100 bg-white p-3">
      {messages.map((item, index) => (
        <div
          key={`${mobile ? 'mobile-' : ''}${item.role}-${index}`}
          className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
            item.role === 'user'
              ? `${mobile ? 'max-w-[90%]' : 'max-w-[88%]'} ml-auto bg-orange-600 text-white`
              : `${mobile ? 'max-w-[94%]' : 'max-w-[92%]'} mr-auto bg-orange-50 text-stone-700`
          }`}
        >
          {item.role === 'assistant' ? (
            item.content ? (
              <MarkdownRenderer content={item.content} />
            ) : (
              <span className="inline-flex items-center gap-2 text-stone-500">
                <Loader2 className="size-4 animate-spin text-orange-700" />
                正在组织回答
              </span>
            )
          ) : (
            <p className="whitespace-pre-wrap">{item.content}</p>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );

  const renderComposer = () => (
    <div className="mt-2 overflow-hidden rounded-lg border border-orange-100 bg-white">
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleComposerKeyDown}
        rows={2}
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        aria-label="AI 助手对话输入框"
        disabled={isLoading}
        className="max-h-28 min-h-16 w-full resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 text-stone-700 outline-none placeholder:text-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );

  const desktopPosition = position ?? { x: 24, y: 96 };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-700 shadow-lg shadow-orange-900/15 transition-transform hover:scale-[1.03] hover:bg-orange-50"
          aria-label="打开 AI 智能助手"
        >
          <Bot className="size-6" />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed z-40 hidden lg:block"
          style={{ left: `${desktopPosition.x}px`, top: `${desktopPosition.y}px` }}
        >
          <aside
            className="surface-soft flex w-[384px] flex-col overflow-hidden rounded-xl bg-white/96"
            style={{ height: `${panelHeight}px` }}
          >
            <div
              onPointerDown={startDrag}
              className="flex cursor-move items-center justify-between border-b border-orange-100 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                  <Bot className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-stone-950">AI 智能助手</h2>
                  <p className="text-xs text-stone-500">{scopeLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex size-8 items-center justify-center text-stone-400">
                  <Grip className="size-4" />
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700"
                  aria-label="收起 AI 智能助手"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-3">
              {renderMessages(desktopMessagesEndRef)}
              {renderComposer()}
            </div>
          </aside>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 top-20 z-40 lg:hidden">
          <aside className="surface-soft flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white/96">
            <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                  <Bot className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-stone-950">AI 智能助手</h2>
                  <p className="text-xs text-stone-500">{scopeLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700"
                aria-label="关闭 AI 智能助手"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-3">
              {renderMessages(mobileMessagesEndRef, true)}
              {renderComposer()}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
