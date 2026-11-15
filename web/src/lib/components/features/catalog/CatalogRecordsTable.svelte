<script lang="ts">
  import type {
    Category,
    Item,
    Source,
  } from '$lib/features/catalog/domain/types';
  import { displayLabel, displayText } from '$lib/shared/labels';
  import { sources, tools } from '$lib/links';
  import DataTable from '$lib/components/ui/table/DataTable.svelte';
  import {
    declaredValue,
    type TableColumn,
    type TablePage,
  } from '$lib/shared/table';

  let {
    label,
    rows,
    manual,
    busy,
    types = [],
    triage = [],
    categories = [],
  }: {
    label: string;
    rows: Source[];
    manual: TablePage;
    busy: boolean;
    types?: Item[];
    triage?: Item[];
    categories?: Category[];
  } = $props();

  const columns = $derived<TableColumn<Source>[]>([
    {
      id: 'nome',
      label: 'Nome',
      value: (row) => displayText(row.nome),
      rowHeader: true,
      filter: 'text',
      width: 210,
    },
    {
      id: 'descricao',
      label: 'Descrição',
      value: (row) => declaredValue(row.descricao, displayText),
      filter: 'text',
      width: 300,
    },
    {
      id: 'tipo',
      label: 'Tipo registrado',
      value: (row) => declaredValue(row.tipo, displayText),
      width: 170,
      filter: [
        { id: 'sem-tipo', nome: 'Sem registro' },
        ...types
          .filter(({ id }) => id !== 'sem-tipo')
          .map(({ id, nome }) => ({ id, nome: displayText(nome) })),
      ],
    },
    {
      id: 'categoria',
      label: 'Categorias',
      value: (row) => declaredValue(row.categorias_texto ?? null, displayText),
      width: 260,
      ...(categories.length > 0 && {
        filter: categories.map((item) => ({
          id: item.id,
          nome: `${displayText(item.nome)} · ${displayLabel(item.tipo_classificacao)}`,
        })),
      }),
    },
    {
      id: 'portais',
      label: 'Portais e responsáveis',
      value: (row) => declaredValue(row.portais_texto ?? null, displayText),
      filter: 'text',
      width: 280,
    },
    {
      id: 'urls',
      label: 'URLs',
      value: (row) => row.urls ?? 0,
      filter: 'number',
      width: 90,
    },
    {
      id: 'triagem',
      label: 'Triagem',
      value: (row) => declaredValue(row.status_triagem, displayText),
      width: 140,
      filter: [
        { id: 'sem-registro', nome: 'Sem registro' },
        { id: '__valor_vazio__', nome: 'Valor vazio' },
        ...triage
          .filter(({ id }) => id && id !== 'sem-registro')
          .map(({ id, nome }) => ({ id, nome: displayText(nome) })),
      ],
    },
  ]);
</script>

<DataTable {label} {rows} {columns} {manual} {busy}>
  {#snippet content(row, column, value)}
    {#if column === 'nome'}
      <a
        href={(row.natureza === 'ferramenta' ? tools : sources)({ id: row.id })}
      >
        {value}
      </a>
    {:else}
      {value}
    {/if}
  {/snippet}
</DataTable>
