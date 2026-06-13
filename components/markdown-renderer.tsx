'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      skipHtml
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-base font-semibold leading-7 text-stone-950">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-semibold leading-6 text-stone-950">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-medium leading-6 text-stone-900">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-6 text-stone-700">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1.5 pl-4 text-sm leading-6 text-stone-700">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1.5 pl-5 text-sm leading-6 text-stone-700">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="list-[revert] pl-1">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-orange-200 pl-3 text-sm leading-6 text-stone-600">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-700 underline decoration-orange-200 underline-offset-4 hover:text-orange-800"
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          const isBlock = Boolean(className) || String(children).includes('\n');

          if (isBlock) {
            return (
              <code className="font-mono text-xs leading-6 text-stone-100">
                {children}
              </code>
            );
          }

          return (
            <code className="rounded bg-stone-900/6 px-1.5 py-0.5 font-mono text-[0.92em] text-stone-800">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="overflow-x-auto rounded-lg bg-stone-950 px-3 py-3">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-stone-700">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-orange-100 bg-orange-50 px-2 py-1.5 font-semibold text-stone-900">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-orange-100 px-2 py-1.5 align-top">
            {children}
          </td>
        ),
        hr: () => <hr className="border-orange-100" />,
        input: (props) => (
          <input
            {...props}
            disabled
            className="mr-1.5 align-middle accent-orange-600"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
