<script lang="ts">
  import RecordView from '$lib/views/RecordView.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<RecordView id={data.id} nature="ferramenta" />
