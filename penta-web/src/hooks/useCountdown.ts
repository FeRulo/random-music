import { useEffect } from 'react';

export function useCountdown(active: boolean, onTick: () => void) {
  useEffect(() => {
    if (!active) return;
    const id = setInterval(onTick, 100);
    return () => clearInterval(id);
  }, [active, onTick]);
}
