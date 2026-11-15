<script lang="ts" generics="Row extends { id: string }">
  import { Button } from 'bits-ui';
  import {
    cellSelectionFeature,
    cellSpanningFeature,
    columnFilteringFeature,
    columnResizingFeature,
    columnSizingFeature,
    columnVisibilityFeature,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    createTable,
    filterFn_includesString,
    rowPaginationFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    tableFeatures,
    type Cell,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type PaginationState,
    type Updater,
  } from '@tanstack/svelte-table';
  import { onDestroy, tick, untrack, type Snippet } from 'svelte';
  import MultiChoice from '$lib/components/ui/MultiChoice.svelte';
  import TextField from '$lib/components/ui/TextField.svelte';
  import Pagination from '$lib/components/ui/table/Pagination.svelte';
  import { fold } from '$lib/shared/text';
  import type {
    TableColumn,
    TableFilterValue,
    TablePage,
    TableValue,
  } from '$lib/shared/table';

  let {
    label,
    rows,
    columns,
    pageSize = 25,
    manual,
    busy = false,
    empty = 'Nenhum resultado corresponde aos filtros.',
    widths,
    setWidths,
    content,
  }: {
    label: string;
    rows: Row[];
    columns: TableColumn<Row>[];
    pageSize?: number;
    manual?: TablePage;
    busy?: boolean;
    empty?: string;
    widths?: Record<string, number>;
    setWidths?: (widths: Record<string, number>) => void;
    content?: Snippet<[Row, string, TableValue]>;
  } = $props();

  const features = tableFeatures({
    cellSelectionFeature,
    cellSpanningFeature,
    columnFilteringFeature,
    columnVisibilityFeature,
    columnSizingFeature,
    columnResizingFeature,
    rowPaginationFeature,
    rowSortingFeature,
    filteredRowModel: createFilteredRowModel(),
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    filterFns: { includesString: filterFn_includesString },
    sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  });

  type Features = typeof features;
  type GridCell = Cell<Features, Row, unknown>;
  const number = new Intl.NumberFormat('pt-BR');
  const TABLE_COLUMN_SCALE = 0.78;
  const MIN_COLUMN_WIDTH = 68;
  const collator = new Intl.Collator('pt-BR', {
    sensitivity: 'base',
    numeric: true,
  });
  const tablePrefix = $props.id();
  const byId = $derived(new Map(columns.map((column) => [column.id, column])));
  const definitions = $derived<ColumnDef<Features, Row>[]>(
    columns.map((column): ColumnDef<Features, Row> => ({
      id: column.id,
      header: column.label,
      ...(column.value && { accessorFn: column.value }),
      enableSorting: Boolean(column.value) && column.sortable !== false,
      enableColumnFilter: Boolean(column.filter),
      enableCellSelection: Boolean(column.value),
      enableHiding: !column.rowHeader,
      size: Math.round((column.width ?? 165) * TABLE_COLUMN_SCALE),
      minSize: Math.max(
        MIN_COLUMN_WIDTH,
        Math.round((column.width ?? 165) * 0.52),
      ),
      spanRows: column.spanRows,
      spanColumns:
        column.spanColumns && (({ row }) => column.spanColumns!(row.original)),
      sortFn:
        column.filter === 'number'
          ? 'basic'
          : (a, b, id) =>
              collator.compare(
                String(a.getValue(id) ?? ''),
                String(b.getValue(id) ?? ''),
              ),
      filterFn: (row, id, value: unknown) => {
        const current = row.getValue<TableValue>(id);
        if (column.filter === 'number') return current === Number(value);
        if (Array.isArray(column.filter))
          return Array.isArray(value)
            ? value.includes(String(current ?? ''))
            : current === value;
        return fold(String(current ?? '')).includes(
          fold(String(value ?? '').trim()),
        );
      },
    })),
  );

  function updated<T>(change: Updater<T>, value: T): T {
    return typeof change === 'function'
      ? (change as (old: T) => T)(value)
      : change;
  }

  let localWidths = $state<Record<string, number>>({});
  let localSort = $state<SortingState>([]);
  let localFilters = $state<ColumnFiltersState>([]);
  let localPagination = $state<PaginationState>({
    pageIndex: 0,
    pageSize: untrack(() => pageSize),
  });
  let selectedRowId = $state<string | null>(null);
  const sorting = $derived(
    manual ? (manual.sort ? [manual.sort] : []) : localSort,
  );
  const columnFilters = $derived<ColumnFiltersState>(
    manual
      ? Object.entries(manual.filters).reduce<ColumnFiltersState>(
          (result, [id, value]) => {
            if (Array.isArray(value)) {
              if (value.length) result.push({ id, value });
            } else if (Array.isArray(byId.get(id)?.filter)) {
              if (value) result.push({ id, value: [value] });
            } else if (value) result.push({ id, value });
            return result;
          },
          [],
        )
      : localFilters,
  );
  const pagination = $derived(
    manual ? { pageIndex: manual.page - 1, pageSize } : localPagination,
  );
  const table = createTable({
    features,
    get data() {
      return rows;
    },
    get columns() {
      return definitions;
    },
    getRowId: (row) => row.id,
    get manualSorting() {
      return Boolean(manual);
    },
    get manualFiltering() {
      return Boolean(manual);
    },
    get manualPagination() {
      return Boolean(manual);
    },
    get rowCount() {
      return manual?.total;
    },
    state: {
      get columnSizing() {
        return widths ?? localWidths;
      },
      get sorting() {
        return sorting;
      },
      get columnFilters() {
        return columnFilters;
      },
      get pagination() {
        return pagination;
      },
    },
    onColumnSizingChange(change) {
      const next = updated(change, widths ?? localWidths);
      if (setWidths) setWidths(next);
      else localWidths = next;
    },
    onSortingChange(change) {
      const next = updated(change, sorting);
      if (manual) manual.onSort(next[0] ?? null);
      else {
        localSort = next;
        localPagination.pageIndex = 0;
      }
    },
    onColumnFiltersChange(change) {
      localFilters = updated(change, columnFilters);
      localPagination.pageIndex = 0;
    },
    onPaginationChange(change) {
      const next = updated(change, pagination);
      if (manual) manual.onPage(next.pageIndex + 1);
      else localPagination = next;
    },
    defaultColumn: { size: 129, minSize: MIN_COLUMN_WIDTH, maxSize: 800 },
    columnResizeMode: 'onEnd',
    enableMultiSort: false,
    enableMultiCellRangeSelection: false,
    sortDescFirst: false,
    isCellRangeSelectionEvent: (event) =>
      event instanceof MouseEvent && event.shiftKey,
  });

  const visibleColumns = $derived(table.getVisibleLeafColumns());
  const visibleRows = $derived(table.getRowModel().rows);
  const firstCell = $derived(
    visibleRows[0]
      ?.getVisibleCells()
      .find((cell) => !cell.getIsCovered() && cell.getCanSelect()),
  );
  const tabStop = $derived.by(() => {
    const cell = table.getFocusedCell();
    if (
      cell &&
      visibleRows.some((row) => row.id === cell.row.id) &&
      cell.column.getIsVisible() &&
      !cell.getIsCovered()
    )
      return cell.id;
    return firstCell?.id;
  });
  const pageCount = $derived(Math.max(1, table.getPageCount()));
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  onDestroy(() => timers.forEach(clearTimeout));

  function filterLabel(id: string, value: unknown) {
    const options = byId.get(id)?.filter;
    const selected = Array.isArray(value) ? value : [value];
    return Array.isArray(options)
      ? selected
          .map(
            (item) =>
              options.find((option) => option.id === item)?.nome ??
              String(item),
          )
          .join(', ')
      : String(value);
  }

  function selectedFilterValues(id: string): string[] {
    const value = manual
      ? manual.filters[id]
      : table.getColumn(id)?.getFilterValue();
    if (Array.isArray(value)) return value.map(String);
    return typeof value === 'string' && value ? [value] : [];
  }

  function setFilter(id: string, value: TableFilterValue, debounce = false) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    if (manual && debounce) {
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          manual?.onFilter(id, value);
        }, 250),
      );
    } else if (manual) manual.onFilter(id, value);
    else table.getColumn(id)?.setFilterValue(value);
  }

  function resizeWithKeyboard(event: KeyboardEvent, id: string) {
    const column = table.getColumn(id);
    if (!column) return;
    const { minSize = MIN_COLUMN_WIDTH, maxSize = 800 } = column.columnDef;
    if (event.key === 'Home') {
      event.preventDefault();
      column.resetSize();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' ? -12 : 12;
      table.setColumnSizing((sizes) => ({
        ...sizes,
        [id]: Math.min(maxSize, Math.max(minSize, column.getSize() + delta)),
      }));
    }
  }

  function selectCell(event: MouseEvent, cell: GridCell) {
    selectedRowId = cell.row.id;
    if (
      event.button !== 0 ||
      (event.target instanceof Element &&
        event.target.closest('a, button, input, select, textarea'))
    )
      return;
    if (!cell.getCanSelect()) return;
    event.preventDefault();
    cell.getSelectionStartHandler()(event);
    (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  }

  function cellKeyboard(body: HTMLTableSectionElement) {
    function keydown(event: KeyboardEvent) {
      if (
        !(event.target instanceof HTMLTableCellElement) ||
        !event.target.dataset.cell
      )
        return;
      const directions = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      } as const;
      const direction = directions[event.key as keyof typeof directions];
      if (event.key === 'Escape' && table.getSelectedCellCount()) {
        event.preventDefault();
        event.stopPropagation();
        table.resetCellSelection(true);
        return;
      }
      if (!direction) return;
      event.preventDefault();
      const cell = visibleRows
        .flatMap((row) => row.getVisibleCells())
        .find(
          (candidate) =>
            candidate.id === (event.target as HTMLElement).dataset.cell,
        );
      if (!cell) return;
      if (table.getFocusedCell()?.id !== cell.id)
        table.setFocusedCell(cell.row.id, cell.column.id);
      if (event.shiftKey) table.extendCellSelection(direction);
      else table.moveCellSelection(direction);
      const destination = table.getFocusedCell()?.id;
      void tick().then(() => {
        if (destination)
          body
            .querySelector<HTMLElement>(
              `[data-cell="${CSS.escape(destination)}"]`,
            )
            ?.focus();
      });
    }
    body.addEventListener('keydown', keydown);
    return { destroy: () => body.removeEventListener('keydown', keydown) };
  }
</script>

<div class="data-table">
  {#if columnFilters.length}
    <div class="table-controls">
      {#each columnFilters as filter (filter.id)}
        <Button.Root
          class="filter-chip"
          type="button"
          aria-label={'Remover filtro de ' + byId.get(filter.id)?.label}
          onclick={() =>
            setFilter(
              filter.id,
              Array.isArray(byId.get(filter.id)?.filter) ? [] : '',
            )}
        >
          {byId.get(filter.id)?.label}: {filterLabel(filter.id, filter.value)}
          <span aria-hidden="true">×</span>
        </Button.Root>
      {/each}
    </div>
  {/if}
  <div class="table-viewport">
    <table aria-busy={busy} style:width={table.getTotalSize() + 'px'}>
      <caption class="sr-only">{label}</caption>
      <colgroup>
        {#each visibleColumns as column (column.id)}
          <col style:width={column.getSize() + 'px'} />
        {/each}
      </colgroup>
      <thead>
        {#each table.getHeaderGroups() as group (group.id)}
          <tr>
            {#each group.headers as header (header.id)}
              {@const column = header.column}
              {@const config = byId.get(column.id)}
              {@const sort = column.getIsSorted()}
              {@const filter = config?.filter}
              <th
                scope="col"
                aria-sort={sort === 'asc'
                  ? 'ascending'
                  : sort === 'desc'
                    ? 'descending'
                    : undefined}
              >
                {#if column.getCanSort()}
                  <Button.Root
                    class="sort-control"
                    type="button"
                    onclick={() => column.toggleSorting()}
                  >
                    {config?.label}
                    <span aria-hidden="true">
                      {sort === 'asc' ? '↑' : sort === 'desc' ? '↓' : '↕'}
                    </span>
                  </Button.Root>
                {:else}
                  {config?.label}
                {/if}
                {#if Array.isArray(filter)}
                  <MultiChoice
                    id={`table-filter-${tablePrefix}-${column.id}`}
                    label={'Filtrar ' + config?.label}
                    items={filter}
                    compact
                    value={selectedFilterValues(column.id)}
                    onValueChange={(value) => setFilter(column.id, value)}
                  />
                {:else if filter}
                  <TextField
                    bare
                    type={filter === 'number' ? 'number' : 'search'}
                    className="table-filter-input"
                    min={filter === 'number' ? 0 : undefined}
                    step={filter === 'number' ? 1 : undefined}
                    maxlength={filter === 'text' ? 160 : undefined}
                    id={`table-filter-text-${tablePrefix}-${column.id}`}
                    aria-label={'Filtrar ' + config?.label}
                    value={String(column.getFilterValue() ?? '')}
                    oninput={(event) => {
                      const input = event.currentTarget;
                      if (input.validity.valid)
                        setFilter(column.id, input.value, true);
                    }}
                  />
                {/if}
                {#if column.getCanResize()}
                  <Button.Root
                    class={`column-resizer ${column.getIsResizing() ? 'resizing' : ''}`}
                    type="button"
                    aria-label={'Redimensionar ' + config?.label}
                    style={column.getIsResizing()
                      ? `transform: translateX(${table.atoms.columnResizing.get().deltaOffset ?? 0}px)`
                      : undefined}
                    onmousedown={header.getResizeHandler()}
                    ontouchstart={header.getResizeHandler()}
                    ondblclick={() => column.resetSize()}
                    onkeydown={(event) => resizeWithKeyboard(event, column.id)}
                  />
                {/if}
              </th>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody use:cellKeyboard>
        {#each visibleRows as row (row.id)}
          <tr class:selected-row={selectedRowId === row.id}>
            {#each row.getVisibleCells() as cell (cell.id)}
              {#if !cell.getIsCovered()}
                {@const rowHeader = byId.get(cell.column.id)?.rowHeader}
                {@const value = cell.getValue<TableValue>() ?? null}
                <svelte:element
                  this={rowHeader ? 'th' : 'td'}
                  role={rowHeader ? 'rowheader' : 'cell'}
                  scope={rowHeader ? 'row' : undefined}
                  rowspan={cell.getRowSpan()}
                  colspan={cell.getColSpan()}
                  data-cell={cell.id}
                  tabindex={cell.getCanSelect()
                    ? tabStop === cell.id
                      ? 0
                      : -1
                    : undefined}
                  class:selected={cell.getIsSelected()}
                  onmousedown={(event: MouseEvent) => selectCell(event, cell)}
                  onmouseenter={cell.getSelectionExtendHandler()}
                >
                  {#if content}{@render content(
                      row.original,
                      cell.column.id,
                      value,
                    )}
                  {:else if typeof value === 'number'}{number.format(value)}
                  {:else}{value ?? 'Sem registro'}{/if}
                </svelte:element>
              {/if}
            {/each}
          </tr>
        {:else}
          {#if !busy}<tr>
              <td colspan={visibleColumns.length}>{empty}</td>
            </tr>{/if}
        {/each}
      </tbody>
    </table>
  </div>
  <Pagination
    {label}
    page={pagination.pageIndex + 1}
    {pageCount}
    disabled={busy}
    onPage={(page) => table.setPageIndex(page - 1)}
  />
</div>

<style>
  .data-table {
    min-width: 0;
    font-size: 0.86rem;
    line-height: 1.35;
  }
  .table-controls {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.3rem 0.55rem;
  }
  .table-controls {
    margin-bottom: 0.4rem;
  }
  :global(.filter-chip) {
    color: var(--ink);
    background: var(--surface-alt);
    border: 1px solid var(--border);
    padding: 0.16rem 0.35rem;
    font-size: 0.8rem;
  }
  .table-viewport {
    max-width: 100%;
    overflow: auto;
    overscroll-behavior-x: contain;
  }
  table {
    margin: 0;
    min-width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    border-radius: 0;
    table-layout: fixed;
    background: var(--surface);
  }
  th,
  td {
    padding: 0.36rem 0.46rem;
    border: 1px solid var(--border);
    vertical-align: top;
    text-align: left;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  tbody th {
    font-weight: 700;
  }
  thead th {
    position: relative;
    padding-inline-end: 0.58rem;
    background: var(--surface-alt);
  }
  :global(.sort-control) {
    display: flex;
    gap: 0.25rem;
    align-items: baseline;
    text-align: left;
    background: none;
    border: 0;
    padding: 0;
    color: inherit;
    font-weight: 750;
    font-size: 0.84rem;
    line-height: 1.2;
  }
  :global(.sort-control span) {
    color: var(--brand);
  }
  thead :global(input.table-filter-input) {
    box-sizing: border-box;
    margin-top: 0.24rem;
    width: 100%;
    min-width: 0;
    min-height: 1.75rem;
    padding: 0.18rem 0.28rem;
    border: 1px solid var(--border);
    border-radius: var(--control-radius);
    color: var(--ink);
    background: var(--surface);
    font: inherit;
    font-size: 0.8rem;
  }
  :global(.pagination) {
    gap: 0.45rem;
    margin-top: 0.65rem;
    font-size: 0.84rem;
  }
  :global(.pagination > .button) {
    min-height: 1.9rem;
    padding: 0.28rem 0.48rem;
    font-size: 0.82rem;
  }
  :global(.pagination-current) {
    gap: 0.3rem;
    font-size: 0.82rem;
  }
  :global(.pagination-select) {
    width: 4.25rem;
  }
  :global(.pagination-select .ui-select-trigger) {
    min-height: 1.9rem;
    gap: 0.25rem;
    padding: 0.24rem 0.38rem;
    font-size: 0.82rem;
  }
  :global(.column-resizer) {
    position: absolute;
    z-index: 1;
    inset: 0 -0.35rem 0 auto;
    width: 0.55rem;
    padding: 0;
    border: 0;
    background: none;
    cursor: col-resize;
    touch-action: none;
  }
  :global(.column-resizer::after) {
    position: absolute;
    inset: 0 calc(50% - 1px);
    content: '';
    background: transparent;
  }
  :global(.column-resizer:hover::after),
  :global(.column-resizer:focus-visible::after),
  :global(.column-resizer.resizing::after) {
    background: var(--focus);
  }
  .selected {
    background: color-mix(in srgb, var(--focus) 20%, var(--surface));
  }
  .selected-row > :is(th, td) {
    background: color-mix(in srgb, var(--focus) 10%, var(--surface));
  }
  :is(td, th)[data-cell]:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: -2px;
  }
</style>
