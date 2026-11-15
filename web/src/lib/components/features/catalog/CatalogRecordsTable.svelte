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

  const textValue = (value: string | null | undefined) =>
    declaredValue(value ?? null, displayText);

  const columns = $derived<TableColumn<Source>[]>([
    {
      id: 'cobertura',
      label: 'Cobertura',
      value: (row) => textValue(row.cobertura_texto),
      filter: 'text',
      width: 180,
    },
    {
      id: 'id',
      label: 'ID',
      value: (row) => row.id,
      filter: 'text',
      width: 150,
    },
    {
      id: 'id_externo',
      label: 'ID externo',
      value: (row) => textValue(row.id_externo),
      filter: 'text',
      width: 150,
    },
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
      value: (row) => textValue(row.descricao),
      filter: 'text',
      width: 300,
    },
    {
      id: 'nota',
      label: 'Nota',
      value: (row) => textValue(row.nota),
      filter: 'text',
      width: 190,
    },
    {
      id: 'observacao',
      label: 'Observação',
      value: (row) => textValue(row.observacao),
      filter: 'text',
      width: 190,
    },
    {
      id: 'observacoes',
      label: 'Observações',
      value: (row) => textValue(row.observacoes),
      filter: 'text',
      width: 220,
    },
    {
      id: 'tipo',
      label: 'Tipo registrado',
      value: (row) => textValue(row.tipo),
      width: 170,
      filter: [
        { id: 'sem-tipo', nome: 'Sem registro' },
        ...types
          .filter(({ id }) => id !== 'sem-tipo')
          .map(({ id, nome }) => ({ id, nome: displayText(nome) })),
      ],
    },
    {
      id: 'natureza',
      label: 'Natureza',
      value: (row) => displayLabel(row.natureza),
      filter: [
        { id: 'fonte', nome: 'Fonte' },
        { id: 'ferramenta', nome: 'Ferramenta' },
      ],
      width: 130,
    },
    {
      id: 'esfera',
      label: 'Esfera',
      value: (row) => textValue(row.esfera),
      filter: 'text',
      width: 140,
    },
    {
      id: 'tecnologia',
      label: 'Tecnologia',
      value: (row) => textValue(row.tecnologia),
      filter: 'text',
      width: 170,
    },
    {
      id: 'acesso_declarado',
      label: 'Acesso declarado',
      value: (row) => textValue(row.acesso_declarado),
      filter: 'text',
      width: 180,
    },
    {
      id: 'data_referencia',
      label: 'Data de referência',
      value: (row) => textValue(row.data_referencia),
      filter: 'text',
      width: 170,
    },
    {
      id: 'referencia_institucional',
      label: 'Referência institucional',
      value: (row) => textValue(row.referencia_institucional),
      filter: 'text',
      width: 220,
    },
    {
      id: 'repositorio_oficial',
      label: 'Repositório oficial',
      value: (row) => textValue(row.repositorio_oficial),
      filter: 'text',
      width: 210,
    },
    {
      id: 'licenca_spdx',
      label: 'Licença SPDX',
      value: (row) => textValue(row.licenca_spdx),
      filter: 'text',
      width: 150,
    },
    {
      id: 'situacao_url',
      label: 'Situação da URL',
      value: (row) => textValue(row.situacao_url),
      filter: 'text',
      width: 200,
    },
    {
      id: 'validacao',
      label: 'Validação',
      value: (row) => textValue(row.status_validacao),
      filter: 'text',
      width: 190,
    },
    {
      id: 'categoria',
      label: 'Categorias',
      value: (row) => textValue(row.categorias_texto),
      width: 260,
      ...(categories.length > 0 && {
        filter: categories.map((item) => ({
          id: item.id,
          nome: `${displayText(item.nome)} · ${displayLabel(item.tipo_classificacao)}`,
        })),
      }),
    },
    {
      id: 'categorias_classificadas',
      label: 'Categorias por classificação',
      value: (row) => textValue(row.categorias_classificadas_texto),
      filter: 'text',
      width: 280,
    },
    {
      id: 'portais',
      label: 'Portais e responsáveis',
      value: (row) => textValue(row.portais_texto),
      filter: 'text',
      width: 280,
    },
    {
      id: 'portais_papeis',
      label: 'Portais por papel',
      value: (row) => textValue(row.portais_papeis_texto),
      filter: 'text',
      width: 280,
    },
    {
      id: 'urls',
      label: 'Qtd. URLs',
      value: (row) => row.urls ?? 0,
      filter: 'number',
      width: 90,
    },
    {
      id: 'urls_texto',
      label: 'URLs registradas',
      value: (row) => textValue(row.urls_texto),
      filter: 'text',
      width: 340,
    },
    {
      id: 'localidade',
      label: 'Localidade declarada',
      value: (row) => textValue(row.localidade_texto),
      filter: 'text',
      width: 220,
    },
    {
      id: 'proveniencia',
      label: 'Proveniência',
      value: (row) => textValue(row.proveniencia_texto),
      filter: 'text',
      width: 320,
    },
    {
      id: 'triagem',
      label: 'Triagem',
      value: (row) => textValue(row.status_triagem),
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
