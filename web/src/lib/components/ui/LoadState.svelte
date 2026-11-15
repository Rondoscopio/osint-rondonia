<script lang="ts">
  import { Button } from 'bits-ui';
  let { failed, retry }: { failed: boolean; retry: () => void } = $props();
</script>

{#if failed}
  <section class="notice" role="alert">
    <p>Não foi possível ler o catálogo.</p>
    <Button.Root class="button" onclick={retry}>Tentar novamente</Button.Root>
  </section>
{:else}
  <p class="notice" role="status">Carregando o catálogo…</p>
{/if}
