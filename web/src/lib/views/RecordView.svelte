<script lang="ts">
  import { createRecordViewModel } from '$lib/features/catalog/record.viewmodel.svelte';
  import type { RecordNature } from '$lib/features/catalog/domain/types';
  import SourceDetail from '$lib/components/features/catalog/SourceDetail.svelte';
  import CatalogNotFound from '$lib/components/features/catalog/CatalogNotFound.svelte';
  import LoadState from '$lib/components/ui/LoadState.svelte';
  import PageMeta from '$lib/components/ui/PageMeta.svelte';

  let { id, nature }: { id: string; nature: RecordNature } = $props();
  const record = createRecordViewModel(() => id);
</script>

<PageMeta
  title={(record.data?.fonte.nome ?? 'Ficha do catálogo') + ' · OSINT Rondônia'}
/>
{#if record.data?.fonte.natureza === nature}
  <SourceDetail detail={record.data} natureza={nature} />
{:else if record.data !== undefined}
  <CatalogNotFound text="A ficha indicada não foi encontrada." />
{:else}
  <LoadState failed={record.isError} retry={() => void record.refetch()} />
{/if}
