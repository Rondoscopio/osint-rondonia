import { createQuery } from '@tanstack/svelte-query';
import { CATALOG_USE_CASES } from '$lib/app/tokens';
import { getAppContainer } from '$lib/app/container-context.svelte';
import type { CatalogUseCases } from './application/catalog-use-cases';
import type { Filters } from './domain/types';
import type { TableFilters, TablePage, TableSort } from '$lib/shared/table';

export function useCatalog() {
  return getAppContainer().get<CatalogUseCases>(CATALOG_USE_CASES);
}

export function createExplorerViewModel(
  scope: () => Filters,
  columns: () => TableFilters,
  setColumn: TablePage['onFilter'],
) {
  const catalog = useCatalog();
  const options = createQuery(() => ({
    queryKey: ['catalog', 'options'],
    queryFn: () => catalog.options(),
  }));
  let page = $state(1);
  let sort = $state<TableSort>(null);
  const filters = $derived({
    ...scope(),
    pagina: page,
    tableSort: sort,
    tableFilters: columns(),
  });
  const results = createQuery(() => ({
    queryKey: ['catalog', 'search', filters],
    queryFn: () => catalog.search(filters),
  }));
  const table = $derived<TablePage>({
    page: results.data?.page ?? page,
    total: results.data?.total,
    sort,
    filters: columns(),
    onPage(value) {
      page = value;
    },
    onSort(value) {
      sort = value;
      page = 1;
    },
    onFilter: setColumn,
  });

  return {
    options,
    results,
    get table() {
      return table;
    },
    firstPage() {
      page = 1;
    },
  };
}
