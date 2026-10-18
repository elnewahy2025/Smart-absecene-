import { describe, expect, it } from 'vitest';
import {
  FOCUSABLE_SELECTOR,
  getFocusableElements,
  isEscapeKey,
  isTabKey,
  nextFocusIndex,
  resolveDialogKeyAction,
} from './modalA11y';

describe('modalA11y', () => {
  it('builds a focusable selector that excludes disabled controls and negative tabindex', () => {
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
    expect(FOCUSABLE_SELECTOR).not.toContain('tabindex="-1"`');
  });

  it('detects Escape and Tab keys', () => {
    expect(isEscapeKey('Escape')).toBe(true);
    expect(isEscapeKey('Esc')).toBe(true);
    expect(isEscapeKey('Enter')).toBe(false);
    expect(isTabKey('Tab')).toBe(true);
    expect(isTabKey('Escape')).toBe(false);
  });

  describe('resolveDialogKeyAction', () => {
    it('closes on Escape regardless of focus', () => {
      expect(resolveDialogKeyAction({ key: 'Escape' }, { focusableCount: 3, currentIndex: 1 })).toBe('close');
      expect(resolveDialogKeyAction({ key: 'Esc' }, { focusableCount: 0, currentIndex: -1 })).toBe('close');
    });

    it('cycles on Tab only when there is something to focus', () => {
      expect(resolveDialogKeyAction({ key: 'Tab' }, { focusableCount: 3, currentIndex: 0 })).toBe('cycle');
      expect(resolveDialogKeyAction({ key: 'Tab' }, { focusableCount: 0, currentIndex: -1 })).toBe('none');
    });

    it('leaves other keys alone', () => {
      expect(resolveDialogKeyAction({ key: 'Enter' }, { focusableCount: 3, currentIndex: 0 })).toBe('none');
      expect(resolveDialogKeyAction({ key: 'a' }, { focusableCount: 3, currentIndex: 0 })).toBe('none');
    });
  });

  describe('nextFocusIndex', () => {
    it('returns -1 when there is nothing focusable', () => {
      expect(nextFocusIndex(-1, 0, false)).toBe(-1);
    });

    it('starts at the first element on Tab and the last on Shift+Tab', () => {
      expect(nextFocusIndex(-1, 3, false)).toBe(0);
      expect(nextFocusIndex(-1, 3, true)).toBe(2);
    });

    it('advances and wraps forward', () => {
      expect(nextFocusIndex(0, 3, false)).toBe(1);
      expect(nextFocusIndex(2, 3, false)).toBe(0);
    });

    it('retreats and wraps backward', () => {
      expect(nextFocusIndex(0, 3, true)).toBe(2);
      expect(nextFocusIndex(2, 3, true)).toBe(1);
    });
  });

  describe('getFocusableElements', () => {
    it('returns an empty array for missing or non-queryable roots', () => {
      expect(getFocusableElements(null)).toEqual([]);
      expect(getFocusableElements(undefined)).toEqual([]);
      expect(getFocusableElements({} as ParentNode)).toEqual([]);
    });

    it('filters out disabled and aria-hidden elements', () => {
      const elements = [
        { hasAttribute: () => false, getAttribute: () => null },
        { hasAttribute: (name: string) => name === 'disabled', getAttribute: () => null },
        { hasAttribute: () => false, getAttribute: (name: string) => (name === 'aria-hidden' ? 'true' : null) },
      ];
      const root = {
        querySelectorAll: () => elements,
      } as unknown as ParentNode;
      expect(getFocusableElements(root)).toHaveLength(1);
    });
  });
});
