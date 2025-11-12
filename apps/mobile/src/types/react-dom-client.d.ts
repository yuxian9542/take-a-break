declare module 'react-dom/client' {
  import type * as React from 'react';

  export interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }

  export function createRoot(
    container: Element | DocumentFragment,
    options?: { hydrate?: boolean }
  ): Root;
}
