import { useCallback, useState } from 'react';
import { readCollection, writeJson } from '@/utils/storage';

export function useStoredList<T>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(() => readCollection(key, seed));

  const add = useCallback(
    (item: T) => {
      setItems((current) => {
        const next = [item, ...current];
        writeJson(key, next);
        return next;
      });
    },
    [key],
  );

  return { items, add };
}
