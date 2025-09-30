'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CustomScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showScrollButtons?: boolean;
  scrollStep?: number;
}

export function CustomScrollArea({
  children,
  className,
  showScrollButtons = true,
  scrollStep = 100,
  ...props
}: CustomScrollAreaProps) {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const checkRaf = useRef<number | null>(null);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 2; // hysteresis to avoid flicker at boundaries
    setCanScrollUp(scrollTop > threshold);
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - threshold);
  };

  const scrollTo = (direction: 'up' | 'down') => {
    const container = scrollContainerRef.current;
    if (!container || isScrolling) return;

    setIsScrolling(true);
    const currentScrollTop = container.scrollTop;
    const targetScrollTop =
      direction === 'up'
        ? Math.max(0, currentScrollTop - scrollStep)
        : Math.min(
            container.scrollHeight - container.clientHeight,
            currentScrollTop + scrollStep
          );

    // Smooth scroll animation
    const startTime = performance.now();
    const duration = 300; // ms

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const scrollValue =
        currentScrollTop + (targetScrollTop - currentScrollTop) * easeOut;
      container.scrollTop = scrollValue;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        setIsScrolling(false);
        checkScroll();
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const scheduleCheckScroll = () => {
    if (checkRaf.current != null) return;
    checkRaf.current = requestAnimationFrame(() => {
      checkRaf.current = null;
      checkScroll();
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    checkScroll();

    // Set up ResizeObserver to check scroll when content changes
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    // Check scroll on content changes
    const mutationObserver = new MutationObserver(checkScroll);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div className={cn('relative flex min-h-0 flex-col', className)} {...props}>
      {/* Scroll Up Button */}
      {showScrollButtons && canScrollUp && (
        <div className='from-sidebar pointer-events-none absolute top-0 right-0 left-0 z-10 bg-gradient-to-b to-transparent p-1'>
          <Button
            variant='ghost'
            size='sm'
            className='pointer-events-auto h-6 w-full text-xs opacity-70 transition-opacity hover:opacity-100'
            onClick={() => scrollTo('up')}
            disabled={isScrolling}
          >
            <ChevronUp className='h-3 w-3' />
          </Button>
        </div>
      )}

      {/* Scrollable Content */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'scrollbar-thin scrollbar-track-sidebar scrollbar-thumb-sidebar-border hover:scrollbar-thumb-sidebar-accent min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-8 pb-8'
        )}
        onScroll={scheduleCheckScroll}
        style={{
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch', // momentum scrolling on iOS
          overscrollBehavior: 'contain'
        }}
      >
        {children}
      </div>

      {/* Scroll Down Button */}
      {showScrollButtons && canScrollDown && (
        <div className='from-sidebar pointer-events-none absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t to-transparent p-1'>
          <Button
            variant='ghost'
            size='sm'
            className='pointer-events-auto h-6 w-full text-xs opacity-70 transition-opacity hover:opacity-100'
            onClick={() => scrollTo('down')}
            disabled={isScrolling}
          >
            <ChevronDown className='h-3 w-3' />
          </Button>
        </div>
      )}

      {/* Scroll Indicators */}
      {(canScrollUp || canScrollDown) && (
        <div className='absolute top-1/2 right-1 flex -translate-y-1/2 transform flex-col gap-1'>
          {canScrollUp && (
            <div className='bg-sidebar-accent h-2 w-1 rounded-full opacity-50' />
          )}
          {canScrollDown && (
            <div className='bg-sidebar-accent h-2 w-1 rounded-full opacity-50' />
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced scrollbar styles
export const customScrollStyles = `
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-track-sidebar::-webkit-scrollbar-track {
    background: var(--sidebar);
    border-radius: 3px;
  }
  
  .scrollbar-thumb-sidebar-border::-webkit-scrollbar-thumb {
    background: var(--sidebar-border);
    border-radius: 3px;
    transition: background 0.2s ease;
  }
  
  .hover\\:scrollbar-thumb-sidebar-accent:hover::-webkit-scrollbar-thumb {
    background: var(--sidebar-accent);
  }
  
  .scrollbar-thumb-sidebar-border::-webkit-scrollbar-thumb:hover {
    background: var(--sidebar-accent);
  }
`;
