import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Poll `fetcher(signal)` every `intervalMs` while the tab is visible; pauses when hidden and
 * refreshes immediately on return. Keeps the last good data when a refresh fails.
 */
export function usePolling(fetcher, intervalMs, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async (signal) => {
    try {
      const data = await fetcherRef.current(signal);
      if (signal?.aborted) return;
      setState({ data, error: null, loading: false, updatedAt: Date.now() });
    } catch (err) {
      if (signal?.aborted || err.name === 'AbortError') return;
      setState((s) => ({ ...s, error: err, loading: false }));
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    let timer = null;
    // New inputs (e.g. another crossing): drop the previous data instead of showing it as current.
    setState({ data: null, error: null, loading: true, updatedAt: null });

    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === 'visible') {
        timer = setTimeout(async () => {
          await run(ctrl.signal);
          schedule();
        }, intervalMs);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        run(ctrl.signal).then(schedule);
      } else {
        clearTimeout(timer);
      }
    };

    run(ctrl.signal).then(schedule);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, run, ...deps]);

  const refresh = useCallback(() => run(), [run]);
  return { ...state, refresh };
}

/** Current time, ticking every `ms` (for countdowns). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
