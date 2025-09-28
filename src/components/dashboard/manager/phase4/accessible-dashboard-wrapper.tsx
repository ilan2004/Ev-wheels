'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  SkipLink, 
  FocusTrap, 
  LiveRegion, 
  ScreenReaderOnly,
  useReducedMotion,
  useHighContrastMode,
  announceToScreenReader 
} from './accessibility-helpers';

interface AccessibleDashboardWrapperProps {
  children: React.ReactNode;
  className?: string;
  emergencyMode?: boolean;
  onEmergencyToggle?: () => void;
}

export function AccessibleDashboardWrapper({
  children,
  className,
  emergencyMode = false,
  onEmergencyToggle
}: AccessibleDashboardWrapperProps) {
  const prefersReducedMotion = useReducedMotion();
  const isHighContrast = useHighContrastMode();
  const [currentFocus, setCurrentFocus] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');

  // Announce emergency mode changes
  useEffect(() => {
    if (emergencyMode) {
      announceToScreenReader('Emergency mode activated. Priority alerts and actions are highlighted.', 'assertive');
    } else {
      announceToScreenReader('Emergency mode deactivated. Normal operations resumed.', 'polite');
    }
  }, [emergencyMode]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      // Alt + E for Emergency mode toggle
      if (e.altKey && e.key === 'e' && onEmergencyToggle) {
        e.preventDefault();
        onEmergencyToggle();
        return;
      }

      // Alt + 1-9 for section navigation
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const sectionId = `section-${e.key}`;
        const section = document.getElementById(sectionId);
        if (section) {
          section.focus();
          announceToScreenReader(`Navigated to section ${e.key}`, 'polite');
        }
        return;
      }

      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[role="search"] input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          announceToScreenReader('Search focused', 'polite');
        }
        return;
      }

      // Escape to close modals/dropdowns
      if (e.key === 'Escape') {
        const openDropdowns = document.querySelectorAll('[aria-expanded="true"]');
        if (openDropdowns.length > 0) {
          (openDropdowns[0] as HTMLElement).click();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyboard);
    return () => document.removeEventListener('keydown', handleGlobalKeyboard);
  }, [onEmergencyToggle]);

  // Focus management
  useEffect(() => {
    const handleFocusChange = () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.id) {
        setCurrentFocus(activeElement.id);
      }
    };

    document.addEventListener('focusin', handleFocusChange);
    return () => document.removeEventListener('focusin', handleFocusChange);
  }, []);

  return (
    <>
      {/* Skip Links */}
      <div className="sr-only focus-within:not-sr-only">
        <SkipLink targetId="main-content">Skip to main content</SkipLink>
        <SkipLink targetId="primary-navigation">Skip to navigation</SkipLink>
        <SkipLink targetId="search">Skip to search</SkipLink>
        <SkipLink targetId="alerts">Skip to alerts</SkipLink>
        <SkipLink targetId="kpis">Skip to KPIs</SkipLink>
      </div>

      {/* Global Live Region */}
      <LiveRegion message={announcement} priority="polite" />
      
      {/* Emergency Mode Announcement */}
      {emergencyMode && (
        <div 
          className="sr-only" 
          aria-live="assertive" 
          aria-atomic="true"
        >
          Emergency mode is active. All critical alerts and high-priority actions are highlighted.
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <ScreenReaderOnly>
        <div>
          Keyboard shortcuts available: 
          Alt + E for emergency mode toggle, 
          Alt + 1-9 for section navigation, 
          Control + K for search,
          Tab to navigate, Enter or Space to activate
        </div>
      </ScreenReaderOnly>

      {/* Main Dashboard Content */}
      <div 
        className={cn(
          'min-h-screen bg-background text-foreground',
          // Apply motion preferences
          prefersReducedMotion && 'motion-reduce:transition-none motion-reduce:animate-none',
          // High contrast adjustments
          isHighContrast && 'contrast-more:border-2 contrast-more:border-current',
          // Emergency mode styling
          emergencyMode && 'bg-red-50 dark:bg-red-950/20',
          className
        )}
        data-emergency-mode={emergencyMode}
        data-reduced-motion={prefersReducedMotion}
        data-high-contrast={isHighContrast}
      >
        {/* Emergency Mode Banner */}
        {emergencyMode && (
          <div 
            className="bg-red-600 text-white px-4 py-2 text-center font-semibold"
            role="alert"
            aria-live="assertive"
          >
            <span className="flex items-center justify-center space-x-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Emergency Mode Active - Priority Operations Only</span>
              {onEmergencyToggle && (
                <button
                  onClick={onEmergencyToggle}
                  className="ml-4 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600"
                  aria-label="Deactivate emergency mode"
                >
                  Deactivate
                </button>
              )}
            </span>
          </div>
        )}

        {/* Main Content */}
        <main 
          id="main-content" 
          className="focus:outline-none"
          tabIndex={-1}
          role="main"
          aria-label="Dashboard main content"
        >
          {children}
        </main>

        {/* Focus Indicator for Development */}
        {process.env.NODE_ENV === 'development' && currentFocus && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-md text-xs font-mono z-50">
            Focus: {currentFocus}
          </div>
        )}

        {/* Accessibility Status Panel (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-md text-xs space-y-1 z-50">
            <div>🎯 Reduced Motion: {prefersReducedMotion ? 'ON' : 'OFF'}</div>
            <div>🔳 High Contrast: {isHighContrast ? 'ON' : 'OFF'}</div>
            <div>🚨 Emergency Mode: {emergencyMode ? 'ON' : 'OFF'}</div>
          </div>
        )}
      </div>
    </>
  );
}

// Accessibility-enhanced layout sections
interface AccessibleSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  emergency?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function AccessibleSection({
  id,
  title,
  children,
  className,
  emergency = false,
  headingLevel = 2
}: AccessibleSectionProps) {
  const HeadingTag = `h${headingLevel}` as React.ElementType;

  return (
    <section
      id={id}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg',
        emergency && 'ring-2 ring-red-500 ring-offset-2 bg-red-50 dark:bg-red-950/20',
        className
      )}
      tabIndex={-1}
      aria-labelledby={`${id}-heading`}
      data-section-emergency={emergency}
    >
      <HeadingTag
        id={`${id}-heading`}
        className={cn(
          'text-lg font-semibold mb-4',
          emergency && 'text-red-700 dark:text-red-300'
        )}
      >
        {title}
        {emergency && (
          <ScreenReaderOnly> - Emergency Priority</ScreenReaderOnly>
        )}
      </HeadingTag>
      {children}
    </section>
  );
}

// Grid layout with accessibility considerations
interface AccessibleGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export function AccessibleGrid({ 
  children, 
  cols = 2, 
  gap = 4, 
  className 
}: AccessibleGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 lg:grid-cols-2',
        cols === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        gap === 2 && 'gap-2',
        gap === 3 && 'gap-3',
        gap === 4 && 'gap-4',
        gap === 6 && 'gap-6',
        gap === 8 && 'gap-8',
        className
      )}
      role="grid"
      aria-label="Dashboard content grid"
    >
      {React.Children.map(children, (child, index) => (
        <div key={index} role="gridcell">
          {child}
        </div>
      ))}
    </div>
  );
}

// Accessibility testing helpers (development only)
export function AccessibilityDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [focusableCount, setFocusableCount] = useState(0);
  const [headingStructure, setHeadingStructure] = useState<string[]>([]);

  useEffect(() => {
    if (!isVisible) return;

    // Count focusable elements
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    setFocusableCount(focusableElements.length);

    // Analyze heading structure
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => `${h.tagName}: ${h.textContent?.trim().slice(0, 50)}...`);
    setHeadingStructure(headings);
  }, [isVisible]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-md text-xs z-50"
        aria-label="Toggle accessibility debug panel"
      >
        A11y Debug
      </button>

      {isVisible && (
        <div className="fixed top-16 right-4 w-80 max-h-96 overflow-auto bg-white dark:bg-gray-900 border rounded-md shadow-lg p-4 text-xs z-50">
          <h3 className="font-bold mb-3">Accessibility Debug</h3>
          
          <div className="space-y-3">
            <div>
              <strong>Focusable Elements:</strong> {focusableCount}
            </div>
            
            <div>
              <strong>Heading Structure:</strong>
              <ul className="mt-1 space-y-1 max-h-32 overflow-auto">
                {headingStructure.map((heading, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-400">
                    {heading}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <strong>Quick Tests:</strong>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => {
                    const elements = document.querySelectorAll('*');
                    const withoutAlt = Array.from(elements).filter(el => 
                      el.tagName === 'IMG' && !el.getAttribute('alt')
                    );
                    alert(`Images without alt text: ${withoutAlt.length}`);
                  }}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Check Alt Text
                </button>
                
                <button
                  onClick={() => {
                    const elements = document.querySelectorAll('[role="button"], button');
                    const withoutLabel = Array.from(elements).filter(el => 
                      !el.getAttribute('aria-label') && 
                      !el.textContent?.trim() &&
                      !el.getAttribute('aria-labelledby')
                    );
                    alert(`Buttons without labels: ${withoutLabel.length}`);
                  }}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Check Button Labels
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
