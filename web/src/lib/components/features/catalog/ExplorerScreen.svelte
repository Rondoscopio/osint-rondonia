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
    territoryActive = false,
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
    territoryActive?: boolean;
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
  <div class="explorer-map">
    {@render map()}
  </div>

  <div class="explorer-main">
    <header class="explorer-heading">
      <div>
        <h1>Explorar o catálogo</h1>
        <p class:territory-active={territoryActive} aria-live="polite">
          {scope}
        </p>
      </div>
      {#if reset}
        <Button.Root class="button" type="button" onclick={reset}>
          Limpar seleção
        </Button.Root>
      {/if}
    </header>

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

    {@render results()}
  </div>
</div>

<style>
  .explorer {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.7rem;
  }
  .explorer-map {
    min-width: 0;
  }
  .explorer-main {
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
  .explorer-heading p.territory-active {
    display: inline-flex;
    align-items: center;
    min-height: 1.8rem;
    margin-top: 0.25rem;
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--brand);
    background: var(--surface-alt);
    font-size: 0.86rem;
    font-weight: 650;
  }
  .explorer-search :global(.field) {
    flex: 1;
    min-width: 0;
  }
  .explorer-nature {
    flex-wrap: wrap;
  }
  .explorer-main :global(.table-viewport) {
    max-height: min(60dvh, 48rem);
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
</style>
