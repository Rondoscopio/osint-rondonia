import { createQuery } from '@tanstack/svelte-query';
import { useCatalog } from './explorer.viewmodel.svelte';

export function createRecordViewModel(id: () => string) {
  const catalog = useCatalog();
  return createQuery(() => ({
    queryKey: ['catalog', 'detail', id()],
    queryFn: () => catalog.detail(id()),
  }));
}
