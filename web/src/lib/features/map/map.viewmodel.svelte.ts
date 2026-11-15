import { createQuery } from '@tanstack/svelte-query';
import { CATALOG_USE_CASES, GEOGRAPHY_USE_CASES } from '$lib/app/tokens';
import { getAppContainer } from '$lib/app/container-context.svelte';
import type { CatalogUseCases } from '$lib/features/catalog/application/catalog-use-cases';
import type {
  CategoryFilterExpression,
  Filters,
} from '$lib/features/catalog/domain/types';
import type { SatelliteLayer } from './domain/types';
import type { GeographyUseCases } from './application/geography-use-cases';

function latestAvailableDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 2);
  return date.toISOString().slice(0, 10);
}

export function createMapViewModel(
  getCategoryFilter: () => CategoryFilterExpression | Filters = () => ({}),
) {
  const container = getAppContainer();
  const catalog = container.get<CatalogUseCases>(CATALOG_USE_CASES);
  const geography = container.get<GeographyUseCases>(GEOGRAPHY_USE_CASES);
  const assets = geography.assets();
  const layers = geography.layerOptions();

  const satelliteLayers = createQuery(() => ({
    queryKey: ['catalog', 'map-satellite-layers'],
    queryFn: async (): Promise<SatelliteLayer[]> => {
      const date = latestAvailableDate();
      const records = await catalog.satelliteLayers();
      return records.map((record) => ({
        id: record.id,
        label: `${record.fonte_nome} · ${record.nome}`,
        tiles: [
          record.periodicidade === 'diaria'
            ? record.url_tiles.replace('{data}', date)
            : record.url_tiles,
        ],
        sourceId: record.fonte_id,
        sourceName: record.fonte_nome,
        attribution: record.atribuicao,
        attributionUrl: record.url_atribuicao,
        acknowledgement: record.acknowledgement,
        maxzoom: record.zoom_maximo,
        tileSize: record.tile_size,
        continuous: Boolean(record.cobertura_continua),
        dataMode: record.periodicidade,
        dataReference:
          record.periodicidade === 'diaria' ? date : record.data_referencia,
      }));
    },
  }));

  const coverage = createQuery(() => ({
    queryKey: ['catalog', 'coverage-map', getCategoryFilter()],
    queryFn: () => catalog.coverageMap(getCategoryFilter()),
  }));

  return {
    assets,
    layers,
    satelliteLayers,
    coverage,
  };
}
