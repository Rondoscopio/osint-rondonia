<script lang="ts">
  import { Button } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type {
    RecutAudience,
    SearchResult,
  } from '$lib/features/catalog/domain/types';
  import TextField from '$lib/components/ui/TextField.svelte';

  let {
    map,
    results,
    totals,
    scope,
    nature,
    query,
    onSearch,
    onNature,
    reset,
  }: {
    map: Snippet;
    results: Snippet;
    totals?: SearchResult['totals'];
    scope: string;
    nature: RecutAudience;
    query: string;
    onSearch: (query: string) => void;
    onNature: (nature: RecutAudience) => void;
    reset?: () => void;
  } = $props();
  let input = $state<HTMLInputElement>();
  let search = $state('');
  $effect(() => {
    search = query;
  });
  const number = new Intl.NumberFormat('pt-BR');
  const recordKinds = [
    { id: 'todos', label: 'Todos' },
    { id: 'fonte', label: 'Fontes' },
    { id: 'ferramenta', label: 'Ferramentas' },
  ] as const;

  function focusSearch(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input?.focus();
    }
  }
</script>

<svelte:window onkeydown={focusSearch} />

<div class="explorer">
  <div class="explorer-main">
    <header class="explorer-heading">
      <div>
        <h1>Explorar o catálogo</h1>
        <p aria-live="polite">{scope}</p>
      </div>
      {#if reset}
        <Button.Root class="button" type="button" onclick={reset}>
          Limpar seleção
        </Button.Root>
      {/if}
    </header>

    <dl class="explorer-counts" aria-label="Contadores dos resultados">
      <div>
        <dt>Fichas</dt>
        <dd>
          {totals ? number.format(totals.fonte + totals.ferramenta) : '—'}
        </dd>
      </div>
      <div>
        <dt>Fontes</dt>
        <dd>{totals ? number.format(totals.fonte) : '—'}</dd>
      </div>
      <div>
        <dt>Ferramentas</dt>
        <dd>{totals ? number.format(totals.ferramenta) : '—'}</dd>
      </div>
    </dl>

    <form
      class="explorer-search"
      onsubmit={(event) => {
        event.preventDefault();
        onSearch(search.trim());
      }}
    >
      <TextField
        id="explorer-search"
        aria-label="Buscar pelo nome ou descrição"
        placeholder="Buscar pelo nome ou descrição"
        type="search"
        bind:element={input}
        bind:value={search}
        maxlength={160}
      />
      <Button.Root class="button" type="submit">Buscar</Button.Root>
    </form>

    <div class="explorer-nature" role="group" aria-label="Natureza das fichas">
      {#each recordKinds as { id, label } (id)}
        <Button.Root
          class="button"
          type="button"
          aria-pressed={nature === id}
          onclick={() => onNature(id)}
        >
          {label}
        </Button.Root>
      {/each}
    </div>

    {@render results()}
  </div>

  <div class="explorer-map">
    {@render map()}
    <a class="map-results-link" href="#resultados">Ver resultados ↓</a>
  </div>
</div>

<style>
  .explorer {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    grid-template-areas: 'map results';
    align-items: start;
    gap: clamp(0.6rem, 1.1vw, 1.25rem);
  }
  .explorer-map {
    grid-area: map;
    min-width: 0;
    position: sticky;
    top: 4.75rem;
  }
  .explorer-main {
    grid-area: results;
    min-width: 0;
    display: grid;
    gap: 0.65rem;
    border: 1px solid var(--border);
    border-radius: 0.65rem;
    background: var(--surface);
    padding: clamp(0.7rem, 1.3vw, 1.15rem);
  }
  .explorer-heading,
  .explorer-nature,
  .explorer-search {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .explorer-heading {
    justify-content: space-between;
  }
  .explorer-heading h1 {
    margin: 0;
    font-size: clamp(1.2rem, 2vw, 1.65rem);
  }
  .explorer-heading p {
    margin: 0;
    color: var(--muted);
  }
  .explorer-search :global(.field) {
    flex: 1;
    min-width: 0;
  }
  .explorer-nature {
    flex-wrap: wrap;
  }
  .map-results-link {
    display: none;
  }
  .explorer-main :global(.table-viewport) {
    max-height: 55dvh;
  }
  @media (min-width: 761px) and (min-height: 700px) {
    .explorer {
      flex: 1;
      min-height: 0;
      align-items: stretch;
    }
    .explorer-map {
      position: static;
      overflow: auto;
    }
    .explorer-main {
      grid-template-rows: repeat(4, auto) minmax(0, 1fr);
      min-height: 0;
    }
    .explorer-main :global(#resultados),
    .explorer-main :global(.data-table) {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .explorer-main :global(.table-viewport) {
      max-height: none;
      flex: 1 1 auto;
    }
    .explorer-main :global(.pagination) {
      flex: none;
      margin-top: 0.5rem;
    }
  }
  .explorer-nature :global([aria-pressed='true']) {
    border-color: var(--brand);
    background: var(--surface-alt);
    color: var(--brand);
  }
  .explorer-counts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;
    margin: 0;
  }
  .explorer-counts div {
    padding: 0.35rem 0.5rem;
    border: 1px solid var(--border);
    background: var(--surface-alt);
    border-radius: 0.35rem;
  }
  .explorer-counts dt {
    color: var(--muted);
    font-size: 0.8rem;
  }
  .explorer-counts dd {
    margin: 0;
    font-size: clamp(1.05rem, 2vw, 1.3rem);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 760px) {
    .explorer {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: 'map' 'results';
    }
    .explorer-map {
      position: static;
    }
    .map-results-link {
      display: inline-block;
      margin-top: 0.4rem;
    }
  }
</style>
