'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconCheck,
  IconEdit,
  IconDots
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Hook for detecting touch device
export const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Mobi|Android/i.test(navigator.userAgent)
      );
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return isTouchDevice;
};

// Hook for responsive breakpoints
export const useResponsiveBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
};

// Touch-friendly button component
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function TouchButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  className,
  disabled = false
}: TouchButtonProps) {
  const isTouchDevice = useIsTouchDevice();
  
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 py-2 text-sm',
    md: 'min-h-[48px] px-6 py-3 text-base',
    lg: 'min-h-[52px] px-8 py-4 text-lg'
  };

  return (
    <motion.div
      whileTap={isTouchDevice ? { scale: 0.95 } : {}}
      whileHover={!isTouchDevice ? { scale: 1.02 } : {}}
    >
      <Button
        onClick={onClick}
        variant={variant}
        disabled={disabled}
        className={cn(
          sizeClasses[size],
          'transition-all duration-200 active:scale-95',
          isTouchDevice && 'touch-manipulation',
          className
        )}
      >
        {children}
      </Button>
    </motion.div>
  );
}

// Swipeable card component for ticket lists
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className
}: SwipeableCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActionVisible, setIsSwipeActionVisible] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    const offset = info.offset.x;
    setSwipeOffset(offset);
    setIsSwipeActionVisible(Math.abs(offset) > 80);
  }, []);

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Determine if swipe is significant enough
    const threshold = 120;
    const shouldTrigger = Math.abs(offset) > threshold || Math.abs(velocity) > 500;
    
    if (shouldTrigger) {
      if (offset > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (offset < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    // Reset position
    setSwipeOffset(0);
    setIsSwipeActionVisible(false);
  }, [onSwipeLeft, onSwipeRight]);

  const isTouchDevice = useIsTouchDevice();

  if (!isTouchDevice) {
    // Desktop version without swipe
    return (
      <Card className={className}>
        {children}
      </Card>
    );
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden">
      {/* Left Action Background */}
      {rightAction && (
        <div 
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start pl-6 transition-opacity",
            rightAction.color,
            isSwipeActionVisible && swipeOffset > 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: Math.max(0, swipeOffset) }}
        >
          <div className="flex items-center gap-2 text-white">
            {rightAction.icon}
            <span className="font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}
      
      {/* Right Action Background */}
      {leftAction && (
        <div 
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end pr-6 transition-opacity",
            leftAction.color,
            isSwipeActionVisible && swipeOffset < 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: Math.max(0, -swipeOffset) }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="font-medium">{leftAction.label}</span>
            {leftAction.icon}
          </div>
        </div>
      )}
      
      {/* Main Card */}
      <motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative z-10"
      >
        <Card className={className}>
          {children}
        </Card>
      </motion.div>
    </div>
  );
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className
}: ResponsiveGridProps) {
  const breakpoint = useResponsiveBreakpoint();
  
  const currentCols = cols[breakpoint] || cols.desktop || 3;
  
  return (
    <div 
      className={cn(
        `grid gap-${gap}`,
        `grid-cols-${currentCols}`,
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {children}
    </div>
  );
}

// Mobile-friendly navigation tabs
interface MobileTabsProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
  }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function MobileTabs({
  tabs,
  activeTab,
  onTabChange,
  className
}: MobileTabsProps) {
  const breakpoint = useResponsiveBreakpoint();
  const isMobile = breakpoint === 'mobile';
  
  const [scrollPosition, setScrollPosition] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      tabsRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (isMobile) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollTabs('left')}
            className="flex-shrink-0"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          
          <div
            ref={tabsRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide flex-1 px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-shrink-0 min-h-[48px] px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "flex items-center gap-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrollTabs('right')}
            className="flex-shrink-0"
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop/Tablet version
  return (
    <div className={cn("flex gap-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "min-h-[48px] px-6 py-3 rounded-lg text-sm font-medium transition-colors",
            "flex items-center gap-2",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {tab.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

// Touch-friendly dropdown/action menu
interface TouchMenuProps {
  trigger: React.ReactNode;
  items: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    action: () => void;
    destructive?: boolean;
  }[];
  className?: string;
}

export function TouchMenu({ trigger, items, className }: TouchMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isTouchDevice = useIsTouchDevice();
  
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={cn(
              "absolute right-0 top-full mt-2 z-50",
              "bg-background border rounded-lg shadow-lg",
              "py-2 min-w-[200px]",
              className
            )}
          >
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center gap-3",
                  "hover:bg-muted transition-colors",
                  isTouchDevice ? "min-h-[48px]" : "min-h-[40px]",
                  item.destructive && "text-destructive hover:bg-destructive/10"
                )}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = async () => {
    if (pullDistance > threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setStartY(0);
  };
  
  const isTouchDevice = useIsTouchDevice();
  
  if (!isTouchDevice) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-10"
          style={{ height: Math.min(pullDistance, threshold) }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <motion.div
              animate={{ rotate: pullDistance > threshold ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <IconChevronLeft className="h-4 w-4 rotate-90" />
            </motion.div>
            <span>
              {pullDistance > threshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <motion.div
        animate={{
          y: isRefreshing ? 40 : pullDistance * 0.5,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
      
      {/* Loading indicator */}
      {isRefreshing && (
        <div className="absolute top-2 left-0 right-0 flex items-center justify-center">
          <div className="bg-background rounded-full p-2 shadow-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <IconDots className="h-4 w-4" />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
