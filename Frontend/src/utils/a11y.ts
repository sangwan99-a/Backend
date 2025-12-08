/**
 * Accessibility (a11y) Utilities
 * WCAG 2.1 AA compliance helpers and hooks
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Check if right-to-left language is active
 */
export function isRTL(): boolean {
  return document.documentElement.dir === 'rtl' ||
    window.getComputedStyle(document.documentElement).direction === 'rtl';
}

/**
 * Hook to detect RTL
 */
export function useRTL(): boolean {
  const [rtl, setRtl] = useState(() => isRTL());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setRtl(isRTL());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });

    return () => observer.disconnect();
  }, []);

  return rtl;
}

/**
 * Check if dark mode is preferred
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Hook to detect dark mode preference
 */
export function useDarkMode(): boolean {
  const [darkMode, setDarkMode] = useState(() => prefersDarkMode());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return darkMode;
}

/**
 * Check if high contrast mode is preferred
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Hook to detect high contrast mode
 */
export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState(() => prefersHighContrast());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return highContrast;
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return reducedMotion;
}

/**
 * Hook for managing focus and announcements
 */
export function useA11y() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap - keep focus within container
  const focusTrap = useCallback((enable: boolean) => {
    if (!enable || !containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Announce to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    let liveRegion = document.querySelector(`[role="status"][aria-live="${priority}"]`);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      (liveRegion as HTMLElement).style.position = 'absolute';
      (liveRegion as HTMLElement).style.left = '-10000px';
      document.body.appendChild(liveRegion);
    }

    (liveRegion as HTMLElement).textContent = message;
  }, []);

  // Skip links for keyboard navigation
  const createSkipLink = useCallback((targetId: string, label: string = 'Skip to main content') => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className = 'skip-link';
    skipLink.textContent = label;
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '0';
    skipLink.style.background = '#000';
    skipLink.style.color = '#fff';
    skipLink.style.padding = '8px';
    skipLink.style.zIndex = '100';

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }, []);

  return {
    containerRef,
    focusTrap,
    announce,
    createSkipLink,
  };
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  items: HTMLElement[] = [],
  options: { horizontal?: boolean; loop?: boolean } = {}
) {
  const { horizontal = false, loop = true } = options;
  const currentIndexRef = useRef(0);

  const navigate = useCallback((direction: 'next' | 'prev') => {
    let nextIndex = direction === 'next' ? currentIndexRef.current + 1 : currentIndexRef.current - 1;

    if (loop) {
      nextIndex = (nextIndex + items.length) % items.length;
    } else {
      nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
    }

    if (items[nextIndex]) {
      items[nextIndex].focus();
      currentIndexRef.current = nextIndex;
    }
  }, [items, loop]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;
    
    if (horizontal && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      e.preventDefault();
      navigate(key === 'ArrowRight' ? 'next' : 'prev');
    } else if (!horizontal && (key === 'ArrowUp' || key === 'ArrowDown')) {
      e.preventDefault();
      navigate(key === 'ArrowDown' ? 'next' : 'prev');
    } else if (key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
      currentIndexRef.current = 0;
    } else if (key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
      currentIndexRef.current = items.length - 1;
    }
  }, [navigate, items]);

  return { navigate, handleKeyDown };
}

/**
 * Create accessible button from div
 */
export function createAccessibleButton(
  element: HTMLElement,
  onClick: (e: KeyboardEvent | MouseEvent) => void
) {
  element.setAttribute('role', 'button');
  element.setAttribute('tabindex', '0');

  const handleClick = (e: MouseEvent) => {
    onClick(e);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

  element.addEventListener('click', handleClick);
  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('click', handleClick);
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Create aria label for complex content
 */
export function createA11yLabel(text: string, element: HTMLElement) {
  const id = `a11y-${Math.random().toString(36).substr(2, 9)}`;
  element.id = id;
  element.setAttribute('aria-label', text);
  return id;
}

/**
 * Announce dynamic content changes
 */
export function announceLiveRegion(message: string, priority: 'polite' | 'assertive' = 'polite') {
  let region = document.querySelector(`[aria-live="${priority}"]`) as HTMLElement;

  if (!region) {
    region = document.createElement('div');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    document.body.appendChild(region);
  }

  region.textContent = message;
}

/**
 * Create a modal dialog with proper a11y attributes
 */
export function createA11yModal(
  title: string,
  content: string,
  onClose: () => void
) {
  const modal = document.createElement('div');
  const modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;
  const titleId = `${modalId}-title`;

  modal.id = modalId;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', titleId);

  modal.innerHTML = `
    <div role="document">
      <h2 id="${titleId}">${title}</h2>
      <div>${content}</div>
      <button type="button" aria-label="Close modal">Close</button>
    </div>
  `;

  const closeButton = modal.querySelector('button');
  closeButton?.addEventListener('click', onClose);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  modal.addEventListener('keydown', handleKeyDown);

  return { modal, modalId, cleanup: () => modal.removeEventListener('keydown', handleKeyDown) };
}

/**
 * Skip link styles (add to global CSS)
 */
export const SKIP_LINK_STYLES = `
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 100;
  }

  .skip-link:focus {
    top: 0;
  }
`;

/**
 * RTL styles (add to global CSS)
 */
export const RTL_STYLES = `
  [dir="rtl"] {
    direction: rtl;
    text-align: right;
  }

  [dir="rtl"] .margin-start {
    margin-right: var(--margin-value);
  }

  [dir="ltr"] .margin-start {
    margin-left: var(--margin-value);
  }
`;

/**
 * High contrast mode styles
 */
export const HIGH_CONTRAST_STYLES = `
  @media (prefers-contrast: more) {
    body {
      --color-background: #ffffff;
      --color-foreground: #000000;
      --color-border: #000000;
    }

    button {
      border: 2px solid currentColor;
      outline-offset: 2px;
    }

    a {
      text-decoration: underline;
    }
  }
`;

/**
 * Reduced motion styles
 */
export const REDUCED_MOTION_STYLES = `
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
