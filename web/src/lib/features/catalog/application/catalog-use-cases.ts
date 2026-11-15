import type { CatalogReader } from '../ports/catalog-reader';

export function createCatalogUseCases(reader: CatalogReader) {
  return {
    satelliteLayers: () => reader.satelliteLayers(),
    options: () => reader.options(),
    dashboard: () => reader.dashboard(),
    catalogOverview: () => reader.catalogOverview(),
    portals: () => reader.portals(),
    portal: (id: string, page = 1) => reader.portal(id, page),
    curationSummary: () => reader.curationSummary(),
    curationRecords: (
      filters: Parameters<CatalogReader['curationRecords']>[0],
    ) => reader.curationRecords(filters),
    declarationOverview: (natureza: 'fonte' | 'ferramenta' | '' = '') =>
      reader.declarationOverview(natureza),
    declarationRecords: (
      filters: Parameters<CatalogReader['declarationRecords']>[0],
    ) => reader.declarationRecords(filters),
    provenanceOverview: () => reader.provenanceOverview(),
    provenanceOrigin: (id: string, page = 1) =>
      reader.provenanceOrigin(id, page),
    coverageMap: (filters: Parameters<CatalogReader['coverageMap']>[0] = {}) =>
      reader.coverageMap(filters),
    search: (...args: Parameters<CatalogReader['search']>) =>
      reader.search(...args),
    recutSummary: (
      categoryFilter: Parameters<CatalogReader['recutSummary']>[0],
      natureza: Parameters<CatalogReader['recutSummary']>[1],
    ) => reader.recutSummary(categoryFilter, natureza),
    detail: (id: string) => reader.detail(id),
    graph: (
      kind: Parameters<CatalogReader['graph']>[0],
      id: string,
      offset = 0,
    ) => reader.graph(kind, id, offset),
  };
}

export type CatalogUseCases = ReturnType<typeof createCatalogUseCases>;
