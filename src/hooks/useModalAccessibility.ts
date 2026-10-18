import { useEffect, useRef, type RefObject } from 'react';
import { getFocusableElements, nextFocusIndex, resolveDialogKeyAction } from '../utils/modalA11y';

interface UseModalAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * Keyboard accessibility for modal dialogs (M-15 follow-up):
 * - focuses the first control when the dialog opens (or the container itself),
 * - traps Tab / Shift+Tab inside the dialog,
 * - closes on Escape,
 * - restores focus to the previously focused element on close.
 */
export function useModalAccessibility({
  isOpen,
  onClose,
  containerRef,
}: UseModalAccessibilityOptions): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const initialFocusables = getFocusableElements(containerRef.current);
    const initialTarget = initialFocusables[0] ?? containerRef.current;
    initialTarget?.focus?.();

    const handleKeyDown = (event: KeyboardEvent) => {
      const list = getFocusableElements(containerRef.current);
      const active = document.activeElement as HTMLElement | null;
      const currentIndex = active ? list.indexOf(active) : -1;

      const action = resolveDialogKeyAction(
        { key: event.key, shiftKey: event.shiftKey },
        { focusableCount: list.length, currentIndex }
      );

      if (action === 'close') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (action === 'cycle') {
        event.preventDefault();
        const target = nextFocusIndex(currentIndex, list.length, event.shiftKey);
        list[target]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, containerRef]);
}
