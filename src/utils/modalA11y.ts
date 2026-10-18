/**
 * Modal accessibility helpers (M-15 follow-up).
 *
 * The pure functions here are unit-tested directly (no DOM required); the
 * React wiring lives in `src/hooks/useModalAccessibility.ts`. Keeping the key
 * decision logic separate is what makes the keyboard behaviour verifiable.
 */

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function isEscapeKey(key: string): boolean {
  return key === 'Escape' || key === 'Esc';
}

export function isTabKey(key: string): boolean {
  return key === 'Tab';
}

export interface DialogKeyEvent {
  key: string;
  shiftKey?: boolean;
}

export interface DialogKeyContext {
  focusableCount: number;
  currentIndex: number;
}

export type DialogKeyAction = 'close' | 'cycle' | 'none';

/**
 * Decides what a keydown inside an open dialog should do.
 * - Escape always closes.
 * - Tab cycles focus, but only when there is something to focus.
 * - Everything else is left to the element.
 */
export function resolveDialogKeyAction(
  event: DialogKeyEvent,
  context: DialogKeyContext
): DialogKeyAction {
  if (isEscapeKey(event.key)) return 'close';
  if (isTabKey(event.key) && context.focusableCount > 0) return 'cycle';
  return 'none';
}

/**
 * Next focusable index with wraparound. Returns -1 when there is nothing to
 * focus. When focus is outside the list (currentIndex < 0), Tab starts at the
 * first element and Shift+Tab starts at the last.
 */
export function nextFocusIndex(currentIndex: number, count: number, shiftKey: boolean): number {
  if (count <= 0) return -1;
  if (currentIndex < 0) return shiftKey ? count - 1 : 0;
  const delta = shiftKey ? -1 : 1;
  return (currentIndex + delta + count) % count;
}

export function getFocusableElements(root: ParentNode | null | undefined): HTMLElement[] {
  if (!root || typeof (root as Element).querySelectorAll !== 'function') return [];
  return Array.from(
    (root as Element).querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
}
