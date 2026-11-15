export type TableOption = { id: string; nome: string };

export type TableValue = string | number | null;
export type TableColumn<Row> = {
  id: string;
  label: string;
  value?: (row: Row) => TableValue;
  filter?: 'text' | 'number' | TableOption[];
  width?: number;
  rowHeader?: boolean;
  sortable?: boolean;
  spanRows?: boolean;
  spanColumns?: (row: Row) => number;
};

export type TableSort = { id: string; desc: boolean } | null;
export type TableFilterValue = string | string[];
export type TableFilters = Record<string, TableFilterValue>;

export type TablePage = {
  page: number;
  total?: number;
  sort: TableSort;
  filters: TableFilters;
  onPage: (page: number) => void;
  onSort: (sort: TableSort) => void;
  onFilter: (id: string, value: TableFilterValue) => void;
};

export function staticTablePage(
  page: number,
  total: number,
  onPage: (page: number) => void,
): TablePage {
  return {
    page,
    total,
    sort: null,
    filters: {},
    onPage,
    onSort: () => {},
    onFilter: () => {},
  };
}

export function declaredValue(
  value: string | null,
  label: (text: string) => string,
) {
  if (value === null) return 'Sem registro';
  if (value === '') return 'Valor vazio';
  return label(value);
}
