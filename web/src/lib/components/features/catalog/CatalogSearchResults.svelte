<script lang="ts">
  import LoadState from '$lib/components/ui/LoadState.svelte';
  import CatalogRecordsTable from './CatalogRecordsTable.svelte';
  import type {
    Category,
    Item,
    SearchResult,
    RecutAudience,
  } from '$lib/features/catalog/domain/types';
  import type { TablePage } from '$lib/shared/table';

  let {
    nature,
    id = 'catalog-search-results',
    title,
    result,
    busy,
    failed,
    types,
    triage,
    categories,
    manual,
    retry,
  }: {
    nature: RecutAudience;
    id?: string;
    title?: string;
    result?: SearchResult;
    busy: boolean;
    failed: boolean;
    types?: Item[];
    triage?: Item[];
    categories?: Category[];
    manual: TablePage;
    retry: () => void;
  } = $props();
</script>

<section id="resultados" aria-labelledby={id + '-results'}>
  {#if title}<p class="eyebrow">{title}</p>{/if}
  <h2 id={id + '-results'} aria-live="polite">
    {#if result}
      {result.total.toLocaleString('pt-BR')}
      {result.total === 1
        ? nature === 'fonte'
          ? 'fonte encontrada'
          : nature === 'todos'
            ? 'ficha encontrada'
            : 'ferramenta encontrada'
        : nature === 'fonte'
          ? 'fontes encontradas'
          : nature === 'todos'
            ? 'fichas encontradas'
            : 'ferramentas encontradas'}
    {:else}
      Resultados
    {/if}
  </h2>
  <CatalogRecordsTable
    label={nature === 'fonte'
      ? 'Fontes'
      : nature === 'todos'
        ? 'Fichas'
        : 'Ferramentas'}
    rows={result?.items ?? []}
    {busy}
    {types}
    {triage}
    {categories}
    {manual}
  />
  {#if failed || busy}<LoadState {failed} {retry} />{/if}
</section>

<style>
  section {
    min-width: 0;
    scroll-margin-top: 5rem;
  }
  h2 {
    margin: 0 0 0.45rem;
    font-size: 1.2rem;
  }
</style>
