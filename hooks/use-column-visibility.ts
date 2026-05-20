'use client';

import * as React from 'react';

const STORAGE_PREFIX = 'bimbingo:col-vis:';

export function useColumnVisibility(key: string, defaults: Record<string, boolean>) {
  const [visible, setVisible] = React.useState<Record<string, boolean>>(defaults);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setVisible({ ...defaults, ...parsed });
      }
    } catch {
      // ignore
    }
  }, [key]);

  const toggle = React.useCallback(
    (colKey: string, next?: boolean) => {
      setVisible((prev) => {
        const updated = { ...prev, [colKey]: next ?? !prev[colKey] };
        try {
          localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [key],
  );

  return { visible, toggle };
}
