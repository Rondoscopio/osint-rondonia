import type {
  CategoryFilterExpression,
  Item,
  RecutAudience,
} from '$lib/shared/types';
export type { CategoryFilterExpression, Item, RecutAudience };
export type CatalogValue = string | number | Uint8Array | null;
export type RecutNature = 'fonte' | 'ferramenta';
export type RecordNature = RecutNature;
export type Count = Item & { total: number };
export type RecutSummary = {
  total: number;
  porTipo: Count[];
  porTriagem: Count[];
  porUf: Count[];
};
export type Category = Item & {
  tipo_classificacao: string;
  fontes?: number;
  ferramentas?: number;
};
export type Portal = Item & {
  tipo: 'grupo' | 'instituicao' | 'site';
  url_base: string | null;
  portal_pai_id: string | null;
  portal_pai_nome: string | null;
  fontes: number;
  filhos: number;
};
export type StateOption = Item & {
  sigla: string;
  municipios: number;
  fontes: number;
};
export type Municipality = Item & { uf: string };
export type MunicipalityCoverage = Municipality & {
  total: number;
  uf_sigla: string;
};
export type StateCoverage = Item & {
  sigla: string;
  total: number;
};
export type Source = Item & {
  id_externo?: string | null;
  natureza: 'fonte' | 'ferramenta';
  descricao: string | null;
  nota?: string | null;
  observacao?: string | null;
  observacoes?: string | null;
  esfera?: string | null;
  tecnologia?: string | null;
  acesso_declarado?: string | null;
  data_referencia?: string | null;
  referencia_institucional?: string | null;
  repositorio_oficial?: string | null;
  licenca_spdx?: string | null;
  situacao_url?: string | null;
  tipo: string | null;
  status_triagem: string | null;
  status_validacao?: string | null;
  cobertura_texto?: string | null;
  localidade_texto?: string | null;
  categorias_texto?: string | null;
  categorias_classificadas_texto?: string | null;
  portais_texto?: string | null;
  portais_papeis_texto?: string | null;
  urls?: number;
  urls_texto?: string | null;
  proveniencia_texto?: string | null;
};
export type CatalogSatelliteLayer = {
  id: string;
  fonte_id: string;
  fonte_nome: string;
  nome: string;
  url_tiles: string;
  periodicidade: 'fixa' | 'diaria';
  data_referencia: string | null;
  atribuicao: string;
  url_atribuicao: string;
  acknowledgement: string | null;
  zoom_maximo: number;
  tile_size: number;
  cobertura_continua: number;
  ordem: number;
};
export type Filters = {
  q: string;
  categoria: string;
  categorias?: string[];
  tipo: string;
  natureza?: RecutAudience;
  triagem: string;
  uf: string;
  municipio: string;
  portalId?: string;
  ufs?: string[];
  municipios?: string[];
  ordem: 'asc' | 'desc';
  pagina: number;
  tableSort?: { id: string; desc: boolean } | null;
  tableFilters?: Record<string, string | string[]>;
  categoryFilter?: CategoryFilterExpression;
};
export type Options = {
  categorias: Category[];
  tipos: Item[];
  triagens: Item[];
  ufs: StateOption[];
  municipios: Municipality[];
};
export type Dashboard = {
  fontes: number;
  ferramentas: number;
  categorias: number;
  portais: number;
  porCategoria: Count[];
  porTipo: Count[];
  porUf: Count[];
};
export type CatalogOverview = {
  totals: {
    registros: number;
    fontes: number;
    ferramentas: number;
    categorias: number;
    portais: number;
    urls: number;
    origens: number;
    relacoesCategoria: number;
    relacoesOrigem: number;
    conjuntosAbrangencia: number;
    fontesComCobertura: number;
    municipios: number;
    ufs: number;
  };
  porNatureza: Count[];
  porClassificacao: Count[];
  porTriagem: Count[];
  porCategoria: (Count & { fontes: number; ferramentas: number })[];
};
export type FieldCompleteness = {
  id: string;
  nome: string;
  informadas: number;
  vazias: number;
  semRegistro: number;
};
export type CurationSummary = {
  total: number;
  porTriagem: Count[];
  porValidacao: Count[];
  completude: FieldCompleteness[];
};
export type CurationFilters = {
  triagem: string;
  validacao: string;
  natureza: RecutNature | '';
  naturezas?: RecutNature[];
  pagina: number;
  tableSort?: Filters['tableSort'];
  tableFilters?: Filters['tableFilters'];
};
export type CurationRecord = {
  id: string;
  nome: string;
  natureza: RecutNature;
  descricao: string | null;
  tipo: string | null;
  status_triagem: string | null;
  status_validacao: string | null;
  situacao_url: string | null;
  categorias: number;
  urls: number;
  origens: number;
};
export type PagedRecords<T> = {
  total: number;
  pagina: number;
  tamanho: number;
  itens: T[];
};
export type DeclarationField =
  | 'orgao_responsavel'
  | 'entidade_responsavel'
  | 'esfera'
  | 'acesso_declarado'
  | 'licenca_spdx'
  | 'tecnologia';
export type DeclarationGroup = {
  id: DeclarationField;
  nome: string;
  valores: Count[];
};
export type DeclarationOverview = { campos: DeclarationGroup[] };
export type DeclarationFilters = {
  campo: DeclarationField;
  valor: string;
  natureza: RecutNature | '';
  pagina: number;
};
export type PortalRecord = Portal;
export type PortalDetail = {
  portal: PortalRecord;
  pais: Item[];
  filhos: PortalRecord[];
  fontes: PagedRecords<Source & { papeis: string[] }>;
};
export type ProvenanceOrigin = {
  id: string;
  nome: string;
  fonte_referenciada_id: string | null;
  fonte_referenciada_nome: string | null;
  fonte_referenciada_natureza?: RecutNature | null;
  total: number;
};
export type ProvenanceOverview = {
  totalOrigens: number;
  totalRelacoes: number;
  fichasComOrigem: number;
  origensReferenciadas: number;
  porPapel: Count[];
  origens: ProvenanceOrigin[];
};
export type ProvenanceSource = Source & {
  papeis: string[];
  urls: number;
  categorias: Category[];
};
export type ProvenanceOriginDetail = {
  origem: ProvenanceOrigin;
  fontes: PagedRecords<ProvenanceSource>;
};
export type CoverageMap = {
  states: StateCoverage[];
  municipalities: MunicipalityCoverage[];
};
export type Detail = {
  fonte: Source & Record<string, CatalogValue>;
  categorias: Category[];
  urls: { id: string; nome: string | null; papel: string; url: string }[];
  origens: {
    tipo_origem: string;
    valor_original: string;
    fonte_id: string | null;
    nome: string | null;
    natureza: 'fonte' | 'ferramenta' | null;
  }[];
  portais: {
    id: string;
    nome: string;
    tipo: Portal['tipo'];
    url_base: string | null;
    portal_pai_id: string | null;
    portal_pai_nome: string | null;
    papel: string;
  }[];
  abrangencias: {
    papel: string;
    nacional: number;
    internacional: number;
    ufs: Item[];
    municipios: Municipality[];
  }[];
};
export type NodeKind = 'fonte' | 'ferramenta' | 'categoria' | 'origem';
export type GraphNode = Item & { kind: NodeKind };
export type Neighbor = GraphNode & { relacao: string; direction: 'out' | 'in' };
export type Graph = { center: GraphNode; neighbors: Neighbor[]; total: number };
export type SearchResult = {
  total: number;
  totals: Record<RecordNature, number>;
  page: number;
  items: Source[];
};

export const PAGE_SIZE = 25;
export const GRAPH_LIMIT = 40;
