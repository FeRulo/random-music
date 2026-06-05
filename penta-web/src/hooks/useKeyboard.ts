import { useEffect } from 'react';

export function useKeyboard(onKey: (key: string) => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.length === 1 && /[a-gA-G]/.test(e.key)) {
        e.preventDefault();
        onKey(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKey, active]);
}
