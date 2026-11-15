import { catalogOptions, query } from './worker-client';
import type { CatalogReader } from '../ports/catalog-reader';

export class WorkerCatalogReader implements CatalogReader {
  satelliteLayers() {
    return query('satelliteLayers');
  }

  options() {
    return catalogOptions();
  }

  dashboard() {
    return query('dashboard');
  }

  catalogOverview() {
    return query('catalogOverview');
  }

  portals() {
    return query('portals');
  }

  portal(id: string, page = 1) {
    return query('portal', id, page);
  }

  curationSummary() {
    return query('curationSummary');
  }

  curationRecords(filters: Parameters<CatalogReader['curationRecords']>[0]) {
    return query('curationRecords', filters);
  }

  declarationOverview(natureza: 'fonte' | 'ferramenta' | '' = '') {
    return query('declarationOverview', natureza);
  }

  declarationRecords(
    filters: Parameters<CatalogReader['declarationRecords']>[0],
  ) {
    return query('declarationRecords', filters);
  }

  provenanceOverview() {
    return query('provenanceOverview');
  }

  provenanceOrigin(id: string, page = 1) {
    return query('provenanceOrigin', id, page);
  }

  coverageMap(
    categoryFilter: Parameters<CatalogReader['coverageMap']>[0] = {},
  ) {
    return query('coverageMap', categoryFilter);
  }

  search(...args: Parameters<CatalogReader['search']>) {
    return query('search', ...args);
  }

  recutSummary(
    categoryFilter: Parameters<CatalogReader['recutSummary']>[0],
    natureza: Parameters<CatalogReader['recutSummary']>[1],
  ) {
    return query('recutSummary', categoryFilter, natureza);
  }

  detail(id: string) {
    return query('detail', id);
  }

  graph(kind: Parameters<CatalogReader['graph']>[0], id: string, offset = 0) {
    return query('graph', kind, id, offset);
  }
}
