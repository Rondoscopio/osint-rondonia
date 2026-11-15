<script lang="ts">
  let { children } = $props();
  import AppRoot from '$lib/app/AppRoot.svelte';
</script>

<AppRoot>
  {@render children()}
</AppRoot>
