import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook data async: jalankan loader (query Supabase), tangani loading/error,
 * dan sediakan reload() untuk memuat ulang setelah mutasi.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    loaderRef
      .current()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}

/** Banner pesan sementara (sukses/error) yang hilang sendiri setelah timeout. */
export function useFlash(timeoutMs = 6000) {
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback(
    (kind: "ok" | "err", text: string) => {
      setFlash({ kind, text });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFlash(null), timeoutMs);
    },
    [timeoutMs]
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { flash, show, clear: () => setFlash(null) };
}
