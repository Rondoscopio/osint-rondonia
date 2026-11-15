<script lang="ts">
  import { Button, Combobox, Label } from 'bits-ui';
  import { fold } from '$lib/shared/text';
  import { displayText } from '$lib/shared/labels';
  import type { Item } from '$lib/shared/types';

  let {
    id,
    label,
    items,
    value,
    onValueChange,
    placeholder = 'Qualquer',
    compact = false,
  }: {
    id: string;
    label: string;
    items: Item[];
    value: string[];
    onValueChange: (value: string[]) => void;
    placeholder?: string;
    compact?: boolean;
  } = $props();

  let search = $state('');
  let open = $state(false);
  const selected = $derived(items.filter((item) => value.includes(item.id)));
  const summary = $derived.by(() => {
    if (value.length === 0) return '';
    if (compact)
      return `${value.length} selecionado${value.length === 1 ? '' : 's'}`;
    const names = selected.slice(0, 2).map((item) => displayText(item.nome));
    const remaining = value.length - names.length;
    return names.join(', ') + (remaining > 0 ? ` + ${remaining}` : '');
  });
  const choices = $derived(
    items
      .filter(
        (item) =>
          fold(displayText(item.nome)).includes(fold(search)) ||
          fold(item.nome).includes(fold(search)),
      )
      .slice(0, 80),
  );
</script>

<div class="field multi-choice">
  <Label.Root for={id} class={compact ? 'sr-only' : undefined}>
    {label}
  </Label.Root>
  <Combobox.Root
    type="multiple"
    {value}
    {onValueChange}
    bind:open
    inputValue={search}
    onOpenChangeComplete={(isOpen) => {
      if (!isOpen) search = '';
    }}
  >
    <div class="multi-choice-control" class:compact>
      {#if summary}<span
          class="multi-choice-summary"
          title={selected.map((item) => displayText(item.nome)).join(', ')}
        >
          {summary}
        </span>{/if}
      <Combobox.Input
        {id}
        class="multi-choice-input"
        placeholder={value.length ? 'Adicionar…' : placeholder}
        aria-label={label}
        oninput={(event) => {
          search = event.currentTarget.value;
        }}
      />
      {#if value.length > 0}<Button.Root
          class="multi-choice-clear"
          type="button"
          aria-label={`Limpar ${label}`}
          onclick={(event) => {
            event.stopPropagation();
            onValueChange([]);
          }}
        >
          ×
        </Button.Root>{/if}
      <Combobox.Trigger
        class="multi-choice-trigger"
        aria-label={`Mostrar opções de ${label}`}
      >
        <svg
          class:expanded={open}
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
        </svg>
      </Combobox.Trigger>
    </div>
    <Combobox.Portal>
      <Combobox.Content class="options multi-choice-options" sideOffset={4}>
        {#each choices as item (item.id)}
          <Combobox.Item value={item.id} label={displayText(item.nome)}>
            {#snippet children({ selected: isSelected })}
              <span>{displayText(item.nome)}</span>
              {#if isSelected}<span
                  class="multi-choice-check"
                  aria-hidden="true"
                >
                  ✓
                </span>{/if}
            {/snippet}
          </Combobox.Item>
        {:else}
          <p>Nenhuma opção encontrada.</p>
        {/each}
        {#if choices.length === 80}<p>Digite para restringir as opções.</p>{/if}
      </Combobox.Content>
    </Combobox.Portal>
  </Combobox.Root>
</div>
