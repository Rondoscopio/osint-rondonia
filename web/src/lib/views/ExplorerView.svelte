<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import ExplorerScreen from '$lib/components/features/catalog/ExplorerScreen.svelte';
  import CatalogSearchResults from '$lib/components/features/catalog/CatalogSearchResults.svelte';
  import PageMeta from '$lib/components/ui/PageMeta.svelte';
  import LoadState from '$lib/components/ui/LoadState.svelte';
  import { createExplorerViewModel } from '$lib/features/catalog/explorer.viewmodel.svelte';
  import type {
    Filters,
    RecutAudience,
  } from '$lib/features/catalog/domain/types';
  import type { MapTerritorySelection } from '$lib/features/map/domain/types';
  import type { TableFilters } from '$lib/shared/table';
  import { getCategoryFilter, getRecut } from '$lib/shared/recuts';

  let {
    initialNature = 'todos',
    initialTheme = '',
    initialPortal = '',
  }: {
    initialNature?: RecutAudience;
    initialTheme?: string;
    initialPortal?: string;
  } = $props();
  const params = $derived(
    browser ? page.url.searchParams : new URLSearchParams(),
  );
  const recut = $derived(getRecut(params.get('tema') ?? initialTheme));
  const portalId = $derived(params.get('portal') ?? initialPortal);
  const uf = $derived(params.get('uf') ?? '');
  const municipio = $derived(params.get('municipio') ?? '');
  const countryId = $derived(params.get('pais'));
  const place = $derived(params.get('territorio'));
  const query = $derived(params.get('q') ?? '');
  const nature = $derived<RecutAudience>(
    params.get('natureza') === 'fonte'
      ? 'fonte'
      : params.get('natureza') === 'ferramenta'
        ? 'ferramenta'
        : params.has('natureza')
          ? 'todos'
          : (recut?.natureza ?? initialNature),
  );
  const scope = $derived<Filters>({
    q: query,
    categoria: '',
    tipo: '',
    triagem: '',
    uf: municipio ? '' : uf,
    municipio,
    portalId,
    natureza: nature,
    ordem: 'asc',
    pagina: 1,
    categoryFilter: recut ? getCategoryFilter(recut) : undefined,
  });
  const urlColumns = $derived<TableFilters>(
    Object.fromEntries(
      ['nome', 'descricao', 'portais', 'urls', 'categoria', 'tipo', 'triagem']
        .filter((column) => params.has(column))
        .map((column) => [
          column,
          params.getAll(column).length > 1
            ? params.getAll(column)
            : params.get(column)!,
        ]),
    ),
  );
  const vm = createExplorerViewModel(
    () => scope,
    () => urlColumns,
    (column, value) => navigate({ [column]: value }),
  );
  $effect.pre(() => {
    void scope;
    void urlColumns;
    untrack(vm.firstPage);
  });
  const state = $derived(vm.options.data?.ufs.find((item) => item.id === uf));
  const city = $derived(
    vm.options.data?.municipios.find((item) => item.id === municipio),
  );
  const stateOptions = $derived(vm.options.data?.ufs ?? []);
  const cityOptions = $derived(
    state || city
      ? (vm.options.data?.municipios ?? []).filter(
          (item) => item.uf === (city?.uf ?? state?.id),
        )
      : [],
  );
  const selected = $derived<MapTerritorySelection | null>(
    uf || municipio || countryId || place
      ? {
          name: city?.nome ?? state?.nome ?? place ?? 'Território selecionado',
          country: '',
          countryId: countryId ?? (uf || municipio ? 'BRA' : null),
          uf: city?.uf ?? uf,
          municipio,
          supported: Boolean(uf || municipio),
        }
      : null,
  );

  function navigate(
    changes: Record<string, string | string[] | null>,
    resetRoute = false,
  ) {
    const next = new URLSearchParams(params);
    if (resetRoute && nature !== 'todos') next.set('natureza', nature);
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key);
      for (const entry of Array.isArray(value) ? value : [value])
        if (entry) next.append(key, entry);
    }
    const suffix = next.toString();
    const path =
      (resetRoute ? resolve('/') : page.url.pathname) +
      (suffix ? '?' + suffix : '');
    if (path !== page.url.pathname + page.url.search)
      void goto(path, { noScroll: true, keepFocus: true });
  }

  function selectTerritory(item: MapTerritorySelection | null) {
    navigate({
      uf: item?.uf ?? null,
      municipio: item?.municipio ?? null,
      pais: item?.countryId ?? null,
      territorio: item?.uf || item?.municipio ? null : (item?.name ?? null),
    });
  }
</script>

<PageMeta
  title="Explorar o catálogo · OSINT Rondônia"
  description="Consulte fontes abertas e ferramentas no mapa e na tabela de resultados."
/>

<ExplorerScreen
  totals={vm.results.data?.totals}
  scope={selected
    ? selected.name + (selected.supported ? '' : ' · sem filtro territorial')
    : (recut?.title ??
      (portalId ? 'Fichas do portal selecionado' : 'Catálogo completo'))}
  {nature}
  {query}
  onSearch={(q) => navigate({ q })}
  onNature={(value) => navigate({ natureza: value })}
  reset={selected || recut || params.has('categoria') || portalId
    ? () =>
        navigate(
          {
            uf: null,
            municipio: null,
            pais: null,
            territorio: null,
            tema: null,
            categoria: null,
            portal: null,
          },
          Boolean(initialTheme || initialPortal),
        )
    : undefined}
>
  {#snippet map()}
    {#await import('./WorldMapView.svelte')}
      <LoadState failed={false} retry={() => {}} />
    {:then { default: WorldMap }}
      <WorldMap
        territory={selected}
        onSelectTerritory={selectTerritory}
        states={stateOptions}
        cities={cityOptions}
      />
    {:catch}
      <LoadState failed retry={() => location.reload()} />
    {/await}
  {/snippet}
  {#snippet results()}
    <CatalogSearchResults
      {nature}
      result={vm.results.data}
      busy={vm.results.isPending}
      failed={vm.results.isError}
      types={vm.options.data?.tipos}
      triage={vm.options.data?.triagens}
      categories={vm.options.data?.categorias}
      manual={vm.table}
      retry={() => void vm.results.refetch()}
    />
  {/snippet}
</ExplorerScreen>
