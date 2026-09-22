import { createContext, useContext, useMemo, type ReactNode } from 'react';

type PageCtx = { sectionId: string; pageNumber: number };

const PageContext = createContext<PageCtx | null>(null);

export function usePageContext(): PageCtx | null {
  return useContext(PageContext);
}

export function PageContextProvider({
  sectionId, pageNumber, children,
}: {
  sectionId: string;
  pageNumber: number;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ sectionId, pageNumber }), [sectionId, pageNumber]);
  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}
