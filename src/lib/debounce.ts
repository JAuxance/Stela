export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Run the pending call immediately (if any) and clear the timer. */
  flush(): void;
  /** Drop any pending call without running it. */
  cancel(): void;
}

/** Trailing-edge debounce with `flush`/`cancel`, used by the Drive write-through. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: A | null = null;

  const debounced = ((...args: A) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const a = lastArgs;
      lastArgs = null;
      if (a) fn(...a);
    }, wait);
  }) as Debounced<A>;

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const a = lastArgs;
    lastArgs = null;
    if (a) fn(...a);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  return debounced;
}
