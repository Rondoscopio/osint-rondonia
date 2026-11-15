<script lang="ts">
  import WorldMap from '$lib/components/features/map/WorldMap.svelte';
  import { createMapViewModel } from '$lib/features/map/map.viewmodel.svelte';
  import type { MapTerritorySelection } from '$lib/features/map/domain/types';
  import type { Item } from '$lib/shared/types';

  let {
    territory,
    onSelectTerritory,
    states,
    cities,
  }: {
    territory: MapTerritorySelection | null;
    onSelectTerritory: (selection: MapTerritorySelection | null) => void;
    states: Item[];
    cities: Item[];
  } = $props();
  const vm = createMapViewModel();
</script>

<WorldMap
  {territory}
  {onSelectTerritory}
  stateOptions={states}
  cityOptions={cities}
  assets={vm.assets}
  layers={vm.layers}
  satelliteLayers={vm.satelliteLayers.data ?? []}
  satelliteLayersLoading={vm.satelliteLayers.isPending}
  satelliteLayersFailed={vm.satelliteLayers.isError}
  retrySatelliteLayers={() => void vm.satelliteLayers.refetch()}
  coverage={vm.coverage.data}
  coverageFailed={vm.coverage.isError}
  retryCoverage={() => void vm.coverage.refetch()}
/>
