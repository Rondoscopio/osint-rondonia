import type {
  CoverageMap,
  CategoryFilterExpression,
  CatalogOverview,
  CatalogSatelliteLayer,
  CurationFilters,
  CurationRecord,
  CurationSummary,
  DeclarationFilters,
  DeclarationOverview,
  Dashboard,
  Detail,
  Filters,
  Graph,
  NodeKind,
  Options,
  PagedRecords,
  Portal,
  PortalDetail,
  RecutAudience,
  ProvenanceOriginDetail,
  ProvenanceOverview,
  RecutNature,
  RecutSummary,
  SearchResult,
  Source,
} from '$lib/features/catalog/domain/types';

/** Read-only application port implemented by the SQLite Web Worker adapter. */
export interface CatalogReader {
  satelliteLayers(): Promise<CatalogSatelliteLayer[]>;
  options(): Promise<Options>;
  dashboard(): Promise<Dashboard>;
  catalogOverview(): Promise<CatalogOverview>;
  portals(): Promise<Portal[]>;
  portal(id: string, page?: number): Promise<PortalDetail | null>;
  curationSummary(): Promise<CurationSummary>;
  curationRecords(
    filters: CurationFilters,
  ): Promise<PagedRecords<CurationRecord>>;
  declarationOverview(
    natureza?: 'fonte' | 'ferramenta' | '',
  ): Promise<DeclarationOverview>;
  declarationRecords(
    filters: DeclarationFilters,
  ): Promise<PagedRecords<Source>>;
  provenanceOverview(): Promise<ProvenanceOverview>;
  provenanceOrigin(
    id: string,
    page?: number,
  ): Promise<ProvenanceOriginDetail | null>;
  coverageMap(
    filters?: CategoryFilterExpression | Filters,
  ): Promise<CoverageMap>;
  search(filters: Filters): Promise<SearchResult>;
  recutSummary(
    categoryFilter: CategoryFilterExpression,
    natureza: RecutAudience,
  ): Promise<RecutSummary>;
  detail(id: string): Promise<Detail | null>;
  graph(kind: NodeKind, id: string, offset?: number): Promise<Graph | null>;
}
