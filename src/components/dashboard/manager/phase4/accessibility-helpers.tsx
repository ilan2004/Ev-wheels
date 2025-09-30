'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Accessible button component with proper focus management
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(function AccessibleButton(
  {
    children,
    variant = 'default',
    size = 'md',
    loading = false,
    loadingText = 'Loading...',
    disabled,
    className,
    'aria-label': ariaLabel,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      {...props}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      aria-label={loading ? loadingText : ariaLabel}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        // Size variants
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-10 px-4 py-2',
        size === 'lg' && 'h-11 px-8 text-base',
        // Style variants
        variant === 'default' &&
          'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' &&
          'border-input bg-background hover:bg-accent hover:text-accent-foreground border',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        variant === 'destructive' &&
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        className
      )}
    >
      {loading && (
        <svg
          className='mr-2 h-4 w-4 animate-spin'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
      )}
      <span className={loading ? 'sr-only' : ''}>{children}</span>
      {loading && (
        <span aria-live='polite' className='sr-only'>
          {loadingText}
        </span>
      )}
    </button>
  );
});

// Skip link component for keyboard navigation
export function SkipLink({
  targetId,
  children
}: {
  targetId: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'bg-primary text-primary-foreground absolute top-0 left-0 z-50 px-4 py-2 font-medium',
        '-translate-y-full transform transition-transform duration-200',
        'focus:translate-y-0'
      )}
    >
      {children}
    </a>
  );
}

// Focus trap for modals and dialogs
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
}

export function FocusTrap({
  children,
  active = true,
  restoreFocus = true
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return <div ref={containerRef}>{children}</div>;
}

// Live region for screen reader announcements
interface LiveRegionProps {
  message?: string;
  priority?: 'polite' | 'assertive';
  clearOnUnmount?: boolean;
}

export function LiveRegion({
  message,
  priority = 'polite',
  clearOnUnmount = true
}: LiveRegionProps) {
  const [content, setContent] = useState(message);

  useEffect(() => {
    setContent(message);
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        setContent('');
      }
    };
  }, [clearOnUnmount]);

  return (
    <div aria-live={priority} aria-atomic='true' className='sr-only'>
      {content}
    </div>
  );
}

// Screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className='sr-only'>{children}</span>;
}

// Keyboard navigation helper hook
export function useKeyboardNavigation(
  items: HTMLElement[] | (() => HTMLElement[]),
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
    onActivate?: (element: HTMLElement, index: number) => void;
  } = {}
) {
  const { loop = true, orientation = 'vertical', onActivate } = options;
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const itemList = typeof items === 'function' ? items() : items;
      if (itemList.length === 0) return;

      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
      const homeKey = 'Home';
      const endKey = 'End';

      let newIndex = activeIndex;

      switch (e.key) {
        case nextKey:
          e.preventDefault();
          newIndex = activeIndex + 1;
          if (newIndex >= itemList.length) {
            newIndex = loop ? 0 : itemList.length - 1;
          }
          break;

        case prevKey:
          e.preventDefault();
          newIndex = activeIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? itemList.length - 1 : 0;
          }
          break;

        case homeKey:
          e.preventDefault();
          newIndex = 0;
          break;

        case endKey:
          e.preventDefault();
          newIndex = itemList.length - 1;
          break;

        case 'Enter':
        case ' ':
          if (activeIndex >= 0 && activeIndex < itemList.length) {
            e.preventDefault();
            onActivate?.(itemList[activeIndex], activeIndex);
          }
          break;

        default:
          return;
      }

      if (
        newIndex !== activeIndex &&
        newIndex >= 0 &&
        newIndex < itemList.length
      ) {
        setActiveIndex(newIndex);
        itemList[newIndex].focus();
      }
    },
    [activeIndex, items, loop, orientation, onActivate]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown
  };
}

// Accessible card component with proper roles
interface AccessibleCardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
  role?: string;
  ariaLabel?: string;
  tabIndex?: number;
}

export function AccessibleCard({
  children,
  className,
  clickable = false,
  onClick,
  role,
  ariaLabel,
  tabIndex,
  ...props
}: AccessibleCardProps) {
  const cardProps = {
    className: cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      clickable &&
        'cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      className
    ),
    role: role || (clickable ? 'button' : undefined),
    'aria-label': ariaLabel,
    tabIndex: clickable ? (tabIndex ?? 0) : undefined,
    onClick: clickable ? onClick : undefined,
    onKeyDown: clickable
      ? (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }
      : undefined,
    ...props
  };

  return <div {...cardProps}>{children}</div>;
}

// High contrast mode detector
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for high contrast media queries
      if (window.matchMedia) {
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        setIsHighContrast(highContrastQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
          setIsHighContrast(e.matches);
        };

        highContrastQuery.addEventListener('change', handleChange);
        return () =>
          highContrastQuery.removeEventListener('change', handleChange);
      }
    };

    checkHighContrast();
  }, []);

  return isHighContrast;
}

// Reduced motion detector
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Color contrast checker
export function checkColorContrast(
  foreground: string,
  background: string
): {
  ratio: number;
  passes: {
    aa: boolean;
    aaa: boolean;
  };
} {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    return { ratio: 0, passes: { aa: false, aaa: false } };
  }

  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const ratio =
    (Math.max(fgLuminance, bgLuminance) + 0.05) /
    (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: {
      aa: ratio >= 4.5,
      aaa: ratio >= 7
    }
  };
}

// Accessible form field wrapper
interface AccessibleFieldProps {
  children: React.ReactNode;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  id: string;
}

export function AccessibleField({
  children,
  label,
  description,
  error,
  required = false,
  id
}: AccessibleFieldProps) {
  const describedBy = [];
  if (description) describedBy.push(`${id}-description`);
  if (error) describedBy.push(`${id}-error`);

  return (
    <div className='space-y-2'>
      <label
        htmlFor={id}
        className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
      >
        {label}
        {required && (
          <span className='text-destructive ml-1' aria-label='required'>
            *
          </span>
        )}
      </label>

      {React.cloneElement(children as React.ReactElement<any>, {
        id,
        'aria-describedby':
          describedBy.length > 0 ? describedBy.join(' ') : undefined,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required
      })}

      {description && (
        <p id={`${id}-description`} className='text-muted-foreground text-sm'>
          {description}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className='text-destructive text-sm' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible tooltip
interface AccessibleTooltipProps {
  children: React.ReactNode;
  content: string;
  id?: string;
}

export function AccessibleTooltip({
  children,
  content,
  id
}: AccessibleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className='relative inline-block'>
      {React.cloneElement(children as React.ReactElement<any>, {
        'aria-describedby': isVisible ? tooltipId : undefined,
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
        onFocus: () => setIsVisible(true),
        onBlur: () => setIsVisible(false)
      })}

      {isVisible && (
        <div
          id={tooltipId}
          role='tooltip'
          className='bg-popover text-popover-foreground absolute -top-10 left-1/2 z-50 -translate-x-1/2 transform rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-md'
        >
          {content}
          <div className='border-t-popover absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent' />
        </div>
      )}
    </div>
  );
}

// Accessible announcement utility
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Clean up after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
