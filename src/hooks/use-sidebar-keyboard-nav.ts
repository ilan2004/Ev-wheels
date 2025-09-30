'use client';

import { useEffect } from 'react';

interface UseSidebarKeyboardNavProps {
  isOpen: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

export function useSidebarKeyboardNav({
  isOpen,
  onScrollUp,
  onScrollDown
}: UseSidebarKeyboardNavProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when sidebar is focused or active
      const activeElement = document.activeElement;
      const sidebarElement = document.querySelector('[data-sidebar="content"]');

      if (
        !sidebarElement?.contains(activeElement) &&
        !sidebarElement?.matches(':hover')
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onScrollUp();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onScrollDown();
          break;
        case 'PageUp':
          event.preventDefault();
          // Scroll up more
          for (let i = 0; i < 3; i++) onScrollUp();
          break;
        case 'PageDown':
          event.preventDefault();
          // Scroll down more
          for (let i = 0; i < 3; i++) onScrollDown();
          break;
        case 'Home':
          if (event.ctrlKey) {
            event.preventDefault();
            // Scroll to top
            const container = sidebarElement?.querySelector(
              '[data-slot="sidebar-content"] > div'
            );
            if (container) {
              (container as HTMLElement).scrollTop = 0;
            }
          }
          break;
        case 'End':
          if (event.ctrlKey) {
            event.preventDefault();
            // Scroll to bottom
            const container = sidebarElement?.querySelector(
              '[data-slot="sidebar-content"] > div'
            );
            if (container) {
              (container as HTMLElement).scrollTop = (
                container as HTMLElement
              ).scrollHeight;
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onScrollUp, onScrollDown]);
}
