'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type AssistantPageContextState = {
  scopeKey: string;
  content: string;
} | null;

type AssistantPageContextValue = {
  pageContext: AssistantPageContextState;
  setPageContext: Dispatch<SetStateAction<AssistantPageContextState>>;
};

const AssistantPageContext = createContext<AssistantPageContextValue | null>(null);

export function AssistantPageContextProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContext] = useState<AssistantPageContextState>(null);
  const value = useMemo(
    () => ({ pageContext, setPageContext }),
    [pageContext]
  );

  return (
    <AssistantPageContext.Provider value={value}>
      {children}
    </AssistantPageContext.Provider>
  );
}

export function AssistantPageContextBridge({
  scopeKey,
  content,
}: {
  scopeKey: string;
  content: string;
}) {
  const { setPageContext } = useAssistantPageContext();

  useEffect(() => {
    const normalizedContent = content.trim();

    setPageContext(
      normalizedContent
        ? {
            scopeKey,
            content: normalizedContent,
          }
        : null
    );

    return () => {
      setPageContext((current) => (
        current?.scopeKey === scopeKey ? null : current
      ));
    };
  }, [content, scopeKey, setPageContext]);

  return null;
}

export function useAssistantPageContext() {
  const context = useContext(AssistantPageContext);
  if (!context) {
    throw new Error('useAssistantPageContext must be used within AssistantPageContextProvider');
  }

  return context;
}
