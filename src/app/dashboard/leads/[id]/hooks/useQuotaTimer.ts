"use client";

import { useCallback, useRef, useState } from "react";

export function useQuotaTimer() {
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaRetryTimer, setQuotaRetryTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startQuotaTimer = useCallback((seconds: number) => {
    setQuotaRetryTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setQuotaRetryTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setQuotaError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const clearQuotaTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setQuotaError(null);
    setQuotaRetryTimer(0);
  }, []);

  return { quotaError, setQuotaError, quotaRetryTimer, startQuotaTimer, clearQuotaTimer };
}
