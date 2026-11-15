<script lang="ts">
  import ExplorerView from '$lib/views/ExplorerView.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<ExplorerView initialPortal={data.id} />
