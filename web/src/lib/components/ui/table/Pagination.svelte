<script lang="ts">
  import { Button } from 'bits-ui';
  import SelectField from '$lib/components/ui/SelectField.svelte';

  let {
    label,
    page,
    pageCount,
    disabled = false,
    onPage,
  }: {
    label: string;
    page: number;
    pageCount: number;
    disabled?: boolean;
    onPage: (page: number) => void;
  } = $props();

  const pages = $derived(
    Array.from({ length: pageCount }, (_, index) => ({
      value: String(index + 1),
      label: String(index + 1),
    })),
  );
</script>

{#if pageCount > 1}
  <nav class="pagination" aria-label={'Paginação de ' + label}>
    <Button.Root
      class="button"
      type="button"
      disabled={disabled || page <= 1}
      onclick={() => onPage(Math.max(1, page - 1))}
    >
      Anterior
    </Button.Root>
    <div class="pagination-current" aria-live="polite">
      <span>Página</span>
      <SelectField
        id={'pagina-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
        ariaLabel="Página atual"
        className="pagination-select"
        {disabled}
        options={pages}
        value={String(page)}
        onValueChange={(value) => onPage(Number(value))}
      />
      <span>de {pageCount}</span>
    </div>
    <Button.Root
      class="button"
      type="button"
      disabled={disabled || page >= pageCount}
      onclick={() => onPage(Math.min(pageCount, page + 1))}
    >
      Próximo
    </Button.Root>
  </nav>
{/if}
