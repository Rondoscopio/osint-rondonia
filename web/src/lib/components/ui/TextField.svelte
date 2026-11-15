<script lang="ts">
  import { Label } from 'bits-ui';
  import type { HTMLInputAttributes } from 'svelte/elements';

  type Props = Omit<HTMLInputAttributes, 'id' | 'value' | 'class'> & {
    id: string;
    label?: string;
    value?: string | number;
    className?: string;
    fieldClassName?: string;
    bare?: boolean;
    element?: HTMLInputElement;
  };

  let {
    id,
    label,
    value = $bindable(''),
    className = '',
    fieldClassName = '',
    bare = false,
    element = $bindable(),
    ...attributes
  }: Props = $props();
</script>

{#snippet control()}
  {#if label}<Label.Root for={id}>{label}</Label.Root>{/if}
  <input
    bind:this={element}
    {id}
    class={className}
    bind:value
    {...attributes}
  />
{/snippet}

{#if bare}
  {@render control()}
{:else}
  <div class="field {fieldClassName}">{@render control()}</div>
{/if}
